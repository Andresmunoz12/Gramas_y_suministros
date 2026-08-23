// test/unit/RF30-Generar-Cotizaciones/generar-cotizaciones.spec.ts

/**
 * MÓDULO: GENERACIÓN DE COTIZACIONES
 * 
 * Casos de prueba implementados:
 * - CP-202: Verificar que generar correctamente una cotización con uno o varios productos
 * - CP-203: Verificar que intentar generar una cotización sin productos seleccionados
 * - CP-204: Verificar que intentar generar una cotización con cantidades inválidas
 * - CP-205: Verificar que intentar generar una cotización con productos no disponibles
 * - CP-206: Verificar el cálculo automático del subtotal y total (con y sin costo de envío)
 * - CP-207: Verificar que la cotización quede almacenada
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CotizacionesService } from '../../../src/cotizaciones/cotizaciones.service';
import { CotizacionesController } from '../../../src/cotizaciones/cotizaciones.controller';
import { Cotizacion } from '../../../src/cotizaciones/cotizacion.entity';
import { DetalleCotizacion } from '../../../src/cotizaciones/detalle-cotizacion.entity';
import { productos } from '../../../src/productos/productos.entity';
import { movimiento } from '../../../src/movimiento/movimiento.entity';
import { stock } from '../../../src/stock/stock.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { CrearCotizacionDto } from '../../../src/cotizaciones/dto/crear-cotizacion.dto';
import {
  usuarioExistente,
  productoGrama,
  productoAdhesivo,
  productoInactivo,
  cotizacionUnProductoDto,
  cotizacionVariosProductosDto,
  cotizacionSinProductosDto,
  cotizacionCantidadNegativaDto,
  cotizacionCantidadCeroDto,
  cotizacionProductoInactivoDto,
  cotizacionProductoInexistenteDto,
  cotizacionCreadaMock,
  cotizacionCreadaVariosMock,
  mensajesCotizacion,
} from './helpers/test-data';

// ============================================
// MOCKS - ACTUALIZADO CON STOCK
// ============================================

const mockCotizacionRepository = {
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  })),
  manager: {
    findOne: jest.fn(),
    count: jest.fn(),
  },
};

const mockDetalleRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockProductoRepository = {
  findOne: jest.fn(),
  count: jest.fn(),
};

const mockMovimientoRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

// ✅ Stock mock con cantidad suficiente
const mockStockRepository = {
  findOne: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    execute: jest.fn(),
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  })),
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Generación de Cotizaciones - Casos de Prueba', () => {
  let service: CotizacionesService;
  let controller: CotizacionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CotizacionesController],
      providers: [
        CotizacionesService,
        {
          provide: getRepositoryToken(Cotizacion),
          useValue: mockCotizacionRepository,
        },
        {
          provide: getRepositoryToken(DetalleCotizacion),
          useValue: mockDetalleRepository,
        },
        {
          provide: getRepositoryToken(productos),
          useValue: mockProductoRepository,
        },
        {
          provide: getRepositoryToken(movimiento),
          useValue: mockMovimientoRepository,
        },
        {
          provide: getRepositoryToken(stock),
          useValue: mockStockRepository,
        },
      ],
    }).compile();

    service = module.get<CotizacionesService>(CotizacionesService);
    controller = module.get<CotizacionesController>(CotizacionesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CP-202: GENERAR CORRECTAMENTE UNA COTIZACIÓN
  // ============================================

  describe('CP-202 - Verificar que generar correctamente una cotización con uno o varios productos', () => {
    it('debería generar una cotización exitosamente con un solo producto', async () => {
      // Arrange
      const dto: CrearCotizacionDto = {
        metodoVenta: cotizacionUnProductoDto.metodoVenta,
        metodoPago: cotizacionUnProductoDto.metodoPago,
        items: cotizacionUnProductoDto.items,
      };

      const reqMock = { user: { userId: usuarioExistente.id_usuario } };

      // ✅ Configurar stock disponible (100 unidades)
      const stockDisponible = {
        id_stock: 1,
        id_producto: 1,
        cantidad_actual: 100,
      };

      // Configuración de Mocks
      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne.mockResolvedValue(productoGrama);
      mockStockRepository.findOne.mockResolvedValue(stockDisponible);
      mockCotizacionRepository.save.mockResolvedValue(cotizacionCreadaMock);
      mockDetalleRepository.create.mockReturnValue({
        idDetalle: 1,
        idCotizacion: 1,
        idProducto: 1,
        cantidad: 5,
        precioUnitario: 50000,
        subtotal: 250000,
      });
      mockDetalleRepository.save.mockResolvedValue({});
      mockCotizacionRepository.findOne.mockResolvedValue({
        ...cotizacionCreadaMock,
        usuario: usuarioExistente,
        detalles: [
          {
            idDetalle: 1,
            idProducto: 1,
            cantidad: 5,
            precioUnitario: 50000,
            subtotal: 250000,
            producto: productoGrama,
          },
        ],
      });

      // Act
      const result = await controller.crearCotizacion(reqMock, dto);

      // Assert
      expect(mockCotizacionRepository.manager.findOne).toHaveBeenCalledWith(usuario, {
        where: { id_usuario: reqMock.user.userId },
      });
      expect(mockProductoRepository.findOne).toHaveBeenCalledWith({
        where: { id_producto: 1 },
      });
      expect(mockStockRepository.findOne).toHaveBeenCalledWith({
        where: { id_producto: 1 },
      });
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith({
        idUsuario: reqMock.user.userId,
        metodoVenta: dto.metodoVenta,
        metodoPago: dto.metodoPago,
        subtotal: 250000,
        costoEnvio: 0,
        total: 250000,
        estado: 'pendiente',
      });
      expect(mockDetalleRepository.create).toHaveBeenCalledWith({
        idCotizacion: 1,
        idProducto: 1,
        cantidad: 5,
        precioUnitario: 50000,
        subtotal: 250000,
      });
      expect(mockDetalleRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.idCotizacion).toBe(1);
      expect(result.total).toBe(250000);
      expect(result.detalles.length).toBe(1);
    });

    it('debería generar una cotización exitosamente con varios productos', async () => {
      // Arrange
      const dto: CrearCotizacionDto = {
        metodoVenta: cotizacionVariosProductosDto.metodoVenta,
        metodoPago: cotizacionVariosProductosDto.metodoPago,
        direccionEnvio: cotizacionVariosProductosDto.direccionEnvio,
        items: cotizacionVariosProductosDto.items,
      };

      const reqMock = { user: { userId: usuarioExistente.id_usuario } };

      // ✅ Configurar stock disponible para ambos productos
      const stockGrama = {
        id_stock: 1,
        id_producto: 1,
        cantidad_actual: 100,
      };
      const stockAdhesivo = {
        id_stock: 2,
        id_producto: 2,
        cantidad_actual: 50,
      };

      // Configuración de Mocks
      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne
        .mockResolvedValueOnce(productoGrama)
        .mockResolvedValueOnce(productoAdhesivo);
      mockStockRepository.findOne
        .mockResolvedValueOnce(stockGrama)
        .mockResolvedValueOnce(stockAdhesivo);
      
      mockCotizacionRepository.save.mockResolvedValue(cotizacionCreadaVariosMock);
      mockDetalleRepository.create.mockImplementation((data) => data);
      mockDetalleRepository.save.mockResolvedValue({});
      mockCotizacionRepository.findOne.mockResolvedValue({
        ...cotizacionCreadaVariosMock,
        usuario: usuarioExistente,
        detalles: [
          { idProducto: 1, cantidad: 2, precioUnitario: 50000, subtotal: 100000, producto: productoGrama },
          { idProducto: 2, cantidad: 3, precioUnitario: 15000, subtotal: 45000, producto: productoAdhesivo },
        ],
      });

      // Act
      const result = await controller.crearCotizacion(reqMock, dto);

      // Assert
      expect(mockProductoRepository.findOne).toHaveBeenNthCalledWith(1, { where: { id_producto: 1 } });
      expect(mockProductoRepository.findOne).toHaveBeenNthCalledWith(2, { where: { id_producto: 2 } });
      expect(mockStockRepository.findOne).toHaveBeenNthCalledWith(1, { where: { id_producto: 1 } });
      expect(mockStockRepository.findOne).toHaveBeenNthCalledWith(2, { where: { id_producto: 2 } });
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith({
        idUsuario: reqMock.user.userId,
        metodoVenta: dto.metodoVenta,
        metodoPago: dto.metodoPago,
        direccionEnvio: dto.direccionEnvio,
        subtotal: 145000,
        costoEnvio: 8000,
        total: 153000,
        estado: 'pendiente',
      });
      expect(result).toBeDefined();
      expect(result.idCotizacion).toBe(2);
      expect(result.total).toBe(153000);
      expect(result.detalles.length).toBe(2);
    });
  });

  // ============================================
  // CP-203: INTENTAR GENERAR SIN PRODUCTOS
  // ============================================

  describe('CP-203 - Verificar que intentar generar una cotización sin productos seleccionados', () => {
    it('debería rechazar la creación si el arreglo de items está vacío', async () => {
      // Arrange
      const dto: CrearCotizacionDto = {
        metodoVenta: cotizacionSinProductosDto.metodoVenta,
        metodoPago: cotizacionSinProductosDto.metodoPago,
        items: cotizacionSinProductosDto.items,
      };

      // Act & Assert usando class-validator
      const { validate } = await import('class-validator');
      const { plainToClass } = await import('class-transformer');
      
      const dtoClass = plainToClass(CrearCotizacionDto, dto);
      const errors = await validate(dtoClass);
      
      // El DTO tiene @IsArray() y debería fallar si está vacío
      // Pero también verificamos la lógica del negocio
      expect(dto.items.length).toBe(0);
      
      // Verificamos que el servicio lance la excepción
      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      
      await expect(service.crearCotizacion(1, dto)).rejects.toThrow(
        new BadRequestException('Debe seleccionar al menos un producto')
      );
      
      expect(mockCotizacionRepository.save).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-204: INTENTAR GENERAR CON CANTIDADES INVÁLIDAS
  // ============================================

  describe('CP-204 - Verificar que intentar generar una cotización con cantidades inválidas', () => {
    it('debería rechazar la creación si la cantidad es menor a 1 (negativa)', async () => {
      // Arrange
      const dto: CrearCotizacionDto = {
        metodoVenta: cotizacionCantidadNegativaDto.metodoVenta,
        metodoPago: cotizacionCantidadNegativaDto.metodoPago,
        items: cotizacionCantidadNegativaDto.items,
      };

      // Act & Assert usando class-validator
      const { validate } = await import('class-validator');
      const { plainToClass } = await import('class-transformer');
      
      const dtoClass = plainToClass(CrearCotizacionDto, dto);
      const errors = await validate(dtoClass);
      
      // El DTO tiene @Min(1) para cantidad
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('items');
      
      expect(mockCotizacionRepository.save).not.toHaveBeenCalled();
    });

    it('debería rechazar la creación si la cantidad es cero', async () => {
      // Arrange
      const dto: CrearCotizacionDto = {
        metodoVenta: cotizacionCantidadCeroDto.metodoVenta,
        metodoPago: cotizacionCantidadCeroDto.metodoPago,
        items: cotizacionCantidadCeroDto.items,
      };

      // Act & Assert usando class-validator
      const { validate } = await import('class-validator');
      const { plainToClass } = await import('class-transformer');
      
      const dtoClass = plainToClass(CrearCotizacionDto, dto);
      const errors = await validate(dtoClass);
      
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('items');
      
      expect(mockCotizacionRepository.save).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-205: INTENTAR GENERAR CON PRODUCTOS NO DISPONIBLES
  // ============================================

  describe('CP-205 - Verificar que intentar generar una cotización con productos no disponibles', () => {
    it('debería lanzar BadRequestException si el producto está inactivo (estado = 0)', async () => {
      // Arrange
      const dto: CrearCotizacionDto = {
        metodoVenta: cotizacionProductoInactivoDto.metodoVenta,
        metodoPago: cotizacionProductoInactivoDto.metodoPago,
        items: cotizacionProductoInactivoDto.items,
      };

      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne.mockResolvedValue(productoInactivo);
      // No se llega a verificar stock porque el producto está inactivo

      // Act & Assert
      await expect(service.crearCotizacion(1, dto)).rejects.toThrow(
        new BadRequestException(mensajesCotizacion.productoInactivo)
      );
      expect(mockCotizacionRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si el producto no existe', async () => {
      // Arrange
      const dto: CrearCotizacionDto = {
        metodoVenta: cotizacionProductoInexistenteDto.metodoVenta,
        metodoPago: cotizacionProductoInexistenteDto.metodoPago,
        items: cotizacionProductoInexistenteDto.items,
      };

      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.crearCotizacion(1, dto)).rejects.toThrow(
        new NotFoundException(mensajesCotizacion.productoNoEncontrado)
      );
      expect(mockCotizacionRepository.save).not.toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException si el stock es insuficiente', async () => {
      // Arrange
      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: [{ idProducto: 1, cantidad: 50 }],
      };

      // Stock insuficiente (solo 10 unidades)
      const stockInsuficiente = {
        id_stock: 1,
        id_producto: 1,
        cantidad_actual: 10,
      };

      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne.mockResolvedValue(productoGrama);
      mockStockRepository.findOne.mockResolvedValue(stockInsuficiente);

      // Act & Assert
      await expect(service.crearCotizacion(1, dto)).rejects.toThrow(
        new BadRequestException(
          `La cantidad solicitada del producto "${productoGrama.nombre}" supera el stock disponible (Máximo: 10)`
        )
      );
      expect(mockCotizacionRepository.save).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-206: VERIFICAR EL CÁLCULO AUTOMÁTICO DE SUBTOTAL Y TOTAL
  // ============================================

  describe('CP-206 - Verificar el cálculo automático del subtotal y total', () => {
    it('debería calcular correctamente sin costo de envío cuando el método de venta es físico', async () => {
      // Arrange
      const dto: CrearCotizacionDto = {
        metodoVenta: cotizacionUnProductoDto.metodoVenta,
        metodoPago: cotizacionUnProductoDto.metodoPago,
        items: cotizacionUnProductoDto.items,
      };

      const stockDisponible = {
        id_stock: 1,
        id_producto: 1,
        cantidad_actual: 100,
      };

      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne.mockResolvedValue(productoGrama);
      mockStockRepository.findOne.mockResolvedValue(stockDisponible);
      mockCotizacionRepository.save.mockResolvedValue(cotizacionCreadaMock);
      mockDetalleRepository.create.mockReturnValue({});
      mockDetalleRepository.save.mockResolvedValue({});
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionCreadaMock);

      // Act
      await service.crearCotizacion(1, dto);

      // Assert
      // subtotal = 5 * 50000 = 250000, costoEnvio = 0, total = 250000
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 250000,
          costoEnvio: 0,
          total: 250000,
        })
      );
    });

    it('debería calcular correctamente sumando costo de envío (8000) cuando el método de venta es envío', async () => {
      // Arrange
      const dto: CrearCotizacionDto = {
        metodoVenta: cotizacionVariosProductosDto.metodoVenta,
        metodoPago: cotizacionVariosProductosDto.metodoPago,
        direccionEnvio: cotizacionVariosProductosDto.direccionEnvio,
        items: cotizacionVariosProductosDto.items,
      };

      const stockGrama = {
        id_stock: 1,
        id_producto: 1,
        cantidad_actual: 100,
      };
      const stockAdhesivo = {
        id_stock: 2,
        id_producto: 2,
        cantidad_actual: 50,
      };

      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne
        .mockResolvedValueOnce(productoGrama)
        .mockResolvedValueOnce(productoAdhesivo);
      mockStockRepository.findOne
        .mockResolvedValueOnce(stockGrama)
        .mockResolvedValueOnce(stockAdhesivo);
      mockCotizacionRepository.save.mockResolvedValue(cotizacionCreadaVariosMock);
      mockDetalleRepository.create.mockReturnValue({});
      mockDetalleRepository.save.mockResolvedValue({});
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionCreadaVariosMock);

      // Act
      await service.crearCotizacion(1, dto);

      // Assert
      // subtotal = (2 * 50000) + (3 * 15000) = 145000
      // envio = 8000
      // total = 145000 + 8000 = 153000
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 145000,
          costoEnvio: 8000,
          total: 153000,
        })
      );
    });
  });

  // ============================================
  // CP-207: VERIFICAR QUE LA COTIZACIÓN QUEDE ALMACENADA
  // ============================================

  describe('CP-207 - Verificar que la cotización quede almacenada', () => {
    it('debería guardar la cabecera de la cotización y todos sus detalles asociados en la base de datos', async () => {
      // Arrange
      const dto: CrearCotizacionDto = {
        metodoVenta: cotizacionVariosProductosDto.metodoVenta,
        metodoPago: cotizacionVariosProductosDto.metodoPago,
        direccionEnvio: cotizacionVariosProductosDto.direccionEnvio,
        items: cotizacionVariosProductosDto.items,
      };

      const stockGrama = {
        id_stock: 1,
        id_producto: 1,
        cantidad_actual: 100,
      };
      const stockAdhesivo = {
        id_stock: 2,
        id_producto: 2,
        cantidad_actual: 50,
      };

      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne
        .mockResolvedValueOnce(productoGrama)
        .mockResolvedValueOnce(productoAdhesivo);
      mockStockRepository.findOne
        .mockResolvedValueOnce(stockGrama)
        .mockResolvedValueOnce(stockAdhesivo);
      mockCotizacionRepository.save.mockResolvedValue(cotizacionCreadaVariosMock);
      mockDetalleRepository.create.mockImplementation((data) => data);
      mockDetalleRepository.save.mockResolvedValue({});
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionCreadaVariosMock);

      // Act
      await service.crearCotizacion(1, dto);

      // Assert
      // Verificar almacenamiento de la cabecera
      expect(mockCotizacionRepository.save).toHaveBeenCalledTimes(1);
      
      // Verificar almacenamiento de los 2 detalles
      expect(mockDetalleRepository.create).toHaveBeenNthCalledWith(1, {
        idCotizacion: 2,
        idProducto: 1,
        cantidad: 2,
        precioUnitario: 50000,
        subtotal: 100000,
      });
      expect(mockDetalleRepository.create).toHaveBeenNthCalledWith(2, {
        idCotizacion: 2,
        idProducto: 2,
        cantidad: 3,
        precioUnitario: 15000,
        subtotal: 45000,
      });
      expect(mockDetalleRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});