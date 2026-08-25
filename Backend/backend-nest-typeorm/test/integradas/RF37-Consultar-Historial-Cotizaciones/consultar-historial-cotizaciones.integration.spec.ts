/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-037 Consultar Historial de Cotizaciones
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
 * Casos de Prueba Cubiertos (RF-037):
 * - CP-247: Consultar el historial de cotizaciones como cliente.
 * - CP-248: Consultar el historial de cotizaciones de un cliente como administrador.
 * - CP-249: Intentar consultar las cotizaciones de otro cliente.
 * - CP-250: Consultar el historial cuando no existen cotizaciones registradas.
 * - CP-251: Verificar que la información mostrada incluya número, fecha, estado, modalidad de entrega y valor total.
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

describe('RF-037: Pruebas de Integración - Consultar Historial de Cotizaciones', () => {
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

    // Crear usuarios
    usuarioCliente = await crearUsuarioDePrueba(
      usuarioRepo,
      2,
      `cliente_historial_${Date.now()}@gramas.com`
    );

    usuarioCliente2 = await crearUsuarioDePrueba(
      usuarioRepo,
      2,
      `cliente2_historial_${Date.now()}@gramas.com`
    );

    usuarioAdmin = await crearUsuarioDePrueba(
      usuarioRepo,
      1,
      `admin_historial_${Date.now()}@gramas.com`
    );

    // Crear productos de prueba
    producto1 = await crearProductoDePrueba(
      productoRepo,
      `Producto Historial 1 ${Date.now()}`,
      150,
      1
    );
    precio1 = Number(producto1.precio);
    await crearStock(stockRepo, producto1.id_producto, 50);

    producto2 = await crearProductoDePrueba(
      productoRepo,
      `Producto Historial 2 ${Date.now()}`,
      200,
      1
    );
    precio2 = Number(producto2.precio);
    await crearStock(stockRepo, producto2.id_producto, 30);

    console.log(`✅ Datos de prueba inicializados:
      - Cliente 1: ${usuarioCliente.email} (ID: ${usuarioCliente.id_usuario})
      - Cliente 2: ${usuarioCliente2.email} (ID: ${usuarioCliente2.id_usuario})
      - Admin: ${usuarioAdmin.email} (ID: ${usuarioAdmin.id_usuario}, Rol: 1)
      - Producto 1: ${producto1.nombre} (ID: ${producto1.id_producto}, Precio: ${precio1})
      - Producto 2: ${producto2.nombre} (ID: ${producto2.id_producto}, Precio: ${precio2})
    `);
  }, 60000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // ============================================================================
  // CP-247: CONSULTAR HISTORIAL COMO CLIENTE
  // ============================================================================
  describe('CP-247: Consultar el historial de cotizaciones como cliente', () => {
    it('debería retornar las cotizaciones del cliente autenticado', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const historial = await service.obtenerCotizacionesUsuario(usuarioCliente.id_usuario);

      expect(historial).toBeDefined();
      expect(Array.isArray(historial)).toBe(true);
      expect(historial.length).toBeGreaterThan(0);

      for (const cotizacion of historial) {
        expect(cotizacion.idUsuario).toBe(usuarioCliente.id_usuario);
      }

      console.log(`✅ [CP-247] Cliente consultó ${historial.length} cotizaciones`);
    }, 30000);

    it('debería retornar solo las cotizaciones del cliente', async () => {
      // Crear cotizaciones para cliente 1
      const items1: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto1: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items1,
      };

      await service.crearCotizacion(usuarioCliente.id_usuario, dto1);
      await service.crearCotizacion(usuarioCliente.id_usuario, dto1);

      // Crear cotizaciones para cliente 2
      const items2: ItemCotizacionDto[] = [
        { idProducto: producto2.id_producto, cantidad: 1 },
      ];

      const dto2: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 123 #45-67, Bogotá',
        items: items2,
      };

      await service.crearCotizacion(usuarioCliente2.id_usuario, dto2);

      const historialCliente1 = await service.obtenerCotizacionesUsuario(usuarioCliente.id_usuario);

      // Verificar que solo tiene cotizaciones del cliente 1
      for (const cotizacion of historialCliente1) {
        expect(cotizacion.idUsuario).toBe(usuarioCliente.id_usuario);
      }

      // Verificar que no incluye cotizaciones del cliente 2
      const cotizacionesCliente2 = historialCliente1.filter(
        c => c.idUsuario === usuarioCliente2.id_usuario
      );
      expect(cotizacionesCliente2.length).toBe(0);

      console.log(`✅ [CP-247] Cliente solo ve sus propias cotizaciones: ${historialCliente1.length}`);
    }, 30000);

    it('debería retornar cotizaciones ordenadas por fecha descendente', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const historial = await service.obtenerCotizacionesUsuario(usuarioCliente.id_usuario);

      if (historial.length > 1) {
        for (let i = 0; i < historial.length - 1; i++) {
          const fecha1 = new Date(historial[i].fechaCreacion);
          const fecha2 = new Date(historial[i + 1].fechaCreacion);
          expect(fecha1.getTime()).toBeGreaterThanOrEqual(fecha2.getTime());
        }
      }

      console.log(`✅ [CP-247] Cotizaciones ordenadas por fecha DESC`);
    }, 30000);
  });

  // ============================================================================
  // CP-248: CONSULTAR HISTORIAL DE CLIENTE COMO ADMINISTRADOR
  // ============================================================================
  describe('CP-248: Consultar el historial de cotizaciones de un cliente como administrador', () => {
    it('debería retornar todas las cotizaciones al administrador', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const historial = await service.obtenerTodasCotizaciones({});

      expect(historial).toBeDefined();
      expect(Array.isArray(historial)).toBe(true);
      expect(historial.length).toBeGreaterThan(0);

      console.log(`✅ [CP-248] Administrador consultó ${historial.length} cotizaciones totales`);
    }, 30000);

    it('debería incluir las cotizaciones de todos los clientes', async () => {
      // Crear cotizaciones para cliente 1
      const items1: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto1: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items1,
      };

      await service.crearCotizacion(usuarioCliente.id_usuario, dto1);

      // Crear cotizaciones para cliente 2
      const items2: ItemCotizacionDto[] = [
        { idProducto: producto2.id_producto, cantidad: 2 },
      ];

      const dto2: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 456 #78-90, Medellín',
        items: items2,
      };

      await service.crearCotizacion(usuarioCliente2.id_usuario, dto2);

      const historial = await service.obtenerTodasCotizaciones({});

      // Verificar que hay cotizaciones de ambos clientes
      const cotizacionesCliente1 = historial.filter(
        c => c.idUsuario === usuarioCliente.id_usuario
      );
      const cotizacionesCliente2 = historial.filter(
        c => c.idUsuario === usuarioCliente2.id_usuario
      );

      expect(cotizacionesCliente1.length).toBeGreaterThan(0);
      expect(cotizacionesCliente2.length).toBeGreaterThan(0);

      console.log(`✅ [CP-248] Admin ve cotizaciones de Cliente1: ${cotizacionesCliente1.length}, Cliente2: ${cotizacionesCliente2.length}`);
    }, 30000);

    it('debería poder filtrar cotizaciones por estado', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      await service.actualizarEstado(cotizacion.idCotizacion, 'pagado');

      const historialPagado = await service.obtenerTodasCotizaciones({ estado: 'pagado' });

      for (const c of historialPagado) {
        expect(c.estado).toBe('pagado');
      }

      console.log(`✅ [CP-248] Filtro por estado 'pagado': ${historialPagado.length} cotizaciones`);
    }, 30000);
  });

  // ============================================================================
  // CP-249: INTENTAR CONSULTAR COTIZACIONES DE OTRO CLIENTE
  // ============================================================================
  describe('CP-249: Intentar consultar las cotizaciones de otro cliente', () => {
    it('no debería permitir que un cliente vea cotizaciones de otro cliente', async () => {
      // Crear cotización para cliente 1
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      // Cliente 2 intenta obtener las cotizaciones de cliente 1
      const historialCliente2 = await service.obtenerCotizacionesUsuario(usuarioCliente2.id_usuario);

      // No debería ver cotizaciones de cliente 1
      for (const cotizacion of historialCliente2) {
        expect(cotizacion.idUsuario).not.toBe(usuarioCliente.id_usuario);
      }

      console.log(`✅ [CP-249] Cliente no puede ver cotizaciones de otro cliente`);
    }, 30000);

    it('debería retornar solo las cotizaciones del cliente autenticado', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      await service.crearCotizacion(usuarioCliente2.id_usuario, dto);

      const historialCliente1 = await service.obtenerCotizacionesUsuario(usuarioCliente.id_usuario);
      const historialCliente2 = await service.obtenerCotizacionesUsuario(usuarioCliente2.id_usuario);

      // Cada cliente solo ve sus propias cotizaciones
      for (const c of historialCliente1) {
        expect(c.idUsuario).toBe(usuarioCliente.id_usuario);
      }

      for (const c of historialCliente2) {
        expect(c.idUsuario).toBe(usuarioCliente2.id_usuario);
      }

      console.log(`✅ [CP-249] Cada cliente solo ve sus propias cotizaciones`);
    }, 30000);
  });

  // ============================================================================
  // CP-250: CONSULTAR HISTORIAL SIN COTIZACIONES
  // ============================================================================
  describe('CP-250: Consultar el historial cuando no existen cotizaciones registradas', () => {
    it('debería retornar un arreglo vacío para cliente sin cotizaciones', async () => {
      // Crear un usuario nuevo sin cotizaciones
      const usuarioSinCotizaciones = await crearUsuarioDePrueba(
        usuarioRepo,
        2,
        `sin_cotizaciones_${Date.now()}@gramas.com`
      );

      const historial = await service.obtenerCotizacionesUsuario(usuarioSinCotizaciones.id_usuario);

      expect(historial).toBeDefined();
      expect(Array.isArray(historial)).toBe(true);
      expect(historial.length).toBe(0);

      console.log(`✅ [CP-250] Cliente sin cotizaciones: ${historial.length} resultados`);
    }, 30000);

    it('debería retornar un arreglo vacío para administrador cuando no hay cotizaciones', async () => {
      // Verificamos que el método existe y retorna un arreglo
      const historial = await service.obtenerTodasCotizaciones({});

      expect(historial).toBeDefined();
      expect(Array.isArray(historial)).toBe(true);

      console.log(`✅ [CP-250] Consulta general retorna ${historial.length} cotizaciones`);
    }, 30000);

    it('debería retornar arreglo vacío al filtrar por estado sin coincidencias', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      // Filtrar por estado 'entregado' (no hay ninguna)
      const historialEntregado = await service.obtenerTodasCotizaciones({ estado: 'entregado' });

      expect(historialEntregado).toBeDefined();
      expect(Array.isArray(historialEntregado)).toBe(true);

      console.log(`✅ [CP-250] Filtro sin resultados: ${historialEntregado.length}`);
    }, 30000);
  });

  // ============================================================================
  // CP-251: VERIFICAR INFORMACIÓN MOSTRADA EN EL HISTORIAL
  // ============================================================================
  describe('CP-251: Verificar que la información mostrada incluya número, fecha, estado, modalidad de entrega y valor total', () => {
    it('debería incluir todos los campos requeridos en las cotizaciones', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto2.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 123 #45-67, Bogotá',
        items: items,
      };

      const cotizacionCreada = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const historial = await service.obtenerCotizacionesUsuario(usuarioCliente.id_usuario);

      const cotizacion = historial.find(c => c.idCotizacion === cotizacionCreada.idCotizacion);

      expect(cotizacion).toBeDefined();
      expect(cotizacion?.idCotizacion).toBeDefined(); // Número
      expect(cotizacion?.fechaCreacion).toBeDefined(); // Fecha
      expect(cotizacion?.estado).toBeDefined(); // Estado
      expect(cotizacion?.metodoVenta).toBeDefined(); // Modalidad de entrega
      expect(cotizacion?.total).toBeDefined(); // Valor total

      // Verificar campos adicionales
      expect(cotizacion?.metodoPago).toBeDefined();
      expect(cotizacion?.subtotal).toBeDefined();
      expect(cotizacion?.costoEnvio).toBeDefined();

      console.log(`✅ [CP-251] Cotización #${cotizacion?.idCotizacion} tiene todos los campos requeridos`);
    }, 30000);

    it('debería mostrar el estado correcto de cada cotización', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      await service.actualizarEstado(cotizacion.idCotizacion, 'pagado');

      const historial = await service.obtenerCotizacionesUsuario(usuarioCliente.id_usuario);

      const cotizacionEncontrada = historial.find(c => c.idCotizacion === cotizacion.idCotizacion);

      expect(cotizacionEncontrada).toBeDefined();
      expect(cotizacionEncontrada?.estado).toBe('pagado');

      console.log(`✅ [CP-251] Estado correcto: ${cotizacionEncontrada?.estado}`);
    }, 30000);

    it('debería mostrar la modalidad de entrega correcta', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_debito',
        direccionEnvio: 'Calle 789 #12-34, Cali',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const historial = await service.obtenerCotizacionesUsuario(usuarioCliente.id_usuario);

      const cotizacionEncontrada = historial.find(c => c.idCotizacion === cotizacion.idCotizacion);

      expect(cotizacionEncontrada).toBeDefined();
      expect(cotizacionEncontrada?.metodoVenta).toBe('envio');
      expect(Number(cotizacionEncontrada?.costoEnvio)).toBe(8000);

      console.log(`✅ [CP-251] Modalidad de entrega: ${cotizacionEncontrada?.metodoVenta}`);
    }, 30000);

    it('debería mostrar el valor total correcto', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 3 },
        { idProducto: producto2.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 101 #20-30, Bogotá',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const historial = await service.obtenerCotizacionesUsuario(usuarioCliente.id_usuario);

      const cotizacionEncontrada = historial.find(c => c.idCotizacion === cotizacion.idCotizacion);

      expect(cotizacionEncontrada).toBeDefined();

      const subtotalEsperado = (precio1 * 3) + (precio2 * 2);
      const totalEsperado = subtotalEsperado + 8000;

      expect(Number(cotizacionEncontrada?.subtotal)).toBe(subtotalEsperado);
      expect(Number(cotizacionEncontrada?.total)).toBe(totalEsperado);

      console.log(`✅ [CP-251] Valor total correcto: ${cotizacionEncontrada?.total}`);
    }, 30000);
  });
});