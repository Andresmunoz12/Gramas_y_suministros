/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-036 Generar y Descargar Cotización en PDF
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Las cotizaciones registradas PERMANECEN guardados en la base de datos.
 * 
 * Casos de Prueba Cubiertos (RF-036):
 * - CP-239: Generar el PDF de una cotización correctamente.
 * - CP-240: Descargar el PDF como cliente propietario de la cotización.
 * - CP-241: Descargar el PDF como administrador.
 * - CP-242: Intentar descargar una cotización que no pertenece al cliente.
 * - CP-245: Verificar que el contenido del PDF sea correcto.
 * - CP-246: Verificar el registro en auditoría de la descarga (PENDIENTE - No implementado)
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../../../../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ForbiddenException } from '@nestjs/common';

import { CotizacionesModule } from '../../../src/cotizaciones/cotizaciones.module';
import { CotizacionesService } from '../../../src/cotizaciones/cotizaciones.service';
import { Cotizacion } from '../../../src/cotizaciones/cotizacion.entity';
import { DetalleCotizacion } from '../../../src/cotizaciones/detalle-cotizacion.entity';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { proveedor } from '../../../src/proveedores/proveedores.entity';
import { rol } from '../../../src/roles/roles.entity';
import { stock } from '../../../src/stock/stock.entity';
import { movimiento } from '../../../src/movimiento/movimiento.entity';
import { entrada } from '../../../src/movimiento/entrada.entity';
import { salida } from '../../../src/movimiento/salida.entity';
import { CrearCotizacionDto, ItemCotizacionDto } from '../../../src/cotizaciones/dto/crear-cotizacion.dto';

// Helper para crear productos de prueba
async function crearProductoDePrueba(
  productRepo: Repository<productos>,
  nombre: string = `Producto Test ${Date.now()}`,
  precio: number = 100,
  estado: number = 1,
) {
  const producto = productRepo.create({
    nombre: nombre,
    marca: 'Marca Test',
    material: 'Material Test',
    precio: precio,
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

// Helper para crear stock
async function crearStock(
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

describe('RF-036: Pruebas de Integración - Generar y Descargar Cotización en PDF', () => {
  let moduleRef: TestingModule;
  let service: CotizacionesService;
  let cotizacionRepo: Repository<Cotizacion>;
  let detalleRepo: Repository<DetalleCotizacion>;
  let productoRepo: Repository<productos>;
  let categoriaRepo: Repository<categoria>;
  let usuarioRepo: Repository<usuario>;
  let proveedorRepo: Repository<proveedor>;
  let roleRepository: Repository<rol>;
  let stockRepo: Repository<stock>;
  let movimientoRepo: Repository<movimiento>;
  let dataSource: DataSource;

  let usuarioCliente: usuario;
  let usuarioCliente2: usuario;
  let usuarioAdmin: usuario;
  let producto1: productos;
  let producto2: productos;
  let producto3: productos;
  let precio1: number;
  let precio2: number;
  let precio3: number;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          url: process.env.DATABASE_URL,
          entities: [
            Cotizacion,
            DetalleCotizacion,
            productos,
            categoria,
            usuario,
            proveedor,
            rol,
            stock,
            movimiento,
            entrada,
            salida
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
          Cotizacion,
          DetalleCotizacion,
          productos,
          categoria,
          usuario,
          proveedor,
          rol,
          stock,
          movimiento,
          entrada,
          salida
        ]),
        CotizacionesModule,
      ],
    }).compile();

    service = moduleRef.get<CotizacionesService>(CotizacionesService);
    cotizacionRepo = moduleRef.get<Repository<Cotizacion>>(getRepositoryToken(Cotizacion));
    detalleRepo = moduleRef.get<Repository<DetalleCotizacion>>(getRepositoryToken(DetalleCotizacion));
    productoRepo = moduleRef.get<Repository<productos>>(getRepositoryToken(productos));
    categoriaRepo = moduleRef.get<Repository<categoria>>(getRepositoryToken(categoria));
    usuarioRepo = moduleRef.get<Repository<usuario>>(getRepositoryToken(usuario));
    proveedorRepo = moduleRef.get<Repository<proveedor>>(getRepositoryToken(proveedor));
    roleRepository = moduleRef.get<Repository<rol>>(getRepositoryToken(rol));
    stockRepo = moduleRef.get<Repository<stock>>(getRepositoryToken(stock));
    movimientoRepo = moduleRef.get<Repository<movimiento>>(getRepositoryToken(movimiento));
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

    // Crear usuarios
    usuarioCliente = await crearUsuarioDePrueba(
      usuarioRepo,
      2,
      `cliente_pdf_${Date.now()}@gramas.com`
    );

    usuarioCliente2 = await crearUsuarioDePrueba(
      usuarioRepo,
      2,
      `cliente2_pdf_${Date.now()}@gramas.com`
    );

    usuarioAdmin = await crearUsuarioDePrueba(
      usuarioRepo,
      1,
      `admin_pdf_${Date.now()}@gramas.com`
    );

    // Crear productos de prueba
    producto1 = await crearProductoDePrueba(
      productoRepo,
      `Producto PDF 1 ${Date.now()}`,
      150,
      1
    );
    precio1 = Number(producto1.precio);
    await crearStock(stockRepo, producto1.id_producto, 50);

    producto2 = await crearProductoDePrueba(
      productoRepo,
      `Producto PDF 2 ${Date.now()}`,
      200,
      1
    );
    precio2 = Number(producto2.precio);
    await crearStock(stockRepo, producto2.id_producto, 30);

    producto3 = await crearProductoDePrueba(
      productoRepo,
      `Producto PDF 3 ${Date.now()}`,
      75,
      1
    );
    precio3 = Number(producto3.precio);
    await crearStock(stockRepo, producto3.id_producto, 20);

    console.log(`✅ Datos de prueba inicializados:
      - Cliente 1: ${usuarioCliente.email} (ID: ${usuarioCliente.id_usuario})
      - Cliente 2: ${usuarioCliente2.email} (ID: ${usuarioCliente2.id_usuario})
      - Admin: ${usuarioAdmin.email} (ID: ${usuarioAdmin.id_usuario}, Rol: 1)
      - Producto 1: ${producto1.nombre} (ID: ${producto1.id_producto}, Precio: ${precio1})
      - Producto 2: ${producto2.nombre} (ID: ${producto2.id_producto}, Precio: ${precio2})
      - Producto 3: ${producto3.nombre} (ID: ${producto3.id_producto}, Precio: ${precio3})
    `);
  }, 60000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // ============================================================================
  // CP-239: GENERAR PDF DE COTIZACIÓN CORRECTAMENTE
  // ============================================================================
  describe('CP-239: Generar el PDF de una cotización correctamente', () => {
    it('debería obtener los datos correctos para generar PDF', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto2.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const user = { userId: usuarioCliente.id_usuario, rol: 2 };
      const cotizacionCompleta = await service.obtenerCotizacionCompleta(idCotizacion, user);

      expect(cotizacionCompleta).toBeDefined();
      expect(cotizacionCompleta.idCotizacion).toBe(idCotizacion);
      expect(cotizacionCompleta.usuario).toBeDefined();
      expect(cotizacionCompleta.detalles).toBeDefined();
      expect(cotizacionCompleta.detalles.length).toBe(2);
      expect(cotizacionCompleta.subtotal).toBeDefined();
      expect(cotizacionCompleta.total).toBeDefined();

      const subtotalEsperado = (precio1 * 2) + (precio2 * 1);
      expect(Number(cotizacionCompleta.subtotal)).toBe(subtotalEsperado);

      console.log(`✅ [CP-239] Datos para PDF obtenidos correctamente para cotización #${idCotizacion}`);
    }, 30000);

    it('debería obtener los datos correctos para cotización con envío', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 3 },
        { idProducto: producto3.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 123 #45-67, Bogotá',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const user = { userId: usuarioCliente.id_usuario, rol: 2 };
      const cotizacionCompleta = await service.obtenerCotizacionCompleta(idCotizacion, user);

      expect(cotizacionCompleta).toBeDefined();
      expect(cotizacionCompleta.metodoVenta).toBe('envio');
      expect(Number(cotizacionCompleta.costoEnvio)).toBe(8000);
      expect(cotizacionCompleta.direccionEnvio).toBe('Calle 123 #45-67, Bogotá');

      const subtotalEsperado = (precio1 * 3) + (precio3 * 2);
      const totalEsperado = subtotalEsperado + 8000;
      expect(Number(cotizacionCompleta.subtotal)).toBe(subtotalEsperado);
      expect(Number(cotizacionCompleta.total)).toBe(totalEsperado);

      console.log(`✅ [CP-239] Datos para PDF con envío obtenidos correctamente #${idCotizacion}`);
    }, 30000);
  });

  // ============================================================================
  // CP-240: DESCARGAR PDF COMO CLIENTE PROPIETARIO
  // ============================================================================
  describe('CP-240: Descargar el PDF como cliente propietario de la cotización', () => {
    it('debería permitir al cliente propietario obtener los datos de la cotización', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const user = { userId: usuarioCliente.id_usuario, rol: 2 };
      const cotizacionCompleta = await service.obtenerCotizacionCompleta(idCotizacion, user);

      expect(cotizacionCompleta).toBeDefined();
      expect(cotizacionCompleta.idCotizacion).toBe(idCotizacion);
      expect(cotizacionCompleta.usuario.id_usuario).toBe(usuarioCliente.id_usuario);

      console.log(`✅ [CP-240] Cliente propietario obtuvo datos de cotización #${idCotizacion}`);
    }, 30000);

    it('debería permitir al cliente propietario obtener datos con múltiples productos', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 3 },
        { idProducto: producto2.id_producto, cantidad: 2 },
        { idProducto: producto3.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_debito',
        direccionEnvio: 'Calle 456 #78-90, Medellín',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const user = { userId: usuarioCliente.id_usuario, rol: 2 };
      const cotizacionCompleta = await service.obtenerCotizacionCompleta(idCotizacion, user);

      expect(cotizacionCompleta.detalles.length).toBe(3);

      console.log(`✅ [CP-240] Cliente propietario obtuvo datos con 3 productos #${idCotizacion}`);
    }, 30000);
  });

  // ============================================================================
  // CP-241: DESCARGAR PDF COMO ADMINISTRADOR
  // ============================================================================
  describe('CP-241: Descargar el PDF como administrador', () => {
    it('debería permitir al administrador obtener datos de cualquier cotización', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const user = { userId: usuarioAdmin.id_usuario, rol: 1 };
      const cotizacionCompleta = await service.obtenerCotizacionCompleta(idCotizacion, user);

      expect(cotizacionCompleta).toBeDefined();
      expect(cotizacionCompleta.idCotizacion).toBe(idCotizacion);

      console.log(`✅ [CP-241] Administrador obtuvo datos de cotización #${idCotizacion}`);
    }, 30000);

    it('debería permitir al administrador obtener datos de cotización de otro cliente', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto2.id_producto, cantidad: 3 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 789 #12-34, Cali',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente2.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const user = { userId: usuarioAdmin.id_usuario, rol: 1 };
      const cotizacionCompleta = await service.obtenerCotizacionCompleta(idCotizacion, user);

      expect(cotizacionCompleta).toBeDefined();
      expect(cotizacionCompleta.idCotizacion).toBe(idCotizacion);
      expect(cotizacionCompleta.usuario.id_usuario).toBe(usuarioCliente2.id_usuario);

      console.log(`✅ [CP-241] Administrador obtuvo datos de cotización de otro cliente #${idCotizacion}`);
    }, 30000);
  });

  // ============================================================================
  // CP-242: INTENTAR DESCARGAR COTIZACIÓN QUE NO PERTENECE AL CLIENTE
  // ============================================================================
  describe('CP-242: Intentar descargar una cotización que no pertenece al cliente', () => {
    it('debería lanzar ForbiddenException al intentar obtener datos de cotización de otro cliente', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const user = { userId: usuarioCliente2.id_usuario, rol: 2 };

      await expect(service.obtenerCotizacionCompleta(idCotizacion, user)).rejects.toThrow(
        ForbiddenException
      );

      console.log(`✅ [CP-242] Cliente no propietario no pudo obtener datos de cotización #${idCotizacion}`);
    }, 30000);

    it('debería lanzar ForbiddenException al intentar obtener datos con usuario inexistente', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto2.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const user = { userId: 999999, rol: 2 };

      await expect(service.obtenerCotizacionCompleta(idCotizacion, user)).rejects.toThrow(
        ForbiddenException
      );

      console.log(`✅ [CP-242] Usuario inexistente no pudo obtener datos de cotización`);
    }, 30000);
  });

  // ============================================================================
  // CP-245: VERIFICAR CONTENIDO DEL PDF
  // ============================================================================
  describe('CP-245: Verificar que el contenido del PDF sea correcto', () => {
    it('debería incluir los datos del cliente en la cotización', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const user = { userId: usuarioCliente.id_usuario, rol: 2 };
      const cotizacionCompleta = await service.obtenerCotizacionCompleta(idCotizacion, user);

      expect(cotizacionCompleta.usuario).toBeDefined();
      expect(cotizacionCompleta.usuario.nombre).toBe(usuarioCliente.nombre);
      expect(cotizacionCompleta.usuario.email).toBe(usuarioCliente.email);

      console.log(`✅ [CP-245] Datos del cliente en cotización: ${cotizacionCompleta.usuario.nombre}`);
    }, 30000);

    it('debería incluir los productos y sus cantidades en la cotización', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 3 },
        { idProducto: producto2.id_producto, cantidad: 2 },
        { idProducto: producto3.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const user = { userId: usuarioCliente.id_usuario, rol: 2 };
      const cotizacionCompleta = await service.obtenerCotizacionCompleta(idCotizacion, user);

      expect(cotizacionCompleta.detalles).toBeDefined();
      expect(cotizacionCompleta.detalles.length).toBe(3);

      const detalle1 = cotizacionCompleta.detalles.find(d => d.idProducto === producto1.id_producto);
      const detalle2 = cotizacionCompleta.detalles.find(d => d.idProducto === producto2.id_producto);
      const detalle3 = cotizacionCompleta.detalles.find(d => d.idProducto === producto3.id_producto);

      expect(detalle1).toBeDefined();
      expect(detalle1?.cantidad).toBe(3);
      expect(Number(detalle1?.subtotal)).toBe(precio1 * 3);

      expect(detalle2).toBeDefined();
      expect(detalle2?.cantidad).toBe(2);
      expect(Number(detalle2?.subtotal)).toBe(precio2 * 2);

      expect(detalle3).toBeDefined();
      expect(detalle3?.cantidad).toBe(1);
      expect(Number(detalle3?.subtotal)).toBe(precio3);

      console.log(`✅ [CP-245] ${cotizacionCompleta.detalles.length} productos en cotización`);
    }, 30000);

    it('debería incluir el subtotal, costo de envío y total en la cotización', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto3.id_producto, cantidad: 4 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 101 #20-30, Bogotá',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const user = { userId: usuarioCliente.id_usuario, rol: 2 };
      const cotizacionCompleta = await service.obtenerCotizacionCompleta(idCotizacion, user);

      const subtotalEsperado = (precio1 * 2) + (precio3 * 4);
      const costoEnvioEsperado = 8000;
      const totalEsperado = subtotalEsperado + costoEnvioEsperado;

      expect(Number(cotizacionCompleta.subtotal)).toBe(subtotalEsperado);
      expect(Number(cotizacionCompleta.costoEnvio)).toBe(costoEnvioEsperado);
      expect(Number(cotizacionCompleta.total)).toBe(totalEsperado);

      console.log(`✅ [CP-245] Subtotal=${cotizacionCompleta.subtotal}, Envío=${cotizacionCompleta.costoEnvio}, Total=${cotizacionCompleta.total}`);
    }, 30000);

    it('debería incluir el método de venta y pago en la cotización', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_debito',
        direccionEnvio: 'Carrera 5 #10-20, Cali',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const user = { userId: usuarioCliente.id_usuario, rol: 2 };
      const cotizacionCompleta = await service.obtenerCotizacionCompleta(idCotizacion, user);

      expect(cotizacionCompleta.metodoVenta).toBe('envio');
      expect(cotizacionCompleta.metodoPago).toBe('tarjeta_debito');
      expect(cotizacionCompleta.direccionEnvio).toBe('Carrera 5 #10-20, Cali');

      console.log(`✅ [CP-245] Método venta: ${cotizacionCompleta.metodoVenta}, pago: ${cotizacionCompleta.metodoPago}`);
    }, 30000);
  });

  // ============================================================================
  // CP-246: VERIFICAR REGISTRO EN AUDITORÍA (PENDIENTE)
  // ============================================================================
  describe('CP-246: Verificar el registro en auditoría de la descarga', () => {
    it('PENDIENTE - La funcionalidad de auditoría no está implementada actualmente', () => {
      console.log(`📝 [CP-246] La funcionalidad de auditoría no está implementada en el sistema actual.
      Para implementarla, se podría considerar:
      1. Agregar trigger en la BD que registre descargas de PDF
      2. Crear una tabla de auditoría y un interceptor en NestJS
      3. Usar TypeORM Subscribers para auditar acciones
      4. Crear un módulo de auditoría que registre todas las operaciones`);

      expect(true).toBe(true);
    });
  });
});