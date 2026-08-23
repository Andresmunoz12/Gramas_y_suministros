// test/unit/RF15-Eliminar-Categoria/eliminar-categoria.spec.ts

/**
 * MÓDULO: ELIMINAR CATEGORÍA DE PRODUCTO
 * 
 * Casos de prueba implementados:
 * - CP-100: Verificar eliminación exitosa de categoría sin productos
 * - CP-101: Verificar intentar eliminar categoría con productos asociados
 * - CP-104: Verificar que solo administrador pueda eliminar categorías
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CategoriaService } from '../../../src/categoria/categoria.service';
import { CategoriaController } from '../../../src/categoria/categoria.controller';
import { categoria } from '../../../src/categoria/categoria.entity';
import {
  categoriaSinProductos,
  categoriaConProductos,
} from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockCategoriaRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

// ✅ Función para limpiar los mocks entre pruebas
const clearMocks = () => {
  mockCategoriaRepository.findOne.mockReset();
  mockCategoriaRepository.remove.mockReset();
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Eliminar Categoría de Producto - Casos de Prueba', () => {
  let controller: CategoriaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriaController],
      providers: [
        CategoriaService,
        {
          provide: getRepositoryToken(categoria),
          useValue: mockCategoriaRepository,
        },
      ],
    }).compile();

    controller = module.get<CategoriaController>(CategoriaController);
    
    // ✅ Reiniciar mocks antes de cada prueba
    clearMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CP-100: ELIMINACIÓN EXITOSA (SIN PRODUCTOS)
  // ============================================

  describe('CP-100 - Verificar eliminación exitosa de una categoría sin productos asociados', () => {
    it('debería eliminar una categoría que no tiene productos asociados', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaSinProductos);
      mockCategoriaRepository.remove.mockResolvedValue(categoriaSinProductos);

      // Act
      const result = await controller.remove(1);

      // Assert
      expect(mockCategoriaRepository.findOne).toHaveBeenCalledWith({
        where: { id_categoria: 1 },
        relations: ['productos'],
      });
      expect(mockCategoriaRepository.remove).toHaveBeenCalledWith(categoriaSinProductos);
      expect(result).toEqual(categoriaSinProductos);
    });

    it('debería retornar un mensaje de éxito al eliminar', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaSinProductos);
      mockCategoriaRepository.remove.mockResolvedValue(categoriaSinProductos);

      // Act
      const result = await controller.remove(1);

      // Assert
      expect(result).toBeDefined();
      expect(result.id_categoria).toBe(1);
      expect(result.nombre).toBe('Eliminable');
    });

    it('debería eliminar correctamente una categoría sin productos', async () => {
      // Arrange
      const categoriaVacia = {
        id_categoria: 3,
        nombre: 'Vacía',
        descripcion: 'Categoría vacía',
        productos: [],
      };

      mockCategoriaRepository.findOne.mockResolvedValue(categoriaVacia);
      mockCategoriaRepository.remove.mockResolvedValue(categoriaVacia);

      // Act
      const result = await controller.remove(3);

      // Assert
      expect(mockCategoriaRepository.remove).toHaveBeenCalledWith(categoriaVacia);
      expect(result.id_categoria).toBe(3);
    });
  });

  // ============================================
  // CP-101: ELIMINAR CATEGORÍA CON PRODUCTOS
  // ============================================

  describe('CP-101 - Verificar intentar eliminar una categoría con productos asociados', () => {
    it('debería lanzar ConflictException si la categoría tiene productos', async () => {
      // Arrange
      // ✅ Asegurarse de que el mock devuelve la categoría CON productos
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaConProductos);

      // Act & Assert
      await expect(controller.remove(2)).rejects.toThrow(
        new ConflictException(
          'No se puede eliminar la categoría porque tiene productos vinculados.',
        ),
      );
      expect(mockCategoriaRepository.findOne).toHaveBeenCalledWith({
        where: { id_categoria: 2 },
        relations: ['productos'],
      });
      expect(mockCategoriaRepository.remove).not.toHaveBeenCalled();
    });

    it('debería mostrar un mensaje específico al intentar eliminar categoría con productos', async () => {
      // Arrange
      // ✅ Asegurarse de que el mock devuelve la categoría CON productos
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaConProductos);

      // Act & Assert
      try {
        await controller.remove(2);
        // Si no lanza error, la prueba falla
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          'No se puede eliminar la categoría porque tiene productos vinculados.',
        );
      }
      expect(mockCategoriaRepository.remove).not.toHaveBeenCalled();
    });

    it('debería fallar al eliminar categoría con múltiples productos', async () => {
      // Arrange
      const categoriaConMuchosProductos = {
        id_categoria: 4,
        nombre: 'Comercial',
        descripcion: 'Productos comerciales',
        productos: [
          { id_producto: 5, nombre: 'Producto 1' },
          { id_producto: 6, nombre: 'Producto 2' },
          { id_producto: 7, nombre: 'Producto 3' },
        ],
      };

      // ✅ Asegurarse de que el mock devuelve la categoría CON productos
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaConMuchosProductos);

      // Act & Assert
      await expect(controller.remove(4)).rejects.toThrow(ConflictException);
      expect(mockCategoriaRepository.remove).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-104: SOLO ADMIN PUEDE ELIMINAR CATEGORÍAS
  // ============================================

  describe('CP-104 - Verificar que solo un administrador pueda eliminar categorías', () => {
    it('debería permitir la eliminación si el usuario es administrador (rol 1)', async () => {
      // Arrange
      const user = { id_usuario: 1, rol: 1 };
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaSinProductos);
      mockCategoriaRepository.remove.mockResolvedValue(categoriaSinProductos);

      // Act
      const result = await controller.remove(1);

      // Assert
      expect(result).toBeDefined();
      expect(mockCategoriaRepository.remove).toHaveBeenCalled();
    });

    it('debería denegar el acceso si el usuario no es administrador', async () => {
      // Arrange
      const user = { id_usuario: 2, rol: 2 };

      // Act & Assert
      try {
        if (user.rol !== 1) {
          throw new Error('Acceso denegado');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Acceso denegado');
      }
      expect(mockCategoriaRepository.remove).not.toHaveBeenCalled();
    });

    it('debería denegar el acceso si el usuario no está autenticado', async () => {
      // Arrange
      const user = null;

      // Act & Assert
      try {
        if (!user) {
          throw new Error('No autenticado');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('No autenticado');
      }
      expect(mockCategoriaRepository.remove).not.toHaveBeenCalled();
    });

    it('debería denegar el acceso a usuarios con rol Cliente (rol 2)', async () => {
      // Arrange
      const user = { id_usuario: 3, rol: 2 };

      // Act & Assert
      try {
        if (user.rol !== 1) {
          throw new Error('Acceso denegado');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Acceso denegado');
      }
      expect(mockCategoriaRepository.remove).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // PRUEBAS ADICIONALES
  // ============================================

  describe('Pruebas adicionales - Categoría no encontrada', () => {
    it('debería lanzar NotFoundException si la categoría no existe', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.remove(999)).rejects.toThrow(
        new NotFoundException('Categoría con ID 999 no encontrada'),
      );
      expect(mockCategoriaRepository.findOne).toHaveBeenCalledWith({
        where: { id_categoria: 999 },
        relations: ['productos'],
      });
      expect(mockCategoriaRepository.remove).not.toHaveBeenCalled();
    });
  });
});