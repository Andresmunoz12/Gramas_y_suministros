import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StockService } from '../../../src/stock/stock.service';
import { StockController } from '../../../src/stock/stock.controller';
import { stock } from '../../../src/stock/stock.entity';
import { Roles } from '../../../src/auth/decorators/roles.decorator';

import {
  stockKukuyo,
  inventarioCompleto,
  productoInexistenteId,
} from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockStockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
};

// ============================================
// SUITE DE PRUEBAS
// ============================================

describe('RF-026: Consultar Stock de Producto', () => {
  let service: StockService;
  let controller: StockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        StockService,
        { provide: getRepositoryToken(stock), useValue: mockStockRepository },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    controller = module.get<StockController>(StockController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================
  // CP-172: Consultar el stock de un producto existente
  // ==========================================================
  describe('CP-172: Consultar producto existente', () => {
    it('debería retornar los datos de stock correctamente para un ID válido', async () => {
      mockStockRepository.findOne.mockResolvedValue(stockKukuyo);

      const resultado = await service.findOne(stockKukuyo.id_producto);

      expect(mockStockRepository.findOne).toHaveBeenCalledWith({
        where: { id_producto: stockKukuyo.id_producto },
        relations: ['producto'],
      });
      expect(resultado).toEqual(stockKukuyo);
    });
  });

  // ==========================================================
  // CP-173 & CP-174: Actualización post entrada/salida 
  // (La lógica matemática se probó en RF-022, aquí probamos
  // que el endpoint lea la tabla que sí fue actualizada)
  // ==========================================================
  describe('CP-173 & CP-174: Integridad de Lectura (Post Movimientos)', () => {
    it('debería leer el array completo de inventario con las cantidades actualizadas', async () => {
      mockStockRepository.find.mockResolvedValue(inventarioCompleto);

      const resultado = await service.findAll();

      expect(mockStockRepository.find).toHaveBeenCalled();
      expect(resultado.length).toBe(2);
      expect(resultado[0].cantidad_actual).toBe(150); // Valor actualizado
    });
  });

  // ==========================================================
  // CP-175: Consultar un producto inexistente
  // ==========================================================
  describe('CP-175: Consultar producto inexistente', () => {
    it('debería lanzar NotFoundException al buscar un ID que no está en stock', async () => {
      mockStockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(productoInexistenteId)).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne(productoInexistenteId)).rejects.toThrow(
        `No se encontró registro de stock para el producto con ID ${productoInexistenteId}`
      );
    });
  });

  // ==========================================================
  // CP-176: Consultar el inventario cuando no existen productos
  // ==========================================================
  describe('CP-176: Inventario Vacío', () => {
    it('debería retornar un array vacío si no hay nada registrado', async () => {
      mockStockRepository.find.mockResolvedValue([]);

      const resultado = await service.findAll();

      expect(resultado).toEqual([]);
      expect(resultado.length).toBe(0);
    });
  });

  // ==========================================================
  // CP-177: Verificar que solo un administrador pueda consultar
  // ==========================================================
  describe('CP-177: RBAC (Role Based Access Control)', () => {
    it('debería tener el decorador @Roles(1) en los endpoints del controlador', () => {
      const reflector = new Reflector();
      
      // Obtenemos los roles permitidos en el método "verTodo"
      const rolesVerTodo = reflector.get<number[]>('roles', controller.verTodo);
      // Obtenemos los roles permitidos en el método "verUno"
      const rolesVerUno = reflector.get<number[]>('roles', controller.verUno);

      // Verificamos que se requiere el rol "1" (Administrador)
      expect(rolesVerTodo).toEqual([1]);
      expect(rolesVerUno).toEqual([1]);
    });
  });
});
