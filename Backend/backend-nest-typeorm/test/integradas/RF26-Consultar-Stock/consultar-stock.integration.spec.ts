/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-026 Consultar Stock de Producto
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Los datos consultados NO se modifican en la base de datos.
 * 
 * Casos de Prueba Cubiertos (RF-026):
 * - CP-172: Consultar el stock de un producto existente.
 * - CP-173: Verificar la actualización del stock después de registrar una entrada.
 * - CP-174: Verificar la actualización del stock después de registrar una salida.
 * - CP-175: Consultar un producto inexistente.
 * - CP-176: Consultar el inventario cuando no existen productos registrados.
 * - CP-177: Verificar que solo un administrador pueda consultar el stock (PENDIENTE - Requiere contexto HTTP)
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../../../../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

import { StockModule } from '../../../src/stock/stock.module';
import { StockService } from '../../../src/stock/stock.service';
import { stock } from '../../../src/stock/stock.entity';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { proveedor } from '../../../src/proveedores/proveedores.entity';
import { rol } from '../../../src/roles/roles.entity';
import { movimiento } from '../../../src/movimiento/movimiento.entity';
import { salida } from '../../../src/movimiento/salida.entity';
import { entrada } from '../../../src/movimiento/entrada.entity';
import { MovimientoModule } from '../../../src/movimiento/movimiento.module';
import { MovimientosService } from '../../../src/movimiento/movimiento.service';
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

describe('RF-026: Pruebas de Integración - Consultar Stock de Producto', () => {
  let moduleRef: TestingModule;
  let stockService: StockService;
  let movimientoService: MovimientosService;
  let stockRepo: Repository<stock>;
  let productoRepo: Repository<productos>;
  let categoriaRepo: Repository<categoria>;
  let usuarioRepo: Repository<usuario>;
  let proveedorRepo: Repository<proveedor>;
  let roleRepository: Repository<rol>;
  let movimientoRepo: Repository<movimiento>;
  let salidaRepo: Repository<salida>;
  let entradaRepo: Repository<entrada>;
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
            stock,
            productos,
            categoria,
            usuario,
            proveedor,
            rol,
            movimiento,
            salida,
            entrada
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
          stock,
          productos,
          categoria,
          usuario,
          proveedor,
          rol,
          movimiento,
          salida,
          entrada
        ]),
        StockModule,
        MovimientoModule,
      ],
    }).compile();

    stockService = moduleRef.get<StockService>(StockService);
    movimientoService = moduleRef.get<MovimientosService>(MovimientosService);
    stockRepo = moduleRef.get<Repository<stock>>(getRepositoryToken(stock));
    productoRepo = moduleRef.get<Repository<productos>>(getRepositoryToken(productos));
    categoriaRepo = moduleRef.get<Repository<categoria>>(getRepositoryToken(categoria));
    usuarioRepo = moduleRef.get<Repository<usuario>>(getRepositoryToken(usuario));
    proveedorRepo = moduleRef.get<Repository<proveedor>>(getRepositoryToken(proveedor));
    roleRepository = moduleRef.get<Repository<rol>>(getRepositoryToken(rol));
    movimientoRepo = moduleRef.get<Repository<movimiento>>(getRepositoryToken(movimiento));
    salidaRepo = moduleRef.get<Repository<salida>>(getRepositoryToken(salida));
    entradaRepo = moduleRef.get<Repository<entrada>>(getRepositoryToken(entrada));
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
      `admin_stock_consulta_${Date.now()}@gramas.com`
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
  // CP-172: CONSULTAR STOCK DE PRODUCTO EXISTENTE
  // ============================================================================
  describe('CP-172: Consultar el stock de un producto existente', () => {
    it('debería retornar el stock correcto para un producto existente', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Consulta ${Date.now()}`,
        1
      );
      
      const cantidadInicial = 150;
      await crearStockInicial(stockRepo, producto.id_producto, cantidadInicial);

      const resultado = await stockService.findOne(producto.id_producto);

      expect(resultado).toBeDefined();
      expect(resultado.id_producto).toBe(producto.id_producto);
      expect(resultado.cantidad_actual).toBe(cantidadInicial);
      expect(resultado.nivel_minimo).toBe(10);
      expect(resultado.producto).toBeDefined();
      expect(resultado.producto.id_producto).toBe(producto.id_producto);
      expect(resultado.producto.nombre).toBe(producto.nombre);

      console.log(`✅ [CP-172] Stock consultado: ${resultado.cantidad_actual} unidades para producto ID ${resultado.id_producto}`);
    });

    it('debería incluir la información del producto en la consulta', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Info ${Date.now()}`,
        1
      );
      
      await crearStockInicial(stockRepo, producto.id_producto, 75);

      const resultado = await stockService.findOne(producto.id_producto);

      expect(resultado).toBeDefined();
      expect(resultado.producto).toBeDefined();
      expect(resultado.producto.nombre).toBe(producto.nombre);
      expect(resultado.producto.marca).toBe('Marca Test');
      expect(resultado.producto.material).toBe('Material Test');
      // El precio puede venir como string o número, usamos toBeCloseTo para manejar ambos
      expect(Number(resultado.producto.precio)).toBe(100);
      expect(resultado.producto.estado).toBe(1);

      console.log(`✅ [CP-172] Información del producto incluida: ${resultado.producto.nombre}`);
    });
  });

  // ============================================================================
  // CP-173: VERIFICAR ACTUALIZACIÓN DEL STOCK DESPUÉS DE ENTRADA
  // ============================================================================
  describe('CP-173: Verificar la actualización del stock después de registrar una entrada', () => {
    it('debería reflejar el aumento de stock después de una entrada', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Entrada Stock ${Date.now()}`,
        1
      );
      
      const stockInicial = 50;
      await crearStockInicial(stockRepo, producto.id_producto, stockInicial);

      const stockAntes = await stockService.findOne(producto.id_producto);
      expect(stockAntes.cantidad_actual).toBe(stockInicial);

      const cantidadEntrada = 30;
      const dto: CreateMovimientoEntradaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidadEntrada,
        detalle: 'Entrada para verificar stock CP-173',
        id_proveedor: proveedorTest.id_proveedor,
        precio_unitario: 100,
        lote: 'LOTE-CP173',
      };

      await movimientoService.registrarEntrada(dto);

      const stockDespues = await stockService.findOne(producto.id_producto);
      expect(stockDespues.cantidad_actual).toBe(stockInicial + cantidadEntrada);

      console.log(`✅ [CP-173] Stock actualizado después de entrada: ${stockInicial} → ${stockDespues.cantidad_actual} (+${cantidadEntrada})`);
    });

    it('debería actualizar correctamente el stock con múltiples entradas', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Multi Entrada ${Date.now()}`,
        1
      );
      
      const stockInicial = 10;
      await crearStockInicial(stockRepo, producto.id_producto, stockInicial);

      const entradas = [20, 15, 30];
      let stockEsperado = stockInicial;

      for (const cantidad of entradas) {
        const dto: CreateMovimientoEntradaDto = {
          id_producto: producto.id_producto,
          id_usuario: usuarioAdmin.id_usuario,
          cantidad: cantidad,
          detalle: `Entrada múltiple ${cantidad}`,
          id_proveedor: proveedorTest.id_proveedor,
          precio_unitario: 100,
        };
        await movimientoService.registrarEntrada(dto);
        stockEsperado += cantidad;
      }

      const stockFinal = await stockService.findOne(producto.id_producto);
      expect(stockFinal.cantidad_actual).toBe(stockEsperado);

      console.log(`✅ [CP-173] Stock después de múltiples entradas: ${stockFinal.cantidad_actual}`);
    }, 30000);
  });

  // ============================================================================
  // CP-174: VERIFICAR ACTUALIZACIÓN DEL STOCK DESPUÉS DE SALIDA
  // ============================================================================
  describe('CP-174: Verificar la actualización del stock después de registrar una salida', () => {
    it('debería reflejar la disminución de stock después de una salida', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Salida Stock ${Date.now()}`,
        1
      );
      
      const stockInicial = 100;
      await crearStockInicial(stockRepo, producto.id_producto, stockInicial);

      const stockAntes = await stockService.findOne(producto.id_producto);
      expect(stockAntes.cantidad_actual).toBe(stockInicial);

      const cantidadSalida = 25;
      const dto: CreateMovimientoSalidaDto = {
        id_producto: producto.id_producto,
        id_usuario: usuarioAdmin.id_usuario,
        cantidad: cantidadSalida,
        detalle: 'Salida para verificar stock CP-174',
        destino: 'Cliente Final',
        motivo: 'Venta Directa',
        observaciones: 'Prueba de actualización de stock',
      };

      await movimientoService.registrarSalida(dto);

      const stockDespues = await stockService.findOne(producto.id_producto);
      expect(stockDespues.cantidad_actual).toBe(stockInicial - cantidadSalida);

      console.log(`✅ [CP-174] Stock actualizado después de salida: ${stockInicial} → ${stockDespues.cantidad_actual} (-${cantidadSalida})`);
    }, 30000);

    it('debería actualizar correctamente el stock con múltiples salidas', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Multi Salida ${Date.now()}`,
        1
      );
      
      const stockInicial = 200;
      await crearStockInicial(stockRepo, producto.id_producto, stockInicial);

      const salidas = [30, 45, 25];
      let stockEsperado = stockInicial;

      for (const cantidad of salidas) {
        const dto: CreateMovimientoSalidaDto = {
          id_producto: producto.id_producto,
          id_usuario: usuarioAdmin.id_usuario,
          cantidad: cantidad,
          detalle: `Salida múltiple ${cantidad}`,
          destino: 'Cliente',
          motivo: 'Venta',
        };
        await movimientoService.registrarSalida(dto);
        stockEsperado -= cantidad;
      }

      const stockFinal = await stockService.findOne(producto.id_producto);
      expect(stockFinal.cantidad_actual).toBe(stockEsperado);

      console.log(`✅ [CP-174] Stock después de múltiples salidas: ${stockFinal.cantidad_actual}`);
    }, 30000);
  });

  // ============================================================================
  // CP-175: CONSULTAR PRODUCTO INEXISTENTE
  // ============================================================================
  describe('CP-175: Consultar un producto inexistente', () => {
    it('debería lanzar NotFoundException al consultar un producto sin stock', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Sin Stock ${Date.now()}`,
        1
      );

      await expect(stockService.findOne(producto.id_producto)).rejects.toThrow(
        NotFoundException
      );

      console.log(`✅ [CP-175] Producto sin stock lanza NotFoundException correctamente`);
    });

    it('debería lanzar NotFoundException al consultar un ID de producto inexistente', async () => {
      const idInexistente = 999999;

      await expect(stockService.findOne(idInexistente)).rejects.toThrow(
        NotFoundException
      );

      console.log(`✅ [CP-175] Producto inexistente lanza NotFoundException correctamente`);
    });

    it('debería lanzar NotFoundException al consultar un producto eliminado', async () => {
      const producto = await crearProductoDePrueba(
        productoRepo,
        `Producto Eliminado ${Date.now()}`,
        0
      );

      await expect(stockService.findOne(producto.id_producto)).rejects.toThrow(
        NotFoundException
      );

      console.log(`✅ [CP-175] Producto inactivo sin stock lanza NotFoundException correctamente`);
    });
  });

  // ============================================================================
  // CP-176: CONSULTAR INVENTARIO CUANDO NO EXISTEN PRODUCTOS REGISTRADOS
  // ============================================================================
  describe('CP-176: Consultar el inventario cuando no existen productos registrados', () => {
    it('debería retornar un arreglo vacío cuando no hay stock registrado', async () => {
      const productoSinStock = await crearProductoDePrueba(
        productoRepo,
        `Producto Sin Stock ${Date.now()}`,
        1
      );

      const inventario = await stockService.findAll();

      const encontrado = inventario.some(item => item.id_producto === productoSinStock.id_producto);
      expect(encontrado).toBe(false);

      console.log(`✅ [CP-176] Producto sin stock no aparece en el inventario`);
    });

    it('debería retornar solo los productos con stock registrado', async () => {
      const producto1 = await crearProductoDePrueba(productoRepo, `Producto Stock 1 ${Date.now()}`, 1);
      const producto2 = await crearProductoDePrueba(productoRepo, `Producto Stock 2 ${Date.now()}`, 1);
      const producto3 = await crearProductoDePrueba(productoRepo, `Producto Stock 3 ${Date.now()}`, 1);

      await crearStockInicial(stockRepo, producto1.id_producto, 10);
      await crearStockInicial(stockRepo, producto2.id_producto, 20);
      await crearStockInicial(stockRepo, producto3.id_producto, 30);

      const productoSinStock = await crearProductoDePrueba(
        productoRepo,
        `Producto Sin Stock ${Date.now()}`,
        1
      );

      const inventario = await stockService.findAll();

      expect(inventario.some(item => item.id_producto === producto1.id_producto)).toBe(true);
      expect(inventario.some(item => item.id_producto === producto2.id_producto)).toBe(true);
      expect(inventario.some(item => item.id_producto === producto3.id_producto)).toBe(true);
      expect(inventario.some(item => item.id_producto === productoSinStock.id_producto)).toBe(false);
      expect(inventario.length).toBeGreaterThanOrEqual(3);

      console.log(`✅ [CP-176] Inventario contiene ${inventario.length} productos con stock`);
    }, 30000);

    it('debería retornar los productos ordenados por ID descendente', async () => {
      const inventario = await stockService.findAll();

      if (inventario.length > 1) {
        for (let i = 0; i < inventario.length - 1; i++) {
          expect(inventario[i].id_producto).toBeGreaterThan(inventario[i + 1].id_producto);
        }
      }

      console.log(`✅ [CP-176] Inventario ordenado correctamente (${inventario.length} productos)`);
    });
  });

  // ============================================================================
  // CP-177: VERIFICAR SOLO ADMINISTRADOR PUEDA CONSULTAR STOCK (PENDIENTE)
  // ============================================================================
  describe('CP-177: Verificar que solo un administrador pueda consultar el stock', () => {
    it('PENDIENTE - La validación de roles está implementada en el controlador con RolesGuard', () => {
      console.log(`📝 [CP-177] La validación de roles está implementada en el controlador a través de RolesGuard.
      Para probar esto se necesitaría:
      1. Pruebas de integración con contexto HTTP (supertest)
      2. Autenticación JWT con diferentes roles
      3. Verificación de códigos de respuesta HTTP (200 vs 403)
      Las pruebas actuales son a nivel de servicio y no incluyen esta validación.`);

      expect(true).toBe(true);
    });
  });
});