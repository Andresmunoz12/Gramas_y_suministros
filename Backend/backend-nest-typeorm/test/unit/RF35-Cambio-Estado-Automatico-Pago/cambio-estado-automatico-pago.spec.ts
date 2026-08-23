// test/unit/RF35-Cambio-Estado-Automatico-Pago/cambio-estado-automatico-pago.spec.ts

/**
 * MÓDULO: CAMBIO DE ESTADO AUTOMÁTICO POR PAGO
 * 
 * Casos de prueba implementados:
 * - CP-233: Verificar que una cotización nueva se registre con estado "Pendiente"
 * - CP-236: Verificar que generar una cotización con Entrega a Domicilio y un método de pago diferente a tarjeta, verificando que permanezca en "Pendiente"
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CotizacionesService } from '../../../src/cotizaciones/cotizaciones.service';
import { CotizacionesController } from '../../../src/cotizaciones/cotizaciones.controller';
import { Cotizacion } from '../../../src/cotizaciones/cotizacion.entity';
import { DetalleCotizacion } from '../../../src/cotizaciones/detalle-cotizacion.entity';
import { productos } from '../../../src/productos/productos.entity';
import { movimiento } from '../../../src/movimiento/movimiento.entity';
import { stock } from '../../../src/stock/stock.entity';
import {
  usuarioExistente,
  productoGrama,
  cotizacionNuevaDto,
  cotizacionNuevaMock,
  cotizacionDomicilioEfectivoDto,
  cotizacionDomicilioEfectivoMock,
} from './helpers/test-data';

// ============================================
// MOCKS - ACTUALIZADO CON STOCK
// ============================================

const mockCotizacionRepository = {
  create: jest.fn().mockImplementation((data) => data),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
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

describe('Cambio de Estado Automático por Pago - Casos de Prueba', () => {
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
  // CP-233: NUEVA COTIZACIÓN SE REGISTRA COMO PENDIENTE
  // ============================================

  describe('CP-233 - Verificar que una cotización nueva se registre con estado "Pendiente"', () => {
    it('debería inicializar el estado como "pendiente" al crear cualquier cotización nueva', async () => {
      // Arrange
      // ✅ Configurar stock disponible (100 unidades)
      const stockDisponible = {
        id_stock: 1,
        id_producto: 1,
        cantidad_actual: 100,
      };

      const reqMock = { user: { userId: usuarioExistente.id_usuario } };

      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne.mockResolvedValue(productoGrama);
      mockStockRepository.findOne.mockResolvedValue(stockDisponible);
      mockCotizacionRepository.save.mockResolvedValue(cotizacionNuevaMock);
      mockDetalleRepository.create.mockReturnValue({
        idDetalle: 1,
        idCotizacion: 90,
        idProducto: 1,
        cantidad: 2,
        precioUnitario: 30000,
        subtotal: 60000,
      });
      mockDetalleRepository.save.mockResolvedValue({});
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionNuevaMock);

      // Act
      const result = await controller.crearCotizacion(reqMock, cotizacionNuevaDto);

      // Assert
      // Verificar que el repositorio reciba 'pendiente' explícitamente al guardar
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: 'pendiente',
        })
      );
      expect(result.estado).toBe('pendiente');
    });
  });

  // ============================================
  // CP-236: ENTREGA A DOMICILIO Y PAGO DIFERENTE A TARJETA
  // ============================================

  describe('CP-236 - Verificar que generar una cotización con Entrega a Domicilio y un método de pago diferente a tarjeta, verificando que permanezca en "Pendiente"', () => {
    it('debería permanecer en estado "pendiente" si el método de venta es "envio" y el método de pago es "efectivo"', async () => {
      // Arrange
      // ✅ Configurar stock disponible (100 unidades)
      const stockDisponible = {
        id_stock: 1,
        id_producto: 1,
        cantidad_actual: 100,
      };

      const reqMock = { user: { userId: usuarioExistente.id_usuario } };

      mockCotizacionRepository.manager.findOne.mockResolvedValue(usuarioExistente);
      mockProductoRepository.findOne.mockResolvedValue(productoGrama);
      mockStockRepository.findOne.mockResolvedValue(stockDisponible);
      mockCotizacionRepository.save.mockResolvedValue(cotizacionDomicilioEfectivoMock);
      mockDetalleRepository.create.mockReturnValue({
        idDetalle: 2,
        idCotizacion: 91,
        idProducto: 1,
        cantidad: 2,
        precioUnitario: 30000,
        subtotal: 60000,
      });
      mockDetalleRepository.save.mockResolvedValue({});
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionDomicilioEfectivoMock);

      // Act
      const result = await controller.crearCotizacion(reqMock, cotizacionDomicilioEfectivoDto);

      // Assert
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metodoVenta: 'envio',
          metodoPago: 'efectivo',
          estado: 'pendiente',
        })
      );
      expect(result.estado).toBe('pendiente');
    });
  });
});