// test/unit/Gestion-Productos/Consultar-Catalogo/consultar-catalogo.spec.ts

/**
 * MÓDULO: CONSULTAR CATÁLOGO DE PRODUCTOS
 * 
 * Casos de prueba implementados:
 * - CP-074: Verificar visualización exitosa del catálogo
 * - CP-075: Verificar que solo se muestren productos activos
 * - CP-076: Verificar consulta del catálogo cuando no hay productos
 * - CP-077: Verificar visualización de información completa del producto
 * - CP-078: Verificar tiempo de carga del catálogo
 * - CP-079: Verificar conexión con la base de datos
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductosService } from '../../../src/productos/productos.service';
import { ProductosController } from '../../../src/productos/productos.controller';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import {
  productosActivos,
  productosInactivos,
  todosLosProductos,
  productoDetalle,
} from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockProductoRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  merge: jest.fn(),
  remove: jest.fn(),
};

const mockCategoriaRepository = {
  findOne: jest.fn(),
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Consultar Catálogo de Productos - Casos de Prueba', () => {
  let service: ProductosService;
  let controller: ProductosController;

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

    service = module.get<ProductosService>(ProductosService);
    controller = module.get<ProductosController>(ProductosController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CP-074: VERIFICAR VISUALIZACIÓN EXITOSA DEL CATÁLOGO
  // ============================================

  describe('CP-074 - Verificar visualización exitosa del catálogo', () => {
    it('debería cargar el catálogo con todos los productos activos', async () => {
      // Arrange
      mockProductoRepository.find.mockResolvedValue(productosActivos);

      // Act
      const result = await controller.findAll();

      // Assert
      // ✅ CORREGIDO: Incluir 'stock' en las relaciones
      expect(mockProductoRepository.find).toHaveBeenCalledWith({
        where: { estado: 1 },
        relations: ['categoria', 'stock'],
      });
      expect(result).toEqual(productosActivos);
      expect(result.length).toBe(3);
    });

    it('debería retornar un array vacío si no hay productos', async () => {
      // Arrange
      mockProductoRepository.find.mockResolvedValue([]);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockProductoRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });

  // ============================================
  // CP-075: VERIFICAR QUE SOLO SE MUESTREN PRODUCTOS ACTIVOS
  // ============================================

  describe('CP-075 - Verificar que solo se muestren productos activos', () => {
    it('debería retornar solo productos con estado = 1 (activos)', async () => {
      // Arrange
      mockProductoRepository.find.mockResolvedValue(productosActivos);

      // Act
      const result = await service.findAll();

      // Assert
      // ✅ CORREGIDO: Incluir 'stock' en las relaciones
      expect(mockProductoRepository.find).toHaveBeenCalledWith({
        where: { estado: 1 },
        relations: ['categoria', 'stock'],
      });
      
      // Verificar que todos los productos tengan estado = 1
      result.forEach((producto) => {
        expect(producto.estado).toBe(1);
      });
      
      // Verificar que ningún producto inactivo esté en el resultado
      const tieneInactivos = result.some((p) => p.estado === 0);
      expect(tieneInactivos).toBe(false);
    });

    it('no debería incluir productos inactivos (estado = 0) en el catálogo', async () => {
      // Arrange
      // Simular que el repositorio solo devuelve activos
      mockProductoRepository.find.mockResolvedValue(productosActivos);

      // Act
      const result = await service.findAll();

      // Assert
      const inactivosEncontrados = result.filter((p) => p.estado === 0);
      expect(inactivosEncontrados.length).toBe(0);
    });
  });

  // ============================================
  // CP-076: CONSULTAR CATÁLOGO CUANDO NO HAY PRODUCTOS
  // ============================================

  describe('CP-076 - Consultar catálogo cuando no existen productos disponibles', () => {
    it('debería retornar un array vacío si no hay productos activos', async () => {
      // Arrange
      mockProductoRepository.find.mockResolvedValue([]);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockProductoRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('debería retornar un array vacío si solo hay productos inactivos', async () => {
      // Arrange
      // Simular que solo hay productos inactivos en la BD
      mockProductoRepository.find.mockResolvedValue([]);

      // Act
      const result = await service.findAll();

      // Assert
      // ✅ CORREGIDO: Incluir 'stock' en las relaciones
      expect(mockProductoRepository.find).toHaveBeenCalledWith({
        where: { estado: 1 },
        relations: ['categoria', 'stock'],
      });
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('debería manejar correctamente la ausencia de productos sin lanzar error', async () => {
      // Arrange
      mockProductoRepository.find.mockResolvedValue([]);

      // Act & Assert
      await expect(controller.findAll()).resolves.not.toThrow();
      expect(mockProductoRepository.find).toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-077: VERIFICAR VISUALIZACIÓN DE INFORMACIÓN COMPLETA DEL PRODUCTO
  // ============================================

  describe('CP-077 - Verificar visualización de información completa del producto', () => {
    it('debería retornar toda la información del producto por ID', async () => {
      // Arrange
      mockProductoRepository.findOne.mockResolvedValue(productoDetalle);

      // Act
      const result = await controller.findOne(1);

      // Assert
      // ✅ CORREGIDO: Incluir 'stock' en las relaciones
      expect(mockProductoRepository.findOne).toHaveBeenCalledWith({
        where: { id_producto: 1 },
        relations: ['categoria', 'stock'],
      });
      
      // Verificar que todos los campos importantes estén presentes
      expect(result).toHaveProperty('id_producto');
      expect(result).toHaveProperty('nombre');
      expect(result).toHaveProperty('marca');
      expect(result).toHaveProperty('peso');
      expect(result).toHaveProperty('material');
      expect(result).toHaveProperty('descripcion');
      expect(result).toHaveProperty('precio');
      expect(result).toHaveProperty('altura');
      expect(result).toHaveProperty('estado');
      expect(result).toHaveProperty('categoria');
      expect(result).toHaveProperty('imagen');
      expect(result).toHaveProperty('createdAt');
      expect(result).toHaveProperty('updatedAt');
    });

    it('debería incluir la categoría del producto en la respuesta', async () => {
      // Arrange
      mockProductoRepository.findOne.mockResolvedValue(productoDetalle);

      // Act
      const result = await controller.findOne(1);

      // Assert
      expect(result.categoria).toBeDefined();
      expect(result.categoria).toHaveProperty('id_categoria');
      expect(result.categoria).toHaveProperty('nombre');
      expect(result.categoria.id_categoria).toBe(1);
      expect(result.categoria.nombre).toBe('Deportiva');
    });

    it('debería lanzar NotFoundException si el producto no existe', async () => {
      // Arrange
      mockProductoRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.findOne(999)).rejects.toThrow(
        new NotFoundException('Producto con ID 999 no encontrado'),
      );
      // ✅ CORREGIDO: Incluir 'stock' en las relaciones
      expect(mockProductoRepository.findOne).toHaveBeenCalledWith({
        where: { id_producto: 999 },
        relations: ['categoria', 'stock'],
      });
    });
  });

  // ============================================
  // CP-078: VERIFICAR TIEMPO DE CARGA DEL CATÁLOGO
  // ============================================

  describe('CP-078 - Verificar tiempo de carga del catálogo', () => {
    it('debería cargar el catálogo en menos de 3 segundos', async () => {
      // Arrange
      mockProductoRepository.find.mockResolvedValue(productosActivos);

      // Act & Assert - Medir tiempo de ejecución
      const startTime = Date.now();
      await controller.findAll();
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // El tiempo de ejecución debería ser menor a 3000ms (3 segundos)
      expect(executionTime).toBeLessThan(3000);
      expect(mockProductoRepository.find).toHaveBeenCalled();
    });

    it('debería cargar el catálogo rápidamente incluso con muchos productos', async () => {
      // Arrange - Simular 100 productos
      const muchosProductos = Array.from({ length: 100 }, (_, i) => ({
        ...productosActivos[0],
        id_producto: i + 1,
        nombre: `Producto ${i + 1}`,
      }));
      mockProductoRepository.find.mockResolvedValue(muchosProductos);

      // Act
      const startTime = Date.now();
      await controller.findAll();
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Assert
      expect(executionTime).toBeLessThan(3000);
      expect(mockProductoRepository.find).toHaveBeenCalled();
    });

    it('debería retornar los productos sin demoras innecesarias', async () => {
      // Arrange
      mockProductoRepository.find.mockResolvedValue(productosActivos);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ============================================
  // CP-079: VERIFICAR CONEXIÓN CON LA BASE DE DATOS
  // ============================================

  describe('CP-079 - Verificar conexión con la base de datos', () => {
    it('debería ejecutar consultas a la base de datos correctamente', async () => {
      // Arrange
      mockProductoRepository.find.mockResolvedValue(productosActivos);

      // Act
      const result = await service.findAll();

      // Assert - Verificar que el repositorio fue llamado
      expect(mockProductoRepository.find).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('debería manejar errores de conexión a la base de datos', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockProductoRepository.find.mockRejectedValue(dbError);

      // Act & Assert
      await expect(service.findAll()).rejects.toThrow('Database connection failed');
      expect(mockProductoRepository.find).toHaveBeenCalled();
    });

    it('debería retornar datos completos desde la base de datos', async () => {
      // Arrange
      mockProductoRepository.find.mockResolvedValue(productosActivos);

      // Act
      const result = await service.findAll();

      // Assert - Verificar estructura de datos
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      
      // Verificar que cada producto tenga los campos esperados
      result.forEach((producto) => {
        expect(producto).toHaveProperty('id_producto');
        expect(producto).toHaveProperty('nombre');
        expect(producto).toHaveProperty('precio');
        expect(producto).toHaveProperty('estado');
        expect(producto).toHaveProperty('categoria');
      });
    });

    it('debería verificar que los datos en la BD coinciden con la respuesta', async () => {
      // Arrange
      const productosEsperados = productosActivos;
      mockProductoRepository.find.mockResolvedValue(productosEsperados);

      // Act
      const result = await service.findAll();

      // Assert
      expect(result).toEqual(productosEsperados);
      expect(result[0].id_producto).toBe(productosEsperados[0].id_producto);
      expect(result[0].nombre).toBe(productosEsperados[0].nombre);
    });
  });

  // ============================================
  // PRUEBAS ADICIONALES: ADMIN (findAllAdmin)
  // ============================================

  describe('Pruebas adicionales - Administrador (findAllAdmin)', () => {
    it('debería retornar todos los productos (incluyendo inactivos) para admin', async () => {
      // Arrange
      mockProductoRepository.find.mockResolvedValue(todosLosProductos);

      // Act
      const result = await service.findAllAdmin();

      // Assert
      // ✅ CORREGIDO: Incluir 'stock' en las relaciones
      expect(mockProductoRepository.find).toHaveBeenCalledWith({
        relations: ['categoria', 'stock'],
        order: { estado: 'DESC', id_producto: 'ASC' },
      });
      
      // Verificar que incluye activos e inactivos
      const activos = result.filter((p) => p.estado === 1);
      const inactivos = result.filter((p) => p.estado === 0);
      
      expect(activos.length).toBeGreaterThan(0);
      expect(inactivos.length).toBeGreaterThan(0);
      expect(result.length).toBe(todosLosProductos.length);
    });
  });
});