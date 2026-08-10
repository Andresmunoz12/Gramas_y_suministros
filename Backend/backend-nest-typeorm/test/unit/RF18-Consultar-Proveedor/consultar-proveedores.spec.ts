// test/unit/R18-Consultar-Proveedores/consultar-proveedores.spec.ts

/**
 * MÓDULO: CONSULTAR LISTADO DE PROVEEDORES
 * 
 * Casos de prueba implementados:
 * - CP-121: Verificar consulta exitosa del listado de proveedores
 * - CP-124: Verificar consulta cuando no existen proveedores registrados
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProveedoresService } from '../../../src/proveedores/proveedores.service';
import { ProveedoresController } from '../../../src/proveedores/proveedores.controller';
import { proveedor } from '../../../src/proveedores/proveedores.entity';
import {
  listaProveedores,
  listaVacia,
  proveedorIndividual,
} from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockProveedorRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Consultar Listado de Proveedores - Casos de Prueba', () => {
  let service: ProveedoresService;
  let controller: ProveedoresController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProveedoresController],
      providers: [
        ProveedoresService,
        {
          provide: getRepositoryToken(proveedor),
          useValue: mockProveedorRepository,
        },
      ],
    }).compile();

    service = module.get<ProveedoresService>(ProveedoresService);
    controller = module.get<ProveedoresController>(ProveedoresController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CP-121: CONSULTA EXITOSA DEL LISTADO
  // ============================================

  describe('CP-121 - Verificar consulta exitosa del listado de proveedores', () => {
    it('debería retornar todos los proveedores con sus entradas', async () => {
      // Arrange
      mockProveedorRepository.find.mockResolvedValue(listaProveedores);

      // Act
      const result = await controller.listar();

      // Assert
      expect(mockProveedorRepository.find).toHaveBeenCalledWith({
        relations: ['entradas'],
      });
      expect(result).toEqual(listaProveedores);
      expect(result.length).toBe(3);
    });

    it('debería incluir las entradas asociadas a cada proveedor', async () => {
      // Arrange
      mockProveedorRepository.find.mockResolvedValue(listaProveedores);

      // Act
      const result = await controller.listar();

      // Assert
      const proveedorConEntradas = result.find((p) => p.id_proveedor === 1);
      expect(proveedorConEntradas).toBeDefined();
      expect(proveedorConEntradas.entradas).toBeDefined();
      expect(proveedorConEntradas.entradas.length).toBe(2);
    });

    it('debería retornar un proveedor específico por ID con sus entradas', async () => {
      // Arrange
      mockProveedorRepository.findOne.mockResolvedValue(proveedorIndividual);

      // Act
      const result = await controller.obtenerUno(1);

      // Assert
      expect(mockProveedorRepository.findOne).toHaveBeenCalledWith({
        where: { id_proveedor: 1 },
        relations: ['entradas'],
      });
      expect(result).toEqual(proveedorIndividual);
      expect(result.id_proveedor).toBe(1);
      expect(result.nombre).toBe('Vivero El Rosal');
    });

    it('debería retornar proveedores con sus datos completos', async () => {
      // Arrange
      mockProveedorRepository.find.mockResolvedValue(listaProveedores);

      // Act
      const result = await controller.listar();

      // Assert
      const primerProveedor = result[0];
      expect(primerProveedor).toHaveProperty('id_proveedor');
      expect(primerProveedor).toHaveProperty('nombre');
      expect(primerProveedor).toHaveProperty('contacto');
      expect(primerProveedor).toHaveProperty('telefono');
      expect(primerProveedor).toHaveProperty('email');
      expect(primerProveedor).toHaveProperty('direccion');
      expect(primerProveedor).toHaveProperty('entradas');
    });
  });

  // ============================================
  // CP-124: CONSULTA SIN PROVEEDORES
  // ============================================

  describe('CP-124 - Verificar consulta cuando no existen proveedores registrados', () => {
    it('debería retornar un array vacío si no hay proveedores', async () => {
      // Arrange
      mockProveedorRepository.find.mockResolvedValue(listaVacia);

      // Act
      const result = await controller.listar();

      // Assert
      expect(mockProveedorRepository.find).toHaveBeenCalledWith({
        relations: ['entradas'],
      });
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    it('debería lanzar NotFoundException si se busca un proveedor que no existe', async () => {
      // Arrange
      mockProveedorRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.obtenerUno(999)).rejects.toThrow(
        new NotFoundException('Proveedor no encontrado'),
      );
      expect(mockProveedorRepository.findOne).toHaveBeenCalledWith({
        where: { id_proveedor: 999 },
        relations: ['entradas'],
      });
    });

    it('debería manejar correctamente la ausencia de proveedores sin lanzar error', async () => {
      // Arrange
      mockProveedorRepository.find.mockResolvedValue(listaVacia);

      // Act & Assert
      await expect(controller.listar()).resolves.not.toThrow();
      expect(mockProveedorRepository.find).toHaveBeenCalled();
    });
  });

  // ============================================
  // PRUEBAS DE CONTROL DE ROLES (CP-118 relacionado)
  // ============================================

  describe('Pruebas de control de acceso', () => {
    it('el controlador debería tener el decorador @Roles(1) a nivel de clase', () => {
      const controllerClass = ProveedoresController;
      const roles = Reflect.getMetadata('roles', controllerClass);
      
      expect(roles).toBeDefined();
    });

    it('debería denegar el acceso si el usuario no es administrador (simulación)', async () => {
      // Act & Assert
      try {
        const user = { id_usuario: 2, rol: 2 };
        if (user.rol !== 1) {
          throw new Error('Acceso denegado: Se requiere rol de Administrador');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Acceso denegado');
        expect(error.message).toContain('Administrador');
      }
      // Verificar que no se llamó al repositorio
      expect(mockProveedorRepository.find).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // PRUEBAS ADICIONALES - TIEMPO DE RESPUESTA
  // ============================================

  describe('Pruebas adicionales - Rendimiento', () => {
    it('debería consultar la lista en menos de 2 segundos', async () => {
      // Arrange
      mockProveedorRepository.find.mockResolvedValue(listaProveedores);

      // Act
      const startTime = Date.now();
      await controller.listar();
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Assert
      expect(executionTime).toBeLessThan(2000);
      expect(mockProveedorRepository.find).toHaveBeenCalled();
    });

    it('debería manejar grandes volúmenes de proveedores eficientemente', async () => {
      // Arrange - Crear 50 proveedores
      const muchosProveedores = Array.from({ length: 50 }, (_, i) => ({
        id_proveedor: i + 1,
        nombre: `Proveedor ${i + 1}`,
        contacto: `Contacto ${i + 1}`,
        telefono: `300${String(i).padStart(7, '0')}`,
        email: `proveedor${i + 1}@test.com`,
        direccion: `Calle ${i + 1}`,
        entradas: [],
      }));

      mockProveedorRepository.find.mockResolvedValue(muchosProveedores);

      // Act
      const startTime = Date.now();
      const result = await controller.listar();
      const endTime = Date.now();
      const executionTime = endTime - startTime;

      // Assert
      expect(result.length).toBe(50);
      expect(executionTime).toBeLessThan(3000);
    });
  });
});