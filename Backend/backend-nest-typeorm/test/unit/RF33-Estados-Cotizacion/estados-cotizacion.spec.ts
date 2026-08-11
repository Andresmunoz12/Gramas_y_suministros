// test/unit/RF33-Estados-Cotizacion/estados-cotizacion.spec.ts

/**
 * MÓDULO: ESTADOS DE COTIZACIÓN
 * 
 * Casos de prueba implementados:
 * - CP-221: Verificar que cambiar una cotización de Pendiente a Pagada
 * - CP-222: Verificar que cambiar una cotización de Pagada a Entregada
 * - CP-223: Verificar que cambiar una cotización a Cancelada
 * - CP-225: Verificar que la ejecución automática del descuento de inventario al pasar a Entregada
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
import {
  productoGrama,
  stockSuficiente,
  cotizacionPendienteMock,
  cotizacionPagadaMock,
  cotizacionEntregadaMock,
  cotizacionCanceladaMock,
} from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockUpdateQueryBuilder = {
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  execute: jest.fn().mockResolvedValue({}),
};

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
  createQueryBuilder: jest.fn().mockReturnValue(mockUpdateQueryBuilder),
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Estados de Cotización - Casos de Prueba', () => {
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
  // CP-221: CAMBIAR DE PENDIENTE A PAGADA
  // ============================================

  describe('CP-221 - Verificar que cambiar una cotización de Pendiente a Pagada', () => {
    it('debería cambiar el estado a "pagado" y registrar la fecha de pago usando simularPago', async () => {
      // Arrange
      mockCotizacionRepository.findOne
        .mockResolvedValueOnce({
          ...cotizacionPendienteMock, // Llamada en simularPago para buscar cotización
        })
        .mockResolvedValueOnce({
          ...cotizacionPendienteMock,
          estado: 'pagado',
          fechaPago: new Date(), // Llamada en obtenerCotizacionCompleta
        });

      mockCotizacionRepository.save.mockResolvedValue({});

      // Act
      const result = await controller.simularPago(70);

      // Assert
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          idCotizacion: 70,
          estado: 'pagado',
          fechaPago: expect.any(Date),
        })
      );
      expect(result.mensaje).toBe('Pago simulado exitosamente');
      expect(result.cotizacion.estado).toBe('pagado');
    });

    it('debería cambiar el estado a "pagado" usando actualizarEstado (Admin)', async () => {
      // Arrange
      mockCotizacionRepository.findOne
        .mockResolvedValueOnce({
          ...cotizacionPendienteMock,
        })
        .mockResolvedValueOnce({
          ...cotizacionPendienteMock,
          estado: 'pagado',
        });

      mockCotizacionRepository.save.mockResolvedValue({});

      // Act
      const result = await controller.actualizarEstado(70, { estado: 'pagado' });

      // Assert
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          idCotizacion: 70,
          estado: 'pagado',
        })
      );
      expect(result.cotizacion.estado).toBe('pagado');
    });
  });

  // ============================================
  // CP-222: CAMBIAR DE PAGADA A ENTREGADA
  // ============================================

  describe('CP-222 - Verificar que cambiar una cotización de Pagada a Entregada', () => {
    it('debería permitir cambiar el estado de "pagado" a "entregado" y procesar correctamente', async () => {
      // Arrange
      mockCotizacionRepository.findOne
        .mockResolvedValueOnce({
          ...cotizacionPagadaMock, // Estado inicial: pagado
        })
        .mockResolvedValueOnce({
          ...cotizacionPagadaMock,
          estado: 'entregado', // Estado final
        });

      mockStockRepository.findOne.mockResolvedValue(stockSuficiente);
      mockCotizacionRepository.save.mockResolvedValue({});
      mockMovimientoRepository.create.mockReturnValue({});
      mockMovimientoRepository.save.mockResolvedValue({});

      // Act
      const result = await controller.actualizarEstado(71, { estado: 'entregado' });

      // Assert
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          idCotizacion: 71,
          estado: 'entregado',
        })
      );
      expect(result.cotizacion.estado).toBe('entregado');
    });
  });

  // ============================================
  // CP-223: CAMBIAR A CANCELADA
  // ============================================

  describe('CP-223 - Verificar que cambiar una cotización a Cancelada', () => {
    it('debería permitir cambiar el estado de una cotización pendiente a "cancelado"', async () => {
      // Arrange
      mockCotizacionRepository.findOne
        .mockResolvedValueOnce({
          ...cotizacionPendienteMock,
        })
        .mockResolvedValueOnce({
          ...cotizacionPendienteMock,
          estado: 'cancelado',
        });

      mockCotizacionRepository.save.mockResolvedValue({});

      // Act
      const result = await controller.actualizarEstado(70, { estado: 'cancelado' });

      // Assert
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          idCotizacion: 70,
          estado: 'cancelado',
        })
      );
      expect(result.cotizacion.estado).toBe('cancelado');
    });
  });

  // ============================================
  // CP-225: DESCUENTO DE INVENTARIO AUTOMÁTICO AL PASAR A ENTREGADA
  // ============================================

  describe('CP-225 - Verificar que la ejecución automática del descuento de inventario al pasar a Entregada', () => {
    it('debería gatillar la lógica de descuento de inventario al cambiar el estado a "entregado"', async () => {
      // Arrange
      mockCotizacionRepository.findOne
        .mockResolvedValueOnce({
          ...cotizacionPendienteMock,
        })
        .mockResolvedValueOnce({
          ...cotizacionPendienteMock,
          estado: 'entregado',
        });

      mockStockRepository.findOne.mockResolvedValue(stockSuficiente);
      mockCotizacionRepository.save.mockResolvedValue({});
      mockMovimientoRepository.create.mockReturnValue({});
      mockMovimientoRepository.save.mockResolvedValue({});

      // Act
      await service.actualizarEstado(70, 'entregado');

      // Assert
      // Verificar que se llamó a la lógica de descuento (QueryBuilder de Stock y Save de Movimiento)
      expect(mockStockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockUpdateQueryBuilder.update).toHaveBeenCalledWith(stock);
      expect(mockMovimientoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id_producto: 1,
          cantidad: 5,
          tipo: 'salida',
        })
      );
      expect(mockMovimientoRepository.save).toHaveBeenCalled();
    });
  });
});
