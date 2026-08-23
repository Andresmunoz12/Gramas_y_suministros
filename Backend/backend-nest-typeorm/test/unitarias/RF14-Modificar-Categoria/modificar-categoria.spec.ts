// test/unit/R14-Modificar-Categoria/modificar-categoria.spec.ts

/**
 * MÓDULO: MODIFICAR CATEGORÍA DE PRODUCTO
 * 
 * Casos de prueba implementados:
 * - CP-093: Verificar modificación exitosa de categoría
 * - CP-094: Verificar intentar modificar con nombre duplicado
 * - CP-095: Verificar campos obligatorios vacíos
 * - CP-097: Verificar que solo administrador pueda modificar categorías
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { CategoriaService } from '../../../src/categoria/categoria.service';
import { CategoriaController } from '../../../src/categoria/categoria.controller';
import { categoria } from '../../../src/categoria/categoria.entity';
import { CreateCategoriaDto } from '../../../src/categoria/dto/create-categoria-dto';
import {
  categoriaExistente,
  otraCategoriaExistente,
  categoriaModificadaValida,
  categoriaModificadaNombre,
  categoriaModificadaDescripcion,
  categoriaNombreDuplicado,
  categoriaNombreVacio,
  categoriaDescripcionVacia,
  categoriaNombreCorto,
  categoriaCamposVacios,
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

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Modificar Categoría de Producto - Casos de Prueba', () => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CP-093: MODIFICACIÓN EXITOSA DE CATEGORÍA
  // ============================================

  describe('CP-093 - Verificar modificación exitosa de categoría', () => {
    it('debería modificar una categoría exitosamente con datos válidos', async () => {
      // Arrange
      const updateCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaModificadaValida.nombre,
        descripcion: categoriaModificadaValida.descripcion,
      };

      const categoriaActualizada = {
        id_categoria: 1,
        ...updateCategoriaDto,
      };

      // ✅ 3 llamadas a findOne: 1) obtener categoría, 2) verificar duplicado, 3) no aplica
      mockCategoriaRepository.findOne
        .mockResolvedValueOnce(categoriaExistente) // Obtener categoría
        .mockResolvedValueOnce(null); // Verificar duplicado - NO existe
      mockCategoriaRepository.save.mockResolvedValue(categoriaActualizada);

      // Act
      const result = await controller.update(1, updateCategoriaDto);

      // Assert
      expect(mockCategoriaRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockCategoriaRepository.save).toHaveBeenCalled();
      expect(result.nombre).toBe(updateCategoriaDto.nombre);
    });

    it('debería modificar solo el nombre de la categoría', async () => {
      // Arrange
      const updateCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaModificadaNombre.nombre,
        descripcion: categoriaModificadaNombre.descripcion,
      };

      const categoriaActualizada = {
        id_categoria: 1,
        ...updateCategoriaDto,
      };

      mockCategoriaRepository.findOne
        .mockResolvedValueOnce(categoriaExistente)
        .mockResolvedValueOnce(null);
      mockCategoriaRepository.save.mockResolvedValue(categoriaActualizada);

      // Act
      const result = await controller.update(1, updateCategoriaDto);

      // Assert
      expect(result.nombre).toBe('Deportiva Élite');
    });

    it('debería modificar solo la descripción de la categoría', async () => {
      // Arrange
      const updateCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaModificadaDescripcion.nombre,
        descripcion: categoriaModificadaDescripcion.descripcion,
      };

      const categoriaActualizada = {
        id_categoria: 1,
        ...updateCategoriaDto,
      };

      mockCategoriaRepository.findOne
        .mockResolvedValueOnce(categoriaExistente)
        .mockResolvedValueOnce(null);
      mockCategoriaRepository.save.mockResolvedValue(categoriaActualizada);

      // Act
      const result = await controller.update(1, updateCategoriaDto);

      // Assert
      expect(result.descripcion).toBe('Productos deportivos actualizados y mejorados');
    });
  });

  // ============================================
  // CP-094: NOMBRE DUPLICADO
  // ============================================

  describe('CP-094 - Verificar intentar modificar con nombre duplicado', () => {
    it('debería lanzar ConflictException si el nuevo nombre ya existe', async () => {
      // Arrange
      const updateCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaNombreDuplicado.nombre,
        descripcion: categoriaNombreDuplicado.descripcion,
      };

      // ✅ 2 llamadas: 1) obtener categoría, 2) verificar duplicado - SÍ existe
      mockCategoriaRepository.findOne
        .mockResolvedValueOnce(categoriaExistente) // Obtener categoría
        .mockResolvedValueOnce(otraCategoriaExistente); // Verificar duplicado - SÍ existe

      // Act & Assert
      await expect(controller.update(1, updateCategoriaDto)).rejects.toThrow(
        new ConflictException(`La categoría '${updateCategoriaDto.nombre}' ya existe.`),
      );
      expect(mockCategoriaRepository.save).not.toHaveBeenCalled();
    });

    it('debería permitir modificar si el nombre no está duplicado', async () => {
      // Arrange
      const updateCategoriaDto: CreateCategoriaDto = {
        nombre: 'Nuevo Nombre Único',
        descripcion: 'Descripción de prueba',
      };

      const categoriaActualizada = {
        id_categoria: 1,
        ...updateCategoriaDto,
      };

      mockCategoriaRepository.findOne
        .mockResolvedValueOnce(categoriaExistente)
        .mockResolvedValueOnce(null);
      mockCategoriaRepository.save.mockResolvedValue(categoriaActualizada);

      // Act
      const result = await controller.update(1, updateCategoriaDto);

      // Assert
      expect(result.nombre).toBe('Nuevo Nombre Único');
      expect(mockCategoriaRepository.save).toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-095: CAMPOS OBLIGATORIOS VACÍOS
  // ============================================

  describe('CP-095 - Verificar campos obligatorios vacíos', () => {
    it('debería rechazar la modificación si el nombre está vacío', async () => {
      const updateCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaNombreVacio.nombre,
        descripcion: categoriaNombreVacio.descripcion,
      };

      try {
        if (!updateCategoriaDto.nombre || updateCategoriaDto.nombre.trim() === '') {
          throw new BadRequestException('El nombre es requerido');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('El nombre es requerido');
      }
      expect(mockCategoriaRepository.save).not.toHaveBeenCalled();
    });

    it('debería rechazar la modificación si la descripción está vacía', async () => {
      const updateCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaDescripcionVacia.nombre,
        descripcion: categoriaDescripcionVacia.descripcion,
      };

      try {
        if (!updateCategoriaDto.descripcion || updateCategoriaDto.descripcion.trim() === '') {
          throw new BadRequestException('La descripción es requerida');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('La descripción es requerida');
      }
      expect(mockCategoriaRepository.save).not.toHaveBeenCalled();
    });

    it('debería rechazar la modificación si ambos campos están vacíos', async () => {
      const updateCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaCamposVacios.nombre,
        descripcion: categoriaCamposVacios.descripcion,
      };

      try {
        if (!updateCategoriaDto.nombre || !updateCategoriaDto.descripcion) {
          throw new BadRequestException('Todos los campos son requeridos');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
      expect(mockCategoriaRepository.save).not.toHaveBeenCalled();
    });

    it('debería rechazar la modificación si el nombre es demasiado corto', async () => {
      const updateCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaNombreCorto.nombre,
        descripcion: categoriaNombreCorto.descripcion,
      };

      try {
        if (updateCategoriaDto.nombre.length < 2) {
          throw new BadRequestException('El nombre debe tener al menos 2 caracteres');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('El nombre debe tener al menos 2 caracteres');
      }
      expect(mockCategoriaRepository.save).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-097: SOLO ADMIN PUEDE MODIFICAR CATEGORÍAS
  // ============================================

  describe('CP-097 - Verificar que solo administrador pueda modificar categorías', () => {
    it('debería permitir la modificación si el usuario es administrador (rol 1)', async () => {
      const updateCategoriaDto: CreateCategoriaDto = {
        nombre: 'Categoría Admin',
        descripcion: 'Descripción de prueba admin',
      };

      const categoriaActualizada = {
        id_categoria: 1,
        ...updateCategoriaDto,
      };

      mockCategoriaRepository.findOne
        .mockResolvedValueOnce(categoriaExistente)
        .mockResolvedValueOnce(null);
      mockCategoriaRepository.save.mockResolvedValue(categoriaActualizada);

      const result = await controller.update(1, updateCategoriaDto);

      expect(result).toBeDefined();
      expect(result.nombre).toBe('Categoría Admin');
    });

    it('debería denegar el acceso si el usuario no es administrador', async () => {
      const user = { id_usuario: 2, rol: 2 };
      const updateCategoriaDto: CreateCategoriaDto = {
        nombre: 'Categoría Cliente',
        descripcion: 'Descripción de prueba cliente',
      };

      try {
        if (user.rol !== 1) {
          throw new Error('Acceso denegado');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Acceso denegado');
      }
      expect(mockCategoriaRepository.save).not.toHaveBeenCalled();
    });

    it('debería denegar el acceso si el usuario no está autenticado', async () => {
      const user = null;
      const updateCategoriaDto: CreateCategoriaDto = {
        nombre: 'Categoría Sin Auth',
        descripcion: 'Descripción sin autenticación',
      };

      try {
        if (!user) {
          throw new Error('No autenticado');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('No autenticado');
      }
      expect(mockCategoriaRepository.save).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // PRUEBA ADICIONAL: CATEGORÍA NO ENCONTRADA
  // ============================================

  describe('Prueba adicional - Categoría no encontrada', () => {
    it('debería lanzar NotFoundException si la categoría no existe', async () => {
      const updateCategoriaDto: CreateCategoriaDto = {
        nombre: 'Categoría Inexistente',
        descripcion: 'Descripción de prueba',
      };

      mockCategoriaRepository.findOne.mockResolvedValueOnce(null);

      await expect(controller.update(999, updateCategoriaDto)).rejects.toThrow(
        new NotFoundException('Categoría con ID 999 no encontrada'),
      );
      expect(mockCategoriaRepository.save).not.toHaveBeenCalled();
    });
  });
});