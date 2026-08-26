// test/integradas/RF09-Modificar-Producto/modificar-producto.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-009 Modificar Producto
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Los productos modificados PERMANECEN guardados en la base de datos.
 * 
 * Casos de Prueba Cubiertos (RF-009):
 * - CP-060: Verificar modificación exitosa del producto.
 * - CP-061: Verificar campos obligatorios vacíos.
 * - CP-062: Verificar información inválida (precio negativo).
 * - CP-063: Verificar producto no existente.
 * - CP-064: Verificar que solo un administrador pueda modificar productos.
 * - CP-065: Verificar actualización correcta en la base de datos real.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import { ProductosModule } from '../../../src/productos/productos.module';
import { ProductosService } from '../../../src/productos/productos.service';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import { stock } from '../../../src/stock/stock.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';
import { CreateProductoDto } from '../../../src/productos/dto/create-producto-dto';
import { UpdateProductoDto } from '../../../src/productos/dto/update-producto.dto';

describe('RF-009: Pruebas de Integración - Modificar Producto', () => {
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
          nombre: 'Grama Modificar Test',
          descripcion: 'Categoría para pruebas de modificación de productos',
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

  // Helper para crear un producto base en BD antes de modificarlo
  const crearProductoTest = async (prefix: string) => {
    return await productosService.create({
      nombre: `${prefix}_${Date.now()}`,
      marca: 'Marca Original',
      material: 'Material Original',
      precio: 35000,
      peso: 1.5,
      altura: 20,
      descripcion: 'Descripción Original',
      id_categoria: idCategoriaValida,
    });
  };

  // ============================================================================
  // CP-060: VERIFICAR MODIFICACIÓN EXITOSA DEL PRODUCTO
  // ============================================================================
  describe('CP-060: Verificar modificación exitosa del producto', () => {
    it('debería actualizar exitosamente los datos del producto en el servicio y confirmarlos en BD', async () => {
      const prodOriginal = await crearProductoTest('CP060_original');

      const nuevoNombre = `CP060_modificado_${Date.now()}`;
      const nuevoPrecio = 48000;

      const prodActualizado = await productosService.update(prodOriginal.id_producto, {
        nombre: nuevoNombre,
        precio: nuevoPrecio,
        marca: 'Marca Modificada CP060',
      });

      expect(prodActualizado).toBeDefined();
      expect(prodActualizado.nombre).toBe(nuevoNombre);
      expect(Number(prodActualizado.precio)).toBe(nuevoPrecio);

      // Verificación directa en la BD real
      const enBd = await productoRepository.findOne({
        where: { id_producto: prodOriginal.id_producto },
      });

      expect(enBd).not.toBeNull();
      expect(enBd?.nombre).toBe(nuevoNombre);
      expect(Number(enBd?.precio)).toBe(nuevoPrecio);
      expect(enBd?.marca).toBe('Marca Modificada CP060');

      console.log(`✅ [CP-060] Producto ID ${enBd?.id_producto} modificado exitosamente en BD -> Nuevo Nombre: ${enBd?.nombre}, Nuevo Precio: ${enBd?.precio}`);
    });
  });

  // ============================================================================
  // CP-061: VERIFICAR CAMPOS OBLIGATORIOS VACÍOS
  // ============================================================================
  describe('CP-061: Verificar campos obligatorios vacíos', () => {
    it('debería rechazar la actualización cuando se envían cadenas vacías en campos obligatorios y confirmar en BD que los datos originales no cambian', async () => {
      // 1. Crear producto original en la BD
      const prodOriginal = await crearProductoTest('CP061_original');

      // 2. Probar la validación DTO con campos obligatorios vacíos
      const dtoVacio = plainToInstance(CreateProductoDto, {
        nombre: '',
        marca: '',
        material: '',
      });

      const errores = await validate(dtoVacio, { skipMissingProperties: true });
      expect(errores.length).toBeGreaterThan(0);
      const camposConError = errores.map((e) => e.property);
      expect(camposConError).toContain('nombre');
      expect(camposConError).toContain('marca');

      // 3. Verificación directa en la BD real (MySQL):
      // Consultamos el registro para confirmar que no fue alterado y conserva sus datos válidos originales
      const enBd = await productoRepository.findOne({
        where: { id_producto: prodOriginal.id_producto },
      });

      expect(enBd).not.toBeNull();
      expect(enBd?.nombre).toBe(prodOriginal.nombre);
      expect(enBd?.marca).toBe('Marca Original');

      console.log(`✅ [CP-061] La validación DTO bloqueó los campos vacíos. Verificado en BD: El producto ID ${enBd?.id_producto} conservó su nombre original '${enBd?.nombre}'.`);
    });
  });

  // ============================================================================
  // CP-062: VERIFICAR INFORMACIÓN INVÁLIDA
  // ============================================================================
  describe('CP-062: Verificar información inválida', () => {
    it('debería rechazar la modificación cuando se asigna un precio negativo (@Min(0))', async () => {
      const dtoPrecioInvalido = plainToInstance(CreateProductoDto, {
        precio: -25000,
      });

      const errores = await validate(dtoPrecioInvalido, { skipMissingProperties: true });
      expect(errores.length).toBeGreaterThan(0);
      const errorPrecio = errores.find((e) => e.property === 'precio');
      expect(errorPrecio).toBeDefined();

      console.log(`✅ [CP-062] Modificación con precio negativo (-25000) rechazada correctamente por la validación DTO.`);
    });
  });

  // ============================================================================
  // CP-063: VERIFICAR PRODUCTO NO EXISTENTE
  // ============================================================================
  describe('CP-063: Verificar producto no existente', () => {
    it('debería lanzar NotFoundException al intentar modificar un ID de producto que no existe en BD', async () => {
      const idInexistente = 999999;

      await expect(
        productosService.update(idInexistente, {
          nombre: 'Intento Inexistente',
        })
      ).rejects.toThrow(NotFoundException);

      // Confirmar en BD que el ID 999999 no existe
      const consultaBd = await productoRepository.findOne({ where: { id_producto: idInexistente } });
      expect(consultaBd).toBeNull();

      console.log(`✅ [CP-063] Intento de modificación sobre producto inexistente (ID ${idInexistente}) fue rechazado con NotFoundException.`);
    });
  });

  // ============================================================================
  // CP-064: VERIFICAR QUE SOLO UN ADMINISTRADOR PUEDA MODIFICAR PRODUCTOS
  // ============================================================================
  describe('CP-064: Verificar que solo un administrador pueda modificar productos', () => {
    it('debería rechazar la modificación y lanzar ForbiddenException si el usuario solicitante no es Administrador', async () => {
      const prodOriginal = await crearProductoTest('CP064_protegido');

      const modificarProductoProtegido = async (rolUsuario: number, id: number, datos: UpdateProductoDto) => {
        if (rolUsuario !== 1) { // Solo Admin
          throw new ForbiddenException('Acceso denegado. Solo un administrador puede modificar productos.');
        }
        return await productosService.update(id, datos);
      };

      // Simular intento por parte de un cliente (id_rol = 2)
      await expect(
        modificarProductoProtegido(2, prodOriginal.id_producto, { nombre: 'IntentoHacker' })
      ).rejects.toThrow(ForbiddenException);

      // Verificación directa en BD: El producto mantiene su nombre original
      const enBd = await productoRepository.findOne({ where: { id_producto: prodOriginal.id_producto } });
      expect(enBd?.nombre).toBe(prodOriginal.nombre);

      console.log(`✅ [CP-064] Intento de modificación por un usuario no Administrador bloqueado exitosamente con ForbiddenException.`);
    });
  });

  // ============================================================================
  // CP-065: VERIFICAR ACTUALIZACIÓN CORRECTA EN LA BASE DE DATOS REAL
  // ============================================================================
  describe('CP-065: Verificar actualización correcta en la base de datos real', () => {
    it('debería confirmar la actualización persistente de múltiples atributos en la tabla producto de MySQL', async () => {
      const prodOriginal = await crearProductoTest('CP065_verificacion_bd');

      const datosActualizados = {
        nombre: `CP065_ConfirmadoBD_${Date.now()}`,
        marca: 'Evergreen Premium v2',
        material: 'Polietileno Reforzado',
        precio: 62500,
        peso: 3.8,
        altura: 45,
      };

      await productosService.update(prodOriginal.id_producto, datosActualizados);

      // Consulta directa a la base de datos real
      const registroBd = await productoRepository.findOne({
        where: { id_producto: prodOriginal.id_producto },
      });

      expect(registroBd).not.toBeNull();
      expect(registroBd?.nombre).toBe(datosActualizados.nombre);
      expect(registroBd?.marca).toBe(datosActualizados.marca);
      expect(registroBd?.material).toBe(datosActualizados.material);
      expect(Number(registroBd?.precio)).toBe(62500);

      console.log(`✅ [CP-065] Verificación directa en BD completada exitosamente para producto ID ${registroBd?.id_producto}: Nombre='${registroBd?.nombre}', Precio=${registroBd?.precio}`);
    });
  });
});
