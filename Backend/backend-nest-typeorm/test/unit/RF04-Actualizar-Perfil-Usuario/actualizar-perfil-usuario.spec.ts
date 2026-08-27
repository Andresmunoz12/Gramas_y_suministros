/**
 * MÓDULO: ACTUALIZAR PERFIL DE USUARIO
 * 
 * Casos de prueba:
 * - CP-026: Verificar que actualización exitosa del perfil.
 * - CP-027: Verificar que campos obligatorios vacíos.
 * - CP-028: Verificar que información con formato inválido.
 * - CP-029: Verificar que correo electrónico duplicado.
 * - CP-030: Verificar actualización en la base de datos.
 * - CP-031: Verificar que verificar que solo el usuario autenticado pueda modificar su perfil.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { UsuariosController } from '../../../src/Usuarios/usuarios.controller';
import { UsuariosService } from '../../../src/Usuarios/usuarios.service';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { UpdateUsuarioDto } from '../../../src/Usuarios/dto/update-usuario.dto';
import { ROLES_KEY } from '../../../src/auth/decorators/roles.decorator';
import { Public } from '../../../src/auth/decorators/public.decorator';
import { mockUserRecord, mockUpdatedUserRecord } from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockUserRepository = {
  update: jest.fn(),
  findOne: jest.fn(), // 👈 AGREGADO
  save: jest.fn(),    // 👈 AGREGADO
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Actualizar Perfil de Usuario - Casos de Prueba', () => {
  let controller: UsuariosController;
  let service: UsuariosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsuariosController],
      providers: [
        UsuariosService,
        {
          provide: getRepositoryToken(usuario),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    controller = module.get<UsuariosController>(UsuariosController);
    service = module.get<UsuariosService>(UsuariosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CP-026: ACTUALIZACIÓN EXITOSA DEL PERFIL
  // ============================================

  describe('CP-026 - Verificar que actualización exitosa del perfil', () => {
    it('debería retornar un mensaje de éxito cuando los parámetros de actualización sean correctos', async () => {
      // Arrange
      const mockUser = {
        id_usuario: 5,
        nombre: 'Andres Felipe',
        apellido: 'Muñoz',
        email: 'andres@gramas.com',
        id_rol: 2,
        passwordHash: 'hashed',
        estado: 'activo',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        nombre: 'Andres Modificado',
        apellido: 'Muñoz Lombana',
        email: 'andres.new@gramas.com',
      });

      const updateDto: UpdateUsuarioDto = {
        nombre: 'Andres Modificado',
        apellido: 'Muñoz Lombana',
        email: 'andres.new@gramas.com',
      };

      // Act
      const result = await controller.actualizar(5, updateDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.actualizado).toBe(true);
      expect(result.mensaje).toBe('Usuario actualizado con éxito');
      expect(result.nombre).toBe('Andres Modificado');
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id_usuario: 5 }
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-027: CAMPOS OBLIGATORIOS VACÍOS
  // ============================================

  describe('CP-027 - Verificar que campos obligatorios vacíos', () => {
    it('debería fallar la validación si se envía un campo obligatorio con valor vacío', async () => {
      // Arrange
      const dto = new UpdateUsuarioDto();
      dto.nombre = '';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nombre');
    });
  });

  // ============================================
  // CP-028: INFORMACIÓN CON FORMATO INVÁLIDO
  // ============================================

  describe('CP-028 - Verificar que información con formato inválido', () => {
    it('debería fallar la validación si el email tiene un formato incorrecto', async () => {
      // Arrange
      const dto = new UpdateUsuarioDto();
      dto.email = 'not-a-valid-email';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });
  });

  // ============================================
  // CP-029: CORREO ELECTRÓNICO DUPLICADO
  // ============================================

  describe('CP-029 - Verificar que correo electrónico duplicado', () => {
    it('debería lanzar un error de la base de datos si el correo ya está registrado por otro usuario', async () => {
      // Arrange
      const mockUser = {
        id_usuario: 5,
        nombre: 'Andres',
        apellido: 'Muñoz',
        email: 'andres@gramas.com',
        id_rol: 2,
        passwordHash: 'hashed',
        estado: 'activo',
      };

      // 👈 AGREGAR MOCK DE findOne (primero encuentra el usuario)
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      // Simulamos que la base de datos lanza un error de llave duplicada
      mockUserRepository.save.mockRejectedValue(new Error('duplicate key value violates unique constraint'));

      const updateDto: UpdateUsuarioDto = {
        email: 'duplicado@gramas.com',
      };

      // Act & Assert
      await expect(
        controller.actualizar(5, updateDto)
      ).rejects.toThrow('duplicate key');
    });
  });

  // ============================================
  // CP-030: ACTUALIZACIÓN EN LA BASE DE DATOS
  // ============================================

  describe('CP-030 - Verificar actualización en la base de datos', () => {
    it('debería ejecutar el query de actualización con el ID y valores correctos', async () => {
      // Arrange
      const mockUser = {
        id_usuario: 5,
        nombre: 'Andres',
        apellido: 'Muñoz',
        email: 'andres@gramas.com',
        id_rol: 2,
        passwordHash: 'hashed',
        estado: 'activo',
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        nombre: 'Nuevo Nombre',
        email: 'nuevo@correo.com',
      });

      const updateDto: UpdateUsuarioDto = {
        nombre: 'Nuevo Nombre',
        email: 'nuevo@correo.com',
      };

      // Act
      await controller.actualizar(5, updateDto);

      // Assert
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id_usuario: 5 }
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          nombre: 'Nuevo Nombre',
          email: 'nuevo@correo.com',
        })
      );
    });
  });

  // ============================================
  // CP-031: CONTROL DE AUTENTICACIÓN Y PERMISOS
  // ============================================

  describe('CP-031 - Verificar que solo el usuario autenticado pueda modificar su perfil', () => {
    it('debería validar que la ruta de actualización requiera rol de Cliente (2) o Administrador (1)', () => {
      // Act
      const roles = Reflect.getMetadata(ROLES_KEY, controller.actualizar);

      // Assert
      expect(roles).toBeDefined();
      expect(roles).toContain(2);
      expect(roles).toContain(1);
    });

    it('debería estar protegida por defecto sin poseer el decorador Public', () => {
      // Act
      const isPublic = Reflect.getMetadata('isPublic', controller.actualizar);

      // Assert
      expect(isPublic).toBeUndefined();
    });
  });
});