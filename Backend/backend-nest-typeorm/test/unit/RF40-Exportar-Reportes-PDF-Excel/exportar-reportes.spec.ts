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
  mockMovimientos,
} from './helpers/test-data';

// ============================================
// MOCKS DE PDFKIT
// ============================================

const mockPipe = jest.fn();
const mockText = jest.fn(); // ✅ AGREGADO: mockText ahora está definido

// ✅ Creamos un mock que funciona con CUALQUIER método y encadenamiento
jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    const pdfDoc: any = {
      pipe: mockPipe,
      text: mockText,
    };

    // ✅ Proxy que retorna el propio proxy para permitir encadenamiento
    const proxy: any = new Proxy(pdfDoc, {
      get(target, prop) {
        if (prop in target) {
          return target[prop];
        }

        if (prop === 'y') return 100;

        if (typeof prop === 'string' && prop !== 'then') {
          const fn = jest.fn();
          fn.mockImplementation(() => proxy);
          target[prop] = fn;
          return fn;
        }

        return undefined;
      },
    });

    return proxy;
  });
});

// ============================================
// MOCKS DE EXCELJS
// ============================================

const mockAddRow = jest.fn();

const createMockCell = () => ({
  value: '',
  font: {},
  fill: {},
  alignment: {},
  border: {},
  numFmt: '',
});

const createMockRow = (values: any[] = []) => {
  const cells = values.map(() => createMockCell());
  return {
    cells,
    getCell: jest.fn((key: any) => {
      if (typeof key === 'number') {
        return cells[key - 1] || createMockCell();
      }
      return createMockCell();
    }),
    eachCell: jest.fn((callback: (cell: any, colNumber: number) => void) => {
      cells.forEach((cell, index) => callback(cell, index + 1));
    }),
    height: 0,
    number: 1,
  };
};

const createMockWorksheet = () => ({
  mergeCells: jest.fn(),
  getCell: jest.fn().mockReturnValue(createMockCell()),
  getRow: jest.fn().mockImplementation(() => createMockRow([1, 2, 3, 4])),
  addRow: jest.fn().mockImplementation((values: any[]) => {
    const row = createMockRow(Array.isArray(values) ? values : [values]);
    mockAddRow(values);
    return row;
  }),
  columns: [],
  properties: {},
});

const mockWorkbook = {
  addWorksheet: jest.fn().mockImplementation(() => createMockWorksheet()),
  creator: '',
  created: new Date(),
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

const mockMovimientoRepository = {
  find: jest.fn().mockResolvedValue(mockMovimientos),
};

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
    it('debería contener los conteos exactos de usuarios, productos, stock, cotizaciones y movimientos en el Excel', async () => {
      // Act
      await controller.exportarExcel(resMock as Response);

      // Assert
      // ✅ El servicio llama a addRow con ARRAYS, no con objetos
      expect(mockAddRow).toHaveBeenCalledWith(['Usuarios', 2, 2, 0]);
      expect(mockAddRow).toHaveBeenCalledWith(['Productos', 2, 2, 0]);
      expect(mockAddRow).toHaveBeenCalledWith(['Stock', 2, 2, 0]);
      expect(mockAddRow).toHaveBeenCalledWith(['Cotizaciones', 2, 1, 1]);
      expect(mockAddRow).toHaveBeenCalledWith(['Movimientos', 2, 1, 1]);
    });

    it('debería escribir los textos informativos correctos y totales acumulados en el PDF', async () => {
      // Act
      await controller.exportarPDF(resMock as Response);

      // Assert
      // ✅ Título principal
      expect(mockText).toHaveBeenCalledWith(
        'REPORTE GENERAL DEL SISTEMA',
        expect.any(Number),
        expect.any(Number),
        expect.objectContaining({ align: 'center' })
      );

      // ✅ Sección de usuarios: 'Total: 2 | Activos: 2 | Inactivos: 0 | Suspendidos: 0'
      expect(mockText).toHaveBeenCalledWith(
        expect.stringContaining('Total: 2'),
        expect.any(Number),
        expect.any(Number)
      );

      // ✅ Sección de productos
      expect(mockText).toHaveBeenCalledWith(
        expect.stringContaining('Total: 2'),
        expect.any(Number),
        expect.any(Number)
      );

      // ✅ Sección de cotizaciones
      expect(mockText).toHaveBeenCalledWith(
        expect.stringContaining('COTIZACIONES'),
        expect.any(Number),
        expect.any(Number)
      );
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