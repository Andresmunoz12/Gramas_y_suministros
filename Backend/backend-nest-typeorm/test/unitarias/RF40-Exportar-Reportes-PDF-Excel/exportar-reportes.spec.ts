// test/unit/RF40-Exportar-Reportes-PDF-Excel/exportar-reportes.spec.ts

/**
 * MÓDULO: EXPORTAR REPORTES A PDF Y EXCEL
 * 
 * Casos de prueba:
 * - CP-268: Verificar que exportar un reporte en formato PDF.
 * - CP-269: Verificar que exportar un reporte en formato Excel.
 * - CP-272: Verificar que el contenido del archivo corresponda al reporte mostrado.
 * - CP-273: Verificar que intentar exportar un reporte con un usuario sin permisos.
 */

import { Test as NestTest, TestingModule as NestTestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ReportesService } from '../../../src/reportes/reportes.service';
import { ReportesController } from '../../../src/reportes/reportes.controller';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { productos } from '../../../src/productos/productos.entity';
import { stock } from '../../../src/stock/stock.entity';
import { movimiento } from '../../../src/movimiento/movimiento.entity';
import { Cotizacion } from '../../../src/cotizaciones/cotizacion.entity';
import { Response } from 'express';
import { ROLES_KEY } from '../../../src/auth/decorators/roles.decorator';
import {
  mockUsuarios,
  mockProductos,
  mockStockData,
  mockCotizaciones,
} from './helpers/test-data';

// ============================================
// MOCKS DE PDFKIT
// ============================================

const mockPipe = jest.fn();
const mockText = jest.fn().mockReturnThis();
const mockFontSize = jest.fn().mockReturnThis();
const mockFont = jest.fn().mockReturnThis();
const mockFillColor = jest.fn().mockReturnThis();
const mockMoveDown = jest.fn().mockReturnThis();
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
      end: mockEnd,
    };
  });
});

// ============================================
// MOCKS DE EXCELJS
// ============================================

const mockAddRow = jest.fn();
const mockWorkbook = {
  addWorksheet: jest.fn().mockReturnThis(),
  columns: [],
  addRow: mockAddRow,
  xlsx: {
    writeBuffer: jest.fn().mockResolvedValue(Buffer.from('mocked-excel-buffer')),
  },
};

jest.mock('exceljs', () => {
  return {
    Workbook: jest.fn().mockImplementation(() => mockWorkbook),
  };
});

// ============================================
// MOCKS DE REPOSITORIOS
// ============================================

const mockUserRepository = {
  find: jest.fn().mockResolvedValue(mockUsuarios),
  count: jest.fn().mockResolvedValue(mockUsuarios.length),
};

const mockProductRepository = {
  find: jest.fn().mockResolvedValue(mockProductos),
  count: jest.fn().mockResolvedValue(mockProductos.length),
};

const mockStockRepository = {
  find: jest.fn().mockResolvedValue(mockStockData),
};

const mockMovimientoRepository = {};

const mockCotizacionRepository = {
  find: jest.fn().mockResolvedValue(mockCotizaciones),
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Exportar Reportes a PDF y Excel - Casos de Prueba', () => {
  let service: ReportesService;
  let controller: ReportesController;
  let resMock: Partial<Response>;

  beforeEach(async () => {
    const module: NestTestingModule = await NestTest.createTestingModule({
      controllers: [ReportesController],
      providers: [
        ReportesService,
        {
          provide: getRepositoryToken(usuario),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(productos),
          useValue: mockProductRepository,
        },
        {
          provide: getRepositoryToken(stock),
          useValue: mockStockRepository,
        },
        {
          provide: getRepositoryToken(movimiento),
          useValue: mockMovimientoRepository,
        },
        {
          provide: getRepositoryToken(Cotizacion),
          useValue: mockCotizacionRepository,
        },
      ],
    }).compile();

    service = module.get<ReportesService>(ReportesService);
    controller = module.get<ReportesController>(ReportesController);

    resMock = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CP-268: EXPORTAR A PDF
  // ============================================

  describe('CP-268 - Verificar que exportar un reporte en formato PDF', () => {
    it('debería configurar correctamente los headers de PDF y entubar el flujo de datos', async () => {
      // Act
      await controller.exportarPDF(resMock as Response);

      // Assert
      expect(resMock.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(resMock.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename=reporte_')
      );
      expect(mockPipe).toHaveBeenCalledWith(resMock);
      expect(mockEnd).toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-269: EXPORTAR A EXCEL
  // ============================================

  describe('CP-269 - Verificar que exportar un reporte en formato Excel', () => {
    it('debería configurar headers de hoja de cálculo y enviar el buffer generado por ExcelJS', async () => {
      // Act
      await controller.exportarExcel(resMock as Response);

      // Assert
      expect(resMock.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      expect(resMock.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename=reporte_')
      );
      expect(resMock.status).toHaveBeenCalledWith(200);
      expect(resMock.send).toHaveBeenCalledWith(Buffer.from('mocked-excel-buffer'));
    });
  });

  // ============================================
  // CP-272: CORRESPONDENCIA DE CONTENIDO
  // ============================================

  describe('CP-272 - Verificar que el contenido del archivo corresponda al reporte mostrado', () => {
    it('debería contener los conteos exactos de usuarios, productos, stock y cotizaciones en el Excel', async () => {
      // Act
      await controller.exportarExcel(resMock as Response);

      // Assert
      expect(mockAddRow).toHaveBeenCalledWith({
        modulo: 'Usuarios',
        total: mockUsuarios.length,
        activos: 2,
        inactivos: 0,
      });
      expect(mockAddRow).toHaveBeenCalledWith({
        modulo: 'Productos',
        total: mockProductos.length,
        activos: 2,
        inactivos: 0,
      });
      expect(mockAddRow).toHaveBeenCalledWith({
        modulo: 'Stock',
        total: mockStockData.length,
        activos: 2,
        inactivos: 0,
      });
      expect(mockAddRow).toHaveBeenCalledWith({
        modulo: 'Cotizaciones',
        total: mockCotizaciones.length,
        activos: 1,
        inactivos: 1,
      });
    });

    it('debería escribir los textos informativos correctos y totales acumulados en el PDF', async () => {
      // Act
      await controller.exportarPDF(resMock as Response);

      // Assert
      expect(mockText).toHaveBeenCalledWith('Reporte General', { align: 'center' });
      expect(mockText).toHaveBeenCalledWith('Usuarios: 2', { indent: 20 });
      expect(mockText).toHaveBeenCalledWith('Productos: 2', { indent: 20 });
      expect(mockText).toHaveBeenCalledWith('Stock Total: 150', { indent: 20 });
      expect(mockText).toHaveBeenCalledWith('Cotizaciones: 2', { indent: 20 });
    });
  });

  // ============================================
  // CP-273: INTENTAR ACCEDER SIN PERMISOS (SEGURIDAD)
  // ============================================

  describe('CP-273 - Verificar que intentar exportar un reporte con un usuario sin permisos', () => {
    it('debería requerir rol de Administrador (1) para exportaciones a Excel y PDF', () => {
      // Act
      const rolesExcel = Reflect.getMetadata(ROLES_KEY, controller.exportarExcel);
      const rolesPDF = Reflect.getMetadata(ROLES_KEY, controller.exportarPDF);

      // Assert
      expect(rolesExcel).toBeDefined();
      expect(rolesExcel).toContain(1);
      
      expect(rolesPDF).toBeDefined();
      expect(rolesPDF).toContain(1);
    });
  });
});
