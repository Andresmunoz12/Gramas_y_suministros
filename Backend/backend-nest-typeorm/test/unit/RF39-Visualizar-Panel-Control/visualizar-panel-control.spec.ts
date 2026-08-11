// test/unit/RF39-Visualizar-Panel-Control/visualizar-panel-control.spec.ts

/**
 * MÓDULO: VISUALIZAR PANEL DE CONTROL (DASHBOARD ADMINISTRADOR)
 * 
 * Casos de prueba:
 * - CP-261: Verificar que visualizar correctamente el panel de control como administrador.
 * - CP-262: Verificar que verificar la cantidad de usuarios registrados mostrada.
 * - CP-263: Verificar que verificar las estadísticas de productos y stock.
 * - CP-264: Verificar que verificar las estadísticas de cotizaciones por estado.
 * - CP-265: Verificar que intentar acceder al panel con un usuario sin permisos.
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
import { ROLES_KEY } from '../../../src/auth/decorators/roles.decorator';
import { mockDashboardData } from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockStockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue({ total: mockDashboardData.stockTotal }),
};

const mockCotizacionQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  getRawOne: jest.fn().mockResolvedValue({ total: mockDashboardData.ventasTotales }),
};

const mockCotizacionRepository = {
  count: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockCotizacionQueryBuilder),
  manager: {
    count: jest.fn().mockResolvedValue(mockDashboardData.usuariosRegistrados),
  },
};

const mockDetalleRepository = {};

const mockProductoRepository = {
  count: jest.fn().mockResolvedValue(mockDashboardData.productosRegistrados),
};

const mockMovimientoRepository = {};

const mockStockRepository = {
  createQueryBuilder: jest.fn().mockReturnValue(mockStockQueryBuilder),
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Visualizar Panel de Control - Casos de Prueba', () => {
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

  // Setup count mock values in order
  const setupCountsMock = () => {
    mockCotizacionRepository.count
      .mockReset()
      .mockResolvedValueOnce(mockDashboardData.total)         // total
      .mockResolvedValueOnce(mockDashboardData.pendiente)     // pendiente
      .mockResolvedValueOnce(mockDashboardData.pagado)        // pagado
      .mockResolvedValueOnce(mockDashboardData.entregado)     // entregado
      .mockResolvedValueOnce(mockDashboardData.cancelado)     // cancelado
      .mockResolvedValueOnce(mockDashboardData.ultimoMes)      // ultimoMes
      .mockResolvedValueOnce(mockDashboardData.ultimaSemana);  // ultimaSemana
  };

  // ============================================
  // CP-261: PANEL DE CONTROL COMO ADMINISTRADOR
  // ============================================

  describe('CP-261 - Verificar que visualizar correctamente el panel de control como administrador', () => {
    it('debería retornar el conjunto completo de métricas del panel administrativo', async () => {
      // Arrange
      setupCountsMock();

      // Act
      const result = await controller.obtenerEstadisticas();

      // Assert
      expect(result).toBeDefined();
      expect(result.total).toBe(mockDashboardData.total);
      expect(result.ventasTotales).toBe(mockDashboardData.ventasTotales);
      expect(result.ultimoMes).toBe(mockDashboardData.ultimoMes);
      expect(result.ultimaSemana).toBe(mockDashboardData.ultimaSemana);
    });
  });

  // ============================================
  // CP-262: CANTIDAD DE USUARIOS REGISTRADOS
  // ============================================

  describe('CP-262 - Verificar que verificar la cantidad de usuarios registrados mostrada', () => {
    it('debería consultar el gestor de entidades para contar los usuarios registrados', async () => {
      // Arrange
      setupCountsMock();

      // Act
      const result = await controller.obtenerEstadisticas();

      // Assert
      expect(mockCotizacionRepository.manager.count).toHaveBeenCalled();
      expect(result.usuariosRegistrados).toBe(mockDashboardData.usuariosRegistrados);
    });
  });

  // ============================================
  // CP-263: ESTADÍSTICAS DE PRODUCTOS Y STOCK
  // ============================================

  describe('CP-263 - Verificar que verificar las estadísticas de productos y stock', () => {
    it('debería retornar el total de productos y la suma total del inventario', async () => {
      // Arrange
      setupCountsMock();

      // Act
      const result = await controller.obtenerEstadisticas();

      // Assert
      expect(mockProductoRepository.count).toHaveBeenCalled();
      expect(mockStockRepository.createQueryBuilder).toHaveBeenCalledWith('stock');
      expect(result.productosRegistrados).toBe(mockDashboardData.productosRegistrados);
      expect(result.stockTotal).toBe(mockDashboardData.stockTotal);
    });
  });

  // ============================================
  // CP-264: ESTADÍSTICAS DE COTIZACIONES POR ESTADO
  // ============================================

  describe('CP-264 - Verificar que verificar las estadísticas de cotizaciones por estado', () => {
    it('debería contar las cotizaciones filtrando individualmente por cada estado de negocio', async () => {
      // Arrange
      setupCountsMock();

      // Act
      const result = await controller.obtenerEstadisticas();

      // Assert
      expect(result.pendiente).toBe(mockDashboardData.pendiente);
      expect(result.pagado).toBe(mockDashboardData.pagado);
      expect(result.entregado).toBe(mockDashboardData.entregado);
      expect(result.cancelado).toBe(mockDashboardData.cancelado);
    });
  });

  // ============================================
  // CP-265: INTENTAR ACCEDER SIN PERMISOS (SEGURIDAD DE DECORADOR DE ROL)
  // ============================================

  describe('CP-265 - Verificar que intentar acceder al panel con un usuario sin permisos', () => {
    it('debería restringir el endpoint a nivel de decoradores exigiendo rol de Administrador (1)', () => {
      // Act
      const roles = Reflect.getMetadata(ROLES_KEY, controller.obtenerEstadisticas);

      // Assert
      expect(roles).toBeDefined();
      expect(roles).toContain(1); // Requiere Rol 1 (Admin)
    });
  });
});
