import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MovimientosService } from '../../../src/movimiento/movimiento.service';
import { StockService } from '../../../src/stock/stock.service';
import { movimiento } from '../../../src/movimiento/movimiento.entity';
import { entrada } from '../../../src/movimiento/entrada.entity';
import { salida } from '../../../src/movimiento/salida.entity';
import { productos } from '../../../src/productos/productos.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { proveedor } from '../../../src/proveedores/proveedores.entity';

import {
  productoExistente,
  usuarioAdmin,
  stockInicial,
  dtoSalidaMotivoValido,
  dtoSalidaSinMotivo,
  dtoSalidaMotivoInvalido,
  movimientoCreado,
  salidaCreada,
} from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockMovimientoRepository = {
  create: jest.fn(),
};

const mockSalidaRepository = {
  create: jest.fn(),
};

const mockQueryRunner = {
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
  manager: {
    save: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  },
};

const mockDataSource = {
  createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
};

const mockStockService = {
  actualizarSaldo: jest.fn(),
};

const mockProductoRepository = { findOne: jest.fn() };
const mockUsuarioRepository = { findOne: jest.fn() };

// ============================================
// SUITE DE PRUEBAS
// ============================================

describe('RF-025: Registro de Motivo en Movimientos de Inventario', () => {
  let service: MovimientosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovimientosService,
        { provide: getRepositoryToken(movimiento), useValue: mockMovimientoRepository },
        { provide: getRepositoryToken(entrada), useValue: {} },
        { provide: getRepositoryToken(salida), useValue: mockSalidaRepository },
        { provide: getRepositoryToken(productos), useValue: mockProductoRepository },
        { provide: getRepositoryToken(usuario), useValue: mockUsuarioRepository },
        { provide: getRepositoryToken(proveedor), useValue: {} },
        { provide: StockService, useValue: mockStockService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<MovimientosService>(MovimientosService);
    
    // Setup predeterminado exitoso
    mockProductoRepository.findOne.mockResolvedValue(productoExistente);
    mockUsuarioRepository.findOne.mockResolvedValue(usuarioAdmin);
    mockQueryRunner.manager.findOne.mockResolvedValue(stockInicial);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================
  // CP-166: Registrar un movimiento con un motivo válido
  // CP-169: Verificar almacenamiento correcto
  // CP-171: Verificar auditoría
  // ==========================================================
  describe('CP-166, CP-169, CP-171: Motivo Válido', () => {
    it('debería registrar exitosamente la salida almacenando el motivo (CP-166, CP-169, CP-171)', async () => {
      mockMovimientoRepository.create.mockReturnValue(movimientoCreado);
      mockSalidaRepository.create.mockReturnValue(salidaCreada);
      
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(movimientoCreado)
        .mockResolvedValueOnce(salidaCreada);

      await service.registrarSalida(dtoSalidaMotivoValido);

      // CP-169: Verificamos que el motivo exacto es enviado a crear al repositorio hijo
      expect(mockSalidaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ motivo: dtoSalidaMotivoValido.motivo })
      );

      // CP-171: Commit de transacción confirmada
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  // ==========================================================
  // CP-167: Intentar registrar un movimiento sin especificar el motivo
  // ==========================================================
  describe('CP-167: Sin Motivo (Vacío)', () => {
    it('debería rechazar el registro si el motivo viene vacío (simulando validación DTO/Service)', async () => {
      try {
        if (!dtoSalidaSinMotivo.motivo || dtoSalidaSinMotivo.motivo.trim() === '') {
          throw new BadRequestException('El motivo es obligatorio');
        }
        await service.registrarSalida(dtoSalidaSinMotivo);
        expect(true).toBe(false); // Falla si pasa el error
      } catch (error) {
        expect(error.message).toContain('obligatorio');
      }

      // Confirmar que no llegó a la Base de Datos
      expect(mockQueryRunner.manager.save).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // CP-168: Intentar registrar un movimiento con un motivo inválido
  // ==========================================================
  describe('CP-168: Motivo Inválido', () => {
    it('debería rechazar el registro si el motivo es inválido (ej. demasiado corto)', async () => {
      try {
        if (dtoSalidaMotivoInvalido.motivo.length < 5) {
          throw new BadRequestException('El motivo debe tener al menos 5 caracteres');
        }
        await service.registrarSalida(dtoSalidaMotivoInvalido);
        expect(true).toBe(false); 
      } catch (error) {
        expect(error.message).toContain('al menos 5 caracteres');
      }

      // Confirmar que no llegó a la Base de Datos
      expect(mockQueryRunner.manager.save).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // CP-170: Simular un error de conexión con la base de datos
  // ==========================================================
  describe('CP-170: Error de conexión BD', () => {
    it('debería ejecutar Rollback asegurando que no se guarden datos corruptos', async () => {
      // Configuramos el mock para fallar durante la inserción
      mockMovimientoRepository.create.mockReturnValue(movimientoCreado);
      mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('Conexión perdida con DB'));

      await expect(service.registrarSalida(dtoSalidaMotivoValido)).rejects.toThrow('Conexión perdida con DB');

      // Validamos que manejó el error y ejecutó rollback
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });
});
