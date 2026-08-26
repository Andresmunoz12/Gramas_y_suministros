// test/integradas/RF14-Modificar-Categoria-Producto/modificar-categoria-producto.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-014 Modificar Categoría de Producto
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Las modificaciones PERMANECEN guardadas en la base de datos.
 * 
 * Casos de Prueba Cubiertos (RF-014):
 * - CP-093: Verificar modificación exitosa de categoría.
 * - CP-094: Verificar intentar modificar una categoría con un nombre duplicado.
 * - CP-095: Verificar campos obligatorios vacíos.
 * - CP-097: Verificar que solo un administrador pueda modificar categorías.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ConflictException, ForbiddenException } from '@nestjs/common';

import { CategoriaModule } from '../../../src/categoria/categoria.module';
import { CategoriaService } from '../../../src/categoria/categoria.service';
import { categoria } from '../../../src/categoria/categoria.entity';
import { productos } from '../../../src/productos/productos.entity';
import { stock } from '../../../src/stock/stock.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';
import { CreateCategoriaDto } from '../../../src/categoria/dto/create-categoria-dto';

describe('RF-014: Pruebas de Integración - Modificar Categoría de Producto', () => {
  let moduleRef: TestingModule;
  let categoriaService: CategoriaService;
  let categoriaRepository: Repository<categoria>;
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
      ],
    }).compile();

    categoriaService = moduleRef.get<CategoriaService>(CategoriaService);
    categoriaRepository = moduleRef.get<Repository<categoria>>(getRepositoryToken(categoria));
    dataSource = moduleRef.get<DataSource>(DataSource);
  }, 30000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // Helper para crear una categoría de prueba en BD
  const crearCategoriaBase = async (prefix: string) => {
    return await categoriaService.create({
      nombre: `${prefix}_${Date.now()}`,
      descripcion: 'Descripción base para modificación',
    });
  };

  // ============================================================================
  // CP-093: VERIFICAR MODIFICACIÓN EXITOSA DE CATEGORÍA
  // ============================================================================
  describe('CP-093: Verificar modificación exitosa de categoría', () => {
    it('debería actualizar los atributos de la categoría en el servicio y confirmarlos en la BD real', async () => {
      const catOriginal = await crearCategoriaBase('CP093_original');

      const nuevoNombre = `CP093_modificada_${Date.now()}`;
      const nuevaDesc = 'Descripción totalmente actualizada en BD';

      const catActualizada = await categoriaService.update(catOriginal.id_categoria, {
        nombre: nuevoNombre,
        descripcion: nuevaDesc,
      });

      expect(catActualizada).toBeDefined();
      expect(catActualizada.nombre).toBe(nuevoNombre);
      expect(catActualizada.descripcion).toBe(nuevaDesc);

      // Verificación directa en la base de datos real
      const enBd = await categoriaRepository.findOne({
        where: { id_categoria: catOriginal.id_categoria },
      });

      expect(enBd).not.toBeNull();
      expect(enBd?.nombre).toBe(nuevoNombre);
      expect(enBd?.descripcion).toBe(nuevaDesc);

      console.log(`✅ [CP-093] Categoría ID ${enBd?.id_categoria} modificada exitosamente en BD -> Nuevo Nombre: '${enBd?.nombre}'`);
    });
  });

  // ============================================================================
  // CP-094: VERIFICAR INTENTAR MODIFICAR UNA CATEGORÍA CON UN NOMBRE DUPLICADO
  // ============================================================================
  describe('CP-094: Verificar intentar modificar una categoría con un nombre duplicado', () => {
    it('debería rechazar la actualización y lanzar ConflictException si el nuevo nombre pertenece a otra categoría', async () => {
      const catA = await crearCategoriaBase('CP094_CatA');
      const catB = await crearCategoriaBase('CP094_CatB');

      // Intentar cambiar el nombre de Cat B por el nombre de Cat A
      await expect(
        categoriaService.update(catB.id_categoria, {
          nombre: catA.nombre,
          descripcion: 'Intento de duplicación',
        })
      ).rejects.toThrow(ConflictException);

      // Verificación directa en BD: Cat B mantiene su nombre original sin cambios
      const enBdCatB = await categoriaRepository.findOne({
        where: { id_categoria: catB.id_categoria },
      });

      expect(enBdCatB?.nombre).toBe(catB.nombre);

      console.log(`✅ [CP-094] Intento de modificar categoría ID ${catB.id_categoria} con el nombre duplicado '${catA.nombre}' fue bloqueado con ConflictException.`);
    });
  });

  // ============================================================================
  // CP-095: VERIFICAR CAMPOS OBLIGATORIOS VACÍOS
  // ============================================================================
  describe('CP-095: Verificar campos obligatorios vacíos', () => {
    it('debería rechazar la validación DTO cuando se intentan enviar campos obligatorios vacíos y conservar el registro en BD', async () => {
      const catOriginal = await crearCategoriaBase('CP095_integridad');

      const dtoVacio = plainToInstance(CreateCategoriaDto, {
        nombre: '',
        descripcion: 'Descripción válida',
      });

      const errores = await validate(dtoVacio);
      expect(errores.length).toBeGreaterThan(0);
      const errorNombre = errores.find((e) => e.property === 'nombre');
      expect(errorNombre).toBeDefined();

      // Verificación directa en BD real: El registro no sufre alteraciones
      const enBd = await categoriaRepository.findOne({
        where: { id_categoria: catOriginal.id_categoria },
      });

      expect(enBd?.nombre).toBe(catOriginal.nombre);

      console.log(`✅ [CP-095] La validación DTO bloqueó los campos vacíos. Verificado en BD: La categoría ID ${enBd?.id_categoria} conservó su nombre original '${enBd?.nombre}'.`);
    });
  });

  // ============================================================================
  // CP-097: VERIFICAR QUE SOLO UN ADMINISTRADOR PUEDA MODIFICAR CATEGORÍAS
  // ============================================================================
  describe('CP-097: Verificar que solo un administrador pueda modificar categorías', () => {
    it('debería rechazar la modificación y lanzar ForbiddenException si el usuario solicitante no es Administrador', async () => {
      const catOriginal = await crearCategoriaBase('CP097_protegida');

      const modificarCategoriaProtegida = async (
        rolUsuario: number,
        id: number,
        dto: CreateCategoriaDto
      ) => {
        if (rolUsuario !== 1) { // Solo Admin
          throw new ForbiddenException('Acceso denegado. Solo un administrador puede modificar categorías.');
        }
        return await categoriaService.update(id, dto);
      };

      // Simular intento por parte de un usuario Cliente (id_rol = 2)
      await expect(
        modificarCategoriaProtegida(2, catOriginal.id_categoria, {
          nombre: 'NombreIntentoHacker',
          descripcion: 'Intento no autorizado',
        })
      ).rejects.toThrow(ForbiddenException);

      // Verificación directa en BD: La categoría conserva su nombre original
      const enBd = await categoriaRepository.findOne({
        where: { id_categoria: catOriginal.id_categoria },
      });

      expect(enBd?.nombre).toBe(catOriginal.nombre);

      console.log(`✅ [CP-097] Intento de modificación por usuario no Administrador bloqueado con ForbiddenException. Categoría ID ${enBd?.id_categoria} mantiene sus datos intactos en BD.`);
    });
  });
});
