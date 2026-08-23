import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { ReportesService } from '../../../src/reportes/reportes.service';
import { ReportesController } from '../../../src/reportes/reportes.controller';
import { stock } from '../../../src/stock/stock.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { productos } from '../../../src/productos/productos.entity';
import { Cotizacion } from '../../../src/cotizaciones/cotizacion.entity';
import { movimiento } from '../../../src/movimiento/movimiento.entity';
import {
  inventarioCombinado,
  stockIgualMinimo,
  stockInferiorMinimo,
  stockSuperiorMinimo,
  stockSinConfiguracion,
} from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockStockRepository = {
  find: jest.fn(),
};

// ============================================
// SUITE DE PRUEBAS
// ============================================

describe('RF-029: Generación de Alerta de Stock Mínimo', () => {
  let service: ReportesService;
  let controller: ReportesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportesController],
      providers: [
        ReportesService,
        { provide: getRepositoryToken(stock), useValue: mockStockRepository },
        { provide: getRepositoryToken(usuario), useValue: {} },
        { provide: getRepositoryToken(productos), useValue: {} },
        { provide: getRepositoryToken(Cotizacion), useValue: {} },
        { provide: getRepositoryToken(movimiento), useValue: {} },
      ],
    }).compile();

    service = module.get<ReportesService>(ReportesService);
    controller = module.get<ReportesController>(ReportesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cálculo Dinámico de Alertas en Reportes', () => {
    it('CP-196: debería generar alerta "Stock bajo" cuando el stock sea igual al mínimo', async () => {
      mockStockRepository.find.mockResolvedValue([stockIgualMinimo]);
      const resultado = await service.getEstadoStock();
      
      const producto = resultado.detalle[0];
      expect(producto.estado).toBe('Stock bajo');
      expect(resultado.bajoStock).toBe(1);
    });

    it('CP-197: debería generar alerta "Stock bajo" cuando el stock sea inferior al mínimo', async () => {
      mockStockRepository.find.mockResolvedValue([stockInferiorMinimo]);
      const resultado = await service.getEstadoStock();
      
      const producto = resultado.detalle[0];
      expect(producto.estado).toBe('Stock bajo');
      expect(resultado.bajoStock).toBe(1);
    });

    it('CP-198: no debería generar alerta cuando el stock sea superior al mínimo', async () => {
      mockStockRepository.find.mockResolvedValue([stockSuperiorMinimo]);
      const resultado = await service.getEstadoStock();
      
      const producto = resultado.detalle[0];
      expect(producto.estado).toBe('Normal');
      expect(resultado.normal).toBe(1);
      expect(resultado.bajoStock).toBe(0);
    });

    it('CP-199: comportamiento sin configuración (nivel=0, actual=0)', async () => {
      mockStockRepository.find.mockResolvedValue([stockSinConfiguracion]);
      const resultado = await service.getEstadoStock();
      
      const producto = resultado.detalle[0];
      expect(producto.estado).toBe('Sin stock');
      expect(resultado.sinStock).toBe(1);
    });

    it('CP-200: la alerta se refleja automáticamente en el resumen general', async () => {
      // Simula el escenario post-movimiento leyendo todos los datos juntos
      mockStockRepository.find.mockResolvedValue(inventarioCombinado);
      const resultado = await service.getEstadoStock();
      
      expect(resultado.total).toBe(4);
      expect(resultado.bajoStock).toBe(2); // CP-196 y CP-197
      expect(resultado.normal).toBe(1);    // CP-198
      expect(resultado.sinStock).toBe(1);  // CP-199
    });
  });

  describe('CP-201: Seguridad en visualización de alertas', () => {
    it('debería verificar que solo un administrador pueda visualizar el estado de stock (@Roles(1))', () => {
      const reflector = new Reflector();
      
      // Obtenemos los roles permitidos en el método "getEstadoStock" del controlador
      const rolesEndpoint = reflector.get<number[]>('roles', controller.getEstadoStock);

      // Verificamos que se requiere el rol "1" (Administrador)
      expect(rolesEndpoint).toEqual([1]);
    });
  });
});
