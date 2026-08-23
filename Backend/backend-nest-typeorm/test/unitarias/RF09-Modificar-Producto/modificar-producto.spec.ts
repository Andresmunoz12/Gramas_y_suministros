// test/unit/RF09-Modificar-Producto/modificar-producto.spec.ts

/**
 * MÓDULO: MODIFICAR PRODUCTO
 * 
 * Casos de prueba:
 * - CP-060: Verificar que modificación exitosa del producto.
 * - CP-061: Verificar que campos obligatorios vacíos.
 * - CP-062: Verificar que información inválida.
 * - CP-063: Verificar que producto no existente.
 * - CP-064: Verificar que verificar que solo un administrador pueda modificar productos.
 * - CP-065: Verificar que verificar actualización correcta en la base de datos.
 * - CP-066: Verificar que verificar registro en auditoría.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { getMetadataArgsStorage } from 'typeorm';
import { ProductosController } from '../../../src/productos/productos.controller';
import { ProductosService } from '../../../src/productos/productos.service';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import { UpdateProductoDto } from '../../../src/productos/dto/update-producto.dto';
import { ROLES_KEY } from '../../../src/auth/decorators/roles.decorator';
import { mockCategoria, mockOriginalProduct, mockProductUpdateDto, mockModifiedProductRecord } from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockProductoRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
};

const mockCategoriaRepository = {
  findOne: jest.fn(),
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Modificar Producto - Casos de Prueba', () => {
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
  // CP-060: MODIFICACIÓN EXITOSA DEL PRODUCTO
  // ============================================

  describe('CP-060 - Verificar que modificación exitosa del producto', () => {
    it('debería procesar la solicitud con éxito y retornar el producto actualizado', async () => {
      // Arrange
      mockProductoRepository.findOne.mockResolvedValue(mockOriginalProduct);
      mockProductoRepository.merge.mockImplementation((prod, dto) => Object.assign(prod, dto));
      mockProductoRepository.save.mockResolvedValue(mockModifiedProductRecord);

      // Act
      const result = await controller.update(101, mockProductUpdateDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id_producto).toBe(101);
      expect(result.nombre).toBe('Grama Sintética Actualizada');
      expect(result.precio).toBe(45000);
    });
  });

  // ============================================
  // CP-061: CAMPOS OBLIGATORIOS VACÍOS
  // ============================================

  describe('CP-061 - Verificar que campos obligatorios vacíos', () => {
    it('debería fallar la validación si se envía un campo obligatorio de texto vacío', async () => {
      // Arrange
      const dto = new UpdateProductoDto();
      dto.nombre = ''; // Vacío
      dto.marca = ''; // Vacío

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const properties = errors.map((err) => err.property);
      expect(properties).toContain('nombre');
      expect(properties).toContain('marca');
    });
  });

  // ============================================
  // CP-062: INFORMACIÓN INVÁLIDA
  // ============================================

  describe('CP-062 - Verificar que información inválida', () => {
    it('debería fallar si el precio o altura no corresponden a un número o son negativos', async () => {
      // Arrange
      const dto = new UpdateProductoDto();
      dto.precio = -100; // Inválido
      dto.altura = -1; // Inválido

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      const properties = errors.map((err) => err.property);
      expect(properties).toContain('precio');
      expect(properties).toContain('altura');
    });
  });

  // ============================================
  // CP-063: PRODUCTO NO EXISTENTE
  // ============================================

  describe('CP-063 - Verificar que producto no existente', () => {
    it('debería lanzar NotFoundException si el id del producto a modificar no existe', async () => {
      // Arrange
      mockProductoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.update(999, mockProductUpdateDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // CP-064: RESTRICCIÓN ROL DE ADMINISTRADOR
  // ============================================

  describe('CP-064 - Verificar que solo un administrador pueda modificar productos', () => {
    it('debería validar que el endpoint de actualización requiera rol de Administrador (1)', () => {
      // Act
      const roles = Reflect.getMetadata(ROLES_KEY, controller.update);

      // Assert
      expect(roles).toBeDefined();
      expect(roles).toEqual([1]);
    });
  });

  // ============================================
  // CP-065: ACTUALIZACIÓN EN BASE DE DATOS
  // ============================================

  describe('CP-065 - Verificar que verificar actualización correcta en la base de datos', () => {
    it('debería persistir los datos de actualización en el repositorio de base de datos', async () => {
      // Arrange
      mockProductoRepository.findOne.mockResolvedValue(mockOriginalProduct);
      mockProductoRepository.save.mockResolvedValue(mockModifiedProductRecord);

      // Act
      await service.update(101, mockProductUpdateDto);

      // Assert
      expect(mockProductoRepository.save).toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-066: REGISTRO EN AUDITORÍA
  // ============================================

  describe('CP-066 - Verificar que verificar registro en auditoría', () => {
    it('debería imprimir un log de auditoría en consola al modificar un producto', async () => {
      // Arrange
      mockProductoRepository.findOne.mockResolvedValue(mockOriginalProduct);
      mockProductoRepository.save.mockResolvedValue(mockModifiedProductRecord);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await controller.update(101, mockProductUpdateDto);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT] Producto modificado: #101 - Grama Sintética Actualizada por administrador')
      );
      consoleSpy.mockRestore();
    });
  });
});
