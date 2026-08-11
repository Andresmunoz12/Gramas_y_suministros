// test/unit/RF36-Generar-Descargar-PDF/generar-descargar-pdf.spec.ts

/**
 * MÓDULO: GENERAR Y DESCARGAR COTIZACIÓN EN PDF
 * 
 * Casos de prueba:
 * - CP-239: Verificar que generar el PDF de una cotización correctamente.
 * - CP-240: Verificar que descargar el PDF como cliente propietario de la cotización.
 * - CP-241: Verificar que descargar el PDF como administrador.
 * - CP-242: Verificar que intentar descargar una cotización que no pertenece al cliente.
 * - CP-245: Verificar que verificar el contenido del PDF sea correcto.
 * - CP-246: Verificar que verificar el registro en auditoría de la descarga.
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
import { Response } from 'express';
import {
  usuarioCliente,
  usuarioAdmin,
  usuarioAjeno,
  cotizacionJuanMock,
} from './helpers/test-data';

// ============================================
// MOCKS DE PDFKIT (DEFINIDOS ANTES DEL MÓDULO)
// ============================================

const mockPipe = jest.fn();
const mockText = jest.fn().mockReturnThis();
const mockFontSize = jest.fn().mockReturnThis();
const mockFont = jest.fn().mockReturnThis();
const mockFillColor = jest.fn().mockReturnThis();
const mockMoveDown = jest.fn().mockReturnThis();
const mockStrokeColor = jest.fn().mockReturnThis();
const mockLineWidth = jest.fn().mockReturnThis();
const mockMoveTo = jest.fn().mockReturnThis();
const mockLineTo = jest.fn().mockReturnThis();
const mockStroke = jest.fn().mockReturnThis();
const mockRect = jest.fn().mockReturnThis();
const mockFill = jest.fn().mockReturnThis();
const mockEnd = jest.fn().mockReturnThis();

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    return {
      pipe: mockPipe,
      fontSize: mockFontSize,
      font: mockFont,
      fillColor: mockFillColor,
      text: mockText,
      moveDown: mockMoveDown,
      strokeColor: mockStrokeColor,
      lineWidth: mockLineWidth,
      moveTo: mockMoveTo,
      lineTo: mockLineTo,
      stroke: mockStroke,
      rect: mockRect,
      fill: mockFill,
      end: mockEnd,
      y: 100,
    };
  });
});

// ============================================
// MOCKS DE REPOSITORIOS
// ============================================

const mockCotizacionRepository = {
  findOne: jest.fn(),
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

describe('Generar y Descargar Cotización en PDF - Casos de Prueba', () => {
  let service: CotizacionesService;
  let controller: CotizacionesController;
  let resMock: Partial<Response>;

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

    resMock = {
      setHeader: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CP-239: GENERAR PDF CORRECTAMENTE
  // ============================================

  describe('CP-239 - Verificar que generar el PDF de una cotización correctamente', () => {
    it('debería instanciar PDFDocument y entubar la respuesta express', async () => {
      // Arrange
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionJuanMock);

      // Act
      await controller.descargarPDF({ user: usuarioCliente }, 100, resMock as Response);

      // Assert
      expect(mockPipe).toHaveBeenCalledWith(resMock);
      expect(resMock.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
    });
  });

  // ============================================
  // CP-240: DESCARGAR COMO CLIENTE PROPIETARIO
  // ============================================

  describe('CP-240 - Verificar que descargar el PDF como cliente propietario de la cotización', () => {
    it('debería permitir la descarga si el userId coincide con el idUsuario de la cotización', async () => {
      // Arrange
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionJuanMock);

      // Act & Assert
      await expect(
        controller.descargarPDF({ user: usuarioCliente }, 100, resMock as Response)
      ).resolves.not.toThrow();
    });
  });

  // ============================================
  // CP-241: DESCARGAR COMO ADMINISTRADOR
  // ============================================

  describe('CP-241 - Verificar que descargar el PDF como administrador', () => {
    it('debería permitir la descarga a un administrador aunque la cotización pertenezca a otro usuario', async () => {
      // Arrange
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionJuanMock);

      // Act & Assert
      await expect(
        controller.descargarPDF({ user: usuarioAdmin }, 100, resMock as Response)
      ).resolves.not.toThrow();
    });
  });

  // ============================================
  // CP-242: INTENTAR DESCARGAR COTIZACIÓN DE OTRO CLIENTE
  // ============================================

  describe('CP-242 - Verificar que intentar descargar una cotización que no pertenece al cliente', () => {
    it('debería lanzar ForbiddenException si el cliente intenta descargar una cotización de otro usuario', async () => {
      // Arrange
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionJuanMock);

      // Act & Assert
      await expect(
        controller.descargarPDF({ user: usuarioAjeno }, 100, resMock as Response)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ============================================
  // CP-245: CONTENIDO DEL PDF CORRECTO
  // ============================================

  describe('CP-245 - Verificar que verificar el contenido del PDF sea correcto', () => {
    it('debería escribir los datos clave de la cotización (título, datos cliente, productos) en el PDF', async () => {
      // Arrange
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionJuanMock);

      // Act
      await controller.descargarPDF({ user: usuarioCliente }, 100, resMock as Response);

      // Assert
      expect(mockText).toHaveBeenCalledWith('GRAMAS Y SUMINISTROS', expect.any(Object));
      expect(mockText).toHaveBeenCalledWith(expect.stringContaining('RECIBO DE COTIZACIÓN #100'));
      expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Nombre: Juan Perez'));
      expect(mockText).toHaveBeenCalledWith(expect.stringContaining('Email: juan@test.com'));
    });
  });

  // ============================================
  // CP-246: REGISTRO EN AUDITORÍA DE DESCARGA
  // ============================================

  describe('CP-246 - Verificar que verificar el registro en auditoría de la descarga', () => {
    it('debería escribir un registro detallado de auditoría en la consola al realizar la descarga', async () => {
      // Arrange
      mockCotizacionRepository.findOne.mockResolvedValue(cotizacionJuanMock);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      await controller.descargarPDF({ user: usuarioCliente }, 100, resMock as Response);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT] Descarga de PDF de cotización #100 por usuario #1 (Rol: 2)')
      );
      consoleSpy.mockRestore();
    });
  });
});
