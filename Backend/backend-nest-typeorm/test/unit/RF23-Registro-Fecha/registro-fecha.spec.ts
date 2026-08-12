import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
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
  proveedorExistente,
  stockInicial,
  dtoEntrada,
  dtoSalida,
  movimientoCreado,
} from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockMovimientoRepository = {
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
const mockProveedorRepository = { findOne: jest.fn() };

// ============================================
// SUITE DE PRUEBAS
// ============================================

describe('RF-023: Registro Automático de Fecha y Hora', () => {
  let service: MovimientosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovimientosService,
        { provide: getRepositoryToken(movimiento), useValue: mockMovimientoRepository },
        { provide: getRepositoryToken(entrada), useValue: { create: jest.fn(), save: jest.fn() } },
        { provide: getRepositoryToken(salida), useValue: { create: jest.fn(), save: jest.fn() } },
        { provide: getRepositoryToken(productos), useValue: mockProductoRepository },
        { provide: getRepositoryToken(usuario), useValue: mockUsuarioRepository },
        { provide: getRepositoryToken(proveedor), useValue: mockProveedorRepository },
        { provide: StockService, useValue: mockStockService },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<MovimientosService>(MovimientosService);
    
    // Setup predeterminado exitoso
    mockProductoRepository.findOne.mockResolvedValue(productoExistente);
    mockUsuarioRepository.findOne.mockResolvedValue(usuarioAdmin);
    mockProveedorRepository.findOne.mockResolvedValue(proveedorExistente);
    mockQueryRunner.manager.findOne.mockResolvedValue(stockInicial);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================
  // CP-153: Registro automático en Entrada
  // CP-158: Auditoría de la transacción
  // ==========================================================
  describe('CP-153 & CP-158: Entrada de Inventario (Fecha delegada a la BD)', () => {
    it('debería crear la entrada delegando la fecha a la Base de Datos', async () => {
      mockMovimientoRepository.create.mockImplementation((dto) => dto);
      mockQueryRunner.manager.save.mockResolvedValue(movimientoCreado);

      await service.registrarEntrada(dtoEntrada);

      // Verificamos qué se le pasó al método `create` del repositorio.
      // No debe contener ninguna propiedad "fecha", para que la BD aplique el DEFAULT 'CURRENT_TIMESTAMP'.
      expect(mockMovimientoRepository.create).toHaveBeenCalledWith(
        expect.not.objectContaining({
          fecha: expect.anything(),
        })
      );
      
      // Verificamos el Commit para auditoría (CP-158)
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  // ==========================================================
  // CP-154: Registro automático en Salida
  // ==========================================================
  describe('CP-154: Salida de Inventario (Fecha delegada a la BD)', () => {
    it('debería crear la salida delegando la fecha a la Base de Datos', async () => {
      mockMovimientoRepository.create.mockImplementation((dto) => dto);
      mockQueryRunner.manager.save.mockResolvedValue(movimientoCreado);

      await service.registrarSalida(dtoSalida);

      // Igual que en la entrada, confirmamos que la fecha no se inyecta desde el servidor
      expect(mockMovimientoRepository.create).toHaveBeenCalledWith(
        expect.not.objectContaining({
          fecha: expect.anything(),
        })
      );
    });
  });

  // ==========================================================
  // CP-155: Intentar modificar manualmente la fecha
  // ==========================================================
  describe('CP-155: Modificación manual de fecha', () => {
    it('debería ignorar cualquier fecha enviada maliciosamente en el DTO', async () => {
      mockMovimientoRepository.create.mockImplementation((dto) => dto);
      mockQueryRunner.manager.save.mockResolvedValue(movimientoCreado);

      // Inyectamos una fecha manualmente (simulando un ataque o bug del frontend)
      const dtoMalicioso = {
        ...dtoEntrada,
        fecha: '2000-01-01T00:00:00Z', 
      } as any; // Cast a any para forzar el paso

      await service.registrarEntrada(dtoMalicioso);

      // A pesar de enviar la fecha, el método `create` del servicio extrae solo los campos permitidos
      // y NO debe enviar la fecha al manager para guardar.
      expect(mockMovimientoRepository.create).toHaveBeenCalledWith(
        expect.not.objectContaining({
          fecha: expect.anything(),
        })
      );
    });
  });

  // ==========================================================
  // CP-156 & CP-157: Errores de BD y fecha del servidor (Rollback)
  // ==========================================================
  describe('CP-156 & CP-157: Errores en servidor o Base de Datos', () => {
    it('debería ejecutar Rollback si la BD falla al generar la fecha o guardar el registro', async () => {
      // Simulamos que al hacer "save" (momento en que la BD generaría el timestamp),
      // la conexión se cae o la BD rechaza el query.
      mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('Conexión perdida con la BD o error de Timestamp'));

      await expect(service.registrarEntrada(dtoEntrada)).rejects.toThrow('Conexión perdida con la BD o error de Timestamp');

      // Validamos CP-157: Manejo del error con Rollback
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });
});
