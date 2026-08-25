/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-033 Estados de Cotización
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
 * Casos de Prueba Cubiertos (RF-033):
 * - CP-221: Cambiar una cotización de Pendiente a Pagada.
 * - CP-222: Cambiar una cotización de Pagada a Entregada.
 * - CP-223: Cambiar una cotización a Cancelada.
 * - CP-225: Ejecución automática del descuento de inventario al pasar a Entregada.
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../../../../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

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

describe('RF-033: Pruebas de Integración - Estados de Cotización', () => {
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
  let producto1: productos;
  let producto2: productos;
  let precio1: number;
  let precio2: number;

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

    // Crear usuario cliente
    usuarioCliente = await crearUsuarioDePrueba(
      usuarioRepo,
      2,
      `cliente_estados_${Date.now()}@gramas.com`
    );

    // Crear productos de prueba
    producto1 = await crearProductoDePrueba(
      productoRepo,
      `Producto Estados 1 ${Date.now()}`,
      150,
      1
    );
    precio1 = Number(producto1.precio);
    await crearStock(stockRepo, producto1.id_producto, 50);

    producto2 = await crearProductoDePrueba(
      productoRepo,
      `Producto Estados 2 ${Date.now()}`,
      200,
      1
    );
    precio2 = Number(producto2.precio);
    await crearStock(stockRepo, producto2.id_producto, 30);

    console.log(`✅ Datos de prueba inicializados:
      - Cliente: ${usuarioCliente.email} (ID: ${usuarioCliente.id_usuario})
      - Producto 1: ${producto1.nombre} (ID: ${producto1.id_producto}, Precio: ${precio1}, Stock: 50)
      - Producto 2: ${producto2.nombre} (ID: ${producto2.id_producto}, Precio: ${precio2}, Stock: 30)
    `);
  }, 60000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // ============================================================================
  // CP-221: CAMBIAR COTIZACIÓN DE PENDIENTE A PAGADA
  // ============================================================================
  describe('CP-221: Cambiar una cotización de Pendiente a Pagada', () => {
    it('debería cambiar el estado de pendiente a pagado', async () => {
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

      // Verificar estado inicial
      expect(cotizacion.estado).toBe('pendiente');

      // Cambiar a pagado
      const resultado = await service.actualizarEstado(idCotizacion, 'pagado');

      expect(resultado).toBeDefined();
      expect(resultado.mensaje).toBe('Estado actualizado a "pagado"');
      expect(resultado.cotizacion.estado).toBe('pagado');

      // Verificar en BD
      const cotizacionEnBd = await cotizacionRepo.findOne({
        where: { idCotizacion: idCotizacion },
      });
      expect(cotizacionEnBd?.estado).toBe('pagado');

      console.log(`✅ [CP-221] Cotización #${idCotizacion} cambiada de pendiente a pagado`);
    }, 30000);

    it('debería permitir cambiar de pendiente a pagado y luego a entregado', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 3 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 123 #45-67, Bogotá',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const stockAntes = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });

      // Pendiente → Pagado (no debe afectar stock)
      await service.actualizarEstado(idCotizacion, 'pagado');

      const stockDespuesPagado = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });
      expect(Number(stockDespuesPagado?.cantidad_actual)).toBe(Number(stockAntes?.cantidad_actual));

      // Pagado → Entregado (debe afectar stock)
      await service.actualizarEstado(idCotizacion, 'entregado');

      const stockDespuesEntregado = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });
      expect(Number(stockDespuesEntregado?.cantidad_actual)).toBe(Number(stockAntes?.cantidad_actual) - 3);

      const cotizacionEnBd = await cotizacionRepo.findOne({
        where: { idCotizacion: idCotizacion },
      });
      expect(cotizacionEnBd?.estado).toBe('entregado');

      console.log(`✅ [CP-221] Cotización #${idCotizacion}: pendiente → pagado → entregado`);
    }, 30000);
  });

  // ============================================================================
  // CP-222: CAMBIAR COTIZACIÓN DE PAGADA A ENTREGADA
  // ============================================================================
  describe('CP-222: Cambiar una cotización de Pagada a Entregada', () => {
    it('debería cambiar el estado de pagado a entregado y restar stock', async () => {
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

      // Cambiar a pagado
      await service.actualizarEstado(idCotizacion, 'pagado');

      const stockAntes1 = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });
      const stockAntes2 = await stockRepo.findOne({
        where: { id_producto: producto2.id_producto },
      });

      // Cambiar a entregado
      const resultado = await service.actualizarEstado(idCotizacion, 'entregado');

      expect(resultado).toBeDefined();
      expect(resultado.mensaje).toBe('Estado actualizado a "entregado"');
      expect(resultado.cotizacion.estado).toBe('entregado');

      const stockDespues1 = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });
      const stockDespues2 = await stockRepo.findOne({
        where: { id_producto: producto2.id_producto },
      });

      expect(Number(stockDespues1?.cantidad_actual)).toBe(Number(stockAntes1?.cantidad_actual) - 2);
      expect(Number(stockDespues2?.cantidad_actual)).toBe(Number(stockAntes2?.cantidad_actual) - 1);

      console.log(`✅ [CP-222] Cotización #${idCotizacion} cambiada de pagado a entregado, stock actualizado`);
    }, 30000);

    it('no debería permitir cambiar de pagado a entregado sin stock suficiente', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 60 }, // Stock es 50
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      // La creación de la cotización debería fallar por stock insuficiente
      await expect(service.crearCotizacion(usuarioCliente.id_usuario, dto)).rejects.toThrow();

      console.log(`✅ [CP-222] Cotización con stock insuficiente rechazada correctamente`);
    });
  });

  // ============================================================================
  // CP-223: CAMBIAR COTIZACIÓN A CANCELADA
  // ============================================================================
  describe('CP-223: Cambiar una cotización a Cancelada', () => {
    it('debería cambiar el estado de pendiente a cancelado', async () => {
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

      const resultado = await service.actualizarEstado(idCotizacion, 'cancelado');

      expect(resultado).toBeDefined();
      expect(resultado.mensaje).toBe('Estado actualizado a "cancelado"');
      expect(resultado.cotizacion.estado).toBe('cancelado');

      const cotizacionEnBd = await cotizacionRepo.findOne({
        where: { idCotizacion: idCotizacion },
      });
      expect(cotizacionEnBd?.estado).toBe('cancelado');

      console.log(`✅ [CP-223] Cotización #${idCotizacion} cancelada correctamente`);
    }, 30000);

    it('debería cambiar el estado de pagado a cancelado', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 3 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      await service.actualizarEstado(idCotizacion, 'pagado');

      const resultado = await service.actualizarEstado(idCotizacion, 'cancelado');

      expect(resultado).toBeDefined();
      expect(resultado.cotizacion.estado).toBe('cancelado');

      console.log(`✅ [CP-223] Cotización #${idCotizacion} cancelada desde pagado`);
    }, 30000);

    it('debería cambiar el estado de entregado a cancelado y devolver stock', async () => {
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

      const stockAntes = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });

      await service.actualizarEstado(idCotizacion, 'entregado');

      const stockDespuesEntrega = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });
      expect(Number(stockDespuesEntrega?.cantidad_actual)).toBe(Number(stockAntes?.cantidad_actual) - 2);

      await service.actualizarEstado(idCotizacion, 'cancelado');

      const stockDespuesCancelado = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });
      expect(Number(stockDespuesCancelado?.cantidad_actual)).toBe(Number(stockAntes?.cantidad_actual));

      const cotizacionEnBd = await cotizacionRepo.findOne({
        where: { idCotizacion: idCotizacion },
      });
      expect(cotizacionEnBd?.estado).toBe('cancelado');

      console.log(`✅ [CP-223] Cotización #${idCotizacion} cancelada desde entregado, stock devuelto`);
    }, 30000);
  });

  // ============================================================================
  // CP-225: DESCUENTO AUTOMÁTICO DE INVENTARIO AL PASAR A ENTREGADA
  // ============================================================================
  describe('CP-225: Ejecución automática del descuento de inventario al pasar a Entregada', () => {
    it('debería descontar stock automáticamente al pasar a entregado', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 4 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const stockAntes = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });

      await service.actualizarEstado(idCotizacion, 'entregado');

      const stockDespues = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });

      expect(Number(stockDespues?.cantidad_actual)).toBe(Number(stockAntes?.cantidad_actual) - 4);

      console.log(`✅ [CP-225] Stock descontado automáticamente: ${stockAntes?.cantidad_actual} → ${stockDespues?.cantidad_actual}`);
    }, 30000);

    it('debería descontar stock de múltiples productos al pasar a entregado', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto2.id_producto, cantidad: 3 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const stockAntes1 = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });
      const stockAntes2 = await stockRepo.findOne({
        where: { id_producto: producto2.id_producto },
      });

      await service.actualizarEstado(idCotizacion, 'entregado');

      const stockDespues1 = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });
      const stockDespues2 = await stockRepo.findOne({
        where: { id_producto: producto2.id_producto },
      });

      expect(Number(stockDespues1?.cantidad_actual)).toBe(Number(stockAntes1?.cantidad_actual) - 2);
      expect(Number(stockDespues2?.cantidad_actual)).toBe(Number(stockAntes2?.cantidad_actual) - 3);

      console.log(`✅ [CP-225] Stock descontado de múltiples productos`);
    }, 30000);

    it('no debería descontar stock al cambiar a otros estados (pendiente, pagado, cancelado)', async () => {
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

      const stockAntes = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });

      // Cambiar a pagado (no descuenta)
      await service.actualizarEstado(idCotizacion, 'pagado');
      
      let stockDespues = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });
      expect(Number(stockDespues?.cantidad_actual)).toBe(Number(stockAntes?.cantidad_actual));

      // Cambiar a cancelado (no descuenta)
      await service.actualizarEstado(idCotizacion, 'cancelado');
      
      stockDespues = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });
      expect(Number(stockDespues?.cantidad_actual)).toBe(Number(stockAntes?.cantidad_actual));

      console.log(`✅ [CP-225] Estados diferentes a entregado no descuentan stock`);
    }, 30000);

    it('debería devolver stock al cambiar de entregado a otro estado', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 3 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const idCotizacion = cotizacion.idCotizacion;

      const stockAntes = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });

      // Entregar (descuenta)
      await service.actualizarEstado(idCotizacion, 'entregado');

      const stockDespuesEntrega = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });
      expect(Number(stockDespuesEntrega?.cantidad_actual)).toBe(Number(stockAntes?.cantidad_actual) - 3);

      // Cambiar a pagado (devuelve stock)
      await service.actualizarEstado(idCotizacion, 'pagado');

      const stockDespuesPagado = await stockRepo.findOne({
        where: { id_producto: producto1.id_producto },
      });
      expect(Number(stockDespuesPagado?.cantidad_actual)).toBe(Number(stockAntes?.cantidad_actual));

      console.log(`✅ [CP-225] Stock devuelto al cambiar de entregado a pagado`);
    }, 30000);
  });
});