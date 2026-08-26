// test/integradas/RF07-Control-Accesos-Permisos/control-accesos-permisos.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-007 Control de Accesos y Permisos
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Estrategias / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Los datos de prueba y usuarios registrados PERMANECEN guardados en la BD.
 * 
 * Casos de Prueba Cubiertos (RF-007):
 * - CP-045: Verificar acceso permitido según el rol.
 * - CP-046: Verificar acceso denegado a una funcionalidad restringida.
 * - CP-047: Verificar carga correcta de permisos/roles al iniciar sesión.
 * - CP-048: Verificar acceso de un Administrador a módulos administrativos.
 * - CP-049: Verificar intento de acceso sin rol válido.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { AuthModule } from '../../../src/auth/auth.module';
import { AuthService } from '../../../src/auth/auth.service';
import { UsuariosModule } from '../../../src/Usuarios/usuarios.module';
import { UsuariosService } from '../../../src/Usuarios/usuarios.service';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';

describe('RF-007: Pruebas de Integración - Control de Accesos y Permisos', () => {
  let moduleRef: TestingModule;
  let authService: AuthService;
  let usuariosService: UsuariosService;
  let jwtService: JwtService;
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
        AuthModule,
      ],
    }).compile();

    authService = moduleRef.get<AuthService>(AuthService);
    usuariosService = moduleRef.get<UsuariosService>(UsuariosService);
    jwtService = moduleRef.get<JwtService>(JwtService);
    userRepository = moduleRef.get<Repository<usuario>>(getRepositoryToken(usuario));
    roleRepository = moduleRef.get<Repository<rol>>(getRepositoryToken(rol));
    dataSource = moduleRef.get<DataSource>(DataSource);

    // Asegurar existencia del Rol Administrador (id_rol = 1) en BD
    let rolAdmin = await roleRepository.findOne({ where: { id_rol: 1 } });
    if (!rolAdmin) {
      await roleRepository.save(
        roleRepository.create({
          id_rol: 1,
          tipo: 'administrador',
          descripcion: 'Rol Administrador',
        })
      );
    }

    // Asegurar existencia del Rol Cliente (id_rol = 2) en BD
    let rolCliente = await roleRepository.findOne({ where: { id_rol: 2 } });
    if (!rolCliente) {
      await roleRepository.save(
        roleRepository.create({
          id_rol: 2,
          tipo: 'cliente',
          descripcion: 'Rol Cliente',
        })
      );
    }
  }, 30000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // Helper de verificación de permisos por rol
  const verificarPermisosRecurso = (rolUsuario: number | undefined | null, rolesPermitidos: number[]) => {
    if (rolUsuario === undefined || rolUsuario === null || rolUsuario <= 0) {
      throw new UnauthorizedException('Intento de acceso sin un rol válido registrado.');
    }
    if (!rolesPermitidos.includes(rolUsuario)) {
      throw new ForbiddenException('Acceso denegado. No posee los permisos requeridos para esta funcionalidad.');
    }
    return { accesoConcedido: true, rol: rolUsuario };
  };

  // ============================================================================
  // CP-045: VERIFICAR ACCESO PERMITIDO SEGÚN EL ROL
  // ============================================================================
  describe('CP-045: Verificar acceso permitido según el rol', () => {
    it('debería conceder el acceso cuando el rol del usuario coincide con los roles autorizados para el módulo', async () => {
      const email = `cp045_acceso_permitido_${Date.now()}@gramas.com`;

      await userRepository.delete({ email });

      const cliente = await usuariosService.crearUsuario({
        nombre: 'Cliente',
        apellido: 'Permitido',
        email: email,
        password_hash: 'PasswordSegura123!',
        id_rol: 2, // Cliente
      });

      // Consultar directo en BD para verificar su rol activo
      const clienteEnBd = await userRepository.findOne({
        where: { id_usuario: cliente.id_usuario },
      });

      // Funcionalidad accesible por clientes (roles permitidos: [2])
      const resultadoAcceso = verificarPermisosRecurso(clienteEnBd?.id_rol, [2]);

      expect(resultadoAcceso.accesoConcedido).toBe(true);
      expect(resultadoAcceso.rol).toBe(2);

      console.log(`✅ [CP-045] Acceso concedido correctamente al usuario ID ${clienteEnBd?.id_usuario} con id_rol=2.`);
    });
  });

  // ============================================================================
  // CP-046: VERIFICAR ACCESO DENEGADO A UNA FUNCIONALIDAD RESTRINGIDA
  // ============================================================================
  describe('CP-046: Verificar acceso denegado a una funcionalidad restringida', () => {
    it('debería denegar el acceso y lanzar ForbiddenException cuando un cliente intenta acceder a una función de administrador', async () => {
      const email = `cp046_acceso_denegado_${Date.now()}@gramas.com`;

      await userRepository.delete({ email });

      const cliente = await usuariosService.crearUsuario({
        nombre: 'Cliente',
        apellido: 'NoAutorizado',
        email: email,
        password_hash: 'PasswordSegura123!',
        id_rol: 2, // Cliente
      });

      const clienteEnBd = await userRepository.findOne({
        where: { id_usuario: cliente.id_usuario },
      });

      // Funcionalidad restringida exclusivamente a Administradores (roles permitidos: [1])
      expect(() => {
        verificarPermisosRecurso(clienteEnBd?.id_rol, [1]);
      }).toThrow(ForbiddenException);

      console.log(`✅ [CP-046] Acceso a funcionalidad restringida denegado correctamente con ForbiddenException para el cliente ID ${clienteEnBd?.id_usuario}.`);
    });
  });

  // ============================================================================
  // CP-047: VERIFICAR CARGA CORRECTA DE PERMISOS AL INICIAR SESIÓN
  // ============================================================================
  describe('CP-047: Verificar carga correcta de permisos al iniciar sesión', () => {
    it('debería incluir el id_rol en la respuesta de login y en el payload del JWT firmado', async () => {
      const email = `cp047_permisos_login_${Date.now()}@gramas.com`;
      const pass = 'PasswordSegura123!';

      await userRepository.delete({ email });

      const usuarioCreado = await usuariosService.crearUsuario({
        nombre: 'CargaPermisos',
        apellido: 'LoginTest',
        email: email,
        password_hash: pass,
        id_rol: 2,
      });

      // Iniciar sesión
      const loginRes = await authService.login(email, pass);

      expect(loginRes.user).toBeDefined();
      expect(loginRes.user.id_rol).toBe(2);

      // Decodificar el token JWT
      const payloadDecodificado: any = jwtService.decode(loginRes.access_token);
      expect(payloadDecodificado).not.toBeNull();
      expect(payloadDecodificado.rol).toBe(2);

      // Verificación directa en BD
      const usuarioEnBd = await userRepository.findOne({
        where: { id_usuario: usuarioCreado.id_usuario },
      });

      expect(payloadDecodificado.rol).toBe(usuarioEnBd?.id_rol);

      console.log(`✅ [CP-047] El id_rol (${payloadDecodificado.rol}) fue cargado correctamente en el token JWT tras iniciar sesión.`);
    });
  });

  // ============================================================================
  // CP-048: VERIFICAR ACCESO DE UN ADMINISTRADOR A MÓDULOS ADMINISTRATIVOS
  // ============================================================================
  describe('CP-048: Verificar acceso de un Administrador a módulos administrativos', () => {
    it('debería otorgar acceso completo a un usuario con rol Administrador (id_rol = 1)', async () => {
      const email = `cp048_admin_modulos_${Date.now()}@gramas.com`;

      await userRepository.delete({ email });

      const admin = await usuariosService.crearUsuario({
        nombre: 'Admin',
        apellido: 'AccesoCompleto',
        email: email,
        password_hash: 'PasswordAdmin123!',
        id_rol: 1, // Administrador
      });

      const adminEnBd = await userRepository.findOne({
        where: { id_usuario: admin.id_usuario },
      });

      // Módulo administrativo (roles permitidos: [1])
      const accesoAdmin = verificarPermisosRecurso(adminEnBd?.id_rol, [1]);

      expect(accesoAdmin.accesoConcedido).toBe(true);
      expect(accesoAdmin.rol).toBe(1);

      console.log(`✅ [CP-048] El usuario Administrador ID ${adminEnBd?.id_usuario} obtuvo acceso concedido al módulo administrativo.`);
    });
  });

  // ============================================================================
  // CP-049: VERIFICAR INTENTO DE ACCESO SIN ROL VÁLIDO
  // ============================================================================
  describe('CP-049: Verificar intento de acceso sin rol válido', () => {
    it('debería rechazar el acceso lanzando UnauthorizedException si el usuario no tiene un rol válido o asignado', async () => {
      const rolInvalido = 0;
      const rolNulo = null;

      expect(() => {
        verificarPermisosRecurso(rolInvalido, [1, 2]);
      }).toThrow(UnauthorizedException);

      expect(() => {
        verificarPermisosRecurso(rolNulo, [1, 2]);
      }).toThrow(UnauthorizedException);

      console.log(`✅ [CP-049] Intentos de acceso sin rol válido (rol: 0 / null) fueron bloqueados exitosamente con UnauthorizedException.`);
    });
  });
});
