// test/unit/RF03-Restablecer-Contrasena/restablecer-contrasena.spec.ts

/**
 * MÓDULO: RESTABLECER CONTRASEÑA
 * 
 * Casos de prueba:
 * - CP-016: Verificar envío exitoso del código de verificación.
 * - CP-017: Verificar que correo electrónico no registrado.
 * - CP-018: Verificar que código de verificación incorrecto.
 * - CP-019: Verificar que código de verificación expirado/ya usado.
 * - CP-020: Verificar correo electrónico en blanco.
 * - CP-021: Verificar que contraseña que no cumple con los requisitos.
 * - CP-022: Verificar que restablecimiento exitoso de la contraseña.
 * - CP-023: Verificar que verificar cifrado de la contraseña.
 * - CP-024: Verificar que código de verificación llegó al destinatario.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { MailerService } from '@nestjs-modules/mailer';
import { AuthController } from '../../../src/password-resets/password-resets.controller';
import { AuthService } from '../../../src/password-resets/password-resets.service';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { PasswordReset } from '../../../src/password-resets/password-resets.entity';
import { SolicitarCodigoDto } from '../../../src/password-resets/dto/Solicitar-codigo.dto';
import { RestablecerPasswordDto } from '../../../src/password-resets/dto/reset-password.dto';
import * as bcrypt from 'bcryptjs';
import { mockUserRecord, mockResetRecord } from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
};

const mockResetRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
};

const mockMailerService = {
  sendMail: jest.fn().mockResolvedValue({ messageId: '123' }),
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Restablecer Contraseña - Casos de Prueba', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(usuario),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(PasswordReset),
          useValue: mockResetRepository,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
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
  // CP-016: ENVÍO EXITOSO DE CÓDIGO
  // ============================================

  describe('CP-016 - Verificar envío exitoso del código de verificación', () => {
    it('debería procesar la solicitud con éxito si el correo está registrado', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUserRecord);
      mockResetRepository.create.mockImplementation((dto) => dto);
      mockResetRepository.save.mockResolvedValue(mockResetRecord);

      // Act
      const result = await controller.solicitarCodigo({ email: 'prueba@gmail.com' });

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Código enviado con éxito al correo');
      expect(mockResetRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'prueba@gmail.com',
          usado: 0,
        })
      );
    });
  });

  // ============================================
  // CP-017: CORREO ELECTRÓNICO NO REGISTRADO
  // ============================================

  describe('CP-017 - Verificar que correo electrónico no registrado', () => {
    it('debería lanzar NotFoundException si el correo no existe en la base de datos', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.solicitarCodigo({ email: 'no_existe@test.com' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ============================================
  // CP-018: CÓDIGO DE VERIFICACIÓN INCORRECTO
  // ============================================

  describe('CP-018 - Verificar que código de verificación incorrecto', () => {
    it('debería lanzar BadRequestException si el código no coincide con ningún registro', async () => {
      // Arrange
      mockResetRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.restablecerPassword({
          codigo_verificacion: '999999',
          nueva_password: 'newValidPassword123',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // CP-019: CÓDIGO DE VERIFICACIÓN EXPIRADO / YA USADO
  // ============================================

  describe('CP-019 - Verificar que código de verificación expirado o usado', () => {
    it('debería lanzar BadRequestException si el código ya fue marcado como usado', async () => {
      // Arrange
      // Si el código ya fue usado, findOne({ where: { codigo, usado: 0 } }) no devolverá nada
      mockResetRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(
        controller.restablecerPassword({
          codigo_verificacion: '123456',
          nueva_password: 'newValidPassword123',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // CP-020: CORREO ELECTRÓNICO EN BLANCO
  // ============================================

  describe('CP-020 - Verificar correo electrónico en blanco', () => {
    it('debería fallar la validación si el email está vacío', async () => {
      // Arrange
      const dto = new SolicitarCodigoDto();
      dto.email = '';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(Object.values(errors[0].constraints || {})).toContain('El correo es obligatorio');
    });
  });

  // ============================================
  // CP-021: CONTRASEÑA NO CUMPLE CON REQUISITOS
  // ============================================

  describe('CP-021 - Verificar que contraseña que no cumple con los requisitos', () => {
    it('debería fallar la validación si la contraseña tiene menos de 8 caracteres', async () => {
      // Arrange
      const dto = new RestablecerPasswordDto();
      dto.codigo_verificacion = '123456';
      dto.nueva_password = '123';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nueva_password');
      expect(Object.values(errors[0].constraints || {})).toContain(
        'La nueva contraseña debe tener al menos 8 caracteres'
      );
    });
  });

  // ============================================
  // CP-022: RESTABLECIMIENTO EXITOSO DE LA CONTRASEÑA
  // ============================================

  describe('CP-022 - Verificar que restablecimiento exitoso de la contraseña', () => {
    it('debería actualizar la contraseña del usuario y marcar el código como usado', async () => {
      // Arrange
      mockResetRepository.findOne.mockResolvedValue(mockResetRecord);
      mockUserRepository.findOne.mockResolvedValue(mockUserRecord);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_new_password_123');

      // Act
      const result = await controller.restablecerPassword({
        codigo_verificacion: '123456',
        nueva_password: 'newValidPassword123',
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.message).toBe('Contraseña actualizada correctamente');
      expect(mockUserRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockUserRecord.email,
          passwordHash: 'hashed_new_password_123',
        })
      );
      expect(mockResetRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          codigo: '123456',
          usado: 1,
        })
      );
    });
  });

  // ============================================
  // CP-023: CIFRADO DE LA CONTRASEÑA
  // ============================================

  describe('CP-023 - Verificar que verificar cifrado de la contraseña', () => {
    it('debería llamar a bcrypt.hash para cifrar la nueva contraseña con salt de factor 10', async () => {
      // Arrange
      mockResetRepository.findOne.mockResolvedValue(mockResetRecord);
      mockUserRepository.findOne.mockResolvedValue(mockUserRecord);

      // Act
      await controller.restablecerPassword({
        codigo_verificacion: '123456',
        nueva_password: 'newValidPassword123',
      });

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('newValidPassword123', 10);
    });
  });

  // ============================================
  // CP-024: EL CÓDIGO LLEGÓ AL DESTINATARIO (COMPROBACIÓN DE MAILER)
  // ============================================

  describe('CP-024 - Verificar que código de verificación llegó al destinatario', () => {
    it('debería enviar el correo electrónico con el código de verificación generado al destinatario', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(mockUserRecord);
      mockResetRepository.create.mockImplementation((dto) => dto);
      mockResetRepository.save.mockResolvedValue(mockResetRecord);

      // Act
      await controller.solicitarCodigo({ email: 'prueba@gmail.com' });

      // Assert
      expect(mockMailerService.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'prueba@gmail.com',
          subject: 'Tu código de recuperación - Gramas y Suministros',
          html: expect.stringContaining('Verificación de Identidad'),
        })
      );
    });
  });
});
