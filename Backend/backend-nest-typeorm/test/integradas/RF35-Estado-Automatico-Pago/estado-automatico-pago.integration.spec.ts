/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-035 Cambio de Estado Automático por Pago
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
 * Casos de Prueba Cubiertos (RF-035):
 * - CP-233: Verificar que una cotización nueva se registre con estado "Pendiente".
 * - CP-236: Generar una cotización con Entrega a Domicilio y un método de pago diferente a tarjeta, verificando que permanezca en "Pendiente".
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

describe('RF-035: Pruebas de Integración - Cambio de Estado Automático por Pago', () => {
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
      `cliente_estado_pago_${Date.now()}@gramas.com`
    );

    // Crear productos de prueba
    producto1 = await crearProductoDePrueba(
      productoRepo,
      `Producto Estado Pago 1 ${Date.now()}`,
      150,
      1
    );
    precio1 = Number(producto1.precio);
    await crearStock(stockRepo, producto1.id_producto, 50);

    producto2 = await crearProductoDePrueba(
      productoRepo,
      `Producto Estado Pago 2 ${Date.now()}`,
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
  // CP-233: VERIFICAR QUE COTIZACIÓN NUEVA SE REGISTRE CON ESTADO "PENDIENTE"
  // ============================================================================
  describe('CP-233: Verificar que una cotización nueva se registre con estado "Pendiente"', () => {
    it('debería crear una cotización con estado pendiente por defecto', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      expect(resultado).toBeDefined();
      expect(resultado.idCotizacion).toBeDefined();
      expect(resultado.estado).toBe('pendiente');

      console.log(`✅ [CP-233] Cotización #${resultado.idCotizacion} creada con estado: ${resultado.estado}`);
    });

    it('debería tener estado pendiente para diferentes modalidades de pago', async () => {
      const metodosPago = ['efectivo', 'tarjeta_debito', 'tarjeta_credito'];
      const idsCotizaciones: number[] = [];

      for (const metodoPago of metodosPago) {
        const items: ItemCotizacionDto[] = [
          { idProducto: producto1.id_producto, cantidad: 1 },
        ];

        const dto: CrearCotizacionDto = {
          metodoVenta: 'envio',
          metodoPago: metodoPago,
          direccionEnvio: `Calle ${Math.floor(Math.random() * 1000)} #45-67, Bogotá`,
          items: items,
        };

        const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
        
        expect(resultado.estado).toBe('pendiente');
        idsCotizaciones.push(resultado.idCotizacion);

        console.log(`✅ [CP-233] Cotización #${resultado.idCotizacion} con pago ${metodoPago} → estado: ${resultado.estado}`);
      }

      expect(idsCotizaciones.length).toBe(3);
    }, 30000);

    it('debería persistir el estado pendiente en la base de datos', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 3 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'tarjeta_credito',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const cotizacionEnBd = await cotizacionRepo.findOne({
        where: { idCotizacion: resultado.idCotizacion },
      });

      expect(cotizacionEnBd).not.toBeNull();
      expect(cotizacionEnBd?.estado).toBe('pendiente');

      console.log(`✅ [CP-233] Estado pendiente persistido en BD: ${cotizacionEnBd?.estado}`);
    });
  });

  // ============================================================================
  // CP-236: GENERAR COTIZACIÓN CON ENVÍO Y PAGO DIFERENTE A TARJETA
  // ============================================================================
  describe('CP-236: Generar una cotización con Entrega a Domicilio y un método de pago diferente a tarjeta, verificando que permanezca en "Pendiente"', () => {
    it('debería crear cotización con envio y pago en efectivo, estado pendiente', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'efectivo',
        direccionEnvio: 'Calle 123 #45-67, Bogotá',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      expect(resultado).toBeDefined();
      expect(resultado.idCotizacion).toBeDefined();
      expect(resultado.metodoVenta).toBe('envio');
      expect(resultado.metodoPago).toBe('efectivo');
      expect(resultado.estado).toBe('pendiente');
      expect(Number(resultado.costoEnvio)).toBe(8000);
      expect(resultado.direccionEnvio).toBe('Calle 123 #45-67, Bogotá');

      console.log(`✅ [CP-236] Cotización #${resultado.idCotizacion} con envío y pago en efectivo → estado: ${resultado.estado}`);
    });

    it('debería crear cotización con envio y pago en tarjeta débito, estado pendiente', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
        { idProducto: producto2.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_debito',
        direccionEnvio: 'Calle 456 #78-90, Medellín',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      expect(resultado).toBeDefined();
      expect(resultado.idCotizacion).toBeDefined();
      expect(resultado.metodoVenta).toBe('envio');
      expect(resultado.metodoPago).toBe('tarjeta_debito');
      expect(resultado.estado).toBe('pendiente');
      expect(Number(resultado.costoEnvio)).toBe(8000);

      console.log(`✅ [CP-236] Cotización #${resultado.idCotizacion} con envío y tarjeta débito → estado: ${resultado.estado}`);
    }, 30000);

    it('debería crear cotización con envio y pago en tarjeta crédito, estado pendiente', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 3 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 789 #12-34, Cali',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      expect(resultado).toBeDefined();
      expect(resultado.idCotizacion).toBeDefined();
      expect(resultado.metodoVenta).toBe('envio');
      expect(resultado.metodoPago).toBe('tarjeta_credito');
      expect(resultado.estado).toBe('pendiente');
      expect(Number(resultado.costoEnvio)).toBe(8000);

      console.log(`✅ [CP-236] Cotización #${resultado.idCotizacion} con envío y tarjeta crédito → estado: ${resultado.estado}`);
    });

    it('debería persistir el estado pendiente en BD para cotizaciones con envío', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto2.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'efectivo',
        direccionEnvio: 'Carrera 10 #20-30, Bogotá',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const cotizacionEnBd = await cotizacionRepo.findOne({
        where: { idCotizacion: resultado.idCotizacion },
      });

      expect(cotizacionEnBd).not.toBeNull();
      expect(cotizacionEnBd?.estado).toBe('pendiente');
      expect(cotizacionEnBd?.metodoVenta).toBe('envio');
      expect(Number(cotizacionEnBd?.costoEnvio)).toBe(8000);

      console.log(`✅ [CP-236] Estado pendiente persistido en BD para cotización con envío`);
    });

    it('debería comparar que el estado es pendiente para todos los métodos de pago con envío', async () => {
      const metodosPago = ['efectivo', 'tarjeta_debito', 'tarjeta_credito'];
      const resultados: any[] = [];

      for (const metodoPago of metodosPago) {
        const items: ItemCotizacionDto[] = [
          { idProducto: producto1.id_producto, cantidad: 1 },
        ];

        const dto: CrearCotizacionDto = {
          metodoVenta: 'envio',
          metodoPago: metodoPago,
          direccionEnvio: `Calle ${Math.floor(Math.random() * 1000)} #45-67, Bogotá`,
          items: items,
        };

        const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
        resultados.push({
          metodoPago,
          estado: resultado.estado,
          costoEnvio: Number(resultado.costoEnvio),
        });
      }

      for (const r of resultados) {
        expect(r.estado).toBe('pendiente');
        expect(r.costoEnvio).toBe(8000);
      }

      console.log(`✅ [CP-236] Todos los métodos de pago con envío mantienen estado pendiente`);
    }, 30000);
  });
});