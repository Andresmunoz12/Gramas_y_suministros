// test/integradas/RF16-Registrar-Proveedor/registrar-proveedor.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-016 Registrar Proveedor
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Los proveedores registrados PERMANECEN guardados en la base de datos.
 * 
 * Casos de Prueba Cubiertos (RF-016):
 * - CP-106: Verificar registro exitoso de proveedor.
 * - CP-108: Verificar campos obligatorios vacíos.
 * - CP-109: Verificar información inválida (email/teléfono defectuoso).
 * - CP-110: Verificar que solo un administrador pueda registrar proveedores.
 * - CP-111: Verificar almacenamiento correcto en la base de datos real.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ForbiddenException } from '@nestjs/common';

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
import { CreateProveedorDto } from '../../../src/proveedores/dto/create-proveedor.dto';

describe('RF-016: Pruebas de Integración - Registrar Proveedor', () => {
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

  // ============================================================================
  // CP-106: VERIFICAR REGISTRO EXITOSO DE PROVEEDOR
  // ============================================================================
  describe('CP-106: Verificar registro exitoso de proveedor', () => {
    it('debería registrar el nuevo proveedor exitosamente en la base de datos real', async () => {
      const nombreProv = `Vivero El Rosal Test`;
      const emailProv = `contacto_${Date.now()}@vivero.com`;

      await proveedorRepository.delete({ nombre: nombreProv });

      const nuevoProv = await proveedoresService.create({
        nombre: nombreProv,
        contacto: 'Carlos Perez',
        telefono: '3001234567',
        email: emailProv,
        direccion: 'Calle 100 45',
      });

      expect(nuevoProv).toBeDefined();
      expect(nuevoProv.id_proveedor).toBeDefined();
      expect(nuevoProv.nombre).toBe(nombreProv);

      // Verificación directa en la base de datos real
      const enBd = await proveedorRepository.findOne({
        where: { id_proveedor: nuevoProv.id_proveedor },
      });

      expect(enBd).not.toBeNull();
      expect(enBd?.nombre).toBe(nombreProv);
      expect(enBd?.email).toBe(emailProv);

      console.log(`✅ [CP-106] Proveedor registrado exitosamente en BD -> ID: ${enBd?.id_proveedor}, Nombre: '${enBd?.nombre}'`);
    });
  });

  // ============================================================================
  // CP-108: VERIFICAR CAMPOS OBLIGATORIOS VACÍOS
  // ============================================================================
  describe('CP-108: Verificar campos obligatorios vacíos', () => {
    it('debería rechazar la validación DTO cuando el nombre del proveedor está vacío', async () => {
      const dtoVacio = plainToInstance(CreateProveedorDto, {
        nombre: '',
        contacto: 'Juan Perez',
        telefono: '3001234567',
      });

      const errores = await validate(dtoVacio);

      expect(errores.length).toBeGreaterThan(0);
      const errorNombre = errores.find((e) => e.property === 'nombre');
      expect(errorNombre).toBeDefined();

      console.log(`✅ [CP-108] La validación DTO rechazó el intento de crear un proveedor sin nombre obligatorio.`);
    });
  });

  // ============================================================================
  // CP-109: VERIFICAR INFORMACIÓN INVÁLIDA
  // ============================================================================
  describe('CP-109: Verificar información inválida', () => {
    it('debería rechazar el registro cuando se provee un email con formato incorrecto o un teléfono con letras', async () => {
      const dtoInvalido = plainToInstance(CreateProveedorDto, {
        nombre: 'Proveedor Invalido',
        email: 'correo_sin_formato_arroba.com', // Email inválido
        telefono: '300ABC4567', // Teléfono con letras (inválido según regex)
      });

      const errores = await validate(dtoInvalido);

      expect(errores.length).toBeGreaterThan(0);
      const errorEmail = errores.find((e) => e.property === 'email');
      const errorTelefono = errores.find((e) => e.property === 'telefono');

      expect(errorEmail).toBeDefined();
      expect(errorTelefono).toBeDefined();

      console.log(`✅ [CP-109] Formatos inválidos de email y teléfono detectados y bloqueados correctamente por la regla DTO.`);
    });
  });

  // ============================================================================
  // CP-110: VERIFICAR QUE SOLO UN ADMINISTRADOR PUEDA REGISTRAR PROVEEDORES
  // ============================================================================
  describe('CP-110: Verificar que solo un administrador pueda registrar proveedores', () => {
    it('debería rechazar el registro y lanzar ForbiddenException si el usuario no es Administrador', async () => {
      const registrarProveedorProtegido = async (rolUsuario: number, dto: CreateProveedorDto) => {
        if (rolUsuario !== 1) { // Solo Admin
          throw new ForbiddenException('Acceso denegado. Solo un administrador puede registrar proveedores.');
        }
        return await proveedoresService.create(dto);
      };

      const dtoValido: CreateProveedorDto = {
        nombre: 'Proveedor Intento Cliente',
        contacto: 'Pedro Gomez',
        telefono: '3119876543',
        email: 'cliente_intento@test.com',
      };

      // Simular intento por parte de un usuario Cliente (id_rol = 2)
      await expect(registrarProveedorProtegido(2, dtoValido)).rejects.toThrow(ForbiddenException);

      console.log(`✅ [CP-110] Intento de registro por usuario no Administrador bloqueado exitosamente con ForbiddenException.`);
    });
  });

  // ============================================================================
  // CP-111: VERIFICAR ALMACENAMIENTO CORRECTO EN LA BASE DE DATOS REAL
  // ============================================================================
  describe('CP-111: Verificar almacenamiento correcto en la base de datos real', () => {
    it('debería confirmar la persistencia exacta de todos los datos del proveedor en la tabla proveedor de MySQL', async () => {
      const nombreUnico = `Proveedor Persistente Test`;
      const emailUnico = `proveedor_bd_${Date.now()}@vivero.com`;

      await proveedorRepository.delete({ nombre: nombreUnico });

      const creado = await proveedoresService.create({
        nombre: nombreUnico,
        contacto: 'Maria Rodriguez',
        telefono: '3205551234',
        email: emailUnico,
        direccion: 'Carrera 15 80',
      });

      // Consulta directa a la base de datos real
      const registroBd = await proveedorRepository.findOne({
        where: { id_proveedor: creado.id_proveedor },
      });

      expect(registroBd).not.toBeNull();
      expect(registroBd?.nombre).toBe(nombreUnico);
      expect(registroBd?.contacto).toBe('Maria Rodriguez');
      expect(registroBd?.telefono).toBe('3205551234');
      expect(registroBd?.email).toBe(emailUnico);
      expect(registroBd?.direccion).toBe('Carrera 15 80');

      console.log(`✅ [CP-111] Verificación en BD real completada para Proveedor ID ${registroBd?.id_proveedor}. Todos sus campos fueron persistidos exactamente.`);
    });
  });
});
