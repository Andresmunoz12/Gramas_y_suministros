// test/integradas/RF02-Iniciar-Sesion-Autenticacion/iniciar-sesion-autenticacion.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-002 Iniciar Sesión / Autenticación de Usuarios
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
 * Casos de Prueba Cubiertos (RF-002):
 * - CP-009: Verificar que inicio de sesión exitoso.
 * - CP-010: Verificar que credenciales incorrectas.
 * - CP-011: Verificar que campos obligatorios vacíos.
 * - CP-012: Verificar que correo no registrado.
 * - CP-013: Verificar creación de sesión (generación y contenido del JWT con datos de BD).
 * - CP-014: Verificar actualización de la última sesión (columna ultimo_login en BD).
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AuthModule } from '../../../src/auth/auth.module';
import { AuthService } from '../../../src/auth/auth.service';
import { UsuariosModule } from '../../../src/Usuarios/usuarios.module';
import { UsuariosService } from '../../../src/Usuarios/usuarios.service';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';
import { LoginDto } from '../../../src/auth/dto/login.dto';
import { CreateUsuarioDto } from '../../../src/Usuarios/dto/create-usurio-dto';

describe('RF-002: Pruebas de Integración - Iniciar Sesión / Autenticación de Usuarios', () => {
  let moduleRef: TestingModule;
  let authService: AuthService;
  let usuariosService: UsuariosService;
  let jwtService: JwtService;
  let userRepository: Repository<usuario>;
  let roleRepository: Repository<rol>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Configuración del módulo de pruebas conectándose directamente a la base de datos real
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
        AuthModule,
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    usuariosService = moduleRef.get<UsuariosService>(UsuariosService);
    jwtService = moduleRef.get<JwtService>(JwtService);
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
    // Cerramos la conexión con el pool de base de datos
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // ============================================================================
  // CP-009: VERIFICAR QUE INICIO DE SESIÓN EXITOSO
  // ============================================================================
  describe('CP-009: Verificar que inicio de sesión exitoso', () => {
    it('debería autenticar correctamente al usuario registrado y retornar el token de acceso', async () => {
      const email = `cp009_login_exitoso_${Date.now()}@gramas.com`;
      const password = 'PasswordSegura123!';

      // Limpiar previamente si existía alguna prueba anterior con el mismo correo
      await userRepository.delete({ email });

      // 1. Crear el usuario en la BD mediante el servicio
      const nuevoUsuario = await usuariosService.crearUsuario({
        nombre: 'Usuario Login',
        apellido: 'Exitoso',
        email: email,
        password_hash: password,
        id_rol: 2,
      });

      // 2. Invocación directa del servicio de autenticación
      const respuestaLogin = await authService.login(email, password);

      // Verificación directa de la respuesta
      expect(respuestaLogin).toBeDefined();
      expect(respuestaLogin.access_token).toBeDefined();
      expect(typeof respuestaLogin.access_token).toBe('string');
      expect(respuestaLogin.user).toBeDefined();
      expect(respuestaLogin.user.email).toBe(email);
      expect(respuestaLogin.user.id).toBe(nuevoUsuario.id_usuario);

      // Verificación directa en BD: Confirmar que el usuario sigue existiendo e intacto
      const usuarioEnBd = await userRepository.findOne({
        where: { id_usuario: nuevoUsuario.id_usuario },
      });
      expect(usuarioEnBd).not.toBeNull();
      expect(usuarioEnBd?.email).toBe(email);

      console.log(`✅ [CP-009] Inicio de sesión exitoso para usuario ID: ${usuarioEnBd?.id_usuario}, Token generado correctamente.`);
    });
  });

  // ============================================================================
  // CP-010: VERIFICAR QUE CREDENCIALES INCORRECTAS
  // ============================================================================
  describe('CP-010: Verificar que credenciales incorrectas', () => {
    it('debería rechazar el inicio de sesión cuando la contraseña es incorrecta y no alterar la BD', async () => {
      const email = `cp010_pass_erronea_${Date.now()}@gramas.com`;
      const passwordCorrecta = 'PasswordCorrecta123!';
      const passwordErronea = 'ClaveEquivocada999!';

      await userRepository.delete({ email });

      const usuarioCreado = await usuariosService.crearUsuario({
        nombre: 'Usuario Credenciales',
        apellido: 'Erroneas',
        email: email,
        password_hash: passwordCorrecta,
        id_rol: 2,
      });

      // Intentar login con contraseña incorrecta
      await expect(authService.login(email, passwordErronea)).rejects.toThrow(UnauthorizedException);

      // Verificación directa en BD: Confirmar que los datos del usuario se mantienen intactos
      const usuarioEnBd = await userRepository.findOne({
        where: { id_usuario: usuarioCreado.id_usuario },
      });
      expect(usuarioEnBd).not.toBeNull();
      expect(usuarioEnBd?.email).toBe(email);

      console.log(`✅ [CP-010] El sistema rechazó correctamente la contraseña errónea para el usuario ID ${usuarioCreado.id_usuario}.`);
    });
  });

  // ============================================================================
  // CP-011: VERIFICAR QUE CAMPOS OBLIGATORIOS VACÍOS
  // ============================================================================
  describe('CP-011: Verificar que campos obligatorios vacíos', () => {
    it('debería detectar errores de validación DTO cuando faltan el correo o la contraseña', async () => {
      const dtoVacio = plainToInstance(LoginDto, {
        email: '',
        password_hash: '',
      });

      const erroresValidacion = await validate(dtoVacio);

      // Verificación de validaciones en el DTO
      expect(erroresValidacion.length).toBeGreaterThan(0);
      const propiedadesConError = erroresValidacion.map((err) => err.property);
      expect(propiedadesConError).toContain('email');
      expect(propiedadesConError).toContain('password_hash');

      // Intentar llamar al servicio directamente con valores vacíos
      await expect(authService.login('', '')).rejects.toThrow(UnauthorizedException);
      await expect(authService.login('correo@valido.com', '')).rejects.toThrow(UnauthorizedException);

      console.log(`✅ [CP-011] Los campos obligatorios vacíos fueron validados y rechazados correctamente.`);
    });
  });

  // ============================================================================
  // CP-012: VERIFICAR QUE CORREO NO REGISTRADO
  // ============================================================================
  describe('CP-012: Verificar que correo no registrado', () => {
    it('debería rechazar el inicio de sesión cuando el correo electrónico no existe en la base de datos', async () => {
      const emailNoExistente = `correo_no_registrado_${Date.now()}@gramas.com`;

      // Confirmar previamente en BD que el correo realmente NO existe
      const existeEnBd = await userRepository.findOne({ where: { email: emailNoExistente } });
      expect(existeEnBd).toBeNull();

      // Invocación directa del servicio esperando rechazo por credenciales inválidas
      await expect(authService.login(emailNoExistente, 'CualquierPassword123!')).rejects.toThrow(UnauthorizedException);

      // Confirmación posterior en BD
      const sigueSinExistir = await userRepository.findOne({ where: { email: emailNoExistente } });
      expect(sigueSinExistir).toBeNull();

      console.log(`✅ [CP-012] El correo no registrado (${emailNoExistente}) fue rechazado correctamente por el sistema.`);
    });
  });

  // ============================================================================
  // CP-013: VERIFICAR CREACIÓN DE SESIÓN (JWT TOKEN)
  // ============================================================================
  describe('CP-013: Verificar creación de sesión', () => {
    it('debería generar una sesión válida (JWT) con el payload correspondiente a los datos del usuario en BD', async () => {
      const email = `cp013_creacion_sesion_${Date.now()}@gramas.com`;
      const password = 'PasswordSegura123!';

      await userRepository.delete({ email });

      const usuarioCreado = await usuariosService.crearUsuario({
        nombre: 'Sesion Valida',
        apellido: 'Test',
        email: email,
        password_hash: password,
        id_rol: 2,
      });

      // Ejecutar inicio de sesión
      const respuesta = await authService.login(email, password);

      // Aserciones sobre la estructura de la sesión retornada
      expect(respuesta.access_token).toBeDefined();

      // Verificar y decodificar el token JWT usando JwtService
      const payloadDecodificado: any = jwtService.verify(respuesta.access_token, {
        secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY_123',
      });

      expect(payloadDecodificado).toBeDefined();
      expect(payloadDecodificado.sub).toBe(usuarioCreado.id_usuario);
      expect(payloadDecodificado.email).toBe(email);
      expect(payloadDecodificado.nombre).toBe('Sesion Valida');
      expect(payloadDecodificado.rol).toBe(2);

      console.log(`✅ [CP-013] Sesión creada y firmada con JWT correctamente para usuario ID ${usuarioCreado.id_usuario}.`);
    });
  });

  // ============================================================================
  // CP-014: VERIFICAR ACTUALIZACIÓN DE LA ÚLTIMA SESIÓN
  // ============================================================================
  describe('CP-014: Verificar actualización de la última sesión', () => {
    it('debería actualizar la columna ultimo_login en la base de datos real tras un inicio de sesión exitoso', async () => {
      const email = `cp014_ultimo_login_${Date.now()}@gramas.com`;
      const password = 'PasswordSegura123!';

      await userRepository.delete({ email });

      const usuarioCreado = await usuariosService.crearUsuario({
        nombre: 'Ultimo Login',
        apellido: 'Prueba',
        email: email,
        password_hash: password,
        id_rol: 2,
      });

      // Consultar el usuario en BD antes del login
      const enBdAntes = await userRepository.findOne({
        where: { id_usuario: usuarioCreado.id_usuario },
        select: ['id_usuario', 'ultimoLogin'],
      });

      const fechaAntesLogin = enBdAntes?.ultimoLogin;

      // Esperar un breve instante para diferenciar la marca de tiempo
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Ejecutar login
      await authService.login(email, password);

      // Verificación directa en BD tras el login
      const enBdDespues = await userRepository.findOne({
        where: { id_usuario: usuarioCreado.id_usuario },
        select: ['id_usuario', 'ultimoLogin'],
      });

      expect(enBdDespues).not.toBeNull();
      expect(enBdDespues?.ultimoLogin).toBeDefined();
      expect(enBdDespues?.ultimoLogin).not.toBeNull();

      // Verificar que la fecha de ultimo_login en BD se actualizó correctamente
      if (fechaAntesLogin) {
        expect(new Date(enBdDespues!.ultimoLogin).getTime()).toBeGreaterThan(new Date(fechaAntesLogin).getTime());
      }

      console.log(`✅ [CP-014] Columna ultimo_login actualizada en BD para el usuario ID ${usuarioCreado.id_usuario}: ${enBdDespues?.ultimoLogin}`);
    });
  });
});
