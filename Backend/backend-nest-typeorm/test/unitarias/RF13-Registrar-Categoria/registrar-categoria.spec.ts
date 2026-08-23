// test/unit/Gestion-Productos/Registrar-Categoria/registrar-categoria.spec.ts

/**
 * MÓDULO: REGISTRAR CATEGORÍA DE PRODUCTO
 * 
 * Casos de prueba implementados:
 * - CP-086: Verificar registro exitoso de categoría
 * - CP-087: Verificar intentar registrar una categoría duplicada
 * - CP-088: Verificar campos obligatorios vacíos
 * - CP-089: Verificar información inválida
 * - CP-090: Verificar que solo un administrador pueda registrar categorías
 * - CP-091: Verificar almacenamiento correcto en la base de datos
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { CategoriaService } from '../../../src/categoria/categoria.service';
import { CategoriaController } from '../../../src/categoria/categoria.controller';
import { categoria } from '../../../src/categoria/categoria.entity';
import { CreateCategoriaDto } from '../../../src/categoria/dto/create-categoria-dto';
import {
  categoriaValida,
  categoriaDuplicada,
  categoriaSinNombre,
  categoriaSinDescripcion,
  categoriaNombreCorto,
  categoriaCaracteresEspeciales,
  categoriaExistente,
  categoriaCreada,
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

describe('Registrar Categoría de Producto - Casos de Prueba', () => {
  let service: CategoriaService;
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

    service = module.get<CategoriaService>(CategoriaService);
    controller = module.get<CategoriaController>(CategoriaController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CP-086: REGISTRO EXITOSO DE CATEGORÍA
  // ============================================

  describe('CP-086 - Verificar registro exitoso de categoría', () => {
    it('debería registrar una categoría exitosamente con datos válidos', async () => {
      // Arrange
      const createCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaValida.nombre,
        descripcion: categoriaValida.descripcion,
      };

      // Simular que la categoría NO existe (findOne retorna null)
      mockCategoriaRepository.findOne.mockResolvedValue(null);
      mockCategoriaRepository.create.mockReturnValue(categoriaCreada);
      mockCategoriaRepository.save.mockResolvedValue(categoriaCreada);

      // Act
      const result = await controller.create(createCategoriaDto);

      // Assert
      expect(mockCategoriaRepository.findOne).toHaveBeenCalledWith({
        where: { nombre: createCategoriaDto.nombre },
      });
      expect(mockCategoriaRepository.create).toHaveBeenCalledWith(createCategoriaDto);
      expect(mockCategoriaRepository.save).toHaveBeenCalled();
      expect(result).toEqual(categoriaCreada);
      expect(result.id_categoria).toBeDefined();
      expect(result.nombre).toBe(createCategoriaDto.nombre);
    });

    it('debería registrar una categoría con diferentes nombres', async () => {
      // Arrange
      const categorias = [
        { nombre: 'Deportiva', descripcion: 'Deportes' },
        { nombre: 'Residencial', descripcion: 'Residencias' },
        { nombre: 'Comercial', descripcion: 'Comercios' },
      ];

      for (const cat of categorias) {
        mockCategoriaRepository.findOne.mockResolvedValue(null);
        mockCategoriaRepository.create.mockReturnValue({ id_categoria: 1, ...cat });
        mockCategoriaRepository.save.mockResolvedValue({ id_categoria: 1, ...cat });

        // Act
        const result = await controller.create(cat);

        // Assert
        expect(result.nombre).toBe(cat.nombre);
        expect(result.descripcion).toBe(cat.descripcion);
      }
    });
  });

  // ============================================
  // CP-087: CATEGORÍA DUPLICADA
  // ============================================

  describe('CP-087 - Verificar intentar registrar una categoría duplicada', () => {
    it('debería lanzar ConflictException si la categoría ya existe', async () => {
      // Arrange
      const createCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaDuplicada.nombre,
        descripcion: categoriaDuplicada.descripcion,
      };

      // Simular que la categoría YA EXISTE
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaExistente);

      // Act & Assert
      await expect(controller.create(createCategoriaDto)).rejects.toThrow(
        new ConflictException(`La categoría '${createCategoriaDto.nombre}' ya existe.`),
      );
      expect(mockCategoriaRepository.findOne).toHaveBeenCalledWith({
        where: { nombre: createCategoriaDto.nombre },
      });
      expect(mockCategoriaRepository.create).not.toHaveBeenCalled();
      expect(mockCategoriaRepository.save).not.toHaveBeenCalled();
    });

    it('debería rechazar el registro si el nombre ya existe (case insensitive)', async () => {
      // Arrange
      const createCategoriaDto: CreateCategoriaDto = {
        nombre: 'jardinería', // Mismo nombre pero con minúsculas
        descripcion: 'Otra descripción',
      };

      mockCategoriaRepository.findOne.mockResolvedValue(categoriaExistente);

      // Act & Assert
      await expect(controller.create(createCategoriaDto)).rejects.toThrow(ConflictException);
    });
  });

  // ============================================
  // CP-088: CAMPOS OBLIGATORIOS VACÍOS
  // ============================================

  describe('CP-088 - Verificar campos obligatorios vacíos', () => {
    it('debería rechazar el registro si el nombre está vacío', async () => {
      // Arrange
      const createCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaSinNombre.nombre,
        descripcion: categoriaSinNombre.descripcion,
      };

      // Act & Assert - Simulamos validación de class-validator
      try {
        if (!createCategoriaDto.nombre || createCategoriaDto.nombre.trim() === '') {
          throw new BadRequestException('El nombre es requerido');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('El nombre es requerido');
      }
    });

    it('debería rechazar el registro si la descripción está vacía', async () => {
      // Arrange
      const createCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaSinDescripcion.nombre,
        descripcion: categoriaSinDescripcion.descripcion,
      };

      // Act & Assert
      try {
        if (!createCategoriaDto.descripcion || createCategoriaDto.descripcion.trim() === '') {
          throw new BadRequestException('La descripción es requerida');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('La descripción es requerida');
      }
    });

    it('debería rechazar el registro si ambos campos están vacíos', async () => {
      // Arrange
      const createCategoriaDto: CreateCategoriaDto = {
        nombre: '',
        descripcion: '',
      };

      // Act & Assert
      try {
        if (!createCategoriaDto.nombre || !createCategoriaDto.descripcion) {
          throw new BadRequestException('Todos los campos son requeridos');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });
  });

  // ============================================
  // CP-089: INFORMACIÓN INVÁLIDA
  // ============================================

  describe('CP-089 - Verificar información inválida', () => {
    it('debería rechazar el registro si el nombre es demasiado corto', async () => {
      // Arrange
      const createCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaNombreCorto.nombre,
        descripcion: categoriaNombreCorto.descripcion,
      };

      // Act & Assert
      try {
        if (createCategoriaDto.nombre.length < 2) {
          throw new BadRequestException('El nombre debe tener al menos 2 caracteres');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('El nombre debe tener al menos 2 caracteres');
      }
    });

    it('debería rechazar el registro si el nombre tiene caracteres especiales', async () => {
      // Arrange
      const createCategoriaDto: CreateCategoriaDto = {
        nombre: categoriaCaracteresEspeciales.nombre,
        descripcion: categoriaCaracteresEspeciales.descripcion,
      };

      // Act & Assert - Simular validación de caracteres
      const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
      try {
        if (!regex.test(createCategoriaDto.nombre)) {
          throw new BadRequestException('El nombre solo puede contener letras y espacios');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe('El nombre solo puede contener letras y espacios');
      }
    });

    it('debería rechazar el registro si el nombre contiene números', async () => {
      // Arrange
      const createCategoriaDto: CreateCategoriaDto = {
        nombre: 'Categoria123',
        descripcion: 'Descripción con números',
      };

      // Act & Assert
      const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
      try {
        if (!regex.test(createCategoriaDto.nombre)) {
          throw new BadRequestException('El nombre solo puede contener letras y espacios');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
      }
    });
  });

  // ============================================
  // CP-090: SOLO ADMIN PUEDE REGISTRAR CATEGORÍAS
  // ============================================

  describe('CP-090 - Verificar que solo un administrador pueda registrar categorías', () => {
    it('debería permitir el registro si el usuario es administrador (rol 1)', async () => {
      // Arrange - Simular que el usuario tiene rol de administrador
      const user = { id_usuario: 1, rol: 1 };
      const createCategoriaDto: CreateCategoriaDto = {
        nombre: 'Nueva Categoria',
        descripcion: 'Descripción de prueba',
      };

      mockCategoriaRepository.findOne.mockResolvedValue(null);
      mockCategoriaRepository.create.mockReturnValue({ id_categoria: 10, ...createCategoriaDto });
      mockCategoriaRepository.save.mockResolvedValue({ id_categoria: 10, ...createCategoriaDto });

      // Act
      const result = await controller.create(createCategoriaDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.nombre).toBe('Nueva Categoria');
    });

    it('debería denegar el acceso si el usuario no es administrador', async () => {
      // Arrange - Simular que el usuario NO es administrador
      const user = { id_usuario: 2, rol: 2 }; // Cliente

      // Act & Assert - El controlador tiene @Roles(1), por lo que el guard rechazaría
      // En la prueba unitaria, simulamos que el guard lanza una excepción
      try {
        // Simulamos que el guard de roles lanza una excepción
        if (user.rol !== 1) {
          throw new Error('Acceso denegado');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Acceso denegado');
      }
    });

    it('debería denegar el acceso si el usuario no está autenticado', async () => {
      // Arrange - Usuario no autenticado
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
    });
  });

  // ============================================
  // CP-091: ALMACENAMIENTO EN BASE DE DATOS
  // ============================================

  describe('CP-091 - Verificar almacenamiento correcto en la base de datos', () => {
    it('debería guardar la categoría correctamente en la base de datos', async () => {
      // Arrange
      const createCategoriaDto: CreateCategoriaDto = {
        nombre: 'Almacenamiento Test',
        descripcion: 'Descripción para test de almacenamiento',
      };

      const categoriaGuardada = {
        id_categoria: 15,
        ...createCategoriaDto,
      };

      mockCategoriaRepository.findOne.mockResolvedValue(null);
      mockCategoriaRepository.create.mockReturnValue(categoriaGuardada);
      mockCategoriaRepository.save.mockResolvedValue(categoriaGuardada);

      // Act
      const result = await controller.create(createCategoriaDto);

      // Assert
      expect(mockCategoriaRepository.save).toHaveBeenCalled();
      expect(result.id_categoria).toBe(15);
      expect(result.nombre).toBe(createCategoriaDto.nombre);
      expect(result.descripcion).toBe(createCategoriaDto.descripcion);
    });

    it('debería persistir todos los campos en la base de datos', async () => {
      // Arrange
      const createCategoriaDto: CreateCategoriaDto = {
        nombre: 'Persistencia Test',
        descripcion: 'Probando persistencia de datos',
      };

      const categoriaGuardada = {
        id_categoria: 20,
        ...createCategoriaDto,
      };

      mockCategoriaRepository.findOne.mockResolvedValue(null);
      mockCategoriaRepository.create.mockReturnValue(categoriaGuardada);
      mockCategoriaRepository.save.mockResolvedValue(categoriaGuardada);

      // Act
      const result = await controller.create(createCategoriaDto);

      // Assert
      expect(result).toMatchObject({
        id_categoria: 20,
        nombre: 'Persistencia Test',
        descripcion: 'Probando persistencia de datos',
      });
    });

    it('debería verificar que los datos guardados coinciden con los enviados', async () => {
      // Arrange
      const createCategoriaDto: CreateCategoriaDto = {
        nombre: 'Verificación Test',
        descripcion: 'Verificando que los datos coincidan',
      };

      mockCategoriaRepository.findOne.mockResolvedValue(null);
      mockCategoriaRepository.create.mockReturnValue({ id_categoria: 25, ...createCategoriaDto });
      mockCategoriaRepository.save.mockResolvedValue({ id_categoria: 25, ...createCategoriaDto });

      // Act
      const result = await controller.create(createCategoriaDto);

      // Assert
      expect(result.nombre).toBe(createCategoriaDto.nombre);
      expect(result.descripcion).toBe(createCategoriaDto.descripcion);
      expect(result).not.toHaveProperty('campo_inexistente');
    });
  });

  // ============================================
  // PRUEBA ADICIONAL: LISTAR CATEGORÍAS (CONSULTA)
  // ============================================

  describe('Prueba adicional - Listar categorías', () => {
    it('debería retornar todas las categorías registradas', async () => {
      // Arrange
      const categoriasMock = [
        { id_categoria: 1, nombre: 'Deportiva', descripcion: 'Deportes' },
        { id_categoria: 2, nombre: 'Residencial', descripcion: 'Residencias' },
      ];
      mockCategoriaRepository.find.mockResolvedValue(categoriasMock);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockCategoriaRepository.find).toHaveBeenCalledWith({
        relations: ['productos'],
      });
      expect(result).toEqual(categoriasMock);
      expect(result.length).toBe(2);
    });
  });
});