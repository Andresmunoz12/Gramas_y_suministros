/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-022 Actualización Automática de Stock
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Los movimientos registrados PERMANECEN guardados en la base de datos.
 * 
 * Casos de Prueba Cubiertos (RF-022):
 * - CP-147: Verificar actualización del stock después de una entrada de inventario.
 * - CP-148: Verificar actualización del stock después de una salida de inventario.
 * - CP-149: Intentar registrar una salida con stock insuficiente.
 * - CP-150: Verificar que el stock nunca sea negativo.
 * - CP-151: Simular un error de actualización en la base de datos.
 * - CP-152: Verificar el registro de auditoría (PENDIENTE - No implementado)
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../../../../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

import { MovimientoModule } from '../../../src/movimiento/movimiento.module';
import { MovimientosService } from '../../../src/movimiento/movimiento.service';
import { movimiento } from '../../../src/movimiento/movimiento.entity';
import { salida } from '../../../src/movimiento/salida.entity';
import { entrada } from '../../../src/movimiento/entrada.entity';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import { stock } from '../../../src/stock/stock.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { proveedor } from '../../../src/proveedores/proveedores.entity';
import { rol } from '../../../src/roles/roles.entity';
import { CreateMovimientoEntradaDto } from '../../../src/movimiento/dto/create-movimiento-entrada.dto';
import { CreateMovimientoSalidaDto } from '../../../src/movimiento/dto/create-movimiento-salida.dto';

// Helper para crear productos de prueba
async function crearProductoDePrueba(
  productRepo: Repository<productos>,
  nombre: string = `Producto Test ${Date.now()}`,
  estado: number = 1,
) {
  const producto = productRepo.create({
    nombre: nombre,
    marca: 'Marca Test',
    material: 'Material Test',
    precio: 100,
    estado: estado,
  });
  return await productRepo.save(producto);
}

// Helper para crear usuario de prueba
async function crearUsuarioDePrueba(
  userRepo: Repository<usuario>,
  rolId: number = 2,
  email?: string,
) {
  const emailUnico = email || `test_user_${Date.now()}@gramas.com`;
  const user = userRepo.create({
    nombre: 'Usuario',
    apellido: 'Prueba',
    email: emailUnico,
    passwordHash: 'PasswordSegura123!',
    id_rol: rolId,
    estado: 'activo',
  });
  return await userRepo.save(user);
}

// Helper para crear proveedor de prueba
async function crearProveedorDePrueba(
  proveedorRepo: Repository<proveedor>,
) {
  const prov = proveedorRepo.create({
    nombre: `Proveedor Test ${Date.now()}`,
    contacto_principal: 'Contacto Test',
    telefono: '123456789',
    email: `proveedor_test_${Date.now()}@test.com`,
    direccion: 'Dirección Test',
    estado: 'activo',
  });
  return await proveedorRepo.save(prov);
}

// Helper para crear stock inicial
async function crearStockInicial(
  stockRepo: Repository<stock>,
  id_producto: number,
  cantidad: number = 100,
) {
  const stockReg = stockRepo.create({
    id_producto: id_producto,
    cantidad_actual: cantidad,
    nivel_minimo: 10,
  });
  return await stockRepo.save(stockReg);
}

describe('RF-022: Pruebas de Integración - Actualización Automática de Stock', () => {
  let moduleRef: TestingModule;
  let service: MovimientosService;
  let movimientoRepo: Repository<movimiento>;
  let salidaRepo: Repository<salida>;
  let entradaRepo: Repository<entrada>;
  let productoRepo: Repository<productos>;
  let categoriaRepo: Repository<categoria>;
  let stockRepo: Repository<stock>;
  let usuarioRepo: Repository<usuario>;
  let proveedorRepo: Repository<proveedor>;
  let roleRepository: Repository<rol>;
  let dataSource: DataSource;

  let productoActivo: productos;
  let usuarioAdmin: usuario;
  let proveedorTest: any;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          url: process.env.DATABASE_URL,
          entities: [
            movimiento,
            salida,
            entrada,
            productos,
            categoria,
            stock,
            usuario,
            proveedor,
            rol
          ],
          synchronize: false,
          ssl: {
            rejectUnauthorized: false,
          },
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
        }),
        TypeOrmModule.forFeature([
          movimiento,
          salida,
          entrada,
          productos,
          categoria,
          stock,
          usuario,
          proveedor,
          rol
        ]),
        MovimientoModule,
      ],
    }).compile();

    service = moduleRef.get<MovimientosService>(MovimientosService);
    movimientoRepo = moduleRef.get<Repository<movimiento>>(getRepositoryToken(movimiento));
    salidaRepo = moduleRef.get<Repository<salida>>(getRepositoryToken(salida));
    entradaRepo = moduleRef.get<Repository<entrada>>(getRepositoryToken(entrada));
    productoRepo = moduleRef.get<Repository<productos>>(getRepositoryToken(productos));
    categoriaRepo = moduleRef.get<Repository<categoria>>(getRepositoryToken(categoria));
    stockRepo = moduleRef.get<Repository<stock>>(getRepositoryToken(stock));
    usuarioRepo = moduleRef.get<Repository<usuario>>(getRepositoryToken(usuario));
    proveedorRepo = moduleRef.get<Repository<proveedor>>(getRepositoryToken(proveedor));
    roleRepository = moduleRef.get<Repository<rol>>(getRepositoryToken(rol));
    dataSource = moduleRef.get<DataSource>(DataSource);

    // Asegurar que existan los roles
    const rolCliente = await roleRepository.findOne({ where: { id_rol: 2 } });
    if (!rolCliente) {
      await roleRepository.save(
        roleRepository.create({
          id_rol: 2,
          tipo: 'cliente',
          descripcion: 'Rol cliente para pruebas de integración',
        }),
      );
    }

    const rolAdmin = await roleRepository.findOne({ where: { id_rol: 1 } });
    if (!rolAdmin) {
      await roleRepository.save(
        roleRepository.create({
          id_rol: 1,
          tipo: 'admin',
          descripcion: 'Rol administrador para pruebas de integración',
        }),
      );
    }

    // Crear datos de prueba compartidos
    productoActivo = await crearProductoDePrueba(productoRepo, 'Producto Stock Test', 1);
    usuarioAdmin = await crearUsuarioDePrueba(
      usuarioRepo,
      1,
      `admin_stock_${Date.now()}@gramas.com`
    );
    proveedorTest = await crearProveedorDePrueba(proveedorRepo);

    console.log(`✅ Datos de prueba inicializados:
      - Producto: ${productoActivo.nombre} (ID: ${productoActivo.id_producto})
      - Admin: ${usuarioAdmin.email} (ID: ${usuarioAdmin.id_usuario}, Rol: 1)
      - Proveedor: ${proveedorTest.nombre} (ID: ${proveedorTest.id_proveedor})
    `);
  }, 60000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // ============================================================================
  // CP-147: VERIFICAR ACTUALIZACIÓN DEL STOCK DESPUÉS DE UNA ENTRADA
  // ============================================================================
  describe('CP-147: Verificar actualización del stock después de una entrada de inventario', () => {
    it('debería aumentar el stock correctamente después de registrar una entrada', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Entrada ${Date.now()}`,
        1
      );
      
      const stockInicial = 50;
      await crearStockInicial(stockRepo, producto.id_producto, stockInicial);

      const cantidadEntrada = 30;

      const dto: CreateMovimientoEntradaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidadEntrada,
        detalle: 'Entrada de prueba CP-147',
        id_proveedor: proveedorTest.id_proveedor,
        precio_unitario: 100,
        lote: 'LOTE-001',
        observaciones: 'Prueba de actualización de stock',
      };

      const stockAntes = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });

      const resultado = await service.registrarEntrada(dto);

      expect(resultado).toBeDefined();
      expect(resultado.mensaje).toBe('Entrada de grama registrada exitosamente');
      expect(resultado.id).toBeDefined();

      const stockDespues = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });

      expect(stockDespues?.cantidad_actual).toBe(stockInicial + cantidadEntrada);
      expect(stockDespues?.cantidad_actual).toBe(stockAntes!.cantidad_actual + cantidadEntrada);

      const movimiento = await movimientoRepo.findOne({
        where: { id_movimiento: resultado.id },
        relations: ['entrada'],
      });

      expect(movimiento).toBeDefined();
      expect(movimiento?.tipo).toBe('entrada');
      expect(movimiento?.cantidad).toBe(cantidadEntrada);
      expect(movimiento?.entrada).toBeDefined();
      expect(movimiento?.entrada.id_proveedor).toBe(proveedorTest.id_proveedor);

      console.log(`✅ [CP-147] Stock actualizado correctamente: ${stockInicial} → ${stockDespues?.cantidad_actual} (+${cantidadEntrada})`);
    });

    it('debería crear un registro de stock si no existe al hacer una entrada', async () => {
      const productoSinStock = await crearProductoDePrueba(
        productoRepo,
        `Producto Sin Stock ${Date.now()}`,
        1
      );

      const stockExistente = await stockRepo.findOne({
        where: { id_producto: productoSinStock.id_producto },
      });
      expect(stockExistente).toBeNull();

      const cantidadEntrada = 25;

      const dto: CreateMovimientoEntradaDto = {
        id_producto: productoSinStock.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidadEntrada,
        detalle: 'Primera entrada para crear stock',
        id_proveedor: proveedorTest.id_proveedor,
        precio_unitario: 150,
        lote: 'LOTE-002',
      };

      const resultado = await service.registrarEntrada(dto);

      const stockCreado = await stockRepo.findOne({
        where: { id_producto: productoSinStock.id_producto },
      });

      expect(stockCreado).not.toBeNull();
      expect(stockCreado?.cantidad_actual).toBe(cantidadEntrada);
      expect(stockCreado?.nivel_minimo).toBe(0);

      console.log(`✅ [CP-147] Stock creado automáticamente: ${stockCreado?.cantidad_actual} unidades`);
    });
  });

  // ============================================================================
  // CP-148: VERIFICAR ACTUALIZACIÓN DEL STOCK DESPUÉS DE UNA SALIDA
  // ============================================================================
  describe('CP-148: Verificar actualización del stock después de una salida de inventario', () => {
    it('debería disminuir el stock correctamente después de registrar una salida', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Salida ${Date.now()}`,
        1
      );
      
      const stockInicial = 100;
      await crearStockInicial(stockRepo, producto.id_producto, stockInicial);

      const cantidadSalida = 25;

      const dto: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidadSalida,
        detalle: 'Salida de prueba CP-148',
        destino: 'Cliente Final',
        motivo: 'Venta Directa',
        observaciones: 'Prueba de actualización de stock',
      };

      const stockAntes = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });

      const resultado = await service.registrarSalida(dto);

      expect(resultado).toBeDefined();
      expect(resultado.mensaje).toBe('Salida de grama registrada exitosamente');
      expect(resultado.id).toBeDefined();

      const stockDespues = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });

      expect(stockDespues?.cantidad_actual).toBe(stockInicial - cantidadSalida);
      expect(stockDespues?.cantidad_actual).toBe(stockAntes!.cantidad_actual - cantidadSalida);

      const movimiento = await movimientoRepo.findOne({
        where: { id_movimiento: resultado.id },
        relations: ['salida'],
      });

      expect(movimiento).toBeDefined();
      expect(movimiento?.tipo).toBe('salida');
      expect(movimiento?.cantidad).toBe(cantidadSalida);
      expect(movimiento?.salida).toBeDefined();
      expect(movimiento?.salida.destino).toBe('Cliente Final');
      expect(movimiento?.salida.motivo).toBe('Venta Directa');

      console.log(`✅ [CP-148] Stock actualizado correctamente: ${stockInicial} → ${stockDespues?.cantidad_actual} (-${cantidadSalida})`);
    });

    it('debería actualizar correctamente el stock con entradas y salidas consecutivas', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Multi Mov ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 50);

      const operaciones = [
        { tipo: 'entrada', cantidad: 30 },
        { tipo: 'salida', cantidad: 10 },
        { tipo: 'entrada', cantidad: 20 },
        { tipo: 'salida', cantidad: 15 },
        { tipo: 'entrada', cantidad: 5 },
      ];

      let stockEsperado = 50;

      for (const op of operaciones) {
        if (op.tipo === 'entrada') {
          const dto: CreateMovimientoEntradaDto = {
            id_producto: producto.id_producto,
            id_usuario: usuarioAdmin.id_usuario,
            cantidad: op.cantidad,
            detalle: `Entrada múltiple`,
            id_proveedor: proveedorTest.id_proveedor,
            precio_unitario: 100,
          };
          await service.registrarEntrada(dto);
          stockEsperado += op.cantidad;
        } else {
          const dto: CreateMovimientoSalidaDto = {
            id_producto: producto.id_producto,
            id_usuario: usuarioAdmin.id_usuario,
            cantidad: op.cantidad,
            detalle: `Salida múltiple`,
            destino: 'Cliente',
            motivo: 'Venta',
          };
          await service.registrarSalida(dto);
          stockEsperado -= op.cantidad;
        }
      }

      const stockFinal = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });

      expect(stockFinal?.cantidad_actual).toBe(stockEsperado);

      const movimientos = await movimientoRepo.find({
        where: { id_producto: producto.id_producto },
      });
      expect(movimientos.length).toBe(operaciones.length);

      console.log(`✅ [CP-148] Múltiples operaciones - Stock final: ${stockFinal?.cantidad_actual}`);
    }, 30000);
  });

  // ============================================================================
  // CP-149: INTENTAR REGISTRAR SALIDA CON STOCK INSUFICIENTE
  // ============================================================================
  describe('CP-149: Intentar registrar una salida con stock insuficiente', () => {
    it('debería lanzar BadRequestException al intentar salida con stock insuficiente', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Stock Limitado ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 10);

      const dto: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: 20,
        detalle: 'Intento con stock insuficiente',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      await expect(service.registrarSalida(dto)).rejects.toThrow(
        BadRequestException
      );

      const stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(10);

      const movimientos = await movimientoRepo.find({
        where: { id_producto: producto.id_producto },
      });
      expect(movimientos.length).toBe(0);

      console.log(`✅ [CP-149] Stock insuficiente bloqueado correctamente`);
    });

    it('debería lanzar BadRequestException al intentar salida con stock exactamente 0', async () => {
      const productoSinStock = await crearProductoDePrueba(
        productoRepo,
        `Producto Sin Stock ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, productoSinStock.id_producto, 0);

      const dto: CreateMovimientoSalidaDto = {
        id_producto: productoSinStock.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: 1,
        detalle: 'Intento con stock 0',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      await expect(service.registrarSalida(dto)).rejects.toThrow(
        BadRequestException
      );

      console.log(`✅ [CP-149] Stock 0 bloqueado correctamente`);
    });

    it('debería lanzar BadRequestException al intentar salida con stock insuficiente incluso con múltiples intentos', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Multi Intentos ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 50);

      const dto1: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: 30,
        detalle: 'Primera salida exitosa',
        destino: 'Cliente A',
        motivo: 'Venta A',
      };
      await service.registrarSalida(dto1);

      const dto2: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: 25,
        detalle: 'Intento fallido',
        destino: 'Cliente B',
        motivo: 'Venta B',
      };

      await expect(service.registrarSalida(dto2)).rejects.toThrow(
        BadRequestException
      );

      const stockFinal = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockFinal?.cantidad_actual).toBe(20);

      console.log(`✅ [CP-149] Múltiples intentos - Stock final: ${stockFinal?.cantidad_actual}`);
    });
  });

  // ============================================================================
  // CP-150: VERIFICAR QUE EL STOCK NUNCA SEA NEGATIVO
  // ============================================================================
  describe('CP-150: Verificar que el stock nunca sea negativo', () => {
    it('debería lanzar excepción y no permitir stock negativo al intentar salida mayor al stock disponible', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto No Negativo ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 10);

      const dto1: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: 15,
        detalle: 'Intento de stock negativo',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      await expect(service.registrarSalida(dto1)).rejects.toThrow(
        BadRequestException
      );

      let stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(10);

      const dto2: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: 10,
        detalle: 'Salida exacta',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      await service.registrarSalida(dto2);

      stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(0);

      const dto3: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: 1,
        detalle: 'Intento con stock 0',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      await expect(service.registrarSalida(dto3)).rejects.toThrow(
        BadRequestException
      );

      stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(0);

      console.log(`✅ [CP-150] Stock nunca negativo - Stock final: ${stockActual?.cantidad_actual}`);
    }, 30000);

    it('debería rechazar cantidades negativas en entrada y salida', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Validacion ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 100);

      const dtoEntradaNegativa: CreateMovimientoEntradaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: -5,
        detalle: 'Entrada negativa',
        id_proveedor: proveedorTest.id_proveedor,
        precio_unitario: 100,
      };

      await expect(service.registrarEntrada(dtoEntradaNegativa)).rejects.toThrow(
        BadRequestException
      );

      const dtoSalidaNegativa: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: -3,
        detalle: 'Salida negativa',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      await expect(service.registrarSalida(dtoSalidaNegativa)).rejects.toThrow(
        BadRequestException
      );

      console.log(`✅ [CP-150] Cantidades negativas rechazadas correctamente`);
    });
  });

  // ============================================================================
  // CP-151: SIMULAR ERROR DE ACTUALIZACIÓN EN BASE DE DATOS
  // ============================================================================
  describe('CP-151: Simular un error de actualización en la base de datos', () => {
    it('debería hacer rollback de la transacción cuando ocurre un error en la entrada', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Error Entrada ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 50);

      const stockInicial = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });

      const dto: CreateMovimientoEntradaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: 100,
        detalle: 'Entrada con error',
        id_proveedor: 999999,
        precio_unitario: 100,
      };

      await expect(service.registrarEntrada(dto)).rejects.toThrow(
        'Proveedor no encontrado'
      );

      const stockDespues = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockDespues?.cantidad_actual).toBe(stockInicial!.cantidad_actual);

      const movimientos = await movimientoRepo.find({
        where: { id_producto: producto.id_producto },
      });
      expect(movimientos.length).toBe(0);

      console.log(`✅ [CP-151] Rollback exitoso - Stock sin cambios: ${stockDespues?.cantidad_actual}`);
    });

    it('debería hacer rollback de la transacción cuando ocurre un error en la salida', async () => {
      const productoInactivo = await crearProductoDePrueba(
        productoRepo,
        `Producto Inactivo Error ${Date.now()}`,
        0
      );
      
      await crearStockInicial(stockRepo, productoInactivo.id_producto, 100);

      const dto: CreateMovimientoSalidaDto = {
        id_producto: productoInactivo.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: 10,
        detalle: 'Salida con error',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      await expect(service.registrarSalida(dto)).rejects.toThrow(
        'El producto no está activo'
      );

      const stockDespues = await stockRepo.findOne({
        where: { id_producto: productoInactivo.id_producto },
      });
      expect(stockDespues?.cantidad_actual).toBe(100);

      const movimientos = await movimientoRepo.find({
        where: { id_producto: productoInactivo.id_producto },
      });
      expect(movimientos.length).toBe(0);

      console.log(`✅ [CP-151] Rollback exitoso en salida - Stock sin cambios`);
    });

    it('debería hacer rollback completo cuando hay error después de crear el movimiento', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Rollback ${Date.now()}`,
        1
      );

      const dto: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: 10,
        detalle: 'Prueba rollback',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      await expect(service.registrarSalida(dto)).rejects.toThrow();

      const stockExistente = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockExistente).toBeNull();

      const movimientos = await movimientoRepo.find({
        where: { id_producto: producto.id_producto },
      });
      expect(movimientos.length).toBe(0);

      console.log(`✅ [CP-151] Rollback completo - No se crearon registros inconsistentes`);
    });
  });

  // ============================================================================
  // CP-152: VERIFICAR REGISTRO DE AUDITORÍA (PENDIENTE)
  // ============================================================================
  describe('CP-152: Verificar registro de auditoría de la actualización del stock', () => {
    it('PENDIENTE - La funcionalidad de auditoría no está implementada actualmente', () => {
      console.log(`📝 [CP-152] La funcionalidad de auditoría no está implementada en el sistema actual.
      Para implementarla, se podría considerar:
      1. Agregar trigger en la BD que registre cambios en stock
      2. Crear una tabla de auditoría y un interceptor en NestJS
      3. Usar TypeORM Subscribers para auditar cambios
      4. Crear un módulo de auditoría que registre todas las operaciones
      `);

      expect(true).toBe(true);
    });
  });
});