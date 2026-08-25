/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-039 Visualizar Panel de Control (Dashboard Administrador)
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
 * Casos de Prueba Cubiertos (RF-039):
 * - CP-261: Visualizar correctamente el panel de control como administrador.
 * - CP-262: Verificar la cantidad de usuarios registrados mostrada.
 * - CP-263: Verificar las estadísticas de productos y stock.
 * - CP-264: Verificar las estadísticas de cotizaciones por estado.
 * - CP-265: Intentar acceder al panel con un usuario sin permisos (PENDIENTE - Requiere contexto HTTP)
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../../../../../.env') });

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, MoreThanOrEqual } from 'typeorm';

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

describe('RF-039: Pruebas de Integración - Visualizar Panel de Control (Dashboard Administrador)', () => {
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

  let usuarioAdmin: usuario;
  let usuarioCliente: usuario;
  let proveedorTest: any;
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
    usuarioAdmin = await crearUsuarioDePrueba(
      usuarioRepo,
      1,
      `admin_dashboard_${Date.now()}@gramas.com`
    );

    usuarioCliente = await crearUsuarioDePrueba(
      usuarioRepo,
      2,
      `cliente_dashboard_${Date.now()}@gramas.com`
    );

    // Crear proveedor de prueba
    proveedorTest = await crearProveedorDePrueba(proveedorRepo);

    // Crear productos de prueba
    producto1 = await crearProductoDePrueba(
      productoRepo,
      `Producto Dashboard 1 ${Date.now()}`,
      150,
      1
    );
    precio1 = Number(producto1.precio);
    await crearStock(stockRepo, producto1.id_producto, 50);

    producto2 = await crearProductoDePrueba(
      productoRepo,
      `Producto Dashboard 2 ${Date.now()}`,
      200,
      1
    );
    precio2 = Number(producto2.precio);
    await crearStock(stockRepo, producto2.id_producto, 30);

    // Crear algunas cotizaciones para tener datos
    const items: ItemCotizacionDto[] = [
      { idProducto: producto1.id_producto, cantidad: 2 },
    ];

    const dto: CrearCotizacionDto = {
      metodoVenta: 'fisico',
      metodoPago: 'efectivo',
      items: items,
    };

    // Crear cotización pendiente
    await service.crearCotizacion(usuarioCliente.id_usuario, dto);

    // Crear cotización pagada
    const cotizacionPagada = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
    await service.actualizarEstado(cotizacionPagada.idCotizacion, 'pagado');

    // Crear cotización entregada
    const cotizacionEntregada = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
    await service.actualizarEstado(cotizacionEntregada.idCotizacion, 'entregado');

    // Crear cotización cancelada
    const cotizacionCancelada = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
    await service.actualizarEstado(cotizacionCancelada.idCotizacion, 'cancelado');

    console.log(`✅ Datos de prueba inicializados:
      - Admin: ${usuarioAdmin.email} (ID: ${usuarioAdmin.id_usuario}, Rol: 1)
      - Cliente: ${usuarioCliente.email} (ID: ${usuarioCliente.id_usuario})
      - Proveedor: ${proveedorTest.nombre} (ID: ${proveedorTest.id_proveedor})
      - Producto 1: ${producto1.nombre} (ID: ${producto1.id_producto}, Precio: ${precio1}, Stock: 50)
      - Producto 2: ${producto2.nombre} (ID: ${producto2.id_producto}, Precio: ${precio2}, Stock: 30)
      - Cotizaciones creadas: pendiente, pagado, entregado, cancelado
    `);
  }, 60000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // ============================================================================
  // CP-261: VISUALIZAR PANEL DE CONTROL COMO ADMINISTRADOR
  // ============================================================================
  describe('CP-261: Visualizar correctamente el panel de control como administrador', () => {
    it('debería retornar todas las estadísticas del dashboard', async () => {
      const estadisticas = await service.obtenerEstadisticas();

      expect(estadisticas).toBeDefined();
      expect(estadisticas).toHaveProperty('total');
      expect(estadisticas).toHaveProperty('pendiente');
      expect(estadisticas).toHaveProperty('pagado');
      expect(estadisticas).toHaveProperty('entregado');
      expect(estadisticas).toHaveProperty('cancelado');
      expect(estadisticas).toHaveProperty('ventasTotales');
      expect(estadisticas).toHaveProperty('ultimoMes');
      expect(estadisticas).toHaveProperty('ultimaSemana');
      expect(estadisticas).toHaveProperty('usuariosRegistrados');
      expect(estadisticas).toHaveProperty('productosRegistrados');
      expect(estadisticas).toHaveProperty('stockTotal');

      expect(typeof estadisticas.total).toBe('number');
      expect(typeof estadisticas.pendiente).toBe('number');
      expect(typeof estadisticas.pagado).toBe('number');
      expect(typeof estadisticas.entregado).toBe('number');
      expect(typeof estadisticas.cancelado).toBe('number');

      console.log(`✅ [CP-261] Dashboard retorna todas las estadísticas correctamente`);
    }, 30000);

    it('debería tener valores consistentes en las estadísticas', async () => {
      const estadisticas = await service.obtenerEstadisticas();

      const sumaEstados = estadisticas.pendiente + estadisticas.pagado + 
                         estadisticas.entregado + estadisticas.cancelado;
      
      expect(sumaEstados).toBe(estadisticas.total);

      expect(estadisticas.usuariosRegistrados).toBeGreaterThanOrEqual(2);
      expect(estadisticas.productosRegistrados).toBeGreaterThanOrEqual(2);

      console.log(`✅ [CP-261] Estadísticas consistentes: Total=${estadisticas.total}, Usuarios=${estadisticas.usuariosRegistrados}`);
    }, 30000);

    it('debería devolver números válidos para todas las estadísticas', async () => {
      const estadisticas = await service.obtenerEstadisticas();

      expect(estadisticas.total).toBeGreaterThanOrEqual(0);
      expect(estadisticas.pendiente).toBeGreaterThanOrEqual(0);
      expect(estadisticas.pagado).toBeGreaterThanOrEqual(0);
      expect(estadisticas.entregado).toBeGreaterThanOrEqual(0);
      expect(estadisticas.cancelado).toBeGreaterThanOrEqual(0);
      expect(estadisticas.ventasTotales).toBeGreaterThanOrEqual(0);
      expect(estadisticas.ultimoMes).toBeGreaterThanOrEqual(0);
      expect(estadisticas.ultimaSemana).toBeGreaterThanOrEqual(0);
      expect(estadisticas.usuariosRegistrados).toBeGreaterThan(0);
      expect(estadisticas.productosRegistrados).toBeGreaterThan(0);
      expect(estadisticas.stockTotal).toBeGreaterThanOrEqual(0);

      console.log(`✅ [CP-261] Todos los valores son válidos (>= 0)`);
    }, 30000);
  });

  // ============================================================================
  // CP-262: VERIFICAR CANTIDAD DE USUARIOS REGISTRADOS
  // ============================================================================
  describe('CP-262: Verificar la cantidad de usuarios registrados mostrada', () => {
    it('debería mostrar el número correcto de usuarios registrados', async () => {
      const usuariosEnBd = await usuarioRepo.count();

      const estadisticas = await service.obtenerEstadisticas();

      expect(estadisticas.usuariosRegistrados).toBe(usuariosEnBd);

      console.log(`✅ [CP-262] Usuarios registrados: ${estadisticas.usuariosRegistrados}`);
    }, 30000);

    it('debería actualizar la cantidad al registrar un nuevo usuario', async () => {
      const usuariosAntes = await usuarioRepo.count();

      await crearUsuarioDePrueba(
        usuarioRepo,
        2,
        `nuevo_usuario_${Date.now()}@gramas.com`
      );

      const usuariosDespues = await usuarioRepo.count();
      const estadisticas = await service.obtenerEstadisticas();

      expect(estadisticas.usuariosRegistrados).toBe(usuariosDespues);
      expect(estadisticas.usuariosRegistrados).toBe(usuariosAntes + 1);

      console.log(`✅ [CP-262] Usuarios registrados actualizados: ${estadisticas.usuariosRegistrados}`);
    }, 30000);

    it('debería incluir todos los roles de usuarios', async () => {
      const estadisticas = await service.obtenerEstadisticas();

      const admins = await usuarioRepo.count({ where: { id_rol: 1 } });
      const clientes = await usuarioRepo.count({ where: { id_rol: 2 } });

      expect(admins).toBeGreaterThan(0);
      expect(clientes).toBeGreaterThan(0);
      expect(estadisticas.usuariosRegistrados).toBe(admins + clientes);

      console.log(`✅ [CP-262] Admins: ${admins}, Clientes: ${clientes}, Total: ${estadisticas.usuariosRegistrados}`);
    }, 30000);
  });

  // ============================================================================
  // CP-263: VERIFICAR ESTADÍSTICAS DE PRODUCTOS Y STOCK
  // ============================================================================
  describe('CP-263: Verificar las estadísticas de productos y stock', () => {
    it('debería mostrar el número correcto de productos registrados', async () => {
      const productosEnBd = await productoRepo.count();

      const estadisticas = await service.obtenerEstadisticas();

      expect(estadisticas.productosRegistrados).toBe(productosEnBd);

      console.log(`✅ [CP-263] Productos registrados: ${estadisticas.productosRegistrados}`);
    }, 30000);

    it('debería mostrar el stock total correcto', async () => {
      const stockTotalResult = await stockRepo
        .createQueryBuilder('stock')
        .select('SUM(stock.cantidad_actual)', 'total')
        .getRawOne();
      
      const stockTotalEsperado = Number(stockTotalResult?.total || 0);

      const estadisticas = await service.obtenerEstadisticas();

      expect(Number(estadisticas.stockTotal)).toBe(stockTotalEsperado);

      console.log(`✅ [CP-263] Stock total: ${estadisticas.stockTotal}`);
    }, 30000);

    it('debería actualizar el stock al agregar un nuevo producto', async () => {
      const stockAntes = await stockRepo
        .createQueryBuilder('stock')
        .select('SUM(stock.cantidad_actual)', 'total')
        .getRawOne();
      
      const stockAntesTotal = Number(stockAntes?.total || 0);

      const nuevoProducto = await crearProductoDePrueba(
        productoRepo,
        `Producto Nuevo ${Date.now()}`,
        100,
        1
      );
      await crearStock(stockRepo, nuevoProducto.id_producto, 25);

      const estadisticas = await service.obtenerEstadisticas();

      expect(Number(estadisticas.stockTotal)).toBe(stockAntesTotal + 25);

      console.log(`✅ [CP-263] Stock total actualizado: ${estadisticas.stockTotal}`);
    }, 30000);
  });

  // ============================================================================
  // CP-264: VERIFICAR ESTADÍSTICAS DE COTIZACIONES POR ESTADO
  // ============================================================================
  describe('CP-264: Verificar las estadísticas de cotizaciones por estado', () => {
    it('debería mostrar el total correcto de cotizaciones', async () => {
      const totalEnBd = await cotizacionRepo.count();

      const estadisticas = await service.obtenerEstadisticas();

      expect(estadisticas.total).toBe(totalEnBd);

      console.log(`✅ [CP-264] Total cotizaciones: ${estadisticas.total}`);
    }, 30000);

    it('debería mostrar la cantidad correcta de cotizaciones pendientes', async () => {
      const pendientesEnBd = await cotizacionRepo.count({ where: { estado: 'pendiente' } });

      const estadisticas = await service.obtenerEstadisticas();

      expect(estadisticas.pendiente).toBe(pendientesEnBd);

      console.log(`✅ [CP-264] Cotizaciones pendientes: ${estadisticas.pendiente}`);
    }, 30000);

    it('debería mostrar la cantidad correcta de cotizaciones pagadas', async () => {
      const pagadasEnBd = await cotizacionRepo.count({ where: { estado: 'pagado' } });

      const estadisticas = await service.obtenerEstadisticas();

      expect(estadisticas.pagado).toBe(pagadasEnBd);

      console.log(`✅ [CP-264] Cotizaciones pagadas: ${estadisticas.pagado}`);
    }, 30000);

    it('debería mostrar la cantidad correcta de cotizaciones entregadas', async () => {
      const entregadasEnBd = await cotizacionRepo.count({ where: { estado: 'entregado' } });

      const estadisticas = await service.obtenerEstadisticas();

      expect(estadisticas.entregado).toBe(entregadasEnBd);

      console.log(`✅ [CP-264] Cotizaciones entregadas: ${estadisticas.entregado}`);
    }, 30000);

    it('debería mostrar la cantidad correcta de cotizaciones canceladas', async () => {
      const canceladasEnBd = await cotizacionRepo.count({ where: { estado: 'cancelado' } });

      const estadisticas = await service.obtenerEstadisticas();

      expect(estadisticas.cancelado).toBe(canceladasEnBd);

      console.log(`✅ [CP-264] Cotizaciones canceladas: ${estadisticas.cancelado}`);
    }, 30000);

    it('debería mostrar las ventas totales correctas', async () => {
      const ventasResult = await cotizacionRepo
        .createQueryBuilder('cotizacion')
        .select('SUM(cotizacion.total)', 'total')
        .where('cotizacion.estado IN (:...estados)', { estados: ['pagado', 'entregado'] })
        .getRawOne();

      const ventasEsperadas = Number(ventasResult?.total || 0);

      const estadisticas = await service.obtenerEstadisticas();

      expect(Number(estadisticas.ventasTotales)).toBe(ventasEsperadas);

      console.log(`✅ [CP-264] Ventas totales: ${estadisticas.ventasTotales}`);
    }, 30000);

    it('debería mostrar el número de cotizaciones del último mes (mayor o igual a 0)', async () => {
      const estadisticas = await service.obtenerEstadisticas();

      // Verificar que es un número válido
      expect(estadisticas.ultimoMes).toBeGreaterThanOrEqual(0);
      // Verificar que no excede el total
      expect(estadisticas.ultimoMes).toBeLessThanOrEqual(estadisticas.total);

      console.log(`✅ [CP-264] Cotizaciones último mes: ${estadisticas.ultimoMes}`);
    }, 30000);

    it('debería mostrar el número de cotizaciones de la última semana (mayor o igual a 0)', async () => {
      const estadisticas = await service.obtenerEstadisticas();

      // Verificar que es un número válido
      expect(estadisticas.ultimaSemana).toBeGreaterThanOrEqual(0);
      // Verificar que no excede el total
      expect(estadisticas.ultimaSemana).toBeLessThanOrEqual(estadisticas.total);
      // La última semana debe ser menor o igual al último mes
      expect(estadisticas.ultimaSemana).toBeLessThanOrEqual(estadisticas.ultimoMes);

      console.log(`✅ [CP-264] Cotizaciones última semana: ${estadisticas.ultimaSemana}`);
    }, 30000);
  });

  // ============================================================================
  // CP-265: INTENTAR ACCEDER AL PANEL CON USUARIO SIN PERMISOS (PENDIENTE)
  // ============================================================================
  describe('CP-265: Intentar acceder al panel con un usuario sin permisos', () => {
    it('PENDIENTE - La validación de roles está implementada en el controlador con RolesGuard', () => {
      console.log(`📝 [CP-265] La validación de roles está implementada en el controlador a través de RolesGuard.
      Para probar esto se necesitaría:
      1. Pruebas de integración con contexto HTTP (supertest)
      2. Autenticación JWT con diferentes roles
      3. Verificación de códigos de respuesta HTTP (200 vs 403)
      Las pruebas actuales son a nivel de servicio y no incluyen esta validación.`);

      expect(true).toBe(true);
    });
  });
});