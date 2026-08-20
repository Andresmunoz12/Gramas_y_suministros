// test/unit/RF02-Iniciar-Sesion-Autenticacion/iniciar-sesion-autenticacion.spec.ts

/**
 * MÓDULO: INICIAR SESIÓN / AUTENTICACIÓN DE USUARIOS
 * 
 * Casos de prueba:
 * - CP-009: Verificar que inicio de sesión exitoso.
 * - CP-010: Verificar que credenciales incorrectas.
 * - CP-011: Verificar que campos obligatorios vacíos.
 * - CP-012: Verificar que correo no registrado.
 * - CP-013: Verificar creación de sesión.
 * - CP-014: Verificar actualización de la última sesión.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { validate } from 'class-validator';
import { AuthController } from '../../../src/auth/auth.controller';
import { AuthService } from '../../../src/auth/auth.service';
import { UsuariosService } from '../../../src/Usuarios/usuarios.service';
import { JwtService } from '@nestjs/jwt';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { LoginDto } from '../../../src/auth/dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { mockUserRecord, validLoginDto } from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

const mockUsuariosService = {
  findByEmailWithPassword: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mocked-jwt-token'),
};

const mockUserRepository = {
  update: jest.fn().mockResolvedValue({ affected: 1 }),
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Iniciar Sesión / Autenticación de Usuarios - Casos de Prueba', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: UsuariosService,
          useValue: mockUsuariosService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: getRepositoryToken(usuario),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CP-009: INICIO DE SESIÓN EXITOSO
  // ============================================

  describe('CP-009 - Verificar que inicio de sesión exitoso', () => {
    it('debería procesar la solicitud con credenciales correctas y retornar la sesión', async () => {
      // Arrange
      mockUsuariosService.findByEmailWithPassword.mockResolvedValue(mockUserRecord);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await controller.login(validLoginDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.access_token).toBe('mocked-jwt-token');
      expect(result.user.email).toBe(mockUserRecord.email);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUserRecord.passwordHash);
    });
  });

  // ============================================
  // CP-010: CREDENCIALES INCORRECTAS
  // ============================================

  describe('CP-010 - Verificar que credenciales incorrectas', () => {
    it('debería rechazar la solicitud si la contraseña es incorrecta', async () => {
      // Arrange
      mockUsuariosService.findByEmailWithPassword.mockResolvedValue(mockUserRecord);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        controller.login({
          email: 'prueba@gmail.com',
          password_hash: 'wrongpassword',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ============================================
  // CP-011: CAMPOS OBLIGATORIOS VACÍOS
  // ============================================

  describe('CP-011 - Verificar que campos obligatorios vacíos', () => {
    it('debería fallar la validación del DTO si el email está vacío', async () => {
      // Arrange
      const dto = new LoginDto();
      dto.email = '';
      dto.password_hash = 'password123';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('debería fallar la validación del DTO si el email no es válido', async () => {
      // Arrange
      const dto = new LoginDto();
      dto.email = 'not-an-email';
      dto.password_hash = 'password123';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('debería lanzar BadRequestException si no se envía password_hash en la petición', async () => {
      // Act & Assert
      await expect(
        controller.login({
          email: 'prueba@gmail.com',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // CP-012: CORREO NO REGISTRADO
  // ============================================

  describe('CP-012 - Verificar que correo no registrado', () => {
    it('debería rechazar la solicitud lanzando UnauthorizedException si el email no existe', async () => {
      // Arrange
      mockUsuariosService.findByEmailWithPassword.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.login({
          email: 'notregistered@gmail.com',
          password_hash: 'password123',
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ============================================
  // CP-013: CREACIÓN DE SESIÓN (JWT E INFORMACIÓN DE USUARIO)
  // ============================================

  describe('CP-013 - Verificar creación de sesión', () => {
    it('debería retornar el token JWT y el perfil básico del usuario autenticado', async () => {
      // Arrange
      mockUsuariosService.findByEmailWithPassword.mockResolvedValue(mockUserRecord);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await controller.login(validLoginDto);

      // Assert
      expect(result).toEqual({
        access_token: 'mocked-jwt-token',
        user: {
          id: mockUserRecord.id_usuario,
          nombre: mockUserRecord.nombre,
          email: mockUserRecord.email,
          id_rol: mockUserRecord.id_rol,
        },
      });
    });
  });

  // ============================================
  // CP-014: ACTUALIZACIÓN DE LA ÚLTIMA SESIÓN
  // ============================================

  describe('CP-014 - Verificar actualización de la última sesión', () => {
    it('debería actualizar el campo ultimoLogin en la base de datos para el usuario logueado', async () => {
      // Arrange
      mockUsuariosService.findByEmailWithPassword.mockResolvedValue(mockUserRecord);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      // Act
      await controller.login(validLoginDto);

      // Assert
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUserRecord.id_usuario,
        expect.objectContaining({
          ultimoLogin: expect.any(Date),
        })
      );
    });
  });
});
