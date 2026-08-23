// test/unit/Gestion-Productos/Filtrar-Catalogo/filtrar-catalogo.spec.ts

/**
 * MÓDULO: FILTRAR CATÁLOGO POR CATEGORÍA
 * 
 * Casos de prueba implementados:
 * - CP-080: Verificar filtrar productos por una categoría válida
 * - CP-082: Verificar filtrar una categoría sin productos disponibles
 * - CP-084: Verificar el tiempo de respuesta del filtro
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CategoriaService } from '../../../src/categoria/categoria.service';
import { CategoriaController } from '../../../src/categoria/categoria.controller';
import { categoria } from '../../../src/categoria/categoria.entity';
import {
  categorias,
  categoriaConProductos,
  categoriaSinProductos,
  todasLasCategorias,
  productosPorCategoria,
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

describe('Filtrar Catálogo por Categoría - Casos de Prueba', () => {
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
  // CP-080: FILTRAR PRODUCTOS POR CATEGORÍA VÁLIDA
  // ============================================

  describe('CP-080 - Verificar filtrar productos por una categoría válida', () => {
    it('debería retornar productos de una categoría específica', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaConProductos);

      // Act
      const result = await controller.findOne(1);

      // Assert
      expect(mockCategoriaRepository.findOne).toHaveBeenCalledWith({
        where: { id_categoria: 1 },
        relations: ['productos'],
      });
      expect(result).toEqual(categoriaConProductos);
      expect(result.productos).toBeDefined();
      expect(result.productos.length).toBeGreaterThan(0);
    });

    it('debería retornar solo productos de la categoría Deportiva (id_categoria = 1)', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaConProductos);

      // Act
      const result = await controller.findOne(1);

      // Assert
      expect(result.id_categoria).toBe(1);
      expect(result.nombre).toBe('Deportiva');
      
      // Verificar que todos los productos pertenecen a la categoría Deportiva
      result.productos.forEach((producto) => {
        expect(producto.categoria.id_categoria).toBe(1);
      });
    });

    it('debería retornar productos de la categoría Residencial (id_categoria = 2)', async () => {
      // Arrange
      const categoriaResidencial = {
        id_categoria: 2,
        nombre: 'Residencial',
        descripcion: 'Productos para hogar y jardín',
        productos: productosPorCategoria.residencial,
      };
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaResidencial);

      // Act
      const result = await controller.findOne(2);

      // Assert
      expect(result.id_categoria).toBe(2);
      expect(result.nombre).toBe('Residencial');
      expect(result.productos.length).toBe(1);
      expect(result.productos[0].nombre).toBe('Grama Residencial');
    });

    it('debería incluir todos los campos del producto al filtrar por categoría', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaConProductos);

      // Act
      const result = await controller.findOne(1);

      // Assert
      const producto = result.productos[0];
      expect(producto).toHaveProperty('id_producto');
      expect(producto).toHaveProperty('nombre');
      expect(producto).toHaveProperty('marca');
      expect(producto).toHaveProperty('precio');
      expect(producto).toHaveProperty('estado');
      expect(producto).toHaveProperty('categoria');
    });
  });

  // ============================================
  // CP-082: FILTRAR CATEGORÍA SIN PRODUCTOS
  // ============================================

  describe('CP-082 - Verificar filtrar una categoría sin productos disponibles', () => {
    it('debería retornar una categoría con array de productos vacío', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaSinProductos);

      // Act
      const result = await controller.findOne(4);

      // Assert
      expect(mockCategoriaRepository.findOne).toHaveBeenCalledWith({
        where: { id_categoria: 4 },
        relations: ['productos'],
      });
      expect(result.productos).toBeDefined();
      expect(result.productos).toEqual([]);
      expect(result.productos.length).toBe(0);
    });

    it('debería retornar la categoría "Suministro" sin productos', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaSinProductos);

      // Act
      const result = await controller.findOne(4);

      // Assert
      expect(result.id_categoria).toBe(4);
      expect(result.nombre).toBe('Suministro');
      expect(result.productos.length).toBe(0);
    });

    it('no debería fallar al consultar una categoría sin productos', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaSinProductos);

      // Act & Assert
      await expect(controller.findOne(4)).resolves.not.toThrow();
      expect(mockCategoriaRepository.findOne).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si la categoría no existe', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.findOne(999)).rejects.toThrow(
        new NotFoundException('Categoría con ID 999 no encontrada'),
      );
      expect(mockCategoriaRepository.findOne).toHaveBeenCalledWith({
        where: { id_categoria: 999 },
        relations: ['productos'],
      });
    });
  });

  // ============================================
  // CP-084: VERIFICAR TIEMPO DE RESPUESTA DEL FILTRO
  // ============================================

  describe('CP-084 - Verificar el tiempo de respuesta del filtro', () => {
    it('debería filtrar por categoría en menos de 2 segundos', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaConProductos);

      // Act & Assert - Medir tiempo de ejecución
      const startTime = Date.now();
      await controller.findOne(1);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(executionTime).toBeLessThan(2000);
      expect(mockCategoriaRepository.findOne).toHaveBeenCalled();
    });

    it('debería responder rápidamente incluso con muchos productos en la categoría', async () => {
      // Arrange - Simular una categoría con 50 productos
      const muchosProductos = Array.from({ length: 50 }, (_, i) => ({
        id_producto: i + 1,
        nombre: `Producto ${i + 1}`,
        precio: 10000 + i * 1000,
        estado: 1,
        categoria: { id_categoria: 1, nombre: 'Deportiva' },
      }));
      const categoriaConMuchosProductos = {
        ...categoriaConProductos,
        productos: muchosProductos,
      };
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaConMuchosProductos);

      // Act
      const startTime = Date.now();
      await controller.findOne(1);
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Assert
      expect(executionTime).toBeLessThan(2000);
    });

    it('debería retornar los productos de la categoría sin demoras innecesarias', async () => {
      // Arrange
      mockCategoriaRepository.findOne.mockResolvedValue(categoriaConProductos);

      // Act
      const result = await controller.findOne(1);

      // Assert
      expect(result).toBeDefined();
      expect(result.productos).toBeDefined();
      expect(Array.isArray(result.productos)).toBe(true);
    });

    it('el tiempo de respuesta debe ser consistente para cualquier categoría', async () => {
      // Arrange - Simular diferentes categorías
      const categoriasTest = [
        { id: 1, productos: productosPorCategoria.deportiva },
        { id: 2, productos: productosPorCategoria.residencial },
        { id: 3, productos: productosPorCategoria.comercial },
        { id: 4, productos: [] },
      ];

      for (const cat of categoriasTest) {
        const categoriaMock = {
          id_categoria: cat.id,
          nombre: `Categoría ${cat.id}`,
          productos: cat.productos,
        };
        mockCategoriaRepository.findOne.mockResolvedValue(categoriaMock);

        // Act
        const startTime = Date.now();
        await controller.findOne(cat.id);
        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // Assert - Todas deben responder en menos de 2 segundos
        expect(executionTime).toBeLessThan(2000);
      }
    });
  });

  // ============================================
  // PRUEBAS ADICIONALES: LISTAR TODAS LAS CATEGORÍAS
  // ============================================

  describe('Pruebas adicionales - Listar todas las categorías', () => {
    it('debería retornar todas las categorías con sus productos', async () => {
      // Arrange
      mockCategoriaRepository.find.mockResolvedValue(todasLasCategorias);

      // Act
      const result = await controller.findAll();

      // Assert
      expect(mockCategoriaRepository.find).toHaveBeenCalledWith({
        relations: ['productos'],
      });
      expect(result).toEqual(todasLasCategorias);
      expect(result.length).toBe(4);
    });

    it('cada categoría debería incluir su lista de productos', async () => {
      // Arrange
      mockCategoriaRepository.find.mockResolvedValue(todasLasCategorias);

      // Act
      const result = await controller.findAll();

      // Assert
      result.forEach((categoria) => {
        expect(categoria).toHaveProperty('productos');
        expect(Array.isArray(categoria.productos)).toBe(true);
      });
    });
  });
});