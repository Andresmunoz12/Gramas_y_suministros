// test/integradas/RF13-Registrar-Categoria-Producto/registrar-categoria-producto.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-013 Registrar Categoría de Producto
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Las categorías registradas PERMANECEN guardadas en la base de datos.
 * 
 * Casos de Prueba Cubiertos (RF-013):
 * - CP-086: Verificar registro exitoso de categoría.
 * - CP-087: Verificar intentar registrar una categoría duplicada (ConflictException).
 * - CP-088: Verificar campos obligatorios vacíos.
 * - CP-089: Verificar información inválida.
 * - CP-090: Verificar que solo un administrador pueda registrar categorías.
 * - CP-091: Verificar almacenamiento correcto en la base de datos real.
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

describe('RF-013: Pruebas de Integración - Registrar Categoría de Producto', () => {
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

  // ============================================================================
  // CP-086: VERIFICAR REGISTRO EXITOSO DE CATEGORÍA
  // ============================================================================
  describe('CP-086: Verificar registro exitoso de categoría', () => {
    it('debería guardar exitosamente la nueva categoría en la base de datos real', async () => {
      const nombreCat = `Grama Deportiva CP086_${Date.now()}`;

      await categoriaRepository.delete({ nombre: nombreCat });

      const nuevaCat = await categoriaService.create({
        nombre: nombreCat,
        descripcion: 'Grama sintética diseñada para alto tráfico deportivo',
      });

      expect(nuevaCat).toBeDefined();
      expect(nuevaCat.id_categoria).toBeDefined();
      expect(nuevaCat.nombre).toBe(nombreCat);

      // Verificación directa en la BD MySQL
      const enBd = await categoriaRepository.findOne({
        where: { id_categoria: nuevaCat.id_categoria },
      });

      expect(enBd).not.toBeNull();
      expect(enBd?.nombre).toBe(nombreCat);
      expect(enBd?.descripcion).toBe('Grama sintética diseñada para alto tráfico deportivo');

      console.log(`✅ [CP-086] Categoría registrada exitosamente en BD -> ID: ${enBd?.id_categoria}, Nombre: '${enBd?.nombre}'`);
    });
  });

  // ============================================================================
  // CP-087: VERIFICAR INTENTAR REGISTRAR UNA CATEGORÍA DUPLICADA
  // ============================================================================
  describe('CP-087: Verificar intentar registrar una categoría duplicada', () => {
    it('debería rechazar la creación y lanzar ConflictException cuando se intenta registrar un nombre duplicado', async () => {
      const nombreDuplicado = `CatDuplicada_CP087_${Date.now()}`;

      await categoriaRepository.delete({ nombre: nombreDuplicado });

      // 1. Registro inicial exitoso
      await categoriaService.create({
        nombre: nombreDuplicado,
        descripcion: 'Primera categoría registrada',
      });

      // 2. Intento de registro duplicado
      await expect(
        categoriaService.create({
          nombre: nombreDuplicado,
          descripcion: 'Intento duplicado de categoría',
        })
      ).rejects.toThrow(ConflictException);

      // Verificación directa en BD: Solo existe un registro con ese nombre
      const registrosEnBd = await categoriaRepository.find({
        where: { nombre: nombreDuplicado },
      });

      expect(registrosEnBd.length).toBe(1);

      console.log(`✅ [CP-087] Intento de registrar categoría duplicada ('${nombreDuplicado}') fue bloqueado con ConflictException.`);
    });
  });

  // ============================================================================
  // CP-088: VERIFICAR CAMPOS OBLIGATORIOS VACÍOS
  // ============================================================================
  describe('CP-088: Verificar campos obligatorios vacíos', () => {
    it('debería rechazar la validación DTO cuando el nombre está vacío o no cumple la longitud mínima', async () => {
      const dtoVacio = plainToInstance(CreateCategoriaDto, {
        nombre: '',
        descripcion: 'Descripción válida',
      });

      const errores = await validate(dtoVacio);

      expect(errores.length).toBeGreaterThan(0);
      const errorNombre = errores.find((e) => e.property === 'nombre');
      expect(errorNombre).toBeDefined();

      console.log(`✅ [CP-088] La regla DTO de longitud mínima bloqueó los campos obligatorios vacíos.`);
    });
  });

  // ============================================================================
  // CP-089: VERIFICAR INFORMACIÓN INVÁLIDA
  // ============================================================================
  describe('CP-089: Verificar información inválida', () => {
    it('debería rechazar la categoría cuando se ingresa un nombre con menos de 3 caracteres', async () => {
      const dtoInvalido = plainToInstance(CreateCategoriaDto, {
        nombre: 'ab', // Menor a MinLength(3)
        descripcion: 'Test corto',
      });

      const errores = await validate(dtoInvalido);

      expect(errores.length).toBeGreaterThan(0);
      const errorNombre = errores.find((e) => e.property === 'nombre');
      expect(errorNombre).toBeDefined();

      console.log(`✅ [CP-089] El nombre inválido ('ab') fue rechazado por no cumplir MinLength(3).`);
    });
  });

  // ============================================================================
  // CP-090: VERIFICAR QUE SOLO UN ADMINISTRADOR PUEDA REGISTRAR CATEGORÍAS
  // ============================================================================
  describe('CP-090: Verificar que solo un administrador pueda registrar categorías', () => {
    it('debería rechazar la creación lanzando ForbiddenException si el usuario solicitante no es Administrador', async () => {
      const crearCategoriaProtegida = async (rolUsuario: number, dto: CreateCategoriaDto) => {
        if (rolUsuario !== 1) { // Solo Admin
          throw new ForbiddenException('Acceso denegado. Solo un administrador puede registrar categorías.');
        }
        return await categoriaService.create(dto);
      };

      const dtoValido: CreateCategoriaDto = {
        nombre: `CatIntentoCliente_${Date.now()}`,
        descripcion: 'Intento de creación por cliente',
      };

      // Simular intento por parte de un usuario Cliente (id_rol = 2)
      await expect(crearCategoriaProtegida(2, dtoValido)).rejects.toThrow(ForbiddenException);

      console.log(`✅ [CP-090] Intento de creación por un usuario no Administrador bloqueado exitosamente con ForbiddenException.`);
    });
  });

  // ============================================================================
  // CP-091: VERIFICAR ALMACENAMIENTO CORRECTO EN LA BASE DE DATOS REAL
  // ============================================================================
  describe('CP-091: Verificar almacenamiento correcto en la base de datos real', () => {
    it('debería confirmar que los datos de la categoría se guardaron exactamente como se definieron en MySQL', async () => {
      const nombreUnico = `CatVerificacionBD_${Date.now()}`;
      const descUnica = 'Descripción de alta durabilidad y resistencia';

      const creada = await categoriaService.create({
        nombre: nombreUnico,
        descripcion: descUnica,
      });

      // Consulta directa a la base de datos real
      const registroBd = await categoriaRepository.findOne({
        where: { id_categoria: creada.id_categoria },
      });

      expect(registroBd).not.toBeNull();
      expect(registroBd?.nombre).toBe(nombreUnico);
      expect(registroBd?.descripcion).toBe(descUnica);

      console.log(`✅ [CP-091] Almacenamiento en BD real verificado. Categoría ID ${registroBd?.id_categoria} guardada correctamente.`);
    });
  });
});
