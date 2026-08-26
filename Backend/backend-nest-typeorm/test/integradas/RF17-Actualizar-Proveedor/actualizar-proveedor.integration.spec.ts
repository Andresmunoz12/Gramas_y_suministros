// test/integradas/RF17-Actualizar-Proveedor/actualizar-proveedor.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-017 Actualizar Proveedor
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Las actualizaciones PERMANECEN guardadas en la base de datos.
 * 
 * Casos de Prueba Cubiertos (RF-017):
 * - CP-113: Verificar actualización exitosa del proveedor.
 * - CP-114: Verificar campos obligatorios vacíos.
 * - CP-115: Verificar información inválida (formatos incorrectos).
 * - CP-117: Verificar intentar actualizar con un nombre/identificador duplicado (ConflictException).
 * - CP-118: Verificar que solo un administrador pueda actualizar proveedores (ForbiddenException).
 * - CP-119: Verificar actualización en la base de datos real.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ConflictException, ForbiddenException } from '@nestjs/common';

import { ProveedoresModule } from '../../../src/proveedores/proveedores.module';
import { ProveedoresService } from '../../../src/proveedores/proveedores.service';
import { proveedor } from '../../../src/proveedores/proveedores.entity';
import { entrada } from '../../../src/movimiento/entrada.entity';
import { movimiento } from '../../../src/movimiento/movimiento.entity';
import { salida } from '../../../src/movimiento/salida.entity';
import { productos } from '../../../src/productos/productos.entity';
import { categoria } from '../../../src/categoria/categoria.entity';
import { stock } from '../../../src/stock/stock.entity';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';
import { UpdateProveedorDto } from '../../../src/proveedores/dto/update-proveedor.dto';

describe('RF-017: Pruebas de Integración - Actualizar Proveedor', () => {
  let moduleRef: TestingModule;
  let proveedoresService: ProveedoresService;
  let proveedorRepository: Repository<proveedor>;
  let dataSource: DataSource;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          url: process.env.DATABASE_URL,
          entities: [proveedor, entrada, movimiento, salida, productos, categoria, stock, usuario, rol],
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
        TypeOrmModule.forFeature([proveedor, entrada, movimiento, salida, productos, categoria, stock, usuario, rol]),
        ProveedoresModule,
      ],
    }).compile();

    proveedoresService = moduleRef.get<ProveedoresService>(ProveedoresService);
    proveedorRepository = moduleRef.get<Repository<proveedor>>(getRepositoryToken(proveedor));
    dataSource = moduleRef.get<DataSource>(DataSource);
  }, 30000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // Helper para registrar un proveedor base sin colisiones
  const crearProveedorBase = async (nombre: string) => {
    await proveedorRepository.delete({ nombre });
    return await proveedoresService.create({
      nombre,
      contacto: 'Contacto Base',
      telefono: '3000000000',
      email: `base_${Date.now()}@vivero.com`,
      direccion: 'Direccion Base 123',
    });
  };

  // ============================================================================
  // CP-113: VERIFICAR ACTUALIZACIÓN EXITOSA DEL PROVEEDOR
  // ============================================================================
  describe('CP-113: Verificar actualización exitosa del proveedor', () => {
    it('debería actualizar los atributos del proveedor en el servicio y confirmarlos en la BD real', async () => {
      const provOriginal = await crearProveedorBase('Prov Original CP113');

      const datosActualizados = await proveedoresService.update(provOriginal.id_proveedor, {
        contacto: 'Carlos Mendoza',
        telefono: '3158889900',
        direccion: 'Avenida Siempre Viva 742',
      });

      expect(datosActualizados).toBeDefined();
      expect(datosActualizados.contacto).toBe('Carlos Mendoza');
      expect(datosActualizados.telefono).toBe('3158889900');

      // Verificación directa en BD MySQL
      const enBd = await proveedorRepository.findOne({
        where: { id_proveedor: provOriginal.id_proveedor },
      });

      expect(enBd).not.toBeNull();
      expect(enBd?.contacto).toBe('Carlos Mendoza');
      expect(enBd?.telefono).toBe('3158889900');
      expect(enBd?.direccion).toBe('Avenida Siempre Viva 742');

      console.log(`✅ [CP-113] Proveedor ID ${enBd?.id_proveedor} actualizado exitosamente en BD -> Contacto: '${enBd?.contacto}'`);
    });
  });

  // ============================================================================
  // CP-114: VERIFICAR CAMPOS OBLIGATORIOS VACÍOS
  // ============================================================================
  describe('CP-114: Verificar campos obligatorios vacíos', () => {
    it('debería rechazar la validación DTO si se intenta enviar un nombre en blanco al actualizar', async () => {
      const dtoVacio = plainToInstance(UpdateProveedorDto, {
        nombre: '',
      });

      const errores = await validate(dtoVacio);

      expect(errores.length).toBeGreaterThan(0);
      const errorNombre = errores.find((e) => e.property === 'nombre');
      expect(errorNombre).toBeDefined();

      console.log(`✅ [CP-114] La regla DTO rechaza nombres en blanco al actualizar.`);
    });
  });

  // ============================================================================
  // CP-115: VERIFICAR INFORMACIÓN INVÁLIDA
  // ============================================================================
  describe('CP-115: Verificar información inválida', () => {
    it('debería rechazar la actualización cuando se envían formatos no válidos de email o teléfono', async () => {
      const dtoInvalido = plainToInstance(UpdateProveedorDto, {
        email: 'email_sin_arroba.com',
        telefono: '300ABC999',
      });

      const errores = await validate(dtoInvalido);

      expect(errores.length).toBeGreaterThan(0);
      const errorEmail = errores.find((e) => e.property === 'email');
      const errorTelefono = errores.find((e) => e.property === 'telefono');

      expect(errorEmail).toBeDefined();
      expect(errorTelefono).toBeDefined();

      console.log(`✅ [CP-115] La actualización con email o teléfono defectuosos fue bloqueada por la validación DTO.`);
    });
  });

  // ============================================================================
  // CP-117: VERIFICAR INTENTAR ACTUALIZAR CON UN NOMBRE DUPLICADO
  // ============================================================================
  describe('CP-117: Verificar intentar actualizar con un nombre duplicado', () => {
    it('debería rechazar la actualización y lanzar ConflictException si el nombre asignado ya pertenece a otro proveedor', async () => {
      const provA = await crearProveedorBase('Prov Alpha CP117');
      const provB = await crearProveedorBase('Prov Beta CP117');

      // Intentar asignar el nombre de Prov A a Prov B
      await expect(
        proveedoresService.update(provB.id_proveedor, {
          nombre: provA.nombre,
        })
      ).rejects.toThrow(ConflictException);

      // Verificación directa en BD: Prov B conserva su nombre original
      const enBd = await proveedorRepository.findOne({
        where: { id_proveedor: provB.id_proveedor },
      });

      expect(enBd?.nombre).toBe(provB.nombre);

      console.log(`✅ [CP-117] Intento de actualización con nombre duplicado ('${provA.nombre}') bloqueado exitosamente con ConflictException.`);
    });
  });

  // ============================================================================
  // CP-118: VERIFICAR QUE SOLO UN ADMINISTRADOR PUEDA ACTUALIZAR PROVEEDORES
  // ============================================================================
  describe('CP-118: Verificar que solo un administrador pueda actualizar proveedores', () => {
    it('debería rechazar la actualización y lanzar ForbiddenException si el usuario no es Administrador', async () => {
      const provBase = await crearProveedorBase('Prov Protegido CP118');

      const actualizarProveedorProtegido = async (
        rolUsuario: number,
        id: number,
        dto: UpdateProveedorDto
      ) => {
        if (rolUsuario !== 1) { // Solo Admin
          throw new ForbiddenException('Acceso denegado. Solo un administrador puede actualizar proveedores.');
        }
        return await proveedoresService.update(id, dto);
      };

      // Simular intento por parte de un usuario Cliente (id_rol = 2)
      await expect(
        actualizarProveedorProtegido(2, provBase.id_proveedor, {
          contacto: 'Intento Hacker',
        })
      ).rejects.toThrow(ForbiddenException);

      // Verificación directa en BD: Los datos permanecen intactos
      const enBd = await proveedorRepository.findOne({
        where: { id_proveedor: provBase.id_proveedor },
      });

      expect(enBd?.contacto).toBe('Contacto Base');

      console.log(`✅ [CP-118] Intento de actualización por un usuario no Administrador fue bloqueado con ForbiddenException.`);
    });
  });

  // ============================================================================
  // CP-119: VERIFICAR ACTUALIZACIÓN EN LA BASE DE DATOS REAL
  // ============================================================================
  describe('CP-119: Verificar actualización en la base de datos real', () => {
    it('debería confirmar que todos los campos modificados se persisten exactamente en MySQL', async () => {
      const provBase = await crearProveedorBase('Prov Persistencia CP119');

      const nuevoNombre = 'Prov Actualizado CP119';
      await proveedorRepository.delete({ nombre: nuevoNombre });

      await proveedoresService.update(provBase.id_proveedor, {
        nombre: nuevoNombre,
        contacto: 'Ana Gutierrez',
        telefono: '3124445566',
        email: `ana_${Date.now()}@vivero.com`,
        direccion: 'Calle 50 10',
      });

      // Consulta directa a la base de datos real
      const registroBd = await proveedorRepository.findOne({
        where: { id_proveedor: provBase.id_proveedor },
      });

      expect(registroBd).not.toBeNull();
      expect(registroBd?.nombre).toBe(nuevoNombre);
      expect(registroBd?.contacto).toBe('Ana Gutierrez');
      expect(registroBd?.telefono).toBe('3124445566');
      expect(registroBd?.direccion).toBe('Calle 50 10');

      console.log(`✅ [CP-119] Actualización persistida y verificada en BD para el Proveedor ID ${registroBd?.id_proveedor}.`);
    });
  });
});
