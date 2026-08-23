// test/unit/RF37-Consultar-Historial-Cotizaciones/consultar-historial-cotizaciones.spec.ts

/**
 * MÓDULO: CONSULTAR HISTORIAL DE COTIZACIONES
 * 
 * Casos de prueba:
 * - CP-247: Verificar que consultar el historial de cotizaciones como cliente.
 * - CP-248: Verificar que consultar el historial de cotizaciones de un cliente como administrador.
 * - CP-249: Verificar que intentar consultar las cotizaciones de otro cliente.
 * - CP-250: Verificar que consultar el historial cuando no existen cotizaciones registradas.
 * - CP-251: Verificar que la información mostrada incluya número, fecha, estado, modalidad de entrega y valor total.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { CotizacionesService } from '../../../src/cotizaciones/cotizaciones.service';
import { CotizacionesController } from '../../../src/cotizaciones/cotizaciones.controller';
import { Cotizacion } from '../../../src/cotizaciones/cotizacion.entity';
import { DetalleCotizacion } from '../../../src/cotizaciones/detalle-cotizacion.entity';
import { productos } from '../../../src/productos/productos.entity';
import { movimiento } from '../../../src/movimiento/movimiento.entity';
import { stock } from '../../../src/stock/stock.entity';
import {
  usuarioCliente,
  usuarioAdmin,
  usuarioAjeno,
  cotizacionJuanMock,
  cotizacionPedroMock,
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
  find: jest.fn(),
  findOne: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
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

describe('Consultar Historial de Cotizaciones - Casos de Prueba', () => {
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
  // CP-247: CONSULTAR HISTORIAL COMO CLIENTE
  // ============================================

  describe('CP-247 - Verificar que consultar el historial de cotizaciones como cliente', () => {
    it('debería retornar el listado de cotizaciones pertenecientes al usuario autenticado', async () => {
      // Arrange
      mockCotizacionRepository.find.mockResolvedValue([cotizacionJuanMock]);

      // Act
      const result = await controller.obtenerMisCotizaciones({ user: usuarioCliente });

      // Assert
      expect(mockCotizacionRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { idUsuario: usuarioCliente.userId },
        })
      );
      expect(result).toHaveLength(1);
      expect(result[0].idUsuario).toBe(usuarioCliente.userId);
    });
  });

  // ============================================
  // CP-248: CONSULTAR HISTORIAL DE UN CLIENTE COMO ADMIN
  // ============================================

  describe('CP-248 - Verificar que consultar el historial de cotizaciones de un cliente como administrador', () => {
    it('debería filtrar las cotizaciones por nombre/correo de cliente utilizando QueryBuilder', async () => {
      // Arrange
      mockQueryBuilder.getMany.mockResolvedValue([cotizacionPedroMock]);

      // Act
      const result = await controller.obtenerTodasCotizaciones(
        { user: usuarioAdmin },
        undefined, // estado
        undefined, // fechaInicio
        undefined, // fechaFin
        'Pedro' // search
      );

      // Assert
      expect(mockCotizacionRepository.createQueryBuilder).toHaveBeenCalledWith('cotizacion');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('usuario.nombre LIKE :search'),
        expect.objectContaining({ search: '%Pedro%' })
      );
      expect(result).toHaveLength(1);
      expect(result[0].usuario.nombre).toBe('Pedro');
    });
  });

  // ============================================
  // CP-249: INTENTAR CONSULTAR COTIZACIÓN DE OTRO CLIENTE
  // ============================================

  describe('CP-249 - Verificar que intentar consultar las cotizaciones de otro cliente', () => {
    it('debería restringir el acceso lanzando ForbiddenException al solicitar el detalle de una cotización ajena', async () => {
      // Arrange
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionPedroMock); // Pertenece a Pedro (idUsuario = 3)

      // Act & Assert
      // Juan (userId = 1) intenta consultar la cotización de Pedro
      await expect(
        controller.obtenerCotizacion({ user: usuarioCliente }, 121)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ============================================
  // CP-250: CONSULTAR HISTORIAL SIN REGISTROS
  // ============================================

  describe('CP-250 - Verificar que consultar el historial cuando no existen cotizaciones registradas', () => {
    it('debería retornar un listado vacío de cotizaciones sin errores', async () => {
      // Arrange
      mockCotizacionRepository.find.mockResolvedValue([]);

      // Act
      const result = await controller.obtenerMisCotizaciones({ user: usuarioCliente });

      // Assert
      expect(result).toEqual([]);
    });
  });

  // ============================================
  // CP-251: CONTENIDO DE INFORMACIÓN EXPUESTA
  // ============================================

  describe('CP-251 - Verificar que verificar que la información mostrada incluya número, fecha, estado, modalidad de entrega y valor total', () => {
    it('debería incluir propiedades esenciales de la cotización en el objeto retornado', async () => {
      // Arrange
      mockCotizacionRepository.find.mockResolvedValue([cotizacionJuanMock]);

      // Act
      const result = await controller.obtenerMisCotizaciones({ user: usuarioCliente });

      // Assert
      const cotizacion = result[0];
      expect(cotizacion).toHaveProperty('idCotizacion'); // Número
      expect(cotizacion).toHaveProperty('fechaCreacion'); // Fecha
      expect(cotizacion).toHaveProperty('estado'); // Estado
      expect(cotizacion).toHaveProperty('metodoVenta'); // Modalidad de entrega / venta
      expect(cotizacion).toHaveProperty('total'); // Valor total
    });
  });
});
