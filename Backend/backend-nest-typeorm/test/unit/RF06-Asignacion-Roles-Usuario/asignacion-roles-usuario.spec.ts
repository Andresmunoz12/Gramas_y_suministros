// test/unit/RF06-Asignacion-Roles-Usuario/asignacion-roles-usuario.spec.ts

/**
 * MÓDULO: ASIGNACIÓN DE ROLES DE USUARIO
 * 
 * Casos de prueba:
 * - CP-039: Verificar que verificar asignación automática del rol Cliente (2).
 * - CP-040: Verificar que verificar que un usuario sin permisos no pueda asignar el rol Administrador.
 * - CP-041: Verificar que verificar asignación de rol realizada por un administrador.
 * - CP-042: Verificar que verificar almacenamiento correcto del rol en la base de datos.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { getMetadataArgsStorage } from 'typeorm';
import { validate } from 'class-validator';
import { UsuariosController } from '../../../src/Usuarios/usuarios.controller';
import { UsuariosService } from '../../../src/Usuarios/usuarios.service';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { CreateUsuarioDto } from '../../../src/Usuarios/dto/create-usurio-dto';
import { UpdateUsuarioDto } from '../../../src/Usuarios/dto/update-usuario.dto';
import { ROLES_KEY } from '../../../src/auth/decorators/roles.decorator';
import { mockRolCliente, mockRolAdmin, mockUserCreationData, mockUserSavedRecord } from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockUserRepository = {
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Asignación de Roles de Usuario - Casos de Prueba', () => {
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
  // CP-039: ASIGNACIÓN AUTOMÁTICA DEL ROL CLIENTE
  // ============================================

  describe('CP-039 - Verificar que verificar asignación automática del rol Cliente', () => {
    it('debería registrar al usuario con el rol de Cliente (2) por defecto si es enviado', async () => {
      // Arrange
      mockUserRepository.create.mockImplementation((dto) => dto);
      mockUserRepository.save.mockResolvedValue(mockUserSavedRecord);

      // Act
      const result = await controller.crearUsuario(mockUserCreationData);

      // Assert
      expect(result).toBeDefined();
      expect(result.id_rol).toBe(2); // Rol de Cliente
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id_rol: 2,
        })
      );
    });
  });

  // ============================================
  // CP-040: RESTRICCIÓN DE ASIGNACIÓN SIN PERMISOS (ROL ADMIN)
  // ============================================

  describe('CP-040 - Verificar que un usuario sin permisos no pueda realizar acciones de Administrador', () => {
    it('debería validar que listar todos los usuarios requiera explícitamente rol de Administrador (1)', () => {
      // Act
      const roles = Reflect.getMetadata(ROLES_KEY, controller.listarTodos);

      // Assert
      expect(roles).toBeDefined();
      expect(roles).toEqual([1]); // Únicamente Administrador
    });

    it('debería validar que eliminar un usuario requiera únicamente rol de Administrador (1)', () => {
      // Act
      const roles = Reflect.getMetadata(ROLES_KEY, controller.eliminar);

      // Assert
      expect(roles).toBeDefined();
      expect(roles).toEqual([1]);
    });
  });

  // ============================================
  // CP-041: ASIGNACIÓN DE ROL POR UN ADMINISTRADOR
  // ============================================

  describe('CP-041 - Verificar que verificar asignación de rol realizada por un administrador', () => {
    it('debería permitir cambiar el rol del usuario si la acción proviene de un administrador autorizado', async () => {
      // Arrange
      mockUserRepository.update.mockResolvedValue({ affected: 1 });
      const adminUpdateData: UpdateUsuarioDto = {
        id_rol: 1, // Cambiando a Administrador
      };

      // Act
      const result = await controller.actualizar(15, adminUpdateData);

      // Assert
      expect(result).toEqual({
        mensaje: 'Usuario actualizado con éxito',
        actualizado: true,
      });
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        15,
        expect.objectContaining({
          rol: { id_rol: 1 },
        })
      );
    });
  });

  // ============================================
  // CP-042: ALMACENAMIENTO CORRECTO EN BASE DE DATOS
  // ============================================

  describe('CP-042 - Verificar almacenamiento correcto del rol en la base de datos', () => {
    it('debería verificar que el campo id_rol existe en los metadatos de la entidad usuario', () => {
      // Act
      const columns = getMetadataArgsStorage().columns.filter(
        (col) => col.target === usuario
      );
      const idRolCol = columns.find((col) => col.propertyName === 'id_rol');

      // Assert
      expect(idRolCol).toBeDefined();
      expect(idRolCol?.options.name).toBe('id_rol');
    });
  });
});
