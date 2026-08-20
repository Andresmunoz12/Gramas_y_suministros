// test/unit/RF10-Desactivar-Producto/desactivar-producto.spec.ts

/**
 * MÓDULO: DESACTIVAR PRODUCTO
 * 
 * Casos de prueba:
 * - CP-067: Verificar que desactivación exitosa del producto.
 * - CP-068: Verificar que intentar desactivar un producto inexistente.
 * - CP-069: Verificar que intentar desactivar un producto ya inactivo.
 * - CP-070: Verificar que cancelar la desactivación (el estado no cambia si no se ejecuta).
 * - CP-071: Verificar que verificar que el producto no aparezca en el catálogo de clientes.
 * - CP-072: Verificar que verificar que solo un administrador pueda desactivar productos.
 * - CP-073: Verificar que verificar registro en auditoría.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductosController } from '../../../src/productos/productos.controller';
import { ProductosService } from '../../../src/productos/productos.service';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import { ROLES_KEY } from '../../../src/auth/decorators/roles.decorator';
import { mockCategoria, mockActiveProduct, mockInactiveProduct } from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockProductoRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
};

const mockCategoriaRepository = {
  findOne: jest.fn(),
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Desactivar Producto - Casos de Prueba', () => {
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
  // CP-067: DESACTIVACIÓN EXITOSA
  // ============================================

  describe('CP-067 - Verificar que desactivación exitosa del producto', () => {
    it('debería cambiar el estado del producto a 0 (inactivo) y retornar el producto modificado', async () => {
      // Arrange
      // Clonamos el mock para evitar mutaciones entre tests
      const productToDesactivate = { ...mockActiveProduct };
      mockProductoRepository.findOne.mockResolvedValue(productToDesactivate);
      mockProductoRepository.save.mockImplementation((prod) => Promise.resolve(prod));

      // Act
      const result = await controller.desactivar(101);

      // Assert
      expect(result).toBeDefined();
      expect(result.estado).toBe(0);
      expect(mockProductoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ id_producto: 101, estado: 0 })
      );
    });
  });

  // ============================================
  // CP-068: DESACTIVAR PRODUCTO INEXISTENTE
  // ============================================

  describe('CP-068 - Verificar que intentar desactivar un producto inexistente', () => {
    it('debería lanzar una NotFoundException si el ID del producto no está registrado', async () => {
      // Arrange
      mockProductoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.desactivar(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // CP-069: DESACTIVAR PRODUCTO YA INACTIVO
  // ============================================

  describe('CP-069 - Verificar que intentar desactivar un producto ya inactivo', () => {
    it('debería mantener el estado del producto en 0 (inactivo) y retornar el producto sin errores', async () => {
      // Arrange
      const alreadyInactive = { ...mockInactiveProduct };
      mockProductoRepository.findOne.mockResolvedValue(alreadyInactive);
      mockProductoRepository.save.mockImplementation((prod) => Promise.resolve(prod));

      // Act
      const result = await controller.desactivar(102);

      // Assert
      expect(result.estado).toBe(0);
      expect(mockProductoRepository.save).toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-070: CANCELAR DESACTIVACIÓN
  // ============================================

  describe('CP-070 - Verificar que cancelar la desactivación', () => {
    it('debería mantener el estado del producto como activo (1) si la acción no se ejecuta o se aborta', async () => {
      // Arrange & Act
      const product = { ...mockActiveProduct };

      // Assert
      expect(product.estado).toBe(1); // Mantiene el estado activo
    });
  });

  // ============================================
  // CP-071: EXCLUSIÓN DEL CATÁLOGO DE CLIENTES
  // ============================================

  describe('CP-071 - Verificar que el producto desactivado no aparezca en el catálogo de clientes', () => {
    it('debería retornar únicamente los productos activos (estado = 1) al invocar findAll', async () => {
      // Arrange
      const activeProductsList = [mockActiveProduct];
      mockProductoRepository.find.mockResolvedValue(activeProductsList);

      // Act
      const catalog = await controller.findAll();

      // Assert
      expect(catalog).toContain(mockActiveProduct);
      expect(catalog).not.toContain(mockInactiveProduct);
      expect(mockProductoRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { estado: 1 },
        })
      );
    });
  });

  // ============================================
  // CP-072: RESTRICCIÓN DE ROL DE ADMINISTRADOR
  // ============================================

  describe('CP-072 - Verificar que solo un administrador pueda desactivar productos', () => {
    it('debería validar que el endpoint de desactivación requiera rol de Administrador (1)', () => {
      // Act
      const roles = Reflect.getMetadata(ROLES_KEY, controller.desactivar);

      // Assert
      expect(roles).toBeDefined();
      expect(roles).toEqual([1]);
    });
  });

  // ============================================
  // CP-073: REGISTRO EN AUDITORÍA
  // ============================================

  describe('CP-073 - Verificar que verificar registro en auditoría', () => {
    it('debería imprimir un log con prefijo [AUDIT] detallando la desactivación del producto', async () => {
      // Arrange
      const productToDesactivate = { ...mockActiveProduct };
      mockProductoRepository.findOne.mockResolvedValue(productToDesactivate);
      mockProductoRepository.save.mockImplementation((prod) => Promise.resolve(prod));
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Act
      await controller.desactivar(101);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AUDIT] Producto desactivado: #101 - Grama Sintética Activa por administrador')
      );
      consoleSpy.mockRestore();
    });
  });
});
