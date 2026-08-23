// test/unit/RF16-Registrar-Proveedor/registrar-proveedor.spec.ts

/**
 * MÓDULO: REGISTRAR PROVEEDOR
 * 
 * Casos de prueba implementados:
 * - CP-106: Verificar registro exitoso de proveedor
 * - CP-108: Verificar campos obligatorios vacíos
 * - CP-109: Verificar información inválida
 * - CP-110: Verificar que solo administrador pueda registrar proveedores
 * - CP-111: Verificar almacenamiento correcto en la base de datos
 */

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ProveedoresService } from '../../../src/proveedores/proveedores.service';
import { ProveedoresController } from '../../../src/proveedores/proveedores.controller';
import { proveedor } from '../../../src/proveedores/proveedores.entity';
import { CreateProveedorDto } from '../../../src/proveedores/dto/create-proveedor.dto';
import {
  proveedorValido,
  proveedorSinNombre,
  proveedorSinContacto,
  proveedorEmailInvalido,
  proveedorTelefonoCorto,
  proveedorRegistrado,
} from './helpers/test-data';

// ============================================
// MOCKS - ACTUALIZADO
// ============================================

const mockQueryBuilder = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  getOne: jest.fn(),
};

const mockProveedorRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder), // ✅ Agregar este método
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Registrar Proveedor - Casos de Prueba', () => {
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
    
    // Resetear mocks antes de cada prueba
    jest.clearAllMocks();
    mockQueryBuilder.getOne.mockReset();
  });

  // ============================================
  // CP-106: REGISTRO EXITOSO DE PROVEEDOR
  // ============================================

  describe('CP-106 - Verificar registro exitoso de proveedor', () => {
    it('debería registrar un proveedor exitosamente con datos válidos', async () => {
      // Arrange
      const createProveedorDto: CreateProveedorDto = {
        nombre: proveedorValido.nombre,
        contacto: proveedorValido.contacto,
        telefono: proveedorValido.telefono,
        email: proveedorValido.email,
        direccion: proveedorValido.direccion,
      };

      // Mock para verificarNombreUnico (no hay duplicado)
      mockQueryBuilder.getOne.mockResolvedValue(null);
      
      mockProveedorRepository.create.mockReturnValue(proveedorRegistrado);
      mockProveedorRepository.save.mockResolvedValue(proveedorRegistrado);

      // Act
      const result = await controller.crear(createProveedorDto);

      // Assert
      expect(mockProveedorRepository.create).toHaveBeenCalledWith(createProveedorDto);
      expect(mockProveedorRepository.save).toHaveBeenCalledWith(proveedorRegistrado);
      expect(result).toEqual(proveedorRegistrado);
      expect(result.id_proveedor).toBe(1);
      expect(result.nombre).toBe(proveedorValido.nombre);
    });

    it('debería registrar un proveedor con todos los campos opcionales vacíos', async () => {
      // Arrange
      const proveedorMinimo = {
        nombre: 'Proveedor Mínimo',
        contacto: '',
        telefono: '',
        email: '',
        direccion: '',
      };

      const proveedorRegistradoMinimo = {
        id_proveedor: 2,
        ...proveedorMinimo,
      };

      // Mock para verificarNombreUnico (no hay duplicado)
      mockQueryBuilder.getOne.mockResolvedValue(null);
      
      mockProveedorRepository.create.mockReturnValue(proveedorRegistradoMinimo);
      mockProveedorRepository.save.mockResolvedValue(proveedorRegistradoMinimo);

      // Act
      const result = await controller.crear(proveedorMinimo);

      // Assert
      expect(result.nombre).toBe('Proveedor Mínimo');
      expect(result.id_proveedor).toBe(2);
    });

    it('debería lanzar ConflictException si el nombre ya existe', async () => {
      // Arrange
      const createProveedorDto: CreateProveedorDto = {
        nombre: 'Vivero El Rosal',
        contacto: 'Juan Pérez',
        telefono: '3001234567',
        email: 'contacto@vivero.com',
        direccion: 'Calle 10 #45-12, Bogotá',
      };

      // Mock: ya existe un proveedor con ese nombre
      mockQueryBuilder.getOne.mockResolvedValue({
        id_proveedor: 1,
        nombre: 'Vivero El Rosal',
      });

      // Act & Assert
      await expect(controller.crear(createProveedorDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.crear(createProveedorDto)).rejects.toThrow(
        `El proveedor con nombre "Vivero El Rosal" ya existe`,
      );
      expect(mockProveedorRepository.save).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-108: CAMPOS OBLIGATORIOS VACÍOS
  // ============================================

  describe('CP-108 - Verificar campos obligatorios vacíos', () => {
    it('debería rechazar el registro si el nombre está vacío', async () => {
      // Arrange
      const dto = plainToClass(CreateProveedorDto, {
        nombre: proveedorSinNombre.nombre,
        contacto: proveedorSinNombre.contacto,
        telefono: proveedorSinNombre.telefono,
        email: proveedorSinNombre.email,
        direccion: proveedorSinNombre.direccion,
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nombre');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      expect(mockProveedorRepository.save).not.toHaveBeenCalled();
    });

    it('debería rechazar el registro si el nombre es muy corto', async () => {
      // Arrange
      const dto = plainToClass(CreateProveedorDto, {
        nombre: 'Ab',
        contacto: 'Juan Pérez',
        telefono: '3001234567',
        email: 'contacto@vivero.com',
        direccion: 'Calle 10 #45-12, Bogotá',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nombre');
      expect(errors[0].constraints).toHaveProperty('isLength');
      expect(mockProveedorRepository.save).not.toHaveBeenCalled();
    });

    it('debería permitir el registro si el contacto está vacío (es opcional)', async () => {
      // Arrange
      const dto = plainToClass(CreateProveedorDto, {
        nombre: 'Proveedor Sin Contacto',
        contacto: proveedorSinContacto.contacto,
        telefono: '3001234567',
        email: 'contacto@vivero.com',
        direccion: 'Calle 10 #45-12, Bogotá',
      });

      // Mock para verificarNombreUnico (no hay duplicado)
      mockQueryBuilder.getOne.mockResolvedValue(null);
      
      const proveedorSinContactoRegistrado = {
        id_proveedor: 3,
        ...dto,
      };

      mockProveedorRepository.create.mockReturnValue(proveedorSinContactoRegistrado);
      mockProveedorRepository.save.mockResolvedValue(proveedorSinContactoRegistrado);

      // Act
      const result = await controller.crear(dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.nombre).toBe('Proveedor Sin Contacto');
      expect(result.contacto).toBe('');
    });
  });

  // ============================================
  // CP-109: INFORMACIÓN INVÁLIDA
  // ============================================

  describe('CP-109 - Verificar información inválida', () => {
    it('debería rechazar el registro si el email tiene formato inválido', async () => {
      // Arrange
      const dto = plainToClass(CreateProveedorDto, {
        nombre: proveedorEmailInvalido.nombre,
        contacto: proveedorEmailInvalido.contacto,
        telefono: proveedorEmailInvalido.telefono,
        email: proveedorEmailInvalido.email,
        direccion: proveedorEmailInvalido.direccion,
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
      expect(errors[0].constraints).toHaveProperty('isEmail');
      expect(mockProveedorRepository.save).not.toHaveBeenCalled();
    });

    it('debería rechazar el registro si el teléfono es demasiado corto', async () => {
      // Arrange
      const dto = plainToClass(CreateProveedorDto, {
        nombre: proveedorTelefonoCorto.nombre,
        contacto: proveedorTelefonoCorto.contacto,
        telefono: proveedorTelefonoCorto.telefono,
        email: proveedorTelefonoCorto.email,
        direccion: proveedorTelefonoCorto.direccion,
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('telefono');
      expect(errors[0].constraints).toHaveProperty('isLength');
      expect(mockProveedorRepository.save).not.toHaveBeenCalled();
    });

    it('debería rechazar el registro si el nombre contiene números', async () => {
      // Arrange
      const dto = plainToClass(CreateProveedorDto, {
        nombre: 'Vivero 123',
        contacto: 'Juan Pérez',
        telefono: '3001234567',
        email: 'contacto@vivero.com',
        direccion: 'Calle 10 #45-12, Bogotá',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nombre');
      expect(errors[0].constraints).toHaveProperty('matches');
      expect(mockProveedorRepository.save).not.toHaveBeenCalled();
    });

    it('debería rechazar el registro si el nombre contiene caracteres especiales', async () => {
      // Arrange
      const dto = plainToClass(CreateProveedorDto, {
        nombre: 'Vivero@ElRosal',
        contacto: 'Juan Pérez',
        telefono: '3001234567',
        email: 'contacto@vivero.com',
        direccion: 'Calle 10 #45-12, Bogotá',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nombre');
      expect(errors[0].constraints).toHaveProperty('matches');
      expect(mockProveedorRepository.save).not.toHaveBeenCalled();
    });

    it('debería rechazar el registro si el teléfono contiene letras', async () => {
      // Arrange
      const dto = plainToClass(CreateProveedorDto, {
        nombre: 'Vivero El Rosal',
        contacto: 'Juan Pérez',
        telefono: '300ABC4567',
        email: 'contacto@vivero.com',
        direccion: 'Calle 10 #45-12, Bogotá',
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('telefono');
      expect(errors[0].constraints).toHaveProperty('matches');
      expect(mockProveedorRepository.save).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-110: SOLO ADMIN PUEDE REGISTRAR PROVEEDORES
  // ============================================

  describe('CP-110 - Verificar que solo un administrador pueda registrar proveedores', () => {
    it('el controlador debería tener el decorador @Roles(1) a nivel de clase', () => {
      const controllerClass = ProveedoresController;
      const roles = Reflect.getMetadata('roles', controllerClass);
      
      expect(roles).toBeDefined();
      expect(roles).toEqual([1]);
    });

    it('debería permitir el registro si el usuario es administrador (rol 1)', async () => {
      // Arrange
      const createProveedorDto: CreateProveedorDto = {
        nombre: proveedorValido.nombre,
        contacto: proveedorValido.contacto,
        telefono: proveedorValido.telefono,
        email: proveedorValido.email,
        direccion: proveedorValido.direccion,
      };

      // Mock para verificarNombreUnico (no hay duplicado)
      mockQueryBuilder.getOne.mockResolvedValue(null);
      
      mockProveedorRepository.create.mockReturnValue(proveedorRegistrado);
      mockProveedorRepository.save.mockResolvedValue(proveedorRegistrado);

      // Act
      const result = await controller.crear(createProveedorDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.nombre).toBe(proveedorValido.nombre);
    });

    // Nota: Las pruebas de denegación de acceso deberían probarse a nivel de guard
    // pero podemos verificar que el decorador está presente
  });

  // ============================================
  // CP-111: ALMACENAMIENTO EN BASE DE DATOS
  // ============================================

  describe('CP-111 - Verificar almacenamiento correcto en la base de datos', () => {
    it('debería guardar el proveedor correctamente en la base de datos', async () => {
      // Arrange
      const createProveedorDto: CreateProveedorDto = {
        nombre: 'Proveedor Test',
        contacto: 'Contacto Test',
        telefono: '3111111111',
        email: 'test@proveedor.com',
        direccion: 'Calle Test #123',
      };

      const proveedorGuardado = {
        id_proveedor: 10,
        ...createProveedorDto,
      };

      // Mock para verificarNombreUnico (no hay duplicado)
      mockQueryBuilder.getOne.mockResolvedValue(null);
      
      mockProveedorRepository.create.mockReturnValue(proveedorGuardado);
      mockProveedorRepository.save.mockResolvedValue(proveedorGuardado);

      // Act
      const result = await controller.crear(createProveedorDto);

      // Assert
      expect(mockProveedorRepository.save).toHaveBeenCalled();
      expect(result.id_proveedor).toBe(10);
      expect(result.nombre).toBe(createProveedorDto.nombre);
      expect(result.email).toBe(createProveedorDto.email);
    });

    it('debería persistir todos los campos en la base de datos', async () => {
      // Arrange
      const createProveedorDto: CreateProveedorDto = {
        nombre: 'Persistencia Test',
        contacto: 'Maria Gómez',
        telefono: '3102222222',
        email: 'maria@test.com',
        direccion: 'Av. Test #456',
      };

      const proveedorGuardado = {
        id_proveedor: 11,
        ...createProveedorDto,
      };

      // Mock para verificarNombreUnico (no hay duplicado)
      mockQueryBuilder.getOne.mockResolvedValue(null);
      
      mockProveedorRepository.create.mockReturnValue(proveedorGuardado);
      mockProveedorRepository.save.mockResolvedValue(proveedorGuardado);

      // Act
      const result = await controller.crear(createProveedorDto);

      // Assert
      expect(result).toMatchObject({
        id_proveedor: 11,
        nombre: 'Persistencia Test',
        contacto: 'Maria Gómez',
        telefono: '3102222222',
        email: 'maria@test.com',
        direccion: 'Av. Test #456',
      });
    });

    it('debería verificar que el proveedor se guarda con la fecha de creación', async () => {
      // Arrange
      const createProveedorDto: CreateProveedorDto = {
        nombre: 'Proveedor Con Fecha',
        contacto: 'Juan Pérez',
        telefono: '3001234567',
        email: 'contacto@vivero.com',
        direccion: 'Calle 10 #45-12, Bogotá',
      };

      const proveedorConFecha = {
        id_proveedor: 12,
        ...createProveedorDto,
        fecha_creacion: new Date(),
      };

      // Mock para verificarNombreUnico (no hay duplicado)
      mockQueryBuilder.getOne.mockResolvedValue(null);
      
      mockProveedorRepository.create.mockReturnValue(proveedorConFecha);
      mockProveedorRepository.save.mockResolvedValue(proveedorConFecha);

      // Act
      const result = await controller.crear(createProveedorDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id_proveedor).toBe(12);
      expect(result.fecha_creacion).toBeDefined();
      expect(result.fecha_creacion).toBeInstanceOf(Date);
    });
  });
});