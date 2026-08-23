// test/unit/RF32-Despacho-Entrega-Cotizacion/despacho-entrega-cotizacion.spec.ts

/**
 * MÓDULO: DESPACHO Y ENTREGA DE COTIZACIÓN (DESCUENTO DE STOCK)
 * 
 * Casos de prueba implementados:
 * - CP-215: Verificar que cambiar una cotización al estado "Entregada" con stock suficiente
 * - CP-217: Verificar que la actualización automática del inventario
 * - CP-218: Verificar que el registro de los movimientos de salida generados automáticamente
 * - CP-219: Verificar que al entregar nuevamente una cotización ya entregada
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
  usuarioExistente,
  productoGrama,
  stockSuficiente,
  stockInsuficiente,
  cotizacionPendienteMock,
  cotizacionEntregadaMock,
  mensajesErrorStock,
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

describe('Despacho y Entrega de Cotización - Casos de Prueba', () => {
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
  // CP-215: CAMBIAR ESTADO A ENTREGADA CON STOCK SUFICIENTE
  // ============================================

  describe('CP-215 - Verificar que cambiar una cotización al estado "Entregada" con stock suficiente', () => {
    it('debería cambiar el estado a entregada exitosamente si hay suficiente stock de los productos', async () => {
      // Arrange
      // Cotización en estado 'pendiente'
      mockCotizacionRepository.findOne
        .mockResolvedValueOnce({
          ...cotizacionPendienteMock,
        }) // Primera llamada en actualizarEstado
        .mockResolvedValueOnce({
          ...cotizacionPendienteMock,
          estado: 'entregado',
        }); // Segunda llamada (obtenerCotizacionCompleta)

      mockStockRepository.findOne.mockResolvedValue(stockSuficiente);
      mockCotizacionRepository.save.mockResolvedValue({});
      mockMovimientoRepository.create.mockReturnValue({});
      mockMovimientoRepository.save.mockResolvedValue({});

      // Act
      const result = await controller.actualizarEstado(50, { estado: 'entregado' });

      // Assert
      expect(mockCotizacionRepository.findOne).toHaveBeenNthCalledWith(1, {
        where: { idCotizacion: 50 },
        relations: ['detalles', 'detalles.producto'],
      });
      expect(mockStockRepository.findOne).toHaveBeenCalledWith({
        where: { id_producto: 1 },
      });
      expect(mockCotizacionRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          idCotizacion: 50,
          estado: 'entregado',
        })
      );
      expect(result.mensaje).toBe('Estado actualizado a "entregado"');
      expect(result.cotizacion.estado).toBe('entregado');
    });
  });

  // ============================================
  // CP-217: ACTUALIZACIÓN AUTOMÁTICA DEL INVENTARIO
  // ============================================

  describe('CP-217 - Verificar que la actualización automática del inventario', () => {
    it('debería descontar la cantidad cotizada del stock del producto automáticamente', async () => {
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
      await service.actualizarEstado(50, 'entregado');

      // Assert
      // Verificar que se llamó al querybuilder para restar el stock
      expect(mockStockRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockUpdateQueryBuilder.update).toHaveBeenCalledWith(stock);
      expect(mockUpdateQueryBuilder.where).toHaveBeenCalledWith('id_producto = :id', { id: 1 });
      
      // La query restará 10 unidades
      const setArg = mockUpdateQueryBuilder.set.mock.calls[0][0];
      expect(setArg.cantidad_actual).toBeDefined();
      expect(typeof setArg.cantidad_actual).toBe('function');
      expect(setArg.cantidad_actual()).toBe('cantidad_actual - 10');
    });
  });

  // ============================================
  // CP-218: REGISTRO DE MOVIMIENTOS DE SALIDA
  // ============================================

  describe('CP-218 - Verificar que el registro de los movimientos de salida generados automáticamente', () => {
    it('debería registrar un movimiento de tipo "salida" asociado a la entrega de la cotización', async () => {
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
      mockMovimientoRepository.create.mockReturnValue({
        id_producto: 1,
        id_usuario: 1,
        cantidad: 10,
        tipo: 'salida',
        detalle: 'Venta por cotización #50',
      });
      mockMovimientoRepository.save.mockResolvedValue({});

      // Act
      await service.actualizarEstado(50, 'entregado');

      // Assert
      expect(mockMovimientoRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id_producto: 1,
          id_usuario: 1,
          cantidad: 10,
          tipo: 'salida',
          detalle: 'Venta por cotización #50',
        })
      );
      expect(mockMovimientoRepository.save).toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-219: ENTREGAR NUEVAMENTE UNA COTIZACIÓN YA ENTREGADA
  // ============================================

  describe('CP-219 - Verificar que al entregar nuevamente una cotización ya entregada', () => {
    it('no debería ejecutar la resta de stock ni registrar movimientos duplicados si el estado ya era entregado', async () => {
      // Arrange
      // Cotización en estado 'entregado'
      mockCotizacionRepository.findOne
        .mockResolvedValueOnce({
          ...cotizacionEntregadaMock,
        })
        .mockResolvedValueOnce({
          ...cotizacionEntregadaMock,
        });

      mockCotizacionRepository.save.mockResolvedValue({});

      // Act
      await service.actualizarEstado(60, 'entregado');

      // Assert
      // No debe buscar stock ya que la cotización ya estaba entregada
      expect(mockStockRepository.findOne).not.toHaveBeenCalled();
      
      // No debe descontar stock del inventario
      expect(mockStockRepository.createQueryBuilder).not.toHaveBeenCalled();
      
      // No debe registrar movimientos de salida adicionales
      expect(mockMovimientoRepository.create).not.toHaveBeenCalled();
      expect(mockMovimientoRepository.save).not.toHaveBeenCalled();
      
      // El estado se mantiene/guarda como entregado sin cambios colaterales
      expect(mockCotizacionRepository.save).toHaveBeenCalled();
    });
  });
});
