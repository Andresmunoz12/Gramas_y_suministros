/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-024 Validación de Cantidad en Movimientos
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
 * Casos de Prueba Cubiertos (RF-024):
 * - CP-159: Registrar un movimiento con una cantidad válida.
 * - CP-160: Intentar registrar una cantidad igual a cero.
 * - CP-161: Intentar registrar una cantidad negativa.
 * - CP-162: Intentar registrar una salida con cantidad superior al stock disponible.
 * - CP-163: Verificar actualización automática del inventario.
 * - CP-164: Verificar almacenamiento de la cantidad registrada.
 * - CP-165: Verificar registro en auditoría (PENDIENTE - No implementado)
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

describe('RF-024: Pruebas de Integración - Validación de Cantidad en Movimientos', () => {
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
    productoActivo = await crearProductoDePrueba(productoRepo, 'Producto Cantidad Test', 1);
    usuarioAdmin = await crearUsuarioDePrueba(
      usuarioRepo,
      1,
      `admin_cantidad_${Date.now()}@gramas.com`
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
  // CP-159: REGISTRAR MOVIMIENTO CON CANTIDAD VÁLIDA
  // ============================================================================
  describe('CP-159: Registrar un movimiento con una cantidad válida', () => {
    it('debería registrar una entrada con cantidad válida (positiva)', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Entrada Valida ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 50);

      const cantidadValida = 25;

      const dto: CreateMovimientoEntradaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidadValida,
        detalle: 'Entrada con cantidad válida CP-159',
        id_proveedor: proveedorTest.id_proveedor,
        precio_unitario: 100,
        lote: 'LOTE-VALIDO-001',
      };

      const resultado = await service.registrarEntrada(dto);

      expect(resultado).toBeDefined();
      expect(resultado.mensaje).toBe('Entrada de grama registrada exitosamente');
      expect(resultado.id).toBeDefined();

      const movimientoEnBd = await movimientoRepo.findOne({
        where: { id_movimiento: resultado.id },
      });

      expect(movimientoEnBd).not.toBeNull();
      expect(movimientoEnBd?.cantidad).toBe(cantidadValida);
      expect(movimientoEnBd?.tipo).toBe('entrada');

      const stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(50 + cantidadValida);

      console.log(`✅ [CP-159] Entrada con cantidad válida: ${cantidadValida} unidades`);
    });

    it('debería registrar una salida con cantidad válida (positiva)', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Salida Valida ${Date.now()}`,
        1
      );
      
      const stockInicial = 100;
      await crearStockInicial(stockRepo, producto.id_producto, stockInicial);

      const cantidadValida = 35;

      const dto: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidadValida,
        detalle: 'Salida con cantidad válida CP-159',
        destino: 'Cliente Final',
        motivo: 'Venta Directa',
      };

      const resultado = await service.registrarSalida(dto);

      expect(resultado).toBeDefined();
      expect(resultado.mensaje).toBe('Salida de grama registrada exitosamente');
      expect(resultado.id).toBeDefined();

      const movimientoEnBd = await movimientoRepo.findOne({
        where: { id_movimiento: resultado.id },
      });

      expect(movimientoEnBd).not.toBeNull();
      expect(movimientoEnBd?.cantidad).toBe(cantidadValida);
      expect(movimientoEnBd?.tipo).toBe('salida');

      const stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(stockInicial - cantidadValida);

      console.log(`✅ [CP-159] Salida con cantidad válida: ${cantidadValida} unidades`);
    });
  });

  // ============================================================================
  // CP-160: INTENTAR REGISTRAR CANTIDAD IGUAL A CERO
  // ============================================================================
  describe('CP-160: Intentar registrar una cantidad igual a cero', () => {
    it('debería lanzar BadRequestException al intentar entrada con cantidad 0', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Cero Entrada ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 50);

      const dto: CreateMovimientoEntradaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: 0,
        detalle: 'Intento de entrada con cantidad 0',
        id_proveedor: proveedorTest.id_proveedor,
        precio_unitario: 100,
      };

      await expect(service.registrarEntrada(dto)).rejects.toThrow(
        BadRequestException
      );

      const stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(50);

      const movimientos = await movimientoRepo.find({
        where: { id_producto: producto.id_producto },
      });
      expect(movimientos.length).toBe(0);

      console.log(`✅ [CP-160] Cantidad 0 en entrada bloqueada correctamente`);
    });

    it('debería lanzar BadRequestException al intentar salida con cantidad 0', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Cero Salida ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 50);

      const dto: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: 0,
        detalle: 'Intento de salida con cantidad 0',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      await expect(service.registrarSalida(dto)).rejects.toThrow(
        BadRequestException
      );

      const stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(50);

      const movimientos = await movimientoRepo.find({
        where: { id_producto: producto.id_producto },
      });
      expect(movimientos.length).toBe(0);

      console.log(`✅ [CP-160] Cantidad 0 en salida bloqueada correctamente`);
    });
  });

  // ============================================================================
  // CP-161: INTENTAR REGISTRAR CANTIDAD NEGATIVA
  // ============================================================================
  describe('CP-161: Intentar registrar una cantidad negativa', () => {
    it('debería lanzar BadRequestException al intentar entrada con cantidad negativa', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Negativo Entrada ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 50);

      const dto: CreateMovimientoEntradaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: -10,
        detalle: 'Intento de entrada con cantidad negativa',
        id_proveedor: proveedorTest.id_proveedor,
        precio_unitario: 100,
      };

      await expect(service.registrarEntrada(dto)).rejects.toThrow(
        BadRequestException
      );

      const stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(50);

      const movimientos = await movimientoRepo.find({
        where: { id_producto: producto.id_producto },
      });
      expect(movimientos.length).toBe(0);

      console.log(`✅ [CP-161] Cantidad negativa en entrada bloqueada correctamente`);
    });

    it('debería lanzar BadRequestException al intentar salida con cantidad negativa', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Negativo Salida ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 50);

      const dto: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: -5,
        detalle: 'Intento de salida con cantidad negativa',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      await expect(service.registrarSalida(dto)).rejects.toThrow(
        BadRequestException
      );

      const stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(50);

      const movimientos = await movimientoRepo.find({
        where: { id_producto: producto.id_producto },
      });
      expect(movimientos.length).toBe(0);

      console.log(`✅ [CP-161] Cantidad negativa en salida bloqueada correctamente`);
    });
  });

  // ============================================================================
  // CP-162: INTENTAR REGISTRAR SALIDA CON CANTIDAD SUPERIOR AL STOCK
  // ============================================================================
  describe('CP-162: Intentar registrar una salida con cantidad superior al stock disponible', () => {
    it('debería lanzar BadRequestException al intentar salida con cantidad mayor al stock', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Stock Insuficiente ${Date.now()}`,
        1
      );
      
      const stockDisponible = 30;
      await crearStockInicial(stockRepo, producto.id_producto, stockDisponible);

      const cantidadMayor = 50;

      const dto: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidadMayor,
        detalle: 'Intento de salida con stock insuficiente',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      await expect(service.registrarSalida(dto)).rejects.toThrow(
        BadRequestException
      );

      const stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(stockDisponible);

      const movimientos = await movimientoRepo.find({
        where: { id_producto: producto.id_producto },
      });
      expect(movimientos.length).toBe(0);

      console.log(`✅ [CP-162] Salida con stock insuficiente bloqueada: disponible ${stockDisponible}, solicitado ${cantidadMayor}`);
    });

    it('debería lanzar BadRequestException al intentar salida con cantidad exactamente igual al stock + 1', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Stock Exacto ${Date.now()}`,
        1
      );
      
      const stockDisponible = 10;
      await crearStockInicial(stockRepo, producto.id_producto, stockDisponible);

      const cantidadMayor = 11;

      const dto: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidadMayor,
        detalle: 'Intento de salida excediendo stock',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      await expect(service.registrarSalida(dto)).rejects.toThrow(
        BadRequestException
      );

      const stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(stockDisponible);

      console.log(`✅ [CP-162] Salida con stock insuficiente bloqueada: disponible ${stockDisponible}, solicitado ${cantidadMayor}`);
    });

    it('debería permitir salida con cantidad igual al stock disponible', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Stock Justo ${Date.now()}`,
        1
      );
      
      const stockDisponible = 20;
      await crearStockInicial(stockRepo, producto.id_producto, stockDisponible);

      const cantidadJusta = 20;

      const dto: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidadJusta,
        detalle: 'Salida con cantidad justa al stock',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      const resultado = await service.registrarSalida(dto);

      expect(resultado).toBeDefined();
      expect(resultado.id).toBeDefined();

      const stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(0);

      console.log(`✅ [CP-162] Salida con cantidad justa al stock permitida: stock final 0`);
    }, 30000);
  });

  // ============================================================================
  // CP-163: VERIFICAR ACTUALIZACIÓN AUTOMÁTICA DEL INVENTARIO
  // ============================================================================
  describe('CP-163: Verificar actualización automática del inventario', () => {
    it('debería actualizar el stock automáticamente después de una entrada', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Actualizacion Entrada ${Date.now()}`,
        1
      );
      
      const stockInicial = 100;
      await crearStockInicial(stockRepo, producto.id_producto, stockInicial);

      const cantidadEntrada = 40;

      const dto: CreateMovimientoEntradaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidadEntrada,
        detalle: 'Entrada para actualizar stock',
        id_proveedor: proveedorTest.id_proveedor,
        precio_unitario: 100,
      };

      const resultado = await service.registrarEntrada(dto);

      const stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(stockInicial + cantidadEntrada);

      const movimiento = await movimientoRepo.findOne({
        where: { id_movimiento: resultado.id },
      });
      expect(movimiento?.cantidad).toBe(cantidadEntrada);

      console.log(`✅ [CP-163] Stock actualizado automáticamente: ${stockInicial} → ${stockActual?.cantidad_actual} (+${cantidadEntrada})`);
    }, 30000);

    it('debería actualizar el stock automáticamente después de una salida', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Actualizacion Salida ${Date.now()}`,
        1
      );
      
      const stockInicial = 80;
      await crearStockInicial(stockRepo, producto.id_producto, stockInicial);

      const cantidadSalida = 25;

      const dto: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidadSalida,
        detalle: 'Salida para actualizar stock',
        destino: 'Cliente',
        motivo: 'Venta',
      };

      const resultado = await service.registrarSalida(dto);

      const stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(stockInicial - cantidadSalida);

      const movimiento = await movimientoRepo.findOne({
        where: { id_movimiento: resultado.id },
      });
      expect(movimiento?.cantidad).toBe(cantidadSalida);

      console.log(`✅ [CP-163] Stock actualizado automáticamente: ${stockInicial} → ${stockActual?.cantidad_actual} (-${cantidadSalida})`);
    }, 30000);

    it('debería actualizar el stock correctamente con múltiples operaciones consecutivas', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Multi Actualizacion ${Date.now()}`,
        1
      );
      
      const stockInicial = 200;
      await crearStockInicial(stockRepo, producto.id_producto, stockInicial);

      const operaciones = [
        { tipo: 'entrada', cantidad: 50 },
        { tipo: 'salida', cantidad: 30 },
        { tipo: 'entrada', cantidad: 20 },
        { tipo: 'salida', cantidad: 15 },
        { tipo: 'entrada', cantidad: 10 },
      ];

      let stockEsperado = stockInicial;

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

      console.log(`✅ [CP-163] Múltiples operaciones - Stock final: ${stockFinal?.cantidad_actual}`);
    }, 30000);
  });

  // ============================================================================
  // CP-164: VERIFICAR ALMACENAMIENTO DE LA CANTIDAD REGISTRADA
  // ============================================================================
  describe('CP-164: Verificar almacenamiento de la cantidad registrada', () => {
    it('debería almacenar correctamente la cantidad en la tabla movimiento para entrada', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Almacenar Entrada ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 50);

      const cantidad = 35;

      const dto: CreateMovimientoEntradaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidad,
        detalle: 'Entrada para almacenar cantidad',
        id_proveedor: proveedorTest.id_proveedor,
        precio_unitario: 100,
        lote: 'LOTE-ALM-001',
      };

      const resultado = await service.registrarEntrada(dto);

      const movimientoEnBd = await movimientoRepo.findOne({
        where: { id_movimiento: resultado.id },
        relations: ['entrada'],
      });

      expect(movimientoEnBd).not.toBeNull();
      expect(movimientoEnBd?.cantidad).toBe(cantidad);
      expect(movimientoEnBd?.tipo).toBe('entrada');
      expect(movimientoEnBd?.entrada).not.toBeNull();
      expect(movimientoEnBd?.entrada.id_proveedor).toBe(proveedorTest.id_proveedor);

      console.log(`✅ [CP-164] Cantidad almacenada en movimiento: ${movimientoEnBd?.cantidad} (entrada)`);
    }, 30000);

    it('debería almacenar correctamente la cantidad en la tabla movimiento para salida', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Almacenar Salida ${Date.now()}`,
        1
      );
      
      const stockInicial = 100;
      await crearStockInicial(stockRepo, producto.id_producto, stockInicial);

      const cantidad = 45;

      const dto: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidad,
        detalle: 'Salida para almacenar cantidad',
        destino: 'Cliente Final',
        motivo: 'Venta Directa',
        observaciones: 'Prueba de almacenamiento',
      };

      const resultado = await service.registrarSalida(dto);

      const movimientoEnBd = await movimientoRepo.findOne({
        where: { id_movimiento: resultado.id },
        relations: ['salida'],
      });

      expect(movimientoEnBd).not.toBeNull();
      expect(movimientoEnBd?.cantidad).toBe(cantidad);
      expect(movimientoEnBd?.tipo).toBe('salida');
      expect(movimientoEnBd?.salida).not.toBeNull();
      expect(movimientoEnBd?.salida.destino).toBe('Cliente Final');
      expect(movimientoEnBd?.salida.motivo).toBe('Venta Directa');

      console.log(`✅ [CP-164] Cantidad almacenada en movimiento: ${movimientoEnBd?.cantidad} (salida)`);
    }, 30000);

    it('debería almacenar cantidades grandes correctamente', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Gran Cantidad ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 0);

      const cantidadGrande = 999999;

      const dto: CreateMovimientoEntradaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidadGrande,
        detalle: 'Entrada con cantidad grande',
        id_proveedor: proveedorTest.id_proveedor,
        precio_unitario: 100,
      };

      const resultado = await service.registrarEntrada(dto);

      const movimientoEnBd = await movimientoRepo.findOne({
        where: { id_movimiento: resultado.id },
      });

      expect(movimientoEnBd).not.toBeNull();
      expect(movimientoEnBd?.cantidad).toBe(cantidadGrande);

      const stockActual = await stockRepo.findOne({
        where: { id_producto: producto.id_producto },
      });
      expect(stockActual?.cantidad_actual).toBe(cantidadGrande);

      console.log(`✅ [CP-164] Cantidad grande almacenada correctamente: ${movimientoEnBd?.cantidad}`);
    });
  });

  // ============================================================================
  // CP-165: VERIFICAR REGISTRO EN AUDITORÍA (PENDIENTE)
  // ============================================================================
  describe('CP-165: Verificar registro en auditoría', () => {
    it('PENDIENTE - La funcionalidad de auditoría no está implementada actualmente', () => {
      console.log(`📝 [CP-165] La funcionalidad de auditoría no está implementada en el sistema actual.`);

      expect(true).toBe(true);
    });
  });
});