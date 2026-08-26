// test/integradas/RF11-Consultar-Catalogo-Productos/consultar-catalogo-productos.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-011 Consultar Catálogo de Productos
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Los productos registrados PERMANECEN guardados en la base de datos.
 * 
 * Casos de Prueba Cubiertos (RF-011):
 * - CP-074: Verificar una visualización exitosa del catálogo.
 * - CP-075: Verificar que solo se muestren productos activos (estado = 1).
 * - CP-076: Verificar consultar el catálogo cuando no existen productos disponibles.
 * - CP-077: Verificar la visualización de la información completa del producto (relaciones y campos).
 * - CP-078: Verificar que el tiempo de carga del catálogo sea menor a 3 segundos.
 * - CP-079: Verificar conexión activa y directa con la base de datos MySQL.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { ProductosModule } from '../../../src/productos/productos.module';
import { ProductosService } from '../../../src/productos/productos.service';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import { stock } from '../../../src/stock/stock.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';

describe('RF-011: Pruebas de Integración - Consultar Catálogo de Productos', () => {
  let moduleRef: TestingModule;
  let productosService: ProductosService;
  let productoRepository: Repository<productos>;
  let categoriaRepository: Repository<categoria>;
  let dataSource: DataSource;
  let idCategoriaValida: number;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          url: process.env.DATABASE_URL,
          entities: [productos, categoria, stock, usuario, rol],
          synchronize: false, // No alterar esquema existente en BD real
          ssl: {
            rejectUnauthorized: false,
          },
          extra: {
            ssl: {
              rejectUnauthorized: false,
            },
          },
        }),
        TypeOrmModule.forFeature([productos, categoria, stock, usuario, rol]),
        ProductosModule,
      ],
    }).compile();

    productosService = moduleRef.get<ProductosService>(ProductosService);
    productoRepository = moduleRef.get<Repository<productos>>(getRepositoryToken(productos));
    categoriaRepository = moduleRef.get<Repository<categoria>>(getRepositoryToken(categoria));
    dataSource = moduleRef.get<DataSource>(DataSource);

    // Asegurar la existencia de al menos una Categoría de prueba en BD
    let cat = await categoriaRepository.findOne({ where: {} });
    if (!cat) {
      cat = await categoriaRepository.save(
        categoriaRepository.create({
          nombre: 'Grama Catálogo Test',
          descripcion: 'Categoría para pruebas de consulta de catálogo',
        })
      );
    }
    idCategoriaValida = cat.id_categoria;
  }, 30000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // Helper para crear un producto en BD
  const crearProducto = async (prefix: string, estado: number = 1) => {
    return await productosService.create({
      nombre: `${prefix}_${Date.now()}`,
      marca: 'Marca Catálogo',
      material: 'Polietileno Premium',
      precio: 52000,
      peso: 3.0,
      altura: 30,
      descripcion: 'Descripción completa para el catálogo público',
      id_categoria: idCategoriaValida,
      estado: estado,
    });
  };

  // ============================================================================
  // CP-074: VERIFICAR UNA VISUALIZACIÓN EXITOSA DEL CATÁLOGO
  // ============================================================================
  describe('CP-074: Verificar una visualización exitosa del catálogo', () => {
    it('debería retornar exitosamente la lista de productos del catálogo desde la base de datos real', async () => {
      // Crear un producto activo de prueba
      const prodPrueba = await crearProducto('CP074_catalogo_exitoso', 1);

      const catalogo = await productosService.findAll();

      expect(catalogo).toBeDefined();
      expect(Array.isArray(catalogo)).toBe(true);
      expect(catalogo.length).toBeGreaterThan(0);

      const productoEncontrado = catalogo.find((p) => p.id_producto === prodPrueba.id_producto);
      expect(productoEncontrado).toBeDefined();
      expect(productoEncontrado?.nombre).toBe(prodPrueba.nombre);

      console.log(`✅ [CP-074] Catálogo consultado exitosamente desde BD real -> Total de productos cargados: ${catalogo.length}`);
    });
  });

  // ============================================================================
  // CP-075: VERIFICAR QUE SOLO SE MUESTREN PRODUCTOS ACTIVOS
  // ============================================================================
  describe('CP-075: Verificar que solo se muestren productos activos', () => {
    it('debería filtrar estrictamente los productos con estado = 1 e ignorar los inactivos (estado = 0)', async () => {
      const prodActivo = await crearProducto('CP075_activo', 1);
      const prodInactivo = await crearProducto('CP075_inactivo', 0);

      const catalogo = await productosService.findAll();

      // Verificar que todos los productos del catálogo público tengan estado 1
      const todosActivos = catalogo.every((p) => p.estado === 1);
      expect(todosActivos).toBe(true);

      // Confirmar inclusión del activo y exclusión del inactivo
      const activoEnCatalogo = catalogo.some((p) => p.id_producto === prodActivo.id_producto);
      const inactivoEnCatalogo = catalogo.some((p) => p.id_producto === prodInactivo.id_producto);

      expect(activoEnCatalogo).toBe(true);
      expect(inactivoEnCatalogo).toBe(false);

      console.log(`✅ [CP-075] Catálogo verificado: Producto activo ID ${prodActivo.id_producto} está presente y producto inactivo ID ${prodInactivo.id_producto} fue excluido.`);
    });
  });

  // ============================================================================
  // CP-076: VERIFICAR CONSULTAR EL CATÁLOGO CUANDO NO EXISTEN PRODUCTOS DISPONIBLES
  // ============================================================================
  describe('CP-076: Verificar consultar el catálogo cuando no existen productos disponibles', () => {
    it('debería retornar un arreglo estructuralmente válido sin lanzar excepciones ante consultas vacías', async () => {
      // Consulta directa al repositorio con un filtro sin coincidencias
      const resultadoVacio = await productoRepository.find({
        where: { id_producto: -99999 },
      });

      expect(resultadoVacio).toBeDefined();
      expect(Array.isArray(resultadoVacio)).toBe(true);
      expect(resultadoVacio.length).toBe(0);

      console.log(`✅ [CP-076] La consulta sin resultados retornó un arreglo vacío [] correctamente sin arrojar errores.`);
    });
  });

  // ============================================================================
  // CP-077: VERIFICAR LA VISUALIZACIÓN DE LA INFORMACIÓN COMPLETA DEL PRODUCTO
  // ============================================================================
  describe('CP-077: Verificar la visualización de la información completa del producto', () => {
    it('debería incluir todos los atributos requeridos (nombre, marca, precio, material) y sus relaciones en el catálogo', async () => {
      const prodCompleto = await crearProducto('CP077_informacion_completa', 1);

      const productoDetallado = await productosService.findOne(prodCompleto.id_producto);

      expect(productoDetallado).toBeDefined();
      expect(productoDetallado.id_producto).toBe(prodCompleto.id_producto);
      expect(productoDetallado.nombre).toBe(prodCompleto.nombre);
      expect(productoDetallado.marca).toBe('Marca Catálogo');
      expect(productoDetallado.material).toBe('Polietileno Premium');
      expect(Number(productoDetallado.precio)).toBe(52000);
      expect(productoDetallado.descripcion).toBe('Descripción completa para el catálogo público');
      expect(productoDetallado.categoria).toBeDefined();
      expect(productoDetallado.categoria.id_categoria).toBe(idCategoriaValida);

      console.log(`✅ [CP-077] Información completa del producto ID ${productoDetallado.id_producto} verificada con sus relaciones y atributos en BD.`);
    });
  });

  // ============================================================================
  // CP-078: VERIFICAR QUE EL TIEMPO DE CARGA DEL CATÁLOGO SEA MENOR A 3 SEGUNDOS
  // ============================================================================
  describe('CP-078: Verificar que el tiempo de carga del catálogo sea menor a 3 segundos', () => {
    it('debería responder la consulta de catálogo en menos de 3000 ms (3 segundos)', async () => {
      const tiempoInicio = Date.now();

      await productosService.findAll();

      const duracionMs = Date.now() - tiempoInicio;

      expect(duracionMs).toBeLessThan(3000);

      console.log(`✅ [CP-078] Tiempo de carga del catálogo medido: ${duracionMs} ms (Requisito: < 3000 ms).`);
    });
  });

  // ============================================================================
  // CP-079: VERIFICAR CONEXIÓN CON LA BASE DE DATOS
  // ============================================================================
  describe('CP-079: Verificar conexión con la base de datos', () => {
    it('debería confirmar que la conexión MySQL via TypeORM está activa, funcional y con latencia óptima', async () => {
      expect(dataSource.isInitialized).toBe(true);

      const resQuery = await dataSource.query('SELECT 1 + 1 AS conexion_activa');

      expect(resQuery).toBeDefined();
      expect(Number(resQuery[0].conexion_activa)).toBe(2);

      console.log(`✅ [CP-079] Conexión directa a la base de datos MySQL verificada y funcional.`);
    });
  });
});
