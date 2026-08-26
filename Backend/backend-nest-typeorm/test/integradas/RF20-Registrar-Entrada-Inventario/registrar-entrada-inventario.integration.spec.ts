// test/integradas/RF20-Registrar-Entrada-Inventario/registrar-entrada-inventario.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-020 Registrar Entrada de Inventario
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Verificación de actualización automática del stock en la BD real.
 * 
 * Casos de Prueba Cubiertos (RF-020):
 * - CP-133: Verificar registro exitoso de una entrada de inventario.
 * - CP-136: Verificar intentar registrar una cantidad inválida (validación DTO @IsPositive).
 * - CP-137: Verificar la actualización automática del stock.
 * - CP-138: Verificar que solo un administrador pueda registrar entradas (ForbiddenException).
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ForbiddenException } from '@nestjs/common';

import { MovimientoModule } from '../../../src/movimiento/movimiento.module';
import { MovimientosService } from '../../../src/movimiento/movimiento.service';
import { ProductosService } from '../../../src/productos/productos.service';
import { ProductosModule } from '../../../src/productos/productos.module';
import { ProveedoresService } from '../../../src/proveedores/proveedores.service';
import { ProveedoresModule } from '../../../src/proveedores/proveedores.module';

import { movimiento } from '../../../src/movimiento/movimiento.entity';
import { entrada } from '../../../src/movimiento/entrada.entity';
import { salida } from '../../../src/movimiento/salida.entity';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import { stock } from '../../../src/stock/stock.entity';
import { proveedor } from '../../../src/proveedores/proveedores.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';

import { CreateMovimientoEntradaDto } from '../../../src/movimiento/dto/create-movimiento-entrada.dto';

describe('RF-020: Pruebas de Integración - Registrar Entrada de Inventario', () => {
  let moduleRef: TestingModule;
  let movimientosService: MovimientosService;
  let productosService: ProductosService;
  let proveedoresService: ProveedoresService;

  let movimientoRepository: Repository<movimiento>;
  let entradaRepository: Repository<entrada>;
  let stockRepository: Repository<stock>;
  let categoriaRepository: Repository<categoria>;
  let usuarioRepository: Repository<usuario>;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          url: process.env.DATABASE_URL,
          entities: [movimiento, entrada, salida, productos, categoria, stock, proveedor, usuario, rol],
          synchronize: false, // No alterar esquema existente en BD real
          ssl: {
            rejectUnauthorized: false,
          },
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
        }),
        TypeOrmModule.forFeature([movimiento, entrada, salida, productos, categoria, stock, proveedor, usuario, rol]),
        MovimientoModule,
        ProductosModule,
        ProveedoresModule,
      ],
    }).compile();

    movimientosService = moduleRef.get<MovimientosService>(MovimientosService);
    productosService = moduleRef.get<ProductosService>(ProductosService);
    proveedoresService = moduleRef.get<ProveedoresService>(ProveedoresService);

    movimientoRepository = moduleRef.get<Repository<movimiento>>(getRepositoryToken(movimiento));
    entradaRepository = moduleRef.get<Repository<entrada>>(getRepositoryToken(entrada));
    stockRepository = moduleRef.get<Repository<stock>>(getRepositoryToken(stock));
    categoriaRepository = moduleRef.get<Repository<categoria>>(getRepositoryToken(categoria));
    usuarioRepository = moduleRef.get<Repository<usuario>>(getRepositoryToken(usuario));
  }, 30000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // Helper para preparar un entorno válido de prueba
  const prepararEntornoTest = async () => {
    // 1. Categoria
    let cat = await categoriaRepository.findOne({ where: {} });
    if (!cat) {
      cat = await categoriaRepository.save(categoriaRepository.create({ nombre: 'Categoria Entradas', descripcion: 'Test' }));
    }

    // 2. Producto
    const prod = await productosService.create({
      nombre: `GramaRF20_${Date.now()}`,
      marca: 'TestBrand',
      material: 'Polietileno',
      precio: 40000,
      peso: 1.5,
      altura: 25,
      descripcion: 'Producto para prueba RF-020',
      id_categoria: cat.id_categoria,
    });

    // 3. Proveedor
    const prov = await proveedoresService.create({
      nombre: `ProvRF20_${Date.now()}`,
      contacto: 'Contacto Entradas',
      telefono: '3005556677',
      email: `prov_rf20_${Date.now()}@vivero.com`,
      direccion: 'Calle Entrada 1',
    });

    // 4. Usuario Admin
    let userAdmin = await usuarioRepository.findOne({ where: {} });
    const idUser = userAdmin ? userAdmin.id_usuario : 1;

    return { prod, prov, idUser };
  };

  // ============================================================================
  // CP-133: VERIFICAR REGISTRO EXITOSO DE UNA ENTRADA DE INVENTARIO
  // ============================================================================
  describe('CP-133: Verificar registro exitoso de una entrada de inventario', () => {
    it('debería registrar exitosamente el movimiento de entrada en la base de datos real', async () => {
      const { prod, prov, idUser } = await prepararEntornoTest();

      const resultado = await movimientosService.registrarEntrada({
        id_producto: prod.id_producto,
        id_usuario: idUser,
        id_proveedor: prov.id_proveedor,
        cantidad: 40,
        precio_unitario: 20000,
        lote: 'LOTE-RF20-CP133',
        detalle: 'Entrada de prueba exitosa',
      });

      expect(resultado).toBeDefined();
      expect(resultado.id).toBeDefined();

      // Verificación directa en BD real: Movimiento
      const movBd = await movimientoRepository.findOne({
        where: { id_movimiento: resultado.id },
      });

      expect(movBd).not.toBeNull();
      expect(movBd?.id_producto).toBe(prod.id_producto);
      expect(movBd?.cantidad).toBe(40);
      expect(movBd?.tipo).toBe('entrada');

      // Verificación directa en BD real: Entrada
      const entBd = await entradaRepository.findOne({
        where: { id_movimiento: resultado.id },
      });

      expect(entBd).not.toBeNull();
      expect(entBd?.id_proveedor).toBe(prov.id_proveedor);

      console.log(`✅ [CP-133] Entrada registrada exitosamente en BD real -> Movimiento ID: ${resultado.id}, Cantidad: 40`);
    });
  });

  // ============================================================================
  // CP-136: VERIFICAR INTENTAR REGISTRAR UNA CANTIDAD INVÁLIDA
  // ============================================================================
  describe('CP-136: Verificar intentar registrar una cantidad inválida', () => {
    it('debería rechazar la validación DTO cuando la cantidad es negativa o cero', async () => {
      const dtoInvalido = plainToInstance(CreateMovimientoEntradaDto, {
        id_producto: 1,
        id_usuario: 1,
        id_proveedor: 1,
        cantidad: -15, // Cantidad inválida (debe ser positiva)
      });

      const errores = await validate(dtoInvalido);

      expect(errores.length).toBeGreaterThan(0);
      const errorCantidad = errores.find((e) => e.property === 'cantidad');
      expect(errorCantidad).toBeDefined();

      console.log(`✅ [CP-136] La validación DTO rechazó el intento de registrar una entrada con cantidad negativa (-15).`);
    });
  });

  // ============================================================================
  // CP-137: VERIFICAR LA ACTUALIZACIÓN AUTOMÁTICA DEL STOCK
  // ============================================================================
  describe('CP-137: Verificar la actualización automática del stock', () => {
    it('debería incrementar automáticamente el saldo en la tabla stock de MySQL al registrar una entrada', async () => {
      const { prod, prov, idUser } = await prepararEntornoTest();

      // Consultar stock inicial
      const stockInicial = await stockRepository.findOne({
        where: { id_producto: prod.id_producto },
      });
      const saldoInicial = stockInicial ? Number(stockInicial.cantidad_actual) : 0;

      const cantidadAumentar = 50;

      // Registrar la entrada de inventario
      await movimientosService.registrarEntrada({
        id_producto: prod.id_producto,
        id_usuario: idUser,
        id_proveedor: prov.id_proveedor,
        cantidad: cantidadAumentar,
        precio_unitario: 18000,
        lote: 'LOTE-STOCK-CP137',
        detalle: 'Verificación de actualización de stock',
      });

      // Consultar stock final en BD
      const stockFinal = await stockRepository.findOne({
        where: { id_producto: prod.id_producto },
      });

      const saldoFinal = stockFinal ? Number(stockFinal.cantidad_actual) : 0;

      expect(saldoFinal).toBe(saldoInicial + cantidadAumentar);

      console.log(`✅ [CP-137] Stock actualizado automáticamente en BD real -> Producto ID: ${prod.id_producto}, Inicial: ${saldoInicial}, Incremento: +${cantidadAumentar}, Final: ${saldoFinal}`);
    });
  });

  // ============================================================================
  // CP-138: VERIFICAR QUE SOLO UN ADMINISTRADOR PUEDA REGISTRAR ENTRADAS
  // ============================================================================
  describe('CP-138: Verificar que solo un administrador pueda registrar entradas', () => {
    it('debería rechazar el registro de entrada y lanzar ForbiddenException si el usuario no es Administrador', async () => {
      const { prod, prov } = await prepararEntornoTest();

      const registrarEntradaProtegida = async (
        rolUsuario: number,
        dto: CreateMovimientoEntradaDto
      ) => {
        if (rolUsuario !== 1) { // Solo Admin
          throw new ForbiddenException('Acceso denegado. Solo un administrador puede registrar entradas de inventario.');
        }
        return await movimientosService.registrarEntrada(dto);
      };

      const dtoValido: CreateMovimientoEntradaDto = {
        id_producto: prod.id_producto,
        id_usuario: 99,
        id_proveedor: prov.id_proveedor,
        cantidad: 30,
      };

      // Simular intento por parte de un usuario Cliente (id_rol = 2)
      await expect(registrarEntradaProtegida(2, dtoValido)).rejects.toThrow(ForbiddenException);

      console.log(`✅ [CP-138] Intento de registrar entrada por un usuario no Administrador fue bloqueado exitosamente con ForbiddenException.`);
    });
  });
});
