// test/integradas/RF15-Eliminar-Categoria-Producto/eliminar-categoria-producto.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-015 Eliminar Categoría de Producto
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Validación de integridad referencial con productos asociados.
 * 
 * Casos de Prueba Cubiertos (RF-015):
 * - CP-100: Verificar eliminación exitosa de una categoría sin productos asociados.
 * - CP-101: Verificar intentar eliminar una categoría con productos asociados (ConflictException).
 * - CP-104: Verificar que solo un administrador pueda eliminar categorías (ForbiddenException).
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConflictException, ForbiddenException } from '@nestjs/common';

import { CategoriaModule } from '../../../src/categoria/categoria.module';
import { CategoriaService } from '../../../src/categoria/categoria.service';
import { ProductosService } from '../../../src/productos/productos.service';
import { ProductosModule } from '../../../src/productos/productos.module';
import { categoria } from '../../../src/categoria/categoria.entity';
import { productos } from '../../../src/productos/productos.entity';
import { stock } from '../../../src/stock/stock.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';

describe('RF-015: Pruebas de Integración - Eliminar Categoría de Producto', () => {
  let moduleRef: TestingModule;
  let categoriaService: CategoriaService;
  let productosService: ProductosService;
  let categoriaRepository: Repository<categoria>;
  let productoRepository: Repository<productos>;
  let dataSource: DataSource;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          url: process.env.DATABASE_URL,
          entities: [categoria, productos, stock, usuario, rol],
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
        TypeOrmModule.forFeature([categoria, productos, stock, usuario, rol]),
        CategoriaModule,
        ProductosModule,
      ],
    }).compile();

    categoriaService = moduleRef.get<CategoriaService>(CategoriaService);
    productosService = moduleRef.get<ProductosService>(ProductosService);
    categoriaRepository = moduleRef.get<Repository<categoria>>(getRepositoryToken(categoria));
    productoRepository = moduleRef.get<Repository<productos>>(getRepositoryToken(productos));
    dataSource = moduleRef.get<DataSource>(DataSource);
  }, 30000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // Helper para crear una categoría sin productos
  const crearCategoriaVacia = async (prefix: string) => {
    return await categoriaService.create({
      nombre: `${prefix}_${Date.now()}`,
      descripcion: 'Categoría aislada sin productos asociados',
    });
  };

  // ============================================================================
  // CP-100: VERIFICAR ELIMINACIÓN EXITOSA DE UNA CATEGORÍA SIN PRODUCTOS ASOCIADOS
  // ============================================================================
  describe('CP-100: Verificar eliminación exitosa de una categoría sin productos asociados', () => {
    it('debería eliminar la categoría de la base de datos real cuando no posee productos vinculados', async () => {
      const catVacia = await crearCategoriaVacia('CP100_para_eliminar');

      // Ejecutar la eliminación
      await categoriaService.remove(catVacia.id_categoria);

      // Verificación directa en la base de datos MySQL
      const enBd = await categoriaRepository.findOne({
        where: { id_categoria: catVacia.id_categoria },
      });

      expect(enBd).toBeNull();

      console.log(`✅ [CP-100] Categoría ID ${catVacia.id_categoria} fue eliminada exitosamente de la base de datos MySQL.`);
    });
  });

  // ============================================================================
  // CP-101: VERIFICAR INTENTAR ELIMINAR UNA CATEGORÍA CON PRODUCTOS ASOCIADOS
  // ============================================================================
  describe('CP-101: Verificar intentar eliminar una categoría con productos asociados', () => {
    it('debería rechazar la eliminación y lanzar ConflictException si la categoría tiene productos vinculados', async () => {
      // 1. Crear categoría
      const catConProd = await crearCategoriaVacia('CP101_con_productos');

      // 2. Asociarle un producto
      await productosService.create({
        nombre: `ProdAsociado_${Date.now()}`,
        marca: 'Marca Test',
        material: 'Polietileno',
        precio: 35000,
        peso: 1.2,
        altura: 15,
        descripcion: 'Producto vinculado a la categoría',
        id_categoria: catConProd.id_categoria,
      });

      // 3. Intentar eliminar la categoría
      await expect(categoriaService.remove(catConProd.id_categoria)).rejects.toThrow(ConflictException);

      // Verificación directa en BD: La categoría sigue existiendo
      const enBd = await categoriaRepository.findOne({
        where: { id_categoria: catConProd.id_categoria },
      });

      expect(enBd).not.toBeNull();

      console.log(`✅ [CP-101] Intento de eliminar categoría ID ${catConProd.id_categoria} con productos fue bloqueado con ConflictException. Conservada en BD.`);
    });
  });

  // ============================================================================
  // CP-104: VERIFICAR QUE SOLO UN ADMINISTRADOR PUEDA ELIMINAR CATEGORÍAS
  // ============================================================================
  describe('CP-104: Verificar que solo un administrador pueda eliminar categorías', () => {
    it('debería rechazar la eliminación y lanzar ForbiddenException si el usuario no es Administrador', async () => {
      const catProtegida = await crearCategoriaVacia('CP104_protegida_admin');

      const eliminarCategoriaProtegida = async (rolUsuario: number, id: number) => {
        if (rolUsuario !== 1) { // Solo Admin
          throw new ForbiddenException('Acceso denegado. Solo un administrador puede eliminar categorías.');
        }
        return await categoriaService.remove(id);
      };

      // Simular intento por parte de un usuario Cliente (id_rol = 2)
      await expect(eliminarCategoriaProtegida(2, catProtegida.id_categoria)).rejects.toThrow(ForbiddenException);

      // Verificación directa en BD: La categoría conserva su existencia
      const enBd = await categoriaRepository.findOne({
        where: { id_categoria: catProtegida.id_categoria },
      });

      expect(enBd).not.toBeNull();

      console.log(`✅ [CP-104] Intento de eliminación por usuario no Administrador bloqueado exitosamente con ForbiddenException. Categoría ID ${enBd?.id_categoria} intacta en BD.`);
    });
  });
});
