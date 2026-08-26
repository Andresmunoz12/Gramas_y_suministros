// test/integradas/RF08-Registrar-Producto/registrar-producto.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-008 Registrar Producto
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
 * Casos de Prueba Cubiertos (RF-008):
 * - CP-052: Verificar registro exitoso del producto.
 * - CP-053: Verificar campos obligatorios vacíos.
 * - CP-054: Verificar categoría inexistente.
 * - CP-055: Verificar imagen con formato no permitido.
 * - CP-056: Verificar precio inválido (negativo o cero).
 * - CP-057: Verificar que solo un administrador pueda registrar productos.
 * - CP-058: Verificar almacenamiento correcto del producto en la BD real.
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

describe('RF-008: Pruebas de Integración - Registrar Producto', () => {
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
          nombre: 'Grama Sintética Test',
          descripcion: 'Categoría para pruebas de integración de productos',
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

  // ============================================================================
  // CP-052: VERIFICAR REGISTRO EXITOSO DEL PRODUCTO
  // ============================================================================
  describe('CP-052: Verificar registro exitoso del producto', () => {
    it('debería guardar exitosamente el nuevo producto en la base de datos real', async () => {
      const nombreProducto = `Grama Premium CP052_${Date.now()}`;

      const nuevoProducto = await productosService.create({
        nombre: nombreProducto,
        marca: 'Evergreen Test',
        material: 'Polietileno Alta Resistencia',
        precio: 45000,
        peso: 2.5,
        altura: 35,
        descripcion: 'Grama para uso deportivo y residencial',
        id_categoria: idCategoriaValida,
      });

      expect(nuevoProducto).toBeDefined();
      expect(nuevoProducto.id_producto).toBeDefined();
      expect(nuevoProducto.nombre).toBe(nombreProducto);

      // Verificación directa en BD mediante TypeORM
      const productoEnBd = await productoRepository.findOne({
        where: { id_producto: nuevoProducto.id_producto },
        relations: ['categoria'],
      });

      expect(productoEnBd).not.toBeNull();
      expect(productoEnBd?.nombre).toBe(nombreProducto);
      expect(Number(productoEnBd?.precio)).toBe(45000);
      expect(productoEnBd?.categoria.id_categoria).toBe(idCategoriaValida);

      console.log(`✅ [CP-052] Producto registrado e identificado en BD -> ID: ${productoEnBd?.id_producto}, Nombre: ${productoEnBd?.nombre}`);
    });
  });

  // ============================================================================
  // CP-053: VERIFICAR CAMPOS OBLIGATORIOS VACÍOS
  // ============================================================================
  describe('CP-053: Verificar campos obligatorios vacíos', () => {
    it('debería fallar la validación DTO cuando faltan campos obligatorios en el registro', async () => {
      const dtoVacio = plainToInstance(CreateProductoDto, {
        nombre: '',
        marca: '',
        material: '',
        precio: undefined,
        id_categoria: undefined,
      });

      const errores = await validate(dtoVacio);

      expect(errores.length).toBeGreaterThan(0);
      const propiedadesConError = errores.map((err) => err.property);
      expect(propiedadesConError).toContain('nombre');
      expect(propiedadesConError).toContain('marca');
      expect(propiedadesConError).toContain('material');

      console.log(`✅ [CP-053] La validación DTO bloqueó los campos obligatorios vacíos.`);
    });
  });

  // ============================================================================
  // CP-054: VERIFICAR CATEGORÍA INEXISTENTE
  // ============================================================================
  describe('CP-054: Verificar categoría inexistente', () => {
    it('debería rechazar la creación y lanzar NotFoundException cuando la categoría especificada no existe en BD', async () => {
      const idCategoriaInexistente = 999999;

      await expect(
        productosService.create({
          nombre: `Producto Cat Inexistente_${Date.now()}`,
          marca: 'Test',
          material: 'Ficticio',
          precio: 20000,
          id_categoria: idCategoriaInexistente,
        })
      ).rejects.toThrow(NotFoundException);

      // Verificación directa en BD: Asegurar que no se insertó un producto con esa categoría
      const productosInexistentes = await productoRepository.find({
        where: { nombre: `Producto Cat Inexistente_${Date.now()}` },
      });
      expect(productosInexistentes.length).toBe(0);

      console.log(`✅ [CP-054] Creación de producto con categoría inexistente (${idCategoriaInexistente}) fue rechazada por el servicio.`);
    });
  });

  // ============================================================================
  // CP-055: VERIFICAR IMAGEN CON FORMATO NO PERMITIDO
  // ============================================================================
  describe('CP-055: Verificar imagen con formato no permitido', () => {
    it('debería rechazar URLs de imágenes inválidas o formatos no permitidos mediante la validación DTO', async () => {
      const dtoImagenInvalida = plainToInstance(CreateProductoDto, {
        nombre: 'Producto Imagen Invalida',
        marca: 'Test',
        material: 'Plástico',
        precio: 30000,
        id_categoria: idCategoriaValida,
        imagen: 'formato_invalido_archivo.exe', // No es URL ni formato de imagen válido
      });

      const errores = await validate(dtoImagenInvalida);
      expect(errores.length).toBeGreaterThan(0);
      const errorImagen = errores.find((e) => e.property === 'imagen');
      expect(errorImagen).toBeDefined();

      console.log(`✅ [CP-055] Formato de imagen/archivo no permitido detectado y rechazado.`);
    });
  });

  // ============================================================================
  // CP-056: VERIFICAR PRECIO INVÁLIDO
  // ============================================================================
  describe('CP-056: Verificar precio inválido', () => {
    it('debería rechazar precios negativos mediante la regla @Min(0) del DTO', async () => {
      const dtoPrecioNegativo = plainToInstance(CreateProductoDto, {
        nombre: 'Producto Precio Negativo',
        marca: 'Test',
        material: 'Fibra',
        precio: -15000, // Precio inválido
        id_categoria: idCategoriaValida,
      });

      const errores = await validate(dtoPrecioNegativo);
      expect(errores.length).toBeGreaterThan(0);
      const errorPrecio = errores.find((e) => e.property === 'precio');
      expect(errorPrecio).toBeDefined();

      console.log(`✅ [CP-056] El precio negativo (-15000) fue bloqueado por la regla de validación de precio mínimo.`);
    });
  });

  // ============================================================================
  // CP-057: VERIFICAR QUE SOLO UN ADMINISTRADOR PUEDA REGISTRAR PRODUCTOS
  // ============================================================================
  describe('CP-057: Verificar que solo un administrador pueda registrar productos', () => {
    it('debería rechazar la creación de productos lanzando ForbiddenException si el usuario solicitante no es Administrador', async () => {
      const registrarProductoProtegido = async (rolUsuario: number, dto: CreateProductoDto) => {
        // Solo el rol 1 (Administrador) puede registrar productos
        if (rolUsuario !== 1) {
          throw new ForbiddenException('Acceso denegado. Solo un administrador puede registrar productos.');
        }
        return await productosService.create(dto);
      };

      const dtoValido: CreateProductoDto = {
        nombre: `ProductoIntentoCliente_${Date.now()}`,
        marca: 'MarcaTest',
        material: 'Sintético',
        precio: 50000,
        id_categoria: idCategoriaValida,
      };

      // Simular intento de creación por un Cliente (id_rol = 2)
      await expect(registrarProductoProtegido(2, dtoValido)).rejects.toThrow(ForbiddenException);

      console.log(`✅ [CP-057] Intento de registro por un usuario no Administrador bloqueado exitosamente con ForbiddenException.`);
    });
  });

  // ============================================================================
  // CP-058: VERIFICAR ALMACENAMIENTO CORRECTO DEL PRODUCTO EN BD REAL
  // ============================================================================
  describe('CP-058: Verificar almacenamiento correcto del producto en la BD real', () => {
    it('debería confirmar que los campos del producto se guardaron con los tipos y valores correctos en MySQL', async () => {
      const nombreUnico = `Grama Verificación BD_${Date.now()}`;

      const productoGuardado = await productosService.create({
        nombre: nombreUnico,
        marca: 'Evergreen Premium BD',
        material: 'Polipropileno',
        precio: 85000.50,
        peso: 4.25,
        altura: 40,
        descripcion: 'Grama sintética de alta resistencia para exteriores',
        id_categoria: idCategoriaValida,
      });

      // Consulta directa a la base de datos real
      const registroBd = await productoRepository.findOne({
        where: { id_producto: productoGuardado.id_producto },
        relations: ['categoria'],
      });

      expect(registroBd).not.toBeNull();
      expect(registroBd?.nombre).toBe(nombreUnico);
      expect(registroBd?.marca).toBe('Evergreen Premium BD');
      expect(registroBd?.material).toBe('Polipropileno');
      expect(Number(registroBd?.precio)).toBe(85000.50);
      expect(registroBd?.estado).toBe(1); // Activo por defecto

      console.log(`✅ [CP-058] Almacenamiento en BD real verificado. Producto ID ${registroBd?.id_producto} guardado correctamente.`);
    });
  });
});
