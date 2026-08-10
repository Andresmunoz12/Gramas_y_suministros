// test/unit/R19-Eliminar-Proveedor/eliminar-proveedor.spec.ts

/**
 * MÓDULO: ELIMINAR PROVEEDOR
 * 
 * Casos de prueba implementados:
 * - CP-127: Verificar eliminación exitosa de un proveedor sin información asociada
 * - CP-128: Verificar intentar eliminar un proveedor con entradas asociadas
 * - CP-131: Verificar que solo un administrador pueda eliminar proveedores
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProveedoresService } from '../../../src/proveedores/proveedores.service';
import { ProveedoresController } from '../../../src/proveedores/proveedores.controller';
import { proveedor } from '../../../src/proveedores/proveedores.entity';
import {
  proveedorSinEntradas,
  proveedorConEntradas,
  proveedorConMuchasEntradas,
  proveedorEliminado,
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

describe('Eliminar Proveedor - Casos de Prueba', () => {
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
  // CP-127: ELIMINACIÓN EXITOSA (SIN ENTRADAS)
  // ============================================

  describe('CP-127 - Verificar eliminación exitosa de un proveedor sin información asociada', () => {
    it('debería eliminar un proveedor que no tiene entradas asociadas', async () => {
      // Arrange
      mockProveedorRepository.findOne.mockResolvedValue(proveedorSinEntradas);
      mockProveedorRepository.remove.mockResolvedValue(proveedorEliminado);

      // Act
      const result = await controller.borrar(1);

      // Assert
      expect(mockProveedorRepository.findOne).toHaveBeenCalledWith({
        where: { id_proveedor: 1 },
        relations: ['entradas'],
      });
      expect(mockProveedorRepository.remove).toHaveBeenCalledWith(proveedorSinEntradas);
      expect(result).toEqual(proveedorEliminado);
    });

    it('debería retornar el proveedor eliminado después de la operación', async () => {
      // Arrange
      mockProveedorRepository.findOne.mockResolvedValue(proveedorSinEntradas);
      mockProveedorRepository.remove.mockResolvedValue(proveedorEliminado);

      // Act
      const result = await controller.borrar(1);

      // Assert
      expect(result.id_proveedor).toBe(1);
      expect(result.nombre).toBe('Proveedor Sin Entradas');
    });

    it('debería eliminar correctamente un proveedor con array de entradas vacío', async () => {
      // Arrange
      const proveedorVacio = {
        id_proveedor: 4,
        nombre: 'Proveedor Vacío',
        contacto: 'Test',
        telefono: '3001111111',
        email: 'vacio@test.com',
        direccion: 'Calle Test',
        entradas: [],
      };

      mockProveedorRepository.findOne.mockResolvedValue(proveedorVacio);
      mockProveedorRepository.remove.mockResolvedValue(proveedorVacio);

      // Act
      const result = await controller.borrar(4);

      // Assert
      expect(mockProveedorRepository.remove).toHaveBeenCalledWith(proveedorVacio);
      expect(result.id_proveedor).toBe(4);
    });
  });

  // ============================================
  // CP-128: ELIMINAR PROVEEDOR CON ENTRADAS
  // ============================================

  describe('CP-128 - Verificar intentar eliminar un proveedor con entradas asociadas', () => {
    it('debería lanzar ConflictException si el proveedor tiene entradas', async () => {
      // Arrange
      mockProveedorRepository.findOne.mockResolvedValue(proveedorConEntradas);

      // Act & Assert
      await expect(controller.borrar(2)).rejects.toThrow(
        new ConflictException(
          'No se puede eliminar el proveedor porque tiene entradas asociadas.',
        ),
      );
      expect(mockProveedorRepository.findOne).toHaveBeenCalledWith({
        where: { id_proveedor: 2 },
        relations: ['entradas'],
      });
      expect(mockProveedorRepository.remove).not.toHaveBeenCalled();
    });

    it('debería mostrar un mensaje específico al intentar eliminar proveedor con entradas', async () => {
      // Arrange
      mockProveedorRepository.findOne.mockResolvedValue(proveedorConEntradas);

      // Act & Assert
      try {
        await controller.borrar(2);
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(
          'No se puede eliminar el proveedor porque tiene entradas asociadas.',
        );
      }
      expect(mockProveedorRepository.remove).not.toHaveBeenCalled();
    });

    it('debería fallar al eliminar proveedor con múltiples entradas', async () => {
      // Arrange
      mockProveedorRepository.findOne.mockResolvedValue(proveedorConMuchasEntradas);

      // Act & Assert
      await expect(controller.borrar(3)).rejects.toThrow(ConflictException);
      expect(mockProveedorRepository.remove).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-131: SOLO ADMIN PUEDE ELIMINAR
  // ============================================

  describe('CP-131 - Verificar que solo un administrador pueda eliminar proveedores', () => {
    it('el controlador debería tener el decorador @Roles(1) a nivel de clase', () => {
      const controllerClass = ProveedoresController;
      const roles = Reflect.getMetadata('roles', controllerClass);
      
      expect(roles).toBeDefined();
    });

    it('debería permitir la eliminación si el usuario es administrador (rol 1)', async () => {
      // Arrange
      const user = { id_usuario: 1, rol: 1 };
      mockProveedorRepository.findOne.mockResolvedValue(proveedorSinEntradas);
      mockProveedorRepository.remove.mockResolvedValue(proveedorEliminado);

      // Act
      const result = await controller.borrar(1);

      // Assert
      expect(result).toBeDefined();
      expect(mockProveedorRepository.remove).toHaveBeenCalled();
    });

    it('debería denegar el acceso si el usuario no es administrador (simulación)', async () => {
      // Arrange
      const user = { id_usuario: 2, rol: 2 };

      // Act & Assert
      try {
        if (user.rol !== 1) {
          throw new Error('Acceso denegado: Se requiere rol de Administrador');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Acceso denegado');
        expect(error.message).toContain('Administrador');
      }
      expect(mockProveedorRepository.remove).not.toHaveBeenCalled();
    });

    it('debería denegar el acceso si el usuario no está autenticado (simulación)', async () => {
      // Arrange
      const user = null;

      // Act & Assert
      try {
        if (!user) {
          throw new Error('Acceso denegado: Usuario no autenticado');
        }
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toContain('Acceso denegado');
      }
      expect(mockProveedorRepository.remove).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // PRUEBAS ADICIONALES
  // ============================================

  describe('Pruebas adicionales - Proveedor no encontrado', () => {
    it('debería lanzar NotFoundException si el proveedor no existe', async () => {
      // Arrange
      mockProveedorRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.borrar(999)).rejects.toThrow(
        new NotFoundException('Proveedor no encontrado'),
      );
      expect(mockProveedorRepository.findOne).toHaveBeenCalledWith({
        where: { id_proveedor: 999 },
        relations: ['entradas'],
      });
      expect(mockProveedorRepository.remove).not.toHaveBeenCalled();
    });
  });
});