// test/integradas/RF12-Filtrar-Catalogo-Categoria/filtrar-catalogo-categoria.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-012 Filtrar Catálogo por Categoría
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Las categorías y productos registrados PERMANECEN guardados en la BD.
 * 
 * Casos de Prueba Cubiertos (RF-012):
 * - CP-080: Verificar que filtrar productos por una categoría válida.
 * - CP-082: Verificar que filtrar una categoría sin productos disponibles.
 * - CP-084: Verificar el tiempo de respuesta del filtro (menor a 3 segundos).
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

describe('RF-012: Pruebas de Integración - Filtrar Catálogo por Categoría', () => {
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

    // Asegurar la existencia de al menos una Categoría válida de prueba en BD
    let cat = await categoriaRepository.findOne({ where: { nombre: 'Grama Residencial Test' } });
    if (!cat) {
      cat = await categoriaRepository.save(
        categoriaRepository.create({
          nombre: 'Grama Residencial Test',
          descripcion: 'Categoría específica para pruebas de filtrado',
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

  // Helper de filtrado por categoría directa en repositorio
  const filtrarPorCategoria = async (idCat: number) => {
    return await productoRepository.find({
      where: {
        categoria: { id_categoria: idCat },
        estado: 1, // Solo productos activos en el catálogo público
      },
      relations: ['categoria', 'stock'],
    });
  };

  // ============================================================================
  // CP-080: VERIFICAR QUE FILTRAR PRODUCTOS POR UNA CATEGORÍA VÁLIDA
  // ============================================================================
  describe('CP-080: Verificar que filtrar productos por una categoría válida', () => {
    it('debería retornar únicamente los productos pertenecientes a la categoría especificada', async () => {
      // Crear un producto para la categoría de prueba
      const productoCatValida = await productosService.create({
        nombre: `GramaFiltrada_${Date.now()}`,
        marca: 'Evergreen Filtro',
        material: 'Polietileno',
        precio: 49000,
        peso: 2.8,
        altura: 32,
        descripcion: 'Producto filtrado por categoría válida',
        id_categoria: idCategoriaValida,
        estado: 1,
      });

      const productosFiltrados = await filtrarPorCategoria(idCategoriaValida);

      expect(productosFiltrados).toBeDefined();
      expect(Array.isArray(productosFiltrados)).toBe(true);
      expect(productosFiltrados.length).toBeGreaterThan(0);

      // Verificar que todos los productos devueltos pertenezcan a la categoría filtrada
      const pertenecenACategoria = productosFiltrados.every(
        (p) => p.categoria.id_categoria === idCategoriaValida
      );
      expect(pertenecenACategoria).toBe(true);

      const encontrado = productosFiltrados.some((p) => p.id_producto === productoCatValida.id_producto);
      expect(encontrado).toBe(true);

      console.log(`✅ [CP-080] Filtrado exitoso para la categoría ID ${idCategoriaValida}. Se obtuvieron ${productosFiltrados.length} productos correspondientes.`);
    });
  });

  // ============================================================================
  // CP-082: VERIFICAR QUE FILTRAR UNA CATEGORÍA SIN PRODUCTOS DISPONIBLES
  // ============================================================================
  describe('CP-082: Verificar que filtrar una categoría sin productos disponibles', () => {
    it('debería retornar un arreglo vacío [] cuando la categoría no tiene productos asignados', async () => {
      // Crear una categoría nueva sin productos
      const catSinProductos = await categoriaRepository.save(
        categoriaRepository.create({
          nombre: `Categoría Vacía_${Date.now()}`,
          descripcion: 'Categoría sin productos para pruebas',
        })
      );

      const productosFiltrados = await filtrarPorCategoria(catSinProductos.id_categoria);

      expect(productosFiltrados).toBeDefined();
      expect(Array.isArray(productosFiltrados)).toBe(true);
      expect(productosFiltrados.length).toBe(0);

      console.log(`✅ [CP-082] Filtrado para la categoría vacía ID ${catSinProductos.id_categoria} retornó un arreglo [] sin productos correctamente.`);
    });
  });

  // ============================================================================
  // CP-084: VERIFICAR EL TIEMPO DE RESPUESTA DEL FILTRO
  // ============================================================================
  describe('CP-084: Verificar el tiempo de respuesta del filtro', () => {
    it('debería responder la consulta de filtrado por categoría en menos de 3000 ms (3 segundos)', async () => {
      const tiempoInicio = Date.now();

      await filtrarPorCategoria(idCategoriaValida);

      const duracionMs = Date.now() - tiempoInicio;

      expect(duracionMs).toBeLessThan(3000);

      console.log(`✅ [CP-084] Tiempo de respuesta del filtro por categoría medido: ${duracionMs} ms (Requisito: < 3000 ms).`);
    });
  });
});
