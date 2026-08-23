import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { StockService } from '../../../src/stock/stock.service';
import { StockController } from '../../../src/stock/stock.controller';
import { stock } from '../../../src/stock/stock.entity';
import { validate } from 'class-validator';
import { UpdateStockMinimoDto } from '../../../src/stock/dto/update-stock-minimo.dto';
import { stockEncontrado, dtoValido, dtoNegativo } from './helpers/test-data';

// ============================================
// MOCKS
// ============================================

const mockStockRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
};

// ============================================
// SUITE DE PRUEBAS
// ============================================

describe('RF-028: Configurar Stock Mínimo de Producto', () => {
  let service: StockService;
  let controller: StockController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        StockService,
        { provide: getRepositoryToken(stock), useValue: mockStockRepository },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    controller = module.get<StockController>(StockController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================
  // CP-184 & CP-185: Configurar / Modificar Stock Mínimo
  // CP-189: Verificar registro (mock save asegura la BD)
  // ==========================================================
  describe('CP-184 & CP-185: Modificar Nivel Mínimo Exitosamente', () => {
    it('debería actualizar el nivel_minimo del registro de stock y guardar en BD', async () => {
      // Configuramos el mock para que encuentre el producto (1)
      mockStockRepository.findOne.mockResolvedValue({ ...stockEncontrado });
      // Simulamos que al guardar, devuelve la entidad actualizada
      mockStockRepository.save.mockImplementation(async (entidad) => entidad);

      const id_producto = 1;
      const resultado = await service.actualizarNivelMinimo(id_producto, dtoValido.nivel_minimo);

      expect(mockStockRepository.findOne).toHaveBeenCalledWith({ where: { id_producto } });
      
      // Verificamos que el valor se haya actualizado (CP-184, CP-185)
      expect(resultado.nivel_minimo).toBe(dtoValido.nivel_minimo);
      
      // Verificamos que el cambio se guarde en la BD (Auditoría/Persistencia - CP-189)
      expect(mockStockRepository.save).toHaveBeenCalled();
    });
  });

  // ==========================================================
  // CP-186: Intentar registrar un valor negativo
  // ==========================================================
  describe('CP-186: Validar Valores Negativos', () => {
    it('debería rechazar un DTO con valor negativo', async () => {
      // Instanciamos el DTO
      const dto = new UpdateStockMinimoDto();
      dto.nivel_minimo = dtoNegativo.nivel_minimo; // -5

      // Ejecutamos las validaciones de class-validator (lo que hace NestJS detrás de cámaras)
      const errores = await validate(dto);
      
      // Comprobamos que existan errores de validación
      expect(errores.length).toBeGreaterThan(0);
      
      // Verificamos que el error específico sea de restricción "min"
      const errorDeMinimo = errores[0].constraints;
      expect(errorDeMinimo).toHaveProperty('min');
      expect(errorDeMinimo.min).toContain('no puede ser negativo');
    });
  });

  // ==========================================================
  // CP-187: Intentar configurar el stock mínimo de producto inexistente
  // ==========================================================
  describe('CP-187: Producto Inexistente', () => {
    it('debería lanzar NotFoundException si el producto no tiene registro de stock', async () => {
      // El repositorio no encuentra nada
      mockStockRepository.findOne.mockResolvedValue(null);

      const idInexistente = 999;
      
      await expect(service.actualizarNivelMinimo(idInexistente, dtoValido.nivel_minimo))
        .rejects.toThrow(NotFoundException);
        
      await expect(service.actualizarNivelMinimo(idInexistente, dtoValido.nivel_minimo))
        .rejects.toThrow(`No se encontró registro de stock para el producto con ID ${idInexistente}.`);
    });
  });

  // ==========================================================
  // CP-188: Verificar que solo un administrador pueda configurar
  // ==========================================================
  describe('CP-188: RBAC (Role Based Access Control) en Configuración', () => {
    it('debería requerir el rol de Administrador (@Roles(1)) en el endpoint', () => {
      const reflector = new Reflector();
      
      // Obtenemos los roles del endpoint actualizarStockMinimo
      const rolesConfigurar = reflector.get<number[]>('roles', controller.actualizarStockMinimo);

      // Verificamos que no sea público y exija rol 1
      expect(rolesConfigurar).toBeDefined();
      expect(rolesConfigurar).toEqual([1]);
    });
  });
});
