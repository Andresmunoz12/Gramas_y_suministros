// test/unit/RF04-Actualizar-Perfil-Usuario/actualizar-perfil-usuario.spec.ts

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
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      const updateDto: UpdateUsuarioDto = {
        nombre: 'Andres Modificado',
        apellido: 'Muñoz Lombana',
        email: 'andres.new@gramas.com',
      };

      // Act
      const result = await controller.actualizar(5, updateDto);

      // Assert
      expect(result).toEqual({
        mensaje: 'Usuario actualizado con éxito',
        actualizado: true,
      });
    });
  });

  // ============================================
  // CP-027: CAMPOS OBLIGATORIOS VACÍOS
  // ============================================

  describe('CP-027 - Verificar que campos obligatorios vacíos', () => {
    it('debería fallar la validación si se envía un campo obligatorio con valor vacío', async () => {
      // Arrange
      const dto = new UpdateUsuarioDto();
      dto.nombre = ''; // nombre no puede estar vacío si se envía

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
      // Simulamos que la base de datos lanza un error de llave duplicada (ej. código 23505 de PostgreSQL)
      mockUserRepository.update.mockRejectedValue(new Error('duplicate key value violates unique constraint'));
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
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      const updateDto: UpdateUsuarioDto = {
        nombre: 'Nuevo Nombre',
        email: 'nuevo@correo.com',
      };

      // Act
      await controller.actualizar(5, updateDto);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        5,
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
      expect(roles).toContain(2); // Cliente
      expect(roles).toContain(1); // Administrador
    });

    it('debería estar protegida por defecto sin poseer el decorador Public', () => {
      // Act
      const isPublic = Reflect.getMetadata('isPublic', controller.actualizar);

      // Assert
      expect(isPublic).toBeUndefined(); // Por lo tanto, requiere autenticación mediante el guard global
    });
  });
});
