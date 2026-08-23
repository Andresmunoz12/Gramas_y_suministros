// test/integradas/RF01-Registro-Usuarios/registro-usuarios.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-001 Registrar Usuario / Registro de Clientes
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Los usuarios registrados PERMANECEN guardados en la base de datos.
 * 
 * Casos de Prueba Cubiertos (RF-001):
 * - CP-001: Verificar que registro exitoso.
 * - CP-002: Verificar que correo duplicado.
 * - CP-003: Verificar que campos obligatorios.
 * - CP-004: Verificar validación de contraseñas (longitud / formato erróneo).
 * - CP-005: Verificar que correo inválido.
 * - CP-006: Verificar asignación del rol Cliente (id_rol = 2).
 * - CP-007: Verificar cifrado de contraseña en BD.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcryptjs';

import { UsuariosModule } from '../../../src/Usuarios/usuarios.module';
import { UsuariosService } from '../../../src/Usuarios/usuarios.service';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';
import { CreateUsuarioDto } from '../../../src/Usuarios/dto/create-usurio-dto';

describe('RF-001: Pruebas de Integración - Registrar Usuario / Registro de Clientes', () => {
  let moduleRef: TestingModule;
  let service: UsuariosService;
  let userRepository: Repository<usuario>;
  let roleRepository: Repository<rol>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Configuración del módulo de pruebas conectándose a la base de datos real
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          url: process.env.DATABASE_URL,
          entities: [usuario, rol],
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
        TypeOrmModule.forFeature([usuario, rol]),
        UsuariosModule,
      ],
    }).compile();

    service = moduleRef.get<UsuariosService>(UsuariosService);
    userRepository = moduleRef.get<Repository<usuario>>(getRepositoryToken(usuario));
    roleRepository = moduleRef.get<Repository<rol>>(getRepositoryToken(rol));
    dataSource = moduleRef.get<DataSource>(DataSource);

    // Asegurar que exista el rol cliente (id_rol = 2) en la BD para las pruebas
    const rolCliente = await roleRepository.findOne({ where: { id_rol: 2 } });
    if (!rolCliente) {
      await roleRepository.save(
        roleRepository.create({
          id_rol: 2,
          tipo: 'cliente',
          descripcion: 'Rol cliente para pruebas de integración',
        }),
      );
    }
  }, 30000); // 30s timeout para conexión inicial a BD cloud

  afterAll(async () => {
    // IMPORTANTE: NO eliminamos los usuarios creados para que QUEDEN PERSISTIDOS en la BD real.
    // Solo cerramos la conexión con el pool de base de datos.
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // ============================================================================
  // CP-001: VERIFICAR QUE REGISTRO EXITOSO
  // ============================================================================
  describe('CP-001: Verificar registro exitoso', () => {
    it('debería guardar exitosamente el nuevo usuario en la base de datos real y mantenerlo cargado', async () => {
      const email = `cp001_registro_exitoso_${Date.now()}@gramas.com`;

      // Limpiar previamente si existía alguna prueba anterior con el mismo correo para garantizar repetibilidad
      await userRepository.delete({ email });

      const dto: CreateUsuarioDto = {
        nombre: 'Carlos QA',
        apellido: 'Mendoza',
        email: email,
        password_hash: 'PasswordSegura123!',
        id_rol: 2,
      };

      // Invocación directa del servicio
      const resultadoServicio = await service.crearUsuario(dto);

      // Verificación directa en la base de datos
      const usuarioEnBd = await userRepository.findOne({
        where: { id_usuario: resultadoServicio.id_usuario },
      });

      expect(usuarioEnBd).not.toBeNull();
      expect(usuarioEnBd?.id_usuario).toBe(resultadoServicio.id_usuario);
      expect(usuarioEnBd?.nombre).toBe('Carlos QA');
      expect(usuarioEnBd?.apellido).toBe('Mendoza');
      expect(usuarioEnBd?.email).toBe(email);
      expect(usuarioEnBd?.estado).toBe('activo');
      expect(usuarioEnBd?.id_rol).toBe(2);

      console.log(`✅ [CP-001] Usuario guardado exitosamente en BD -> ID: ${usuarioEnBd?.id_usuario}, Email: ${usuarioEnBd?.email}`);
    });
  });

  // ============================================================================
  // CP-002: VERIFICAR QUE CORREO DUPLICADO
  // ============================================================================
  describe('CP-002: Verificar correo duplicado', () => {
    it('debería bloquear la creación en BD y lanzar excepción al intentar registrar un email duplicado', async () => {
      const emailDuplicado = `cp002_duplicado_${Date.now()}@gramas.com`;

      // Limpiar registros antiguos del mismo correo si existen
      await userRepository.delete({ email: emailDuplicado });

      const dtoOriginal: CreateUsuarioDto = {
        nombre: 'Usuario Original',
        apellido: 'Prueba',
        email: emailDuplicado,
        password_hash: 'PasswordSegura123!',
        id_rol: 2,
      };

      // Crear el primer usuario en la BD (este usuario SÍ quedará cargado en la BD)
      const creadoOriginal = await service.crearUsuario(dtoOriginal);

      // Confirmar que existe 1 registro en BD
      const enBdAntes = await userRepository.find({ where: { email: emailDuplicado } });
      expect(enBdAntes.length).toBe(1);

      const dtoDuplicado: CreateUsuarioDto = {
        nombre: 'Usuario Duplicado',
        apellido: 'Intento Falla',
        email: emailDuplicado,
        password_hash: 'PasswordSegura123!',
        id_rol: 2,
      };

      // Intentar guardar el duplicado directamente en el servicio/BD
      await expect(service.crearUsuario(dtoDuplicado)).rejects.toThrow();

      // Verificación directa en BD: Debe seguir habiendo solo 1 registro (el original)
      const enBdDespues = await userRepository.find({ where: { email: emailDuplicado } });
      expect(enBdDespues.length).toBe(1);
      expect(enBdDespues[0].nombre).toBe('Usuario Original');

      console.log(`✅ [CP-002] El correo duplicado fue bloqueado por la BD. El usuario original con ID ${creadoOriginal.id_usuario} permanece cargado.`);
    });
  });

  // ============================================================================
  // CP-003: VERIFICAR QUE CAMPOS OBLIGATORIOS
  // ============================================================================
  describe('CP-003: Verificar campos obligatorios', () => {
    it('debería fallar la validación y no persistir en BD cuando faltan campos obligatorios', async () => {
      const dtoIncompleto = plainToInstance(CreateUsuarioDto, {
        apellido: 'Solo Apellido Incompleto',
        // Falta nombre, email, password_hash, id_rol
      });

      const erroresValidacion = await validate(dtoIncompleto);

      // Verificar que la validación detecta los campos faltantes
      expect(erroresValidacion.length).toBeGreaterThan(0);
      const propiedadesConError = erroresValidacion.map((err) => err.property);
      expect(propiedadesConError).toContain('nombre');
      expect(propiedadesConError).toContain('email');
      expect(propiedadesConError).toContain('password_hash');
      expect(propiedadesConError).toContain('id_rol');

      // Verificación directa en BD: Asegurar que no se creó ningún registro con ese apellido
      const registosenBd = await userRepository.find({ where: { apellido: 'Solo Apellido Incompleto' } });
      expect(registosenBd.length).toBe(0);
    });
  });

  // ============================================================================
  // CP-004: VERIFICAR CONTRASEÑAS DIFERENTES / VALIDACIÓN DE CONTRASEÑA
  // ============================================================================
  describe('CP-004: Verificar contraseñas diferentes / formato erróneo', () => {
    it('debería rechazar contraseñas con menos de 8 caracteres y evitar modificaciones en BD', async () => {
      const email = `cp004_pass_corta_${Date.now()}@gramas.com`;

      const dtoPassCorta = plainToInstance(CreateUsuarioDto, {
        nombre: 'Prueba Pass',
        apellido: 'Corta',
        email: email,
        password_hash: '123', // Inválida: menos de 8 caracteres
        id_rol: 2,
      });

      const erroresValidacion = await validate(dtoPassCorta);

      expect(erroresValidacion.length).toBeGreaterThan(0);
      const errorPass = erroresValidacion.find((err) => err.property === 'password_hash');
      expect(errorPass).toBeDefined();

      // Verificación directa en BD: Confirmar que NO se guardó ningún usuario con ese email
      const usuarioEnBd = await userRepository.findOne({ where: { email } });
      expect(usuarioEnBd).toBeNull();
    });
  });

  // ============================================================================
  // CP-005: VERIFICAR QUE CORREO INVÁLIDO
  // ============================================================================
  describe('CP-005: Verificar correo inválido', () => {
    it('debería rechazar emails con formato inválido y no realizar inserciones en BD', async () => {
      const dtoEmailInvalido = plainToInstance(CreateUsuarioDto, {
        nombre: 'Email',
        apellido: 'Invalido',
        email: 'correo-sin-arroba-formato-incorrecto.com',
        password_hash: 'PasswordSegura123!',
        id_rol: 2,
      });

      const erroresValidacion = await validate(dtoEmailInvalido);

      expect(erroresValidacion.length).toBeGreaterThan(0);
      const errorEmail = erroresValidacion.find((err) => err.property === 'email');
      expect(errorEmail).toBeDefined();

      // Verificación directa en BD: Confirmar que el email inválido no existe en BD
      const usuarioEnBd = await userRepository.findOne({
        where: { email: 'correo-sin-arroba-formato-incorrecto.com' },
      });
      expect(usuarioEnBd).toBeNull();
    });
  });

  // ============================================================================
  // CP-006: VERIFICAR ASIGNACIÓN DEL ROL CLIENTE
  // ============================================================================
  describe('CP-006: Verificar asignación del rol Cliente', () => {
    it('debería asignar por defecto/especificación el id_rol 2 (Cliente) en BD y mantenerlo persisto', async () => {
      const email = `cp006_rol_cliente_${Date.now()}@gramas.com`;

      await userRepository.delete({ email });

      const dtoCliente: CreateUsuarioDto = {
        nombre: 'Cliente Gramas',
        apellido: 'Fiel',
        email: email,
        password_hash: 'PasswordSegura123!',
        id_rol: 2, // Rol Cliente
      };

      const creado = await service.crearUsuario(dtoCliente);

      // Consulta directa a BD incluyendo la relación con la tabla 'rol'
      const usuarioEnBd = await userRepository.findOne({
        where: { id_usuario: creado.id_usuario },
        relations: ['rol'],
      });

      expect(usuarioEnBd).not.toBeNull();
      expect(usuarioEnBd?.id_rol).toBe(2);
      expect(usuarioEnBd?.rol).toBeDefined();
      expect(usuarioEnBd?.rol.tipo.toLowerCase()).toBe('cliente');

      console.log(`✅ [CP-006] Usuario cliente guardado en BD -> ID: ${usuarioEnBd?.id_usuario}, Rol ID: ${usuarioEnBd?.id_rol} (${usuarioEnBd?.rol?.tipo})`);
    });
  });

  // ============================================================================
  // CP-007: VERIFICAR CIFRADO DE CONTRASEÑA
  // ============================================================================
  describe('CP-007: Verificar cifrado de contraseña', () => {
    it('debería almacenar en la columna password_hash la contraseña encriptada mediante bcrypt y mantener el usuario en BD', async () => {
      const passwordPlana = 'MiPasswordSuperSecreta123!';
      const email = `cp007_cifrado_${Date.now()}@gramas.com`;

      await userRepository.delete({ email });

      const dto: CreateUsuarioDto = {
        nombre: 'Usuario Cifrado',
        apellido: 'Seguridad',
        email: email,
        password_hash: passwordPlana,
        id_rol: 2,
      };

      const creado = await service.crearUsuario(dto);

      // Verificación directa en BD seleccionando explícitamente la columna password_hash
      const usuarioEnBd = await userRepository.findOne({
        where: { id_usuario: creado.id_usuario },
        select: ['id_usuario', 'email', 'passwordHash'],
      });

      expect(usuarioEnBd).not.toBeNull();
      expect(usuarioEnBd?.passwordHash).toBeDefined();
      
      // Aserción 1: La contraseña en BD NO coincide con la contraseña plana original
      expect(usuarioEnBd?.passwordHash).not.toBe(passwordPlana);

      // Aserción 2: La contraseña en BD tiene el formato característico de hash bcrypt ($2a$, $2b$, $2y$)
      expect(usuarioEnBd?.passwordHash).toMatch(/^\$2[aby]\$/);

      // Aserción 3: Se verifica mediante bcrypt.compare que la clave cifrada en BD corresponde a la clave plana
      const coincide = await bcrypt.compare(passwordPlana, usuarioEnBd!.passwordHash);
      expect(coincide).toBe(true);

      console.log(`✅ [CP-007] Usuario guardado en BD con contraseña cifrada -> ID: ${usuarioEnBd?.id_usuario}, Password Hash en BD: ${usuarioEnBd?.passwordHash}`);
    });
  });
});
