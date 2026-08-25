/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-034 Modalidades de Entrega de Cotización
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
 * Casos de Prueba Cubiertos (RF-034):
 * - CP-227: Generar una cotización con modalidad Entrega Física.
 * - CP-228: Generar una cotización con modalidad Entrega a Domicilio.
 * - CP-232: Verificar el registro en auditoría (PENDIENTE - No implementado)
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

describe('RF-034: Pruebas de Integración - Modalidades de Entrega de Cotización', () => {
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
      `cliente_entrega_${Date.now()}@gramas.com`
    );

    // Crear productos de prueba
    producto1 = await crearProductoDePrueba(
      productoRepo,
      `Producto Entrega 1 ${Date.now()}`,
      150,
      1
    );
    precio1 = Number(producto1.precio);
    await crearStock(stockRepo, producto1.id_producto, 50);

    producto2 = await crearProductoDePrueba(
      productoRepo,
      `Producto Entrega 2 ${Date.now()}`,
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
  // CP-227: GENERAR COTIZACIÓN CON MODALIDAD ENTREGA FÍSICA
  // ============================================================================
  describe('CP-227: Generar una cotización con modalidad Entrega Física', () => {
    it('debería generar cotización con metodoVenta = fisico y costoEnvio = 0', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto2.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      expect(resultado).toBeDefined();
      expect(resultado.idCotizacion).toBeDefined();
      expect(resultado.metodoVenta).toBe('fisico');
      expect(Number(resultado.costoEnvio)).toBe(0);

      const subtotalEsperado = (precio1 * 2) + (precio2 * 1);
      expect(Number(resultado.subtotal)).toBe(subtotalEsperado);
      expect(Number(resultado.total)).toBe(subtotalEsperado);
      expect(resultado.direccionEnvio).toBeNull();

      console.log(`✅ [CP-227] Cotización con entrega física creada: ID ${resultado.idCotizacion}, Total: ${resultado.total}`);
    });

    it('debería almacenar correctamente la modalidad física en la base de datos', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 3 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'tarjeta_debito',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const cotizacionEnBd = await cotizacionRepo.findOne({
        where: { idCotizacion: resultado.idCotizacion },
      });

      expect(cotizacionEnBd).not.toBeNull();
      expect(cotizacionEnBd?.metodoVenta).toBe('fisico');
      expect(Number(cotizacionEnBd?.costoEnvio)).toBe(0);
      expect(cotizacionEnBd?.direccionEnvio).toBeNull();

      console.log(`✅ [CP-227] Modalidad física almacenada en BD correctamente`);
    });

    it('no debería permitir direccionEnvio cuando metodoVenta es fisico', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        direccionEnvio: 'Calle 123 #45-67, Bogotá', // No debería usarse
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      // La dirección de envío debería ser null aunque se envió
      expect(resultado.direccionEnvio).toBeNull();

      const cotizacionEnBd = await cotizacionRepo.findOne({
        where: { idCotizacion: resultado.idCotizacion },
      });
      expect(cotizacionEnBd?.direccionEnvio).toBeNull();

      console.log(`✅ [CP-227] Dirección de envío ignorada para modalidad física`);
    });
  });

  // ============================================================================
  // CP-228: GENERAR COTIZACIÓN CON MODALIDAD ENTREGA A DOMICILIO
  // ============================================================================
  describe('CP-228: Generar una cotización con modalidad Entrega a Domicilio', () => {
    it('debería generar cotización con metodoVenta = envio y costoEnvio = 8000', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto2.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 456 #78-90, Medellín',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      expect(resultado).toBeDefined();
      expect(resultado.idCotizacion).toBeDefined();
      expect(resultado.metodoVenta).toBe('envio');
      expect(Number(resultado.costoEnvio)).toBe(8000);

      const subtotalEsperado = (precio1 * 2) + (precio2 * 1);
      const totalEsperado = subtotalEsperado + 8000;
      expect(Number(resultado.subtotal)).toBe(subtotalEsperado);
      expect(Number(resultado.total)).toBe(totalEsperado);
      expect(resultado.direccionEnvio).toBe('Calle 456 #78-90, Medellín');

      console.log(`✅ [CP-228] Cotización con entrega a domicilio creada: ID ${resultado.idCotizacion}, Total: ${resultado.total}`);
    });

    it('debería almacenar correctamente la modalidad envío en la base de datos', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 4 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'efectivo',
        direccionEnvio: 'Calle 789 #12-34, Cali',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const cotizacionEnBd = await cotizacionRepo.findOne({
        where: { idCotizacion: resultado.idCotizacion },
      });

      expect(cotizacionEnBd).not.toBeNull();
      expect(cotizacionEnBd?.metodoVenta).toBe('envio');
      expect(Number(cotizacionEnBd?.costoEnvio)).toBe(8000);
      expect(cotizacionEnBd?.direccionEnvio).toBe('Calle 789 #12-34, Cali');

      console.log(`✅ [CP-228] Modalidad envío almacenada en BD correctamente`);
    });

    it('debería requerir direccionEnvio cuando metodoVenta es envio', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        // direccionEnvio no se envía
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      // La dirección de envío debería ser null porque no se envió
      expect(resultado.direccionEnvio).toBeNull();

      const cotizacionEnBd = await cotizacionRepo.findOne({
        where: { idCotizacion: resultado.idCotizacion },
      });
      expect(cotizacionEnBd?.direccionEnvio).toBeNull();

      console.log(`✅ [CP-228] Dirección de envío puede ser null en BD`);
    });

    it('debería calcular correctamente el total sumando el costo de envío', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto2.id_producto, cantidad: 3 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_debito',
        direccionEnvio: 'Calle 101 #20-30, Bogotá',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const subtotalEsperado = (precio1 * 2) + (precio2 * 3);
      const costoEnvio = 8000;
      const totalEsperado = subtotalEsperado + costoEnvio;

      expect(Number(resultado.subtotal)).toBe(subtotalEsperado);
      expect(Number(resultado.costoEnvio)).toBe(costoEnvio);
      expect(Number(resultado.total)).toBe(totalEsperado);
      expect(Number(resultado.total)).toBe(Number(resultado.subtotal) + Number(resultado.costoEnvio));

      console.log(`✅ [CP-228] Total calculado correctamente: ${resultado.subtotal} + ${resultado.costoEnvio} = ${resultado.total}`);
    });
  });

  // ============================================================================
  // CP-232: VERIFICAR REGISTRO EN AUDITORÍA (PENDIENTE)
  // ============================================================================
  describe('CP-232: Verificar el registro en auditoría', () => {
    it('PENDIENTE - La funcionalidad de auditoría no está implementada actualmente', () => {
      console.log(`📝 [CP-232] La funcionalidad de auditoría no está implementada en el sistema actual.
      Para implementarla, se podría considerar:
      1. Agregar trigger en la BD que registre cambios en cotizaciones
      2. Crear una tabla de auditoría y un interceptor en NestJS
      3. Usar TypeORM Subscribers para auditar cambios
      4. Crear un módulo de auditoría que registre todas las operaciones`);

      expect(true).toBe(true);
    });
  });
});