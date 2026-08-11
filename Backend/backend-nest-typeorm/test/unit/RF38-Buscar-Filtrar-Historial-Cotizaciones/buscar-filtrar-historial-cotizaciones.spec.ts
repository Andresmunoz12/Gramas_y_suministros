// test/unit/RF38-Buscar-Filtrar-Historial-Cotizaciones/buscar-filtrar-historial-cotizaciones.spec.ts

/**
 * MÓDULO: BUSCAR Y FILTRAR HISTORIAL DE COTIZACIONES
 * 
 * Casos de prueba:
 * - CP-253: Verificar que buscar cotizaciones por cliente.
 * - CP-254: Verificar que buscar cotizaciones por fecha.
 * - CP-255: Verificar que buscar cotizaciones por estado Pendiente.
 * - CP-256: Verificar que buscar cotizaciones por estado Pagada, Entregada o Cancelada.
 * - CP-257: Verificar que aplicar múltiples filtros simultáneamente.
 * - CP-258: Verificar que realizar una búsqueda sin resultados.
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
  usuarioAdmin,
  mockCotizaciones,
} from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockQueryBuilder = {
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  getMany: jest.fn(),
};

const mockCotizacionRepository = {
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
};

const mockDetalleRepository = {};
const mockProductoRepository = {};
const mockMovimientoRepository = {};
const mockStockRepository = {};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Buscar y Filtrar Historial de Cotizaciones - Casos de Prueba', () => {
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
  // CP-253: BUSCAR POR CLIENTE
  // ============================================

  describe('CP-253 - Verificar que buscar cotizaciones por cliente', () => {
    it('debería aplicar el filtro de búsqueda por nombre/correo de cliente', async () => {
      // Arrange
      const filtered = mockCotizaciones.filter(c => c.usuario.nombre.includes('Juan'));
      mockQueryBuilder.getMany.mockResolvedValue(filtered);

      // Act
      const result = await controller.obtenerTodasCotizaciones(
        { user: usuarioAdmin },
        undefined,
        undefined,
        undefined,
        'Juan'
      );

      // Assert
      expect(mockCotizacionRepository.createQueryBuilder).toHaveBeenCalledWith('cotizacion');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('usuario.nombre LIKE :search'),
        expect.objectContaining({ search: '%Juan%' })
      );
      expect(result).toHaveLength(2);
      expect(result[0].usuario.nombre).toBe('Juan Perez');
    });
  });

  // ============================================
  // CP-254: BUSCAR POR FECHA
  // ============================================

  describe('CP-254 - Verificar que buscar cotizaciones por fecha', () => {
    it('debería aplicar los filtros de fecha inicio y fecha fin', async () => {
      // Arrange
      const startDate = '2026-08-01';
      const endDate = '2026-08-05T23:59:59.999Z';
      const filtered = mockCotizaciones.filter(
        c => c.fechaCreacion >= new Date(startDate) && c.fechaCreacion <= new Date(endDate)
      );
      mockQueryBuilder.getMany.mockResolvedValue(filtered);

      // Act
      const result = await controller.obtenerTodasCotizaciones(
        { user: usuarioAdmin },
        undefined,
        startDate,
        endDate
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'cotizacion.fechaCreacion >= :fechaInicio',
        expect.objectContaining({ fechaInicio: new Date(startDate) })
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'cotizacion.fechaCreacion <= :fechaFin',
        expect.objectContaining({ fechaFin: new Date(endDate) })
      );
      expect(result).toHaveLength(2);
    });
  });

  // ============================================
  // CP-255: BUSCAR POR ESTADO PENDIENTE
  // ============================================

  describe('CP-255 - Verificar que buscar cotizaciones por estado Pendiente', () => {
    it('debería filtrar únicamente las cotizaciones con estado "pendiente"', async () => {
      // Arrange
      const filtered = mockCotizaciones.filter(c => c.estado === 'pendiente');
      mockQueryBuilder.getMany.mockResolvedValue(filtered);

      // Act
      const result = await controller.obtenerTodasCotizaciones(
        { user: usuarioAdmin },
        'pendiente'
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'cotizacion.estado = :estado',
        expect.objectContaining({ estado: 'pendiente' })
      );
      expect(result).toHaveLength(1);
      expect(result[0].estado).toBe('pendiente');
    });
  });

  // ============================================
  // CP-256: BUSCAR POR ESTADOS PAGADA, ENTREGADA O CANCELADA
  // ============================================

  describe('CP-256 - Verificar que buscar cotizaciones por estado Pagada, Entregada o Cancelada', () => {
    it.each(['pagado', 'entregado', 'cancelado'])(
      'debería filtrar por el estado "%s"',
      async (estado) => {
        // Arrange
        const filtered = mockCotizaciones.filter(c => c.estado === estado);
        mockQueryBuilder.getMany.mockResolvedValue(filtered);

        // Act
        const result = await controller.obtenerTodasCotizaciones(
          { user: usuarioAdmin },
          estado
        );

        // Assert
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
          'cotizacion.estado = :estado',
          { estado }
        );
        expect(result).toHaveLength(1);
        expect(result[0].estado).toBe(estado);
      }
    );
  });

  // ============================================
  // CP-257: APLICAR MÚLTIPLES FILTROS SIMULTÁNEAMENTE
  // ============================================

  describe('CP-257 - Verificar que aplicar múltiples filtros simultáneamente', () => {
    it('debería encadenar correctamente filtros de estado, fechas y texto de búsqueda', async () => {
      // Arrange
      const filtered = [mockCotizaciones[0]]; // Juan Perez, pendiente, 2026-08-01
      mockQueryBuilder.getMany.mockResolvedValue(filtered);

      // Act
      const result = await controller.obtenerTodasCotizaciones(
        { user: usuarioAdmin },
        'pendiente',
        '2026-08-01',
        '2026-08-02',
        'Juan'
      );

      // Assert
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'cotizacion.estado = :estado',
        { estado: 'pendiente' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'cotizacion.fechaCreacion >= :fechaInicio',
        { fechaInicio: new Date('2026-08-01') }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'cotizacion.fechaCreacion <= :fechaFin',
        { fechaFin: new Date('2026-08-02') }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('usuario.nombre LIKE :search'),
        { search: '%Juan%' }
      );
      expect(result).toHaveLength(1);
    });
  });

  // ============================================
  // CP-258: BÚSQUEDA SIN RESULTADOS
  // ============================================

  describe('CP-258 - Verificar que realizar una búsqueda sin resultados', () => {
    it('debería retornar un listado vacío cuando no hay coincidencia con los filtros', async () => {
      // Arrange
      mockQueryBuilder.getMany.mockResolvedValue([]);

      // Act
      const result = await controller.obtenerTodasCotizaciones(
        { user: usuarioAdmin },
        'cancelado',
        undefined,
        undefined,
        'Inexistente'
      );

      // Assert
      expect(result).toEqual([]);
    });
  });
});
