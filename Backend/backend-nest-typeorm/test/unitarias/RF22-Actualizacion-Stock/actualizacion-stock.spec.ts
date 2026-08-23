import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MovimientosService } from '../../../src/movimiento/movimiento.service';
import { StockService } from '../../../src/stock/stock.service';
import { stock } from '../../../src/stock/stock.entity';
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
  stockInsuficiente,
  dtoEntrada,
  dtoSalidaValida,
  dtoSalidaInsuficiente,
  dtoSalidaFuerzaNegativo,
  movimientoCreado,
  entradaCreada,
  salidaCreada,
} from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockMovimientoRepository = {
  create: jest.fn(),
  save: jest.fn(),
};
const mockEntradaRepository = {
  create: jest.fn(),
  save: jest.fn(),
};
const mockSalidaRepository = {
  create: jest.fn(),
  save: jest.fn(),
};
const mockProductoRepository = {
  findOne: jest.fn(),
};
const mockUsuarioRepository = {
  findOne: jest.fn(),
};
const mockProveedorRepository = {
  findOne: jest.fn(),
};
const mockStockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
};

// Necesitamos mockear el queryRunner y su manager de forma persistente 
// para validar que se llama actualizarSaldo con la cantidad correcta (Suma o Resta)
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

// ============================================
// SUITE DE PRUEBAS
// ============================================

describe('RF-022: Actualización Automática de Stock', () => {
  let service: MovimientosService;
  let stockService: StockService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MovimientosService,
        StockService, // Usamos el servicio real de Stock para probar la matemática (Suma/Resta)
        { provide: getRepositoryToken(movimiento), useValue: mockMovimientoRepository },
        { provide: getRepositoryToken(entrada), useValue: mockEntradaRepository },
        { provide: getRepositoryToken(salida), useValue: mockSalidaRepository },
        { provide: getRepositoryToken(productos), useValue: mockProductoRepository },
        { provide: getRepositoryToken(usuario), useValue: mockUsuarioRepository },
        { provide: getRepositoryToken(proveedor), useValue: mockProveedorRepository },
        { provide: getRepositoryToken(stock), useValue: mockStockRepository },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<MovimientosService>(MovimientosService);
    stockService = module.get<StockService>(StockService);

    // Spy para rastrear si se llamó el método de actualizarSaldo
    jest.spyOn(stockService, 'actualizarSaldo');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================
  // CP-147: Actualización del stock después de una entrada (Suma)
  // CP-152: Auditoría (commitTransaction se ejecuta)
  // ==========================================================
  describe('CP-147 & CP-152: Entrada de inventario (Suma de Stock)', () => {
    it('debería sumar la cantidad al stock existente tras una entrada', async () => {
      // Arrange
      mockProductoRepository.findOne.mockResolvedValue(productoExistente);
      mockUsuarioRepository.findOne.mockResolvedValue(usuarioAdmin);
      mockProveedorRepository.findOne.mockResolvedValue(proveedorExistente);
      
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(movimientoCreado)
        .mockResolvedValueOnce(entradaCreada)
        .mockResolvedValueOnce({ ...stockInicial, cantidad_actual: stockInicial.cantidad_actual + dtoEntrada.cantidad });

      mockQueryRunner.manager.findOne.mockResolvedValue(stockInicial); // Para el actualizarSaldo (encuentra el stock)

      // Act
      await service.registrarEntrada(dtoEntrada);

      // Assert
      expect(stockService.actualizarSaldo).toHaveBeenCalledWith(
        dtoEntrada.id_producto,
        dtoEntrada.cantidad, // Valor positivo para sumar
        mockQueryRunner.manager,
      );
      
      // CP-152: Validación de la transacción confirmada (Auditoría/Persistencia segura)
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  // ==========================================================
  // CP-148: Actualización del stock después de una salida (Resta)
  // ==========================================================
  describe('CP-148: Salida de inventario (Resta de Stock)', () => {
    it('debería restar la cantidad al stock existente tras una salida', async () => {
      // Arrange
      mockProductoRepository.findOne.mockResolvedValue(productoExistente);
      mockUsuarioRepository.findOne.mockResolvedValue(usuarioAdmin);
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(stockInicial); // Validacion antes de salir

      mockQueryRunner.manager.save
        .mockResolvedValueOnce(movimientoCreado)
        .mockResolvedValueOnce(salidaCreada)
        .mockResolvedValueOnce({ ...stockInicial, cantidad_actual: stockInicial.cantidad_actual - dtoSalidaValida.cantidad });
      
      // Para el actualizarSaldo del StockService (busqueda con bloqueo pesimista)
      mockQueryRunner.manager.findOne.mockResolvedValueOnce(stockInicial);

      // Act
      await service.registrarSalida(dtoSalidaValida);

      // Assert
      expect(stockService.actualizarSaldo).toHaveBeenCalledWith(
        dtoSalidaValida.id_producto,
        -dtoSalidaValida.cantidad, // Valor negativo para restar (-30)
        mockQueryRunner.manager,
      );
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
    });
  });

  // ==========================================================
  // CP-149: Intentar registrar salida con stock insuficiente
  // ==========================================================
  describe('CP-149: Salida con stock insuficiente', () => {
    it('debería bloquear la salida si el stock es menor a lo solicitado', async () => {
      // Arrange
      mockProductoRepository.findOne.mockResolvedValue(productoExistente);
      mockUsuarioRepository.findOne.mockResolvedValue(usuarioAdmin);
      mockQueryRunner.manager.findOne.mockResolvedValue(stockInsuficiente); // Stock = 5

      // Act & Assert
      await expect(service.registrarSalida(dtoSalidaInsuficiente)).rejects.toThrow(BadRequestException);
      expect(stockService.actualizarSaldo).not.toHaveBeenCalled(); // No se actualiza el stock
    });
  });

  // ==========================================================
  // CP-150: Verificar que el stock nunca sea negativo
  // ==========================================================
  describe('CP-150: Prevenir stock negativo', () => {
    it('debería rechazar la salida matemáticamente si el resultado sería < 0', async () => {
      mockProductoRepository.findOne.mockResolvedValue(productoExistente);
      mockUsuarioRepository.findOne.mockResolvedValue(usuarioAdmin);
      mockQueryRunner.manager.findOne.mockResolvedValue(stockInicial); // Stock = 50, se piden 51

      await expect(service.registrarSalida(dtoSalidaFuerzaNegativo)).rejects.toThrow(BadRequestException);
      
      // Confirmamos que el saldo no llegó a tocarse, evitando el -1
      expect(stockService.actualizarSaldo).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // CP-151: Simular error de actualización (Rollback)
  // ==========================================================
  describe('CP-151: Manejo de transacciones (Rollback)', () => {
    it('debería hacer un rollbackTransaction si ocurre cualquier error durante el proceso', async () => {
      // Arrange
      mockProductoRepository.findOne.mockResolvedValue(productoExistente);
      mockUsuarioRepository.findOne.mockResolvedValue(usuarioAdmin);
      mockProveedorRepository.findOne.mockResolvedValue(proveedorExistente);

      // Simulamos que el guardado del movimiento principal en Base de Datos falla de repente
      mockQueryRunner.manager.save.mockRejectedValueOnce(new Error('Fallo crítico en la BD'));

      // Act & Assert
      await expect(service.registrarEntrada(dtoEntrada)).rejects.toThrow('Fallo crítico en la BD');

      // Validamos que se ejecute Rollback para revertir cualquier daño a los registros previos
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      
      // Validamos que NO se hizo commit (la data errónea no se guardó)
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });
  });
});
