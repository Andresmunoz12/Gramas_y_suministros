import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { MovimientosService } from '../../../src/movimiento/movimiento.service';
import { MovimientoController } from '../../../src/movimiento/movimiento.controller';
import { movimiento } from '../../../src/movimiento/movimiento.entity';
import { entrada } from '../../../src/movimiento/entrada.entity';
import { salida } from '../../../src/movimiento/salida.entity';
import { productos } from '../../../src/productos/productos.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { proveedor } from '../../../src/proveedores/proveedores.entity';
import { StockService } from '../../../src/stock/stock.service';

import {
  historialConMovimientos,
  historialVacio,
} from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockMovimientoRepository = {
  find: jest.fn(),
};

// ============================================
// SUITE DE PRUEBAS
// ============================================

describe('RF-027: Consultar Historial de Movimientos de Inventario', () => {
  let service: MovimientosService;
  let controller: MovimientoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MovimientoController],
      providers: [
        MovimientosService,
        { provide: getRepositoryToken(movimiento), useValue: mockMovimientoRepository },
        { provide: getRepositoryToken(entrada), useValue: {} },
        { provide: getRepositoryToken(salida), useValue: {} },
        { provide: getRepositoryToken(productos), useValue: {} },
        { provide: getRepositoryToken(usuario), useValue: {} },
        { provide: getRepositoryToken(proveedor), useValue: {} },
        { provide: StockService, useValue: {} },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    service = module.get<MovimientosService>(MovimientosService);
    controller = module.get<MovimientoController>(MovimientoController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================
  // CP-178: Consultar el historial con movimientos registrados
  // CP-180: Criterios de búsqueda sin resultados (vía ORM find)
  // CP-181: Verificar que la información incluya detalles
  // ==========================================================
  describe('CP-178, CP-180 & CP-181: Lectura de Historial y Relaciones', () => {
    it('debería retornar el historial completo incluyendo relaciones clave (producto, usuario, entrada, salida)', async () => {
      mockMovimientoRepository.find.mockResolvedValue(historialConMovimientos);

      const resultado = await service.findAll();

      // Validación CP-181: Que el query exija las relaciones necesarias para mostrar detalles
      expect(mockMovimientoRepository.find).toHaveBeenCalledWith({
        relations: ['producto', 'usuario', 'entrada', 'salida'],
        order: { fecha: 'DESC' },
      });

      // Validación CP-178: Que retorne los datos correctamente
      expect(resultado).toEqual(historialConMovimientos);
      
      // CP-181 (Aserciones de detalle)
      expect(resultado[0].producto.nombre).toBe('Grama 50mm'); // Tiene producto
      expect(resultado[1].salida.motivo).toBe('Mantenimiento Semestral'); // Tiene motivo
    });
  });

  // ==========================================================
  // CP-179: Consultar el historial cuando no existen movimientos
  // ==========================================================
  describe('CP-179: Historial Vacío', () => {
    it('debería retornar un array vacío cuando no hay registros en la base de datos', async () => {
      mockMovimientoRepository.find.mockResolvedValue(historialVacio);

      const resultado = await service.findAll();

      expect(resultado).toEqual([]);
      expect(resultado.length).toBe(0);
    });
  });

  // ==========================================================
  // CP-182: Verificar que solo un administrador pueda consultar el historial
  // ==========================================================
  describe('CP-182: RBAC (Role Based Access Control) en Historial', () => {
    it('debería tener el decorador @Roles(1) en el endpoint obtenerHistorial del controlador', () => {
      const reflector = new Reflector();
      
      const rolesHistorial = reflector.get<number[]>('roles', controller.obtenerHistorial);

      // Si esto falla, significa que el endpoint está público y es un hueco de seguridad
      expect(rolesHistorial).toBeDefined();
      expect(rolesHistorial).toEqual([1]); // 1 = Admin
    });
  });

  // ==========================================================
  // CP-183: Simular un error de conexión con la base de datos
  // ==========================================================
  describe('CP-183: Error en la Base de Datos', () => {
    it('debería propagar el error si el repositorio de base de datos falla al consultar', async () => {
      mockMovimientoRepository.find.mockRejectedValue(new Error('Conexión con BD Perdida'));

      await expect(service.findAll()).rejects.toThrow('Conexión con BD Perdida');
    });
  });
});
