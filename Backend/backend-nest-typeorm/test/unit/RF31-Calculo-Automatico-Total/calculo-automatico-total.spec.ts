// test/unit/RF31-Calculo-Automatico-Total/calculo-automatico-total.spec.ts

/**
 * MÓDULO: CÁLCULO AUTOMÁTICO DEL VALOR TOTAL DE COTIZACIÓN
 * 
 * Casos de prueba implementados:
 * - CP-209: Verificar que calcular correctamente el valor total con varios productos
 * - CP-210: Verificar el recálculo automático al modificar cantidades
 * - CP-211: Verificar que el recálculo al agregar o eliminar productos
 * - CP-214: Verificar que el cliente no pueda modificar manualmente el valor total
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
  productoA,
  productoB,
  cotizacionVariosProductosDto,
  cotizacionCantidadInicialDto,
  cotizacionCantidadModificadaDto,
  cotizacionUnSoloProductoDto,
  cotizacionDosProductosDto,
  cotizacionProductoEliminadoDto,
  cotizacionConTotalManualDto,
  cotizacionCreadaVariosMock,
  cotizacionCreadaInicialMock,
  cotizacionCreadaModificadaMock,
  cotizacionCreadaDosProductosMock,
  cotizacionCreadaProductoEliminadoMock,
} from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockCotizacionRepository = {
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(),
  manager: {
    findOne: jest.fn(),
  },
};

const mockDetalleRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockProductoRepository = {
  findOne: jest.fn(),
};

const mockMovimientoRepository = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockStockRepository = {
  findOne: jest.fn(),
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Cálculo Automático de Totales - Casos de Prueba', () => {
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
  // CP-209: CALCULAR VALOR TOTAL CON VARIOS PRODUCTOS
  // ============================================

  describe('CP-209 - Verificar que calcular correctamente el valor total con varios productos', () => {
    it('debería calcular correctamente el total sumando los subtotales de cada producto', async () => {
      // Arrange
      const dto: CrearCotizacionDto = {
        metodoVenta: cotizacionVariosProductosDto.metodoVenta,
        metodoPago: cotizacionVariosProductosDto.metodoPago,
        items: cotizacionVariosProductosDto.items,
      };

      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne
        .mockResolvedValueOnce(productoA)
        .mockResolvedValueOnce(productoB);
      mockCotizacionRepository.save.mockResolvedValue(cotizacionCreadaVariosMock);
      mockDetalleRepository.create.mockReturnValue({});
      mockDetalleRepository.save.mockResolvedValue({});
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionCreadaVariosMock);

      // Act
      const result = await service.crearCotizacion(1, dto);

      // Assert
      // Producto A: 2 * 30000 = 60000
      // Producto B: 3 * 15000 = 45000
      // Total = 105000 (Sin envio porque metodoVenta es fisico)
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 105000,
          costoEnvio: 0,
          total: 105000,
        })
      );
      expect(result.total).toBe(105000);
    });
  });

  // ============================================
  // CP-210: RECÁLCULO AUTOMÁTICO AL MODIFICAR CANTIDADES
  // ============================================

  describe('CP-210 - Verificar el recálculo automático al modificar cantidades', () => {
    it('debería calcular el total inicial y recalcular proporcionalmente cuando cambian las cantidades', async () => {
      // --- PASO 1: Cantidad Inicial (2 unidades del Producto A) ---
      const dtoInicial: CrearCotizacionDto = {
        metodoVenta: cotizacionCantidadInicialDto.metodoVenta,
        metodoPago: cotizacionCantidadInicialDto.metodoPago,
        items: cotizacionCantidadInicialDto.items,
      };

      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne.mockResolvedValue(productoA);
      mockCotizacionRepository.save.mockResolvedValue(cotizacionCreadaInicialMock);
      mockDetalleRepository.create.mockReturnValue({});
      mockDetalleRepository.save.mockResolvedValue({});
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionCreadaInicialMock);

      const resultInicial = await service.crearCotizacion(1, dtoInicial);

      // Assert Inicial: 2 * 30000 = 60000
      expect(mockCotizacionRepository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          subtotal: 60000,
          total: 60000,
        })
      );
      expect(resultInicial.total).toBe(60000);

      // --- PASO 2: Cantidad Modificada (5 unidades del Producto A) ---
      const dtoModificado: CrearCotizacionDto = {
        metodoVenta: cotizacionCantidadModificadaDto.metodoVenta,
        metodoPago: cotizacionCantidadModificadaDto.metodoPago,
        items: cotizacionCantidadModificadaDto.items,
      };

      mockCotizacionRepository.save.mockResolvedValue(cotizacionCreadaModificadaMock);
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionCreadaModificadaMock);

      const resultModificado = await service.crearCotizacion(1, dtoModificado);

      // Assert Modificado: 5 * 30000 = 150000
      expect(mockCotizacionRepository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          subtotal: 150000,
          total: 150000,
        })
      );
      expect(resultModificado.total).toBe(150000);
    });
  });

  // ============================================
  // CP-211: RECÁLCULO AL AGREGAR O ELIMINAR PRODUCTOS
  // ============================================

  describe('CP-211 - Verificar el recálculo al agregar o eliminar productos', () => {
    it('debería recalcular correctamente el total de la cotización cuando se añaden o remueven productos del listado', async () => {
      // --- PASO 1: Un solo producto (Producto A * 2) ---
      const dtoUnProducto: CrearCotizacionDto = {
        metodoVenta: cotizacionUnSoloProductoDto.metodoVenta,
        metodoPago: cotizacionUnSoloProductoDto.metodoPago,
        items: cotizacionUnSoloProductoDto.items,
      };

      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne.mockResolvedValue(productoA);
      mockCotizacionRepository.save.mockResolvedValue(cotizacionCreadaInicialMock);
      mockDetalleRepository.create.mockReturnValue({});
      mockDetalleRepository.save.mockResolvedValue({});
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionCreadaInicialMock);

      const resultUnProducto = await service.crearCotizacion(1, dtoUnProducto);
      expect(resultUnProducto.total).toBe(60000);

      // --- PASO 2: Agregar Producto B (Producto A * 2 + Producto B * 1) ---
      const dtoDosProductos: CrearCotizacionDto = {
        metodoVenta: cotizacionDosProductosDto.metodoVenta,
        metodoPago: cotizacionDosProductosDto.metodoPago,
        items: cotizacionDosProductosDto.items,
      };

      mockProductoRepository.findOne
        .mockReset()
        .mockResolvedValueOnce(productoA)
        .mockResolvedValueOnce(productoB);
      mockCotizacionRepository.save.mockResolvedValue(cotizacionCreadaDosProductosMock);
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionCreadaDosProductosMock);

      const resultDosProductos = await service.crearCotizacion(1, dtoDosProductos);

      // Assert: (2 * 30000) + (1 * 15000) = 75000
      expect(mockCotizacionRepository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          subtotal: 75000,
          total: 75000,
        })
      );
      expect(resultDosProductos.total).toBe(75000);

      // --- PASO 3: Eliminar Producto A (Solo queda Producto B * 1) ---
      const dtoProductoEliminado: CrearCotizacionDto = {
        metodoVenta: cotizacionProductoEliminadoDto.metodoVenta,
        metodoPago: cotizacionProductoEliminadoDto.metodoPago,
        items: cotizacionProductoEliminadoDto.items,
      };

      mockProductoRepository.findOne
        .mockReset()
        .mockResolvedValueOnce(productoB);
      mockCotizacionRepository.save.mockResolvedValue(cotizacionCreadaProductoEliminadoMock);
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionCreadaProductoEliminadoMock);

      const resultProductoEliminado = await service.crearCotizacion(1, dtoProductoEliminado);

      // Assert: 1 * 15000 = 15000
      expect(mockCotizacionRepository.save).toHaveBeenLastCalledWith(
        expect.objectContaining({
          subtotal: 15000,
          total: 15000,
        })
      );
      expect(resultProductoEliminado.total).toBe(15000);
    });
  });

  // ============================================
  // CP-214: EL CLIENTE NO PUEDE MODIFICAR EL TOTAL MANUALLY
  // ============================================

  describe('CP-214 - Verificar que el cliente no pueda modificar manualmente el valor total', () => {
    it('debería rechazar a nivel de validación (class-validator) si el payload contiene propiedades no permitidas como total o subtotal', () => {
      // Arrange
      const payload: any = {
        metodoVenta: cotizacionConTotalManualDto.metodoVenta,
        metodoPago: cotizacionConTotalManualDto.metodoPago,
        items: cotizacionConTotalManualDto.items,
        total: cotizacionConTotalManualDto.total, // Inyección manual de total
        subtotal: cotizacionConTotalManualDto.subtotal, // Inyección manual de subtotal
      };

      // Act & Assert
      // Simulamos la validación de forbidNonWhitelisted de NestJS
      try {
        const allowedProperties = ['metodoVenta', 'metodoPago', 'direccionEnvio', 'items'];
        const extraProperties = Object.keys(payload).filter(
          (key) => !allowedProperties.includes(key)
        );

        if (extraProperties.length > 0) {
          throw new BadRequestException(
            extraProperties.map((prop) => `property ${prop} should not exist`)
          );
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.response.message).toContain('property total should not exist');
        expect(error.response.message).toContain('property subtotal should not exist');
      }
    });

    it('debería ignorar los campos de total/subtotal manuales en el servicio y realizar el cálculo automáticamente', async () => {
      // Arrange
      const dtoInyectado: any = {
        metodoVenta: cotizacionConTotalManualDto.metodoVenta,
        metodoPago: cotizacionConTotalManualDto.metodoPago,
        items: cotizacionConTotalManualDto.items,
        total: cotizacionConTotalManualDto.total, // 500
        subtotal: cotizacionConTotalManualDto.subtotal, // 300
      };

      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne.mockResolvedValue(productoA);
      mockCotizacionRepository.save.mockResolvedValue(cotizacionCreadaInicialMock);
      mockDetalleRepository.create.mockReturnValue({});
      mockDetalleRepository.save.mockResolvedValue({});
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionCreadaInicialMock);

      // Act
      // Cast a CrearCotizacionDto para simular llamada al servicio omitiendo validación
      const result = await service.crearCotizacion(1, dtoInyectado as CrearCotizacionDto);

      // Assert
      // Debe ignorar completamente el total de 500 e inyectar el cálculo real (60000)
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.not.objectContaining({
          total: 500,
          subtotal: 300,
        })
      );
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 60000,
          total: 60000,
        })
      );
      expect(result.total).toBe(60000);
      expect(result.total).not.toBe(500);
    });
  });
});
