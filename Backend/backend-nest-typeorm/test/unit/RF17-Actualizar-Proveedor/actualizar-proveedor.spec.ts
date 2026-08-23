// test/unit/RF17-Actualizar-Proveedor/actualizar-proveedor.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ProveedoresService } from '../../../src/proveedores/proveedores.service';
import { ProveedoresController } from '../../../src/proveedores/proveedores.controller';
import { proveedor } from '../../../src/proveedores/proveedores.entity';
import { UpdateProveedorDto } from '../../../src/proveedores/dto/update-proveedor.dto';
import {
  proveedorExistente,
  proveedorActualizadoValido,
  actualizarNombre,
  actualizarContacto,
  actualizarTelefono,
  proveedorNombreVacio,
  proveedorEmailInvalido,
  proveedorTelefonoCorto,
  proveedorTelefonoConLetras,
  proveedorNombreConNumeros,
  proveedorNombreConSimbolos,
  proveedorNombreCorto,
  proveedorActualizado,
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
  update: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => mockQueryBuilder),
};

// ============================================
// CONFIGURACIÓN DE PRUEBAS
// ============================================

describe('Actualizar Proveedor - Casos de Prueba', () => {
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
  // CP-113: ACTUALIZACIÓN EXITOSA
  // ============================================

  describe('CP-113 - Verificar actualización exitosa del proveedor', () => {
    it('debería actualizar un proveedor exitosamente con datos válidos', async () => {
      // Arrange
      const updateProveedorDto: UpdateProveedorDto = {
        nombre: proveedorActualizadoValido.nombre,
        contacto: proveedorActualizadoValido.contacto,
        telefono: proveedorActualizadoValido.telefono,
        email: proveedorActualizadoValido.email,
        direccion: proveedorActualizadoValido.direccion,
      };

      // Mock para verificarNombreUnico (no hay duplicado)
      mockQueryBuilder.getOne.mockResolvedValue(null);
      
      // Primera llamada a findOne: obtener el proveedor existente
      mockProveedorRepository.findOne
        .mockResolvedValueOnce(proveedorExistente) // Para verificar existencia
        .mockResolvedValueOnce(proveedorActualizado); // Para devolver actualizado
      
      mockProveedorRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      const result = await controller.actualizar(1, updateProveedorDto);

      // Assert
      expect(mockProveedorRepository.findOne).toHaveBeenCalledTimes(2);
      expect(mockProveedorRepository.update).toHaveBeenCalledWith(1, updateProveedorDto);
      expect(result).toEqual(proveedorActualizado);
      expect(result.nombre).toBe(proveedorActualizadoValido.nombre);
    });

    it('debería actualizar solo el nombre del proveedor', async () => {
      // Arrange
      const updateProveedorDto: UpdateProveedorDto = {
        nombre: actualizarNombre.nombre,
      };

      const proveedorConNombreActualizado = {
        ...proveedorExistente,
        nombre: actualizarNombre.nombre,
      };

      // Mock para verificarNombreUnico (nombre diferente, no duplicado)
      mockQueryBuilder.getOne.mockResolvedValue(null);
      
      mockProveedorRepository.findOne
        .mockResolvedValueOnce(proveedorExistente)
        .mockResolvedValueOnce(proveedorConNombreActualizado);
      
      mockProveedorRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      const result = await controller.actualizar(1, updateProveedorDto);

      // Assert
      expect(result.nombre).toBe(actualizarNombre.nombre);
      expect(result.contacto).toBe(proveedorExistente.contacto);
    });

    it('debería actualizar solo el contacto del proveedor', async () => {
      // Arrange
      const updateProveedorDto: UpdateProveedorDto = {
        contacto: actualizarContacto.contacto,
      };

      const proveedorConContactoActualizado = {
        ...proveedorExistente,
        contacto: actualizarContacto.contacto,
      };

      // Mock para verificarNombreUnico (no se verifica porque no se actualiza nombre)
      mockQueryBuilder.getOne.mockResolvedValue(null);
      
      mockProveedorRepository.findOne
        .mockResolvedValueOnce(proveedorExistente)
        .mockResolvedValueOnce(proveedorConContactoActualizado);
      
      mockProveedorRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      const result = await controller.actualizar(1, updateProveedorDto);

      // Assert
      expect(result.contacto).toBe(actualizarContacto.contacto);
      expect(result.nombre).toBe(proveedorExistente.nombre);
    });

    it('debería actualizar solo el teléfono del proveedor', async () => {
      // Arrange
      const updateProveedorDto: UpdateProveedorDto = {
        telefono: actualizarTelefono.telefono,
      };

      const proveedorConTelefonoActualizado = {
        ...proveedorExistente,
        telefono: actualizarTelefono.telefono,
      };

      // Mock para verificarNombreUnico (no se verifica porque no se actualiza nombre)
      mockQueryBuilder.getOne.mockResolvedValue(null);
      
      mockProveedorRepository.findOne
        .mockResolvedValueOnce(proveedorExistente)
        .mockResolvedValueOnce(proveedorConTelefonoActualizado);
      
      mockProveedorRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      const result = await controller.actualizar(1, updateProveedorDto);

      // Assert
      expect(result.telefono).toBe(actualizarTelefono.telefono);
    });
  });

  // ============================================
  // CP-114: CAMPOS OBLIGATORIOS VACÍOS
  // ============================================

  describe('CP-114 - Verificar campos obligatorios vacíos', () => {
    it('debería rechazar la actualización si el nombre está vacío', async () => {
      // Arrange
      const dto = plainToClass(UpdateProveedorDto, {
        nombre: proveedorNombreVacio.nombre,
        contacto: proveedorNombreVacio.contacto,
        telefono: proveedorNombreVacio.telefono,
        email: proveedorNombreVacio.email,
        direccion: proveedorNombreVacio.direccion,
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nombre');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
      expect(mockProveedorRepository.update).not.toHaveBeenCalled();
    });

    it('debería rechazar la actualización si el nombre es demasiado corto', async () => {
      // Arrange
      const dto = plainToClass(UpdateProveedorDto, {
        nombre: proveedorNombreCorto.nombre,
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
      // ✅ CORREGIDO: usar 'isLength' en lugar de 'length'
      expect(errors[0].constraints).toHaveProperty('isLength');
      expect(mockProveedorRepository.update).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-115: INFORMACIÓN INVÁLIDA
  // ============================================

  describe('CP-115 - Verificar información inválida', () => {
    it('debería rechazar la actualización si el nombre contiene números', async () => {
      // Arrange
      const dto = plainToClass(UpdateProveedorDto, {
        nombre: proveedorNombreConNumeros.nombre,
        contacto: proveedorNombreConNumeros.contacto,
        telefono: proveedorNombreConNumeros.telefono,
        email: proveedorNombreConNumeros.email,
        direccion: proveedorNombreConNumeros.direccion,
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nombre');
      expect(errors[0].constraints).toHaveProperty('matches');
      expect(mockProveedorRepository.update).not.toHaveBeenCalled();
    });

    it('debería rechazar la actualización si el nombre contiene caracteres especiales', async () => {
      // Arrange
      const dto = plainToClass(UpdateProveedorDto, {
        nombre: proveedorNombreConSimbolos.nombre,
        contacto: proveedorNombreConSimbolos.contacto,
        telefono: proveedorNombreConSimbolos.telefono,
        email: proveedorNombreConSimbolos.email,
        direccion: proveedorNombreConSimbolos.direccion,
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('nombre');
      expect(errors[0].constraints).toHaveProperty('matches');
      expect(mockProveedorRepository.update).not.toHaveBeenCalled();
    });

    it('debería rechazar la actualización si el email tiene formato inválido', async () => {
      // Arrange
      const dto = plainToClass(UpdateProveedorDto, {
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
      expect(mockProveedorRepository.update).not.toHaveBeenCalled();
    });

    it('debería rechazar la actualización si el teléfono es demasiado corto', async () => {
      // Arrange
      const dto = plainToClass(UpdateProveedorDto, {
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
      // ✅ CORREGIDO: usar 'isLength' en lugar de 'length'
      expect(errors[0].constraints).toHaveProperty('isLength');
      expect(mockProveedorRepository.update).not.toHaveBeenCalled();
    });

    it('debería rechazar la actualización si el teléfono contiene letras', async () => {
      // Arrange
      const dto = plainToClass(UpdateProveedorDto, {
        nombre: proveedorTelefonoConLetras.nombre,
        contacto: proveedorTelefonoConLetras.contacto,
        telefono: proveedorTelefonoConLetras.telefono,
        email: proveedorTelefonoConLetras.email,
        direccion: proveedorTelefonoConLetras.direccion,
      });

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('telefono');
      expect(errors[0].constraints).toHaveProperty('matches');
      expect(mockProveedorRepository.update).not.toHaveBeenCalled();
    });
  });

  // ============================================
  // CP-117: DUPLICADO (NO APLICA)
  // ============================================

  describe('CP-117 - Verificar intentar registrar un ID duplicado', () => {
    it('NOTA: Este caso de prueba no se implementa porque el ID es autoincrementable y no se puede duplicar', () => {
      expect(true).toBe(true);
    });
  });

  // ============================================
  // CP-118: SOLO ADMIN PUEDE ACTUALIZAR
  // ============================================

  describe('CP-118 - Verificar que solo un administrador pueda actualizar proveedores', () => {
    it('el controlador debería tener el decorador @Roles(1) a nivel de clase', () => {
      const controllerClass = ProveedoresController;
      const roles = Reflect.getMetadata('roles', controllerClass);
      
      expect(roles).toBeDefined();
      // ✅ CORREGIDO: Roles devuelve un array [1], no 1
      expect(roles).toEqual([1]);
    });

    it('debería permitir la actualización si el usuario es administrador (simulación)', async () => {
      // Arrange
      const updateProveedorDto: UpdateProveedorDto = {
        nombre: 'Actualizado Admin',
      };

      const proveedorActualizadoAdmin = {
        ...proveedorExistente,
        nombre: 'Actualizado Admin',
      };

      // Mock para verificarNombreUnico
      mockQueryBuilder.getOne.mockResolvedValue(null);
      
      mockProveedorRepository.findOne
        .mockResolvedValueOnce(proveedorExistente)
        .mockResolvedValueOnce(proveedorActualizadoAdmin);
      
      mockProveedorRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      const result = await controller.actualizar(1, updateProveedorDto);

      // Assert
      expect(result.nombre).toBe('Actualizado Admin');
      expect(mockProveedorRepository.update).toHaveBeenCalled();
    });

    // Nota: La prueba de denegación de acceso debería probarse a nivel de guard, no en el servicio
  });

  // ============================================
  // CP-119: ACTUALIZACIÓN EN BASE DE DATOS
  // ============================================

  describe('CP-119 - Verificar actualización en la base de datos', () => {
    it('debería actualizar el proveedor correctamente en la base de datos', async () => {
      // Arrange
      const updateProveedorDto: UpdateProveedorDto = {
        nombre: 'Actualización BD Test',
        contacto: 'Contacto BD',
        telefono: '3111111111',
        email: 'bd@test.com',
        direccion: 'Calle BD #123',
      };

      const proveedorActualizadoBD = {
        id_proveedor: 1,
        ...updateProveedorDto,
        entradas: [],
      };

      // Mock para verificarNombreUnico
      mockQueryBuilder.getOne.mockResolvedValue(null);
      
      mockProveedorRepository.findOne
        .mockResolvedValueOnce(proveedorExistente)
        .mockResolvedValueOnce(proveedorActualizadoBD);
      
      mockProveedorRepository.update.mockResolvedValue({ affected: 1 });

      // Act
      const result = await controller.actualizar(1, updateProveedorDto);

      // Assert
      expect(mockProveedorRepository.update).toHaveBeenCalledWith(1, updateProveedorDto);
      expect(result.nombre).toBe('Actualización BD Test');
      expect(result.contacto).toBe('Contacto BD');
      expect(result.telefono).toBe('3111111111');
      expect(result.email).toBe('bd@test.com');
      expect(result.direccion).toBe('Calle BD #123');
    });

    it('debería lanzar NotFoundException si el proveedor no existe', async () => {
      // Arrange
      const updateProveedorDto: UpdateProveedorDto = {
        nombre: 'Proveedor Inexistente',
      };

      // Mock: el proveedor no existe
      mockProveedorRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.actualizar(999, updateProveedorDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(controller.actualizar(999, updateProveedorDto)).rejects.toThrow(
        'Proveedor no encontrado',
      );
      expect(mockProveedorRepository.update).not.toHaveBeenCalled();
    });

    it('debería lanzar ConflictException si el nombre ya existe', async () => {
      // Arrange
      const updateProveedorDto: UpdateProveedorDto = {
        nombre: 'Otro Proveedor Existente',
      };

      // Primero, el proveedor existe (findOne para verificar existencia)
      mockProveedorRepository.findOne
        .mockResolvedValueOnce(proveedorExistente) // Para verificar que existe
        .mockResolvedValueOnce(proveedorExistente); // Para la segunda llamada (no se usa porque lanza excepción)
      
      // Mock para verificarNombreUnico: hay otro proveedor con el mismo nombre
      mockQueryBuilder.getOne.mockResolvedValue({
        id_proveedor: 2,
        nombre: 'Otro Proveedor Existente',
      });

      // Act & Assert
      await expect(controller.actualizar(1, updateProveedorDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.actualizar(1, updateProveedorDto)).rejects.toThrow(
        `El proveedor con nombre "Otro Proveedor Existente" ya existe`,
      );
      expect(mockProveedorRepository.update).not.toHaveBeenCalled();
    });
  });
});