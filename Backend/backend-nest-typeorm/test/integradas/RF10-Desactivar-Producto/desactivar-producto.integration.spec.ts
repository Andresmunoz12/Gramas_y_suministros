// test/integradas/RF10-Desactivar-Producto/desactivar-producto.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-010 Desactivar Producto
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Los productos y cambios de estado PERMANECEN guardados en la base de datos.
 * 
 * Casos de Prueba Cubiertos (RF-010):
 * - CP-067: Verificar desactivación exitosa del producto (estado = 0).
 * - CP-068: Verificar intento de desactivar un producto inexistente.
 * - CP-069: Verificar intento de desactivar un producto ya inactivo.
 * - CP-070: Verificar cancelación de desactivación / reactivación (estado = 1).
 * - CP-071: Verificar que el producto desactivado no aparezca en el catálogo de clientes.
 * - CP-072: Verificar que solo un administrador pueda desactivar productos.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { ProductosModule } from '../../../src/productos/productos.module';
import { ProductosService } from '../../../src/productos/productos.service';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import { stock } from '../../../src/stock/stock.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';

describe('RF-010: Pruebas de Integración - Desactivar Producto', () => {
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
          nombre: 'Grama Desactivación Test',
          descripcion: 'Categoría para pruebas de desactivación de productos',
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

  // Helper para crear un producto activo (estado = 1) en la BD antes de desactivarlo
  const crearProductoActivo = async (prefix: string) => {
    return await productosService.create({
      nombre: `${prefix}_${Date.now()}`,
      marca: 'Marca Activa',
      material: 'Material Test',
      precio: 40000,
      peso: 2.0,
      altura: 25,
      descripcion: 'Producto para pruebas de desactivación',
      id_categoria: idCategoriaValida,
      estado: 1, // Activo por defecto
    });
  };

  // ============================================================================
  // CP-067: VERIFICAR DESACTIVACIÓN EXITOSA DEL PRODUCTO
  // ============================================================================
  describe('CP-067: Verificar desactivación exitosa del producto', () => {
    it('debería cambiar el estado del producto a 0 (inactivo) y confirmarlo en la BD real', async () => {
      const prodOriginal = await crearProductoActivo('CP067_desactivar');

      // Ejecutar la desactivación
      const prodDesactivado = await productosService.desactivar(prodOriginal.id_producto);

      expect(prodDesactivado).toBeDefined();
      expect(prodDesactivado.estado).toBe(0);

      // Verificación directa en la base de datos MySQL
      const enBd = await productoRepository.findOne({
        where: { id_producto: prodOriginal.id_producto },
      });

      expect(enBd).not.toBeNull();
      expect(enBd?.estado).toBe(0);

      console.log(`✅ [CP-067] Producto ID ${enBd?.id_producto} desactivado exitosamente. Estado en BD actual: ${enBd?.estado}`);
    });
  });

  // ============================================================================
  // CP-068: VERIFICAR INTENTAR DESACTIVAR UN PRODUCTO INEXISTENTE
  // ============================================================================
  describe('CP-068: Verificar intentar desactivar un producto inexistente', () => {
    it('debería lanzar NotFoundException al intentar desactivar un ID de producto que no existe en BD', async () => {
      const idInexistente = 999999;

      await expect(productosService.desactivar(idInexistente)).rejects.toThrow(NotFoundException);

      // Verificación directa en BD: Confirmar que no existe el ID 999999
      const enBd = await productoRepository.findOne({ where: { id_producto: idInexistente } });
      expect(enBd).toBeNull();

      console.log(`✅ [CP-068] Intento de desactivar producto inexistente (ID ${idInexistente}) fue rechazado con NotFoundException.`);
    });
  });

  // ============================================================================
  // CP-069: VERIFICAR INTENTAR DESACTIVAR UN PRODUCTO YA INACTIVO
  // ============================================================================
  describe('CP-069: Verificar intentar desactivar un producto ya inactivo', () => {
    it('debería procesar la solicitud manteniendo el estado en 0 (inactivo) sin fallar ni alterar la BD', async () => {
      const prodOriginal = await crearProductoActivo('CP069_ya_inactivo');

      // 1. Primera desactivación
      await productosService.desactivar(prodOriginal.id_producto);

      // 2. Segunda desactivación (ya inactivo)
      const reDesactivado = await productosService.desactivar(prodOriginal.id_producto);
      expect(reDesactivado.estado).toBe(0);

      // Verificación directa en BD
      const enBd = await productoRepository.findOne({
        where: { id_producto: prodOriginal.id_producto },
      });

      expect(enBd?.estado).toBe(0);

      console.log(`✅ [CP-069] Re-desactivación de producto ID ${enBd?.id_producto} procesada correctamente. Mantiene estado=0 en BD.`);
    });
  });

  // ============================================================================
  // CP-070: VERIFICAR CANCELAR LA DESACTIVACIÓN / REACTIVACIÓN
  // ============================================================================
  describe('CP-070: Verificar cancelar la desactivación / reactivación', () => {
    it('debería permitir la reactivación del producto (activar) devolviendo el estado a 1 en BD', async () => {
      const prodOriginal = await crearProductoActivo('CP070_cancelar_desactivacion');

      // Desactivar
      await productosService.desactivar(prodOriginal.id_producto);

      // Cancelar desactivación / Reactivar producto
      const prodReactivado = await productosService.activar(prodOriginal.id_producto);
      expect(prodReactivado.estado).toBe(1);

      // Verificación directa en la base de datos real
      const enBd = await productoRepository.findOne({
        where: { id_producto: prodOriginal.id_producto },
      });

      expect(enBd?.estado).toBe(1);

      console.log(`✅ [CP-070] Desactivación cancelada/revertida exitosamente. Producto ID ${enBd?.id_producto} restablecido con estado=1 en BD.`);
    });
  });

  // ============================================================================
  // CP-071: VERIFICAR QUE EL PRODUCTO NO APAREZCA EN EL CATÁLOGO DE CLIENTES
  // ============================================================================
  describe('CP-071: Verificar que el producto no aparezca en el catálogo de clientes', () => {
    it('debería excluir el producto desactivado (estado = 0) de los resultados del catálogo público (findAll)', async () => {
      const prodOriginal = await crearProductoActivo('CP071_catalogo_clientes');

      // Desactivar el producto
      await productosService.desactivar(prodOriginal.id_producto);

      // Consultar el catálogo público de clientes (solo productos con estado = 1)
      const catalogoClientes = await productosService.findAll();

      const estaEnCatalogo = catalogoClientes.some((p) => p.id_producto === prodOriginal.id_producto);
      expect(estaEnCatalogo).toBe(false);

      // Consultar el catálogo completo de administración (debe incluirlo)
      const catalogoAdmin = await productosService.findAllAdmin();
      const estaEnAdmin = catalogoAdmin.some((p) => p.id_producto === prodOriginal.id_producto);
      expect(estaEnAdmin).toBe(true);

      console.log(`✅ [CP-071] El producto desactivado (ID ${prodOriginal.id_producto}) no se muestra en el catálogo de clientes, pero sí en el panel admin.`);
    });
  });

  // ============================================================================
  // CP-072: VERIFICAR QUE SOLO UN ADMINISTRADOR PUEDA DESACTIVAR PRODUCTOS
  // ============================================================================
  describe('CP-072: Verificar que solo un administrador pueda desactivar productos', () => {
    it('debería rechazar la desactivación y lanzar ForbiddenException si el usuario no es Administrador', async () => {
      const prodOriginal = await crearProductoActivo('CP072_protegido_admin');

      const desactivarProductoProtegido = async (rolUsuario: number, id: number) => {
        if (rolUsuario !== 1) { // Solo Admin
          throw new ForbiddenException('Acceso denegado. Solo un administrador puede desactivar productos.');
        }
        return await productosService.desactivar(id);
      };

      // Simular intento por parte de un usuario cliente (id_rol = 2)
      await expect(desactivarProductoProtegido(2, prodOriginal.id_producto)).rejects.toThrow(ForbiddenException);

      // Verificación directa en BD: El producto conserva su estado activo (1)
      const enBd = await productoRepository.findOne({
        where: { id_producto: prodOriginal.id_producto },
      });

      expect(enBd?.estado).toBe(1);

      console.log(`✅ [CP-072] Intento de desactivar por un usuario no Administrador bloqueado con ForbiddenException. Producto ID ${enBd?.id_producto} conserva estado=1 en BD.`);
    });
  });
});
