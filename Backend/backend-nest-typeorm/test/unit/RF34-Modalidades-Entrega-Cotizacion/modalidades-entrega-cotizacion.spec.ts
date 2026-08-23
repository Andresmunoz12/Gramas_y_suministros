// test/unit/RF34-Modalidades-Entrega-Cotizacion/modalidades-entrega-cotizacion.spec.ts

/**
 * MÓDULO: MODALIDADES DE ENTREGA DE COTIZACIÓN
 * 
 * Casos de prueba implementados:
 * - CP-227: Verificar que generar una cotización con modalidad Entrega Física
 * - CP-228: Verificar que generar una cotización con modalidad Entrega a Domicilio
 * - CP-232: Verificar el registro en auditoría de la operación (LoggerMiddleware)
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
import { LoggerMiddleware } from '../../../src/auth/middleware/logger/logger.middleware';
import {
  usuarioExistente,
  productoGrama,
  cotizacionFisicaDto,
  cotizacionFisicaCreadaMock,
  cotizacionEnvioDto,
  cotizacionEnvioCreadaMock,
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

describe('Modalidades de Entrega - Casos de Prueba', () => {
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
  // CP-227: GENERAR COTIZACIÓN MODALIDAD ENTREGA FÍSICA
  // ============================================

  describe('CP-227 - Verificar que generar una cotización con modalidad Entrega Física', () => {
    it('debería generar una cotización con metodoVenta = "fisico" y costo de envío en 0', async () => {
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
      mockCotizacionRepository.save.mockResolvedValue(cotizacionFisicaCreadaMock);
      mockDetalleRepository.create.mockReturnValue({
        idDetalle: 1,
        idCotizacion: 80,
        idProducto: 1,
        cantidad: 2,
        precioUnitario: 30000,
        subtotal: 60000,
      });
      mockDetalleRepository.save.mockResolvedValue({});
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionFisicaCreadaMock);

      // Act
      const result = await controller.crearCotizacion(reqMock, cotizacionFisicaDto);

      // Assert
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metodoVenta: 'fisico',
          costoEnvio: 0,
          total: 60000,
        })
      );
      expect(result.metodoVenta).toBe('fisico');
      expect(result.costoEnvio).toBe(0);
      expect(result.total).toBe(60000);
    });
  });

  // ============================================
  // CP-228: GENERAR COTIZACIÓN MODALIDAD ENTREGA A DOMICILIO
  // ============================================

  describe('CP-228 - Verificar que generar una cotización con modalidad Entrega a Domicilio', () => {
    it('debería generar una cotización con metodoVenta = "envio", sumando $8000 de costo de envío', async () => {
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
      mockCotizacionRepository.save.mockResolvedValue(cotizacionEnvioCreadaMock);
      mockDetalleRepository.create.mockReturnValue({
        idDetalle: 2,
        idCotizacion: 81,
        idProducto: 1,
        cantidad: 2,
        precioUnitario: 30000,
        subtotal: 60000,
      });
      mockDetalleRepository.save.mockResolvedValue({});
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionEnvioCreadaMock);

      // Act
      const result = await controller.crearCotizacion(reqMock, cotizacionEnvioDto);

      // Assert
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          metodoVenta: 'envio',
          costoEnvio: 8000,
          total: 68000,
          direccionEnvio: 'Calle Falsa 123',
        })
      );
      expect(result.metodoVenta).toBe('envio');
      expect(result.costoEnvio).toBe(8000);
      expect(result.total).toBe(68000);
      expect(result.direccionEnvio).toBe('Calle Falsa 123');
    });
  });

  // ============================================
  // CP-232: REGISTRO EN AUDITORÍA DE LA OPERACIÓN
  // ============================================

  describe('CP-232 - Verificar que verificar el registro en auditoría de la operación', () => {
    it('debería registrar el evento de la petición HTTP en consola (auditoría de operación) a través del LoggerMiddleware', () => {
      // Arrange
      const middleware = new LoggerMiddleware();
      const req = {
        method: 'POST',
        originalUrl: '/cotizaciones',
      } as any;
      const res = {
        statusCode: 201,
        on: jest.fn().mockImplementation((event, callback) => {
          if (event === 'finish') {
            callback();
          }
        }),
      } as any;
      const next = jest.fn();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      middleware.use(req, res, next);

      // Assert
      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('POST /cotizaciones - Estado: 201')
      );

      consoleSpy.mockRestore();
    });
  });
});