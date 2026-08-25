/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-038 Buscar y Filtrar Historial de Cotizaciones
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
 * Casos de Prueba Cubiertos (RF-038):
 * - CP-253: Buscar cotizaciones por cliente.
 * - CP-254: Buscar cotizaciones por fecha.
 * - CP-255: Buscar cotizaciones por estado Pendiente.
 * - CP-256: Buscar cotizaciones por estado Pagada, Entregada o Cancelada.
 * - CP-257: Aplicar múltiples filtros simultáneamente.
 * - CP-258: Realizar una búsqueda sin resultados.
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

describe('RF-038: Pruebas de Integración - Buscar y Filtrar Historial de Cotizaciones', () => {
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
      `cliente_filtro_${Date.now()}@gramas.com`
    );

    usuarioCliente2 = await crearUsuarioDePrueba(
      usuarioRepo,
      2,
      `cliente2_filtro_${Date.now()}@gramas.com`
    );

    usuarioAdmin = await crearUsuarioDePrueba(
      usuarioRepo,
      1,
      `admin_filtro_${Date.now()}@gramas.com`
    );

    // Crear productos de prueba
    producto1 = await crearProductoDePrueba(
      productoRepo,
      `Producto Filtro 1 ${Date.now()}`,
      150,
      1
    );
    precio1 = Number(producto1.precio);
    await crearStock(stockRepo, producto1.id_producto, 50);

    producto2 = await crearProductoDePrueba(
      productoRepo,
      `Producto Filtro 2 ${Date.now()}`,
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
  // CP-253: BUSCAR COTIZACIONES POR CLIENTE
  // ============================================================================
  describe('CP-253: Buscar cotizaciones por cliente', () => {
    it('debería encontrar cotizaciones por nombre del cliente', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const nombreBusqueda = usuarioCliente.nombre;
      const resultado = await service.obtenerTodasCotizaciones({
        search: nombreBusqueda,
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBeGreaterThan(0);

      for (const cotizacion of resultado) {
        const nombreCompleto = `${cotizacion.usuario.nombre} ${cotizacion.usuario.apellido || ''}`;
        expect(nombreCompleto.toLowerCase()).toContain(nombreBusqueda.toLowerCase());
      }

      console.log(`✅ [CP-253] Búsqueda por nombre "${nombreBusqueda}" encontró ${resultado.length} cotizaciones`);
    }, 30000);

    it('debería encontrar cotizaciones por email del cliente', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto2.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 123 #45-67, Bogotá',
        items: items,
      };

      await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const emailBusqueda = usuarioCliente.email.substring(0, 10);
      const resultado = await service.obtenerTodasCotizaciones({
        search: emailBusqueda,
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBeGreaterThan(0);

      for (const cotizacion of resultado) {
        expect(cotizacion.usuario.email.toLowerCase()).toContain(emailBusqueda.toLowerCase());
      }

      console.log(`✅ [CP-253] Búsqueda por email "${emailBusqueda}" encontró ${resultado.length} cotizaciones`);
    }, 30000);

    it('debería encontrar cotizaciones de un cliente específico', async () => {
      // Crear cotizaciones para ambos clientes
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

      const resultado = await service.obtenerTodasCotizaciones({
        search: usuarioCliente.email,
      });

      for (const cotizacion of resultado) {
        expect(cotizacion.usuario.id_usuario).toBe(usuarioCliente.id_usuario);
      }

      console.log(`✅ [CP-253] Búsqueda por cliente específico encontró ${resultado.length} cotizaciones`);
    }, 30000);
  });

  // ============================================================================
  // CP-254: BUSCAR COTIZACIONES POR FECHA
  // ============================================================================
  describe('CP-254: Buscar cotizaciones por fecha', () => {
    it('debería encontrar cotizaciones en un rango de fechas', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const fecha = new Date(cotizacion.fechaCreacion);

      const fechaInicio = new Date(fecha);
      fechaInicio.setDate(fechaInicio.getDate() - 1);
      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaFin.getDate() + 1);

      const resultado = await service.obtenerTodasCotizaciones({
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBeGreaterThan(0);

      for (const c of resultado) {
        const fechaCotizacion = new Date(c.fechaCreacion);
        expect(fechaCotizacion.getTime()).toBeGreaterThanOrEqual(fechaInicio.getTime());
        expect(fechaCotizacion.getTime()).toBeLessThanOrEqual(fechaFin.getTime());
      }

      console.log(`✅ [CP-254] Rango de fechas encontró ${resultado.length} cotizaciones`);
    }, 30000);

    it('debería encontrar cotizaciones desde una fecha inicio', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const fecha = new Date(cotizacion.fechaCreacion);

      const fechaInicio = new Date(fecha);
      fechaInicio.setDate(fechaInicio.getDate() - 1);

      const resultado = await service.obtenerTodasCotizaciones({
        fechaInicio: fechaInicio.toISOString(),
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBeGreaterThan(0);

      for (const c of resultado) {
        const fechaCotizacion = new Date(c.fechaCreacion);
        expect(fechaCotizacion.getTime()).toBeGreaterThanOrEqual(fechaInicio.getTime());
      }

      console.log(`✅ [CP-254] Fecha inicio encontró ${resultado.length} cotizaciones`);
    }, 30000);

    it('debería encontrar cotizaciones hasta una fecha fin', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const fecha = new Date(cotizacion.fechaCreacion);

      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaFin.getDate() + 1);

      const resultado = await service.obtenerTodasCotizaciones({
        fechaFin: fechaFin.toISOString(),
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBeGreaterThan(0);

      for (const c of resultado) {
        const fechaCotizacion = new Date(c.fechaCreacion);
        expect(fechaCotizacion.getTime()).toBeLessThanOrEqual(fechaFin.getTime());
      }

      console.log(`✅ [CP-254] Fecha fin encontró ${resultado.length} cotizaciones`);
    }, 30000);
  });

  // ============================================================================
  // CP-255: BUSCAR COTIZACIONES POR ESTADO PENDIENTE
  // ============================================================================
  describe('CP-255: Buscar cotizaciones por estado Pendiente', () => {
    it('debería encontrar solo cotizaciones con estado pendiente', async () => {
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

      const resultado = await service.obtenerTodasCotizaciones({
        estado: 'pendiente',
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);

      for (const c of resultado) {
        expect(c.estado).toBe('pendiente');
      }

      console.log(`✅ [CP-255] Estado pendiente: ${resultado.length} cotizaciones`);
    }, 30000);

    it('no debería incluir cotizaciones con otros estados', async () => {
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

      const resultado = await service.obtenerTodasCotizaciones({
        estado: 'pendiente',
      });

      // La cotización pagada no debería aparecer
      const encontrada = resultado.some(c => c.idCotizacion === cotizacion.idCotizacion);
      expect(encontrada).toBe(false);

      console.log(`✅ [CP-255] Cotizaciones pagadas no aparecen en filtro pendiente`);
    }, 30000);
  });

  // ============================================================================
  // CP-256: BUSCAR COTIZACIONES POR ESTADO PAGADA, ENTREGADA O CANCELADA
  // ============================================================================
  describe('CP-256: Buscar cotizaciones por estado Pagada, Entregada o Cancelada', () => {
    it('debería encontrar cotizaciones con estado pagado', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      await service.actualizarEstado(cotizacion.idCotizacion, 'pagado');

      const resultado = await service.obtenerTodasCotizaciones({
        estado: 'pagado',
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);

      for (const c of resultado) {
        expect(c.estado).toBe('pagado');
      }

      console.log(`✅ [CP-256] Estado pagado: ${resultado.length} cotizaciones`);
    }, 30000);

    it('debería encontrar cotizaciones con estado entregado', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 456 #78-90, Medellín',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      await service.actualizarEstado(cotizacion.idCotizacion, 'entregado');

      const resultado = await service.obtenerTodasCotizaciones({
        estado: 'entregado',
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);

      for (const c of resultado) {
        expect(c.estado).toBe('entregado');
      }

      console.log(`✅ [CP-256] Estado entregado: ${resultado.length} cotizaciones`);
    }, 30000);

    it('debería encontrar cotizaciones con estado cancelado', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto2.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      await service.actualizarEstado(cotizacion.idCotizacion, 'cancelado');

      const resultado = await service.obtenerTodasCotizaciones({
        estado: 'cancelado',
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);

      for (const c of resultado) {
        expect(c.estado).toBe('cancelado');
      }

      console.log(`✅ [CP-256] Estado cancelado: ${resultado.length} cotizaciones`);
    }, 30000);
  });

  // ============================================================================
  // CP-257: APLICAR MÚLTIPLES FILTROS SIMULTÁNEAMENTE
  // ============================================================================
  describe('CP-257: Aplicar múltiples filtros simultáneamente', () => {
    it('debería filtrar por estado y cliente', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      await service.actualizarEstado(cotizacion.idCotizacion, 'pagado');

      // Crear otra cotización pendiente para el mismo cliente
      await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const resultado = await service.obtenerTodasCotizaciones({
        estado: 'pagado',
        search: usuarioCliente.email,
      });

      for (const c of resultado) {
        expect(c.estado).toBe('pagado');
        expect(c.usuario.id_usuario).toBe(usuarioCliente.id_usuario);
      }

      console.log(`✅ [CP-257] Filtro por estado + cliente: ${resultado.length} cotizaciones`);
    }, 30000);

    it('debería filtrar por estado y rango de fechas', async () => {
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

      const fecha = new Date(cotizacion.fechaCreacion);
      const fechaInicio = new Date(fecha);
      fechaInicio.setDate(fechaInicio.getDate() - 1);
      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaFin.getDate() + 1);

      const resultado = await service.obtenerTodasCotizaciones({
        estado: 'pagado',
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      });

      for (const c of resultado) {
        expect(c.estado).toBe('pagado');
        const fechaCotizacion = new Date(c.fechaCreacion);
        expect(fechaCotizacion.getTime()).toBeGreaterThanOrEqual(fechaInicio.getTime());
        expect(fechaCotizacion.getTime()).toBeLessThanOrEqual(fechaFin.getTime());
      }

      console.log(`✅ [CP-257] Filtro por estado + fechas: ${resultado.length} cotizaciones`);
    }, 30000);

    it('debería filtrar por cliente y rango de fechas', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto2.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 789 #12-34, Cali',
        items: items,
      };

      const cotizacion = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const fecha = new Date(cotizacion.fechaCreacion);
      const fechaInicio = new Date(fecha);
      fechaInicio.setDate(fechaInicio.getDate() - 1);
      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaFin.getDate() + 1);

      const resultado = await service.obtenerTodasCotizaciones({
        search: usuarioCliente.email,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      });

      for (const c of resultado) {
        expect(c.usuario.id_usuario).toBe(usuarioCliente.id_usuario);
        const fechaCotizacion = new Date(c.fechaCreacion);
        expect(fechaCotizacion.getTime()).toBeGreaterThanOrEqual(fechaInicio.getTime());
        expect(fechaCotizacion.getTime()).toBeLessThanOrEqual(fechaFin.getTime());
      }

      console.log(`✅ [CP-257] Filtro por cliente + fechas: ${resultado.length} cotizaciones`);
    }, 30000);

    it('debería aplicar tres filtros simultáneamente', async () => {
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

      const fecha = new Date(cotizacion.fechaCreacion);
      const fechaInicio = new Date(fecha);
      fechaInicio.setDate(fechaInicio.getDate() - 1);
      const fechaFin = new Date(fecha);
      fechaFin.setDate(fechaFin.getDate() + 1);

      const resultado = await service.obtenerTodasCotizaciones({
        estado: 'pagado',
        search: usuarioCliente.email,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      });

      for (const c of resultado) {
        expect(c.estado).toBe('pagado');
        expect(c.usuario.id_usuario).toBe(usuarioCliente.id_usuario);
        const fechaCotizacion = new Date(c.fechaCreacion);
        expect(fechaCotizacion.getTime()).toBeGreaterThanOrEqual(fechaInicio.getTime());
        expect(fechaCotizacion.getTime()).toBeLessThanOrEqual(fechaFin.getTime());
      }

      console.log(`✅ [CP-257] Tres filtros simultáneos: ${resultado.length} cotizaciones`);
    }, 30000);
  });

  // ============================================================================
  // CP-258: REALIZAR BÚSQUEDA SIN RESULTADOS
  // ============================================================================
  describe('CP-258: Realizar una búsqueda sin resultados', () => {
    it('debería retornar arreglo vacío al buscar cliente inexistente', async () => {
      const resultado = await service.obtenerTodasCotizaciones({
        search: 'usuario_que_no_existe_123456',
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBe(0);

      console.log(`✅ [CP-258] Búsqueda de cliente inexistente: ${resultado.length} resultados`);
    }, 30000);

    it('debería retornar arreglo vacío al buscar estado sin cotizaciones', async () => {
      // Usar un estado que no existe o que no tiene cotizaciones
      const resultado = await service.obtenerTodasCotizaciones({
        estado: 'estado_inexistente',
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBe(0);

      console.log(`✅ [CP-258] Estado inexistente: ${resultado.length} resultados`);
    }, 30000);

    it('debería retornar arreglo vacío al buscar rango de fechas sin cotizaciones', async () => {
      const fechaInicio = new Date('2020-01-01');
      const fechaFin = new Date('2020-01-02');

      const resultado = await service.obtenerTodasCotizaciones({
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBe(0);

      console.log(`✅ [CP-258] Rango de fechas sin cotizaciones: ${resultado.length} resultados`);
    }, 30000);

    it('debería retornar arreglo vacío al combinar filtros sin resultados', async () => {
      const resultado = await service.obtenerTodasCotizaciones({
        estado: 'entregado',
        search: 'usuario_que_no_existe',
        fechaInicio: '2020-01-01',
        fechaFin: '2020-01-02',
      });

      expect(resultado).toBeDefined();
      expect(Array.isArray(resultado)).toBe(true);
      expect(resultado.length).toBe(0);

      console.log(`✅ [CP-258] Filtros combinados sin resultados: ${resultado.length} resultados`);
    }, 30000);
  });
});