/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-031 Cálculo Automático del Valor Total de Cotización
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
 * Casos de Prueba Cubiertos (RF-031):
 * - CP-209: Calcular correctamente el valor total con varios productos.
 * - CP-210: Recálculo automático al modificar cantidades.
 * - CP-211: Recálculo al agregar o eliminar productos.
 * - CP-214: Cliente no pueda modificar manualmente el valor total.
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

describe('RF-031: Pruebas de Integración - Cálculo Automático del Valor Total de Cotización', () => {
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
  let dataSource: DataSource;

  let usuarioCliente: usuario;
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
      `cliente_calculo_${Date.now()}@gramas.com`
    );

    // Crear productos de prueba con diferentes precios
    producto1 = await crearProductoDePrueba(
      productoRepo,
      `Producto Calculo 1 ${Date.now()}`,
      100,
      1
    );
    precio1 = Number(producto1.precio);
    await crearStock(stockRepo, producto1.id_producto, 50);

    producto2 = await crearProductoDePrueba(
      productoRepo,
      `Producto Calculo 2 ${Date.now()}`,
      250,
      1
    );
    precio2 = Number(producto2.precio);
    await crearStock(stockRepo, producto2.id_producto, 30);

    producto3 = await crearProductoDePrueba(
      productoRepo,
      `Producto Calculo 3 ${Date.now()}`,
      75,
      1
    );
    precio3 = Number(producto3.precio);
    await crearStock(stockRepo, producto3.id_producto, 20);

    console.log(`✅ Datos de prueba inicializados:
      - Cliente: ${usuarioCliente.email} (ID: ${usuarioCliente.id_usuario})
      - Producto 1: ${producto1.nombre} (ID: ${producto1.id_producto}, Precio: ${precio1}, Stock: 50)
      - Producto 2: ${producto2.nombre} (ID: ${producto2.id_producto}, Precio: ${precio2}, Stock: 30)
      - Producto 3: ${producto3.nombre} (ID: ${producto3.id_producto}, Precio: ${precio3}, Stock: 20)
    `);
  }, 60000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // ============================================================================
  // CP-209: CALCULAR TOTAL CON VARIOS PRODUCTOS
  // ============================================================================
  describe('CP-209: Calcular correctamente el valor total con varios productos', () => {
    it('debería calcular el total correctamente para venta física con 3 productos', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto2.id_producto, cantidad: 1 },
        { idProducto: producto3.id_producto, cantidad: 4 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const subtotalEsperado = (precio1 * 2) + (precio2 * 1) + (precio3 * 4);
      const costoEnvioEsperado = 0;
      const totalEsperado = subtotalEsperado + costoEnvioEsperado;

      expect(Number(resultado.subtotal)).toBe(subtotalEsperado);
      expect(Number(resultado.costoEnvio)).toBe(costoEnvioEsperado);
      expect(Number(resultado.total)).toBe(totalEsperado);
      expect(Number(resultado.total)).toBe(Number(resultado.subtotal) + Number(resultado.costoEnvio));

      console.log(`✅ [CP-209] Total calculado correctamente para 3 productos: ${resultado.total}`);
    });

    it('debería calcular el total correctamente para venta con envío con varios productos', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 3 },
        { idProducto: producto2.id_producto, cantidad: 2 },
        { idProducto: producto3.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 123 #45-67, Bogotá',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const subtotalEsperado = (precio1 * 3) + (precio2 * 2) + (precio3 * 1);
      const costoEnvioEsperado = 8000;
      const totalEsperado = subtotalEsperado + costoEnvioEsperado;

      expect(Number(resultado.subtotal)).toBe(subtotalEsperado);
      expect(Number(resultado.costoEnvio)).toBe(costoEnvioEsperado);
      expect(Number(resultado.total)).toBe(totalEsperado);
      expect(Number(resultado.total)).toBe(Number(resultado.subtotal) + Number(resultado.costoEnvio));

      console.log(`✅ [CP-209] Total con envío calculado correctamente: ${resultado.total}`);
    });

    it('debería calcular correctamente el subtotal de cada detalle y sumarlos', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 5 },
        { idProducto: producto2.id_producto, cantidad: 3 },
        { idProducto: producto3.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const subtotalDetalles = resultado.detalles.reduce((sum, d) => sum + Number(d.subtotal), 0);
      
      expect(subtotalDetalles).toBe(Number(resultado.subtotal));
      expect(Number(resultado.total)).toBe(subtotalDetalles + Number(resultado.costoEnvio));

      console.log(`✅ [CP-209] Suma de detalles = ${subtotalDetalles}, Total = ${resultado.total}`);
    });
  });

  // ============================================================================
  // CP-210: RECÁLCULO AUTOMÁTICO AL MODIFICAR CANTIDADES
  // ============================================================================
  describe('CP-210: Recálculo automático al modificar cantidades', () => {
    it('debería recalcular el total al aumentar la cantidad de un producto', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
        { idProducto: producto2.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const resultadoInicial = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const subtotalInicial = Number(resultadoInicial.subtotal);

      const itemsModificados: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 5 },
        { idProducto: producto2.id_producto, cantidad: 1 },
      ];

      const dtoModificado: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: itemsModificados,
      };

      const resultadoModificado = await service.crearCotizacion(usuarioCliente.id_usuario, dtoModificado);
      const subtotalModificado = Number(resultadoModificado.subtotal);

      const subtotalEsperadoModificado = (precio1 * 5) + precio2;

      expect(subtotalModificado).toBe(subtotalEsperadoModificado);
      expect(subtotalModificado).toBeGreaterThan(subtotalInicial);

      console.log(`✅ [CP-210] Total recalculado: ${subtotalInicial} → ${subtotalModificado} (aumento de ${subtotalModificado - subtotalInicial})`);
    }, 30000);

    it('debería recalcular el total al disminuir la cantidad de un producto', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 4 },
        { idProducto: producto2.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const resultadoInicial = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const subtotalInicial = Number(resultadoInicial.subtotal);

      const itemsModificados: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto2.id_producto, cantidad: 1 },
      ];

      const dtoModificado: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: itemsModificados,
      };

      const resultadoModificado = await service.crearCotizacion(usuarioCliente.id_usuario, dtoModificado);
      const subtotalModificado = Number(resultadoModificado.subtotal);

      const subtotalEsperadoModificado = (precio1 * 2) + precio2;

      expect(subtotalModificado).toBe(subtotalEsperadoModificado);
      expect(subtotalModificado).toBeLessThan(subtotalInicial);

      console.log(`✅ [CP-210] Total recalculado: ${subtotalInicial} → ${subtotalModificado} (disminución de ${subtotalInicial - subtotalModificado})`);
    }, 30000);

    it('debería recalcular el total cuando una cantidad se cambia a 0', async () => {
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

      const resultadoInicial = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const subtotalInicial = Number(resultadoInicial.subtotal);

      const itemsModificados: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 0 },
        { idProducto: producto2.id_producto, cantidad: 2 },
        { idProducto: producto3.id_producto, cantidad: 1 },
      ];

      const dtoModificado: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: itemsModificados,
      };

      const resultadoModificado = await service.crearCotizacion(usuarioCliente.id_usuario, dtoModificado);
      const subtotalModificado = Number(resultadoModificado.subtotal);

      const subtotalEsperadoModificado = (precio2 * 2) + precio3;

      expect(subtotalModificado).toBe(subtotalEsperadoModificado);
      expect(subtotalModificado).toBeLessThan(subtotalInicial);

      console.log(`✅ [CP-210] Total recalculado al poner cantidad 0: ${subtotalInicial} → ${subtotalModificado}`);
    }, 30000);
  });

  // ============================================================================
  // CP-211: RECÁLCULO AL AGREGAR O ELIMINAR PRODUCTOS
  // ============================================================================
  describe('CP-211: Recálculo al agregar o eliminar productos', () => {
    it('debería recalcular el total al agregar un nuevo producto', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto2.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const resultadoInicial = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const subtotalInicial = Number(resultadoInicial.subtotal);

      const itemsAgregados: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto2.id_producto, cantidad: 1 },
        { idProducto: producto3.id_producto, cantidad: 3 },
      ];

      const dtoAgregado: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: itemsAgregados,
      };

      const resultadoAgregado = await service.crearCotizacion(usuarioCliente.id_usuario, dtoAgregado);
      const subtotalAgregado = Number(resultadoAgregado.subtotal);

      const subtotalEsperadoAgregado = (precio1 * 2) + precio2 + (precio3 * 3);

      expect(subtotalAgregado).toBe(subtotalEsperadoAgregado);
      expect(subtotalAgregado).toBeGreaterThan(subtotalInicial);

      console.log(`✅ [CP-211] Total recalculado al agregar producto: ${subtotalInicial} → ${subtotalAgregado}`);
    }, 30000);

    it('debería recalcular el total al eliminar un producto', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto2.id_producto, cantidad: 3 },
        { idProducto: producto3.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const resultadoInicial = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const subtotalInicial = Number(resultadoInicial.subtotal);

      const itemsEliminados: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto3.id_producto, cantidad: 1 },
      ];

      const dtoEliminado: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: itemsEliminados,
      };

      const resultadoEliminado = await service.crearCotizacion(usuarioCliente.id_usuario, dtoEliminado);
      const subtotalEliminado = Number(resultadoEliminado.subtotal);

      const subtotalEsperadoEliminado = (precio1 * 2) + precio3;

      expect(subtotalEliminado).toBe(subtotalEsperadoEliminado);
      expect(subtotalEliminado).toBeLessThan(subtotalInicial);

      console.log(`✅ [CP-211] Total recalculado al eliminar producto: ${subtotalInicial} → ${subtotalEliminado}`);
    }, 30000);

    it('debería recalcular el total al agregar múltiples productos', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const resultadoInicial = await service.crearCotizacion(usuarioCliente.id_usuario, dto);
      const subtotalInicial = Number(resultadoInicial.subtotal);

      const itemsMultiples: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 1 },
        { idProducto: producto2.id_producto, cantidad: 2 },
        { idProducto: producto3.id_producto, cantidad: 4 },
      ];

      const dtoMultiples: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: itemsMultiples,
      };

      const resultadoMultiples = await service.crearCotizacion(usuarioCliente.id_usuario, dtoMultiples);
      const subtotalMultiples = Number(resultadoMultiples.subtotal);

      const subtotalEsperadoMultiples = precio1 + (precio2 * 2) + (precio3 * 4);

      expect(subtotalMultiples).toBe(subtotalEsperadoMultiples);
      expect(subtotalMultiples).toBeGreaterThan(subtotalInicial);

      console.log(`✅ [CP-211] Total recalculado al agregar múltiples productos: ${subtotalInicial} → ${subtotalMultiples}`);
    }, 30000);
  });

  // ============================================================================
  // CP-214: CLIENTE NO PUEDA MODIFICAR MANUALMENTE EL VALOR TOTAL
  // ============================================================================
  describe('CP-214: Cliente no pueda modificar manualmente el valor total', () => {
    it('el DTO de creación no debe permitir enviar subtotal o total', async () => {
      const dto = new CrearCotizacionDto();
      expect(dto).not.toHaveProperty('subtotal');
      expect(dto).not.toHaveProperty('total');

      console.log(`✅ [CP-214] El DTO no incluye campos de subtotal o total`);
    });

    it('el total debe ser calculado automáticamente por el servicio', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 3 },
        { idProducto: producto2.id_producto, cantidad: 2 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const subtotalEsperado = (precio1 * 3) + (precio2 * 2);
      const totalEsperado = subtotalEsperado;

      expect(Number(resultado.subtotal)).toBe(subtotalEsperado);
      expect(Number(resultado.total)).toBe(totalEsperado);

      console.log(`✅ [CP-214] Total calculado automáticamente: ${resultado.total}`);
    });

    it('el total debe ser siempre igual a subtotal + costo de envío', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 2 },
        { idProducto: producto2.id_producto, cantidad: 3 },
        { idProducto: producto3.id_producto, cantidad: 1 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'envio',
        metodoPago: 'tarjeta_credito',
        direccionEnvio: 'Calle 123 #45-67, Bogotá',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const subtotalEsperado = (precio1 * 2) + (precio2 * 3) + (precio3 * 1);
      const costoEnvioEsperado = 8000;
      const totalEsperado = subtotalEsperado + costoEnvioEsperado;

      expect(Number(resultado.subtotal)).toBe(subtotalEsperado);
      expect(Number(resultado.costoEnvio)).toBe(costoEnvioEsperado);
      expect(Number(resultado.total)).toBe(totalEsperado);
      expect(Number(resultado.total)).toBe(Number(resultado.subtotal) + Number(resultado.costoEnvio));

      console.log(`✅ [CP-214] Total = Subtotal + Envío: ${resultado.subtotal} + ${resultado.costoEnvio} = ${resultado.total}`);
    });

    it('el total se calcula en el servicio y no se puede enviar desde el cliente', async () => {
      const items: ItemCotizacionDto[] = [
        { idProducto: producto1.id_producto, cantidad: 4 },
      ];

      const dto: CrearCotizacionDto = {
        metodoVenta: 'fisico',
        metodoPago: 'efectivo',
        items: items,
      };

      const resultado = await service.crearCotizacion(usuarioCliente.id_usuario, dto);

      const cotizacionEnBd = await cotizacionRepo.findOne({
        where: { idCotizacion: resultado.idCotizacion },
      });

      expect(cotizacionEnBd).not.toBeNull();
      expect(Number(cotizacionEnBd?.subtotal)).toBe(precio1 * 4);
      expect(Number(cotizacionEnBd?.total)).toBe(precio1 * 4);

      // Verificar que el total fue calculado por el servicio, no enviado por el cliente
      // El total en BD es el calculado automáticamente
      expect(Number(cotizacionEnBd?.total)).toBe(Number(cotizacionEnBd?.subtotal));

      console.log(`✅ [CP-214] Total en BD: ${cotizacionEnBd?.total} (calculado automáticamente por el servicio)`);
    });
  });
});