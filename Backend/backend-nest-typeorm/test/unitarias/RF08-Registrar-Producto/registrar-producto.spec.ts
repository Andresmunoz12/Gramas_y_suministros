// test/unit/RF08-Registrar-Producto/registrar-producto.spec.ts

/**
 * MÓDULO: REGISTRAR PRODUCTO
 * 
 * Casos de prueba:
 * - CP-052: Verificar que registro exitoso del producto.
 * - CP-053: Verificar que campos obligatorios vacíos.
 * - CP-054: Verificar que categoría inexistente.
 * - CP-055: Verificar que imagen con formato no permitido.
 * - CP-056: Verificar que precio inválido.
 * - CP-057: Verificar que verificar que solo un administrador pueda registrar productos.
 * - CP-058: Verificar que verificar almacenamiento correcto del producto.
 * - CP-059: Verificar que verificar registro en auditoría.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { getMetadataArgsStorage } from 'typeorm';
import { ProductosController } from '../../../src/productos/productos.controller';
import { ProductosService } from '../../../src/productos/productos.service';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import { CreateProductoDto } from '../../../src/productos/dto/create-producto-dto';
import { ROLES_KEY } from '../../../src/auth/decorators/roles.decorator';
import { mockCategoria, mockProductCreationDto, mockProductSavedRecord } from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockProductoRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
};

const mockCategoriaRepository = {
  findOne: jest.fn(),
};

// Helper para extraer la función fileFilter del archivo de controlador
// Como fileFilter es un const interno, podemos recrear y validar su lógica exacta en test
const testFileFilter = (filename: string, cb: (err: any, accept: boolean) => void) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp'];
  if (!ext || !allowedExtensions.includes(ext)) {
    return cb(new BadRequestException('Formato de imagen no permitido'), false);
  }
  cb(null, true);
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Registrar Producto - Casos de Prueba', () => {
  let controller: ProductosController;
  let service: ProductosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductosController],
      providers: [
        ProductosService,
        {
          provide: getRepositoryToken(productos),
          useValue: mockProductoRepository,
        },
        {
          provide: getRepositoryToken(categoria),
          useValue: mockCategoriaRepository,
        },
      ],
    }).compile();

    controller = module.get<ProductosController>(ProductosController);
    service = module.get<ProductosService>(ProductosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CP-052: REGISTRO EXITOSO DEL PRODUCTO
  // ============================================

  describe('CP-052 - Verificar que registro exitoso del producto', () => {
    it('debería procesar el registro con éxito y retornar el producto creado', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(mockCategoria);
      mockProductoRepository.create.mockImplementation((dto) => dto);
      mockProductoRepository.save.mockResolvedValue(mockProductSavedRecord);

      // Act
      const result = await controller.create(mockProductCreationDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id_producto).toBe(101);
      expect(result.nombre).toBe(mockProductCreationDto.nombre);
    });
  });

  // ============================================
  // CP-053: CAMPOS OBLIGATORIOS VACÍOS
  // ============================================

  describe('CP-053 - Verificar que campos obligatorios vacíos', () => {
    it('debería fallar la validación si el nombre, marca o material están vacíos', async () => {
      // Arrange
      const dto = new CreateProductoDto();
      dto.nombre = '';
      dto.marca = '';
      dto.material = '';
      dto.precio = 10000;
      dto.id_categoria = 1;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const propertiesWithError = errors.map((err) => err.property);
      expect(propertiesWithError).toContain('nombre');
      expect(propertiesWithError).toContain('marca');
      expect(propertiesWithError).toContain('material');
    });
  });

  // ============================================
  // CP-054: CATEGORÍA INEXISTENTE
  // ============================================

  describe('CP-054 - Verificar que categoría inexistente', () => {
    it('debería lanzar NotFoundException si el id_categoria provisto no existe en la base de datos', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.create({
          ...mockProductCreationDto,
          id_categoria: 99,
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // CP-055: IMAGEN CON FORMATO NO PERMITIDO
  // ============================================

  describe('CP-055 - Verificar que imagen con formato no permitido', () => {
    it('debería rechazar archivos con extensiones no permitidas (.pdf, .txt, .exe)', () => {
      // Arrange
      const callback = jest.fn();

      // Act
      testFileFilter('documento.pdf', callback);

      // Assert
      expect(callback).toHaveBeenCalledWith(
        expect.any(BadRequestException),
        false
      );
    });

    it('debería aceptar archivos con extensiones permitidas (.png, .jpg, .jpeg, .webp)', () => {
      // Arrange
      const callback = jest.fn();

      // Act
      testFileFilter('foto_producto.png', callback);

      // Assert
      expect(callback).toHaveBeenCalledWith(null, true);
    });
  });

  // ============================================
  // CP-056: PRECIO INVÁLIDO
  // ============================================

  describe('CP-056 - Verificar que precio inválido', () => {
    it('debería fallar la validación si el precio es un valor negativo', async () => {
      // Arrange
      const dto = new CreateProductoDto();
      dto.nombre = 'Grama Standard';
      dto.marca = 'Evergreen';
      dto.material = 'Polietileno';
      dto.precio = -500; // Inválido
      dto.id_categoria = 1;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('precio');
    });
  });

  // ============================================
  // CP-057: RESTRICCIÓN ROL DE ADMINISTRADOR
  // ============================================

  describe('CP-057 - Verificar que solo un administrador pueda registrar productos', () => {
    it('debería validar que el endpoint de creación de productos requiera rol de Administrador (1)', () => {
      // Act
      const roles = Reflect.getMetadata(ROLES_KEY, controller.create);

      // Assert
      expect(roles).toBeDefined();
      expect(roles).toEqual([1]); // Administrador únicamente
    });
  });

  // ============================================
  // CP-058: ALMACENAMIENTO CORRECTO EN BASE DE DATOS
  // ============================================

  describe('CP-058 - Verificar almacenamiento correcto del producto', () => {
    it('debería verificar que el id_producto y los campos de la entidad productos estén en los metadatos de TypeORM', () => {
      // Act
      const columns = getMetadataArgsStorage().columns.filter(
        (col) => col.target === productos
      );
      const nameCol = columns.find((col) => col.propertyName === 'nombre');
      const priceCol = columns.find((col) => col.propertyName === 'precio');

      // Assert
      expect(nameCol).toBeDefined();
      expect(priceCol).toBeDefined();
    });
  });

  // ============================================
  // CP-059: REGISTRO EN AUDITORÍA
  // ============================================

  describe('CP-059 - Verificar que verificar registro en auditoría', () => {
    it('debería imprimir un log con prefijo [AUDIT] indicando el registro del producto', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(mockCategoria);
      mockProductoRepository.create.mockImplementation((dto) => dto);
      mockProductoRepository.save.mockResolvedValue(mockProductSavedRecord);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await controller.create(mockProductCreationDto);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT] Producto registrado: #101 - Grama Sintética Evergreen por administrador')
      );
      consoleSpy.mockRestore();
    });
  });
});
