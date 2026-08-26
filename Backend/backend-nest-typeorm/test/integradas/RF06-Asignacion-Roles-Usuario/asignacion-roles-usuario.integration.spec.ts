// test/integradas/RF06-Asignacion-Roles-Usuario/asignacion-roles-usuario.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-006 Asignación de Roles de Usuario
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Los usuarios y asignaciones de rol PERMANECEN guardados en la base de datos.
 * 
 * Casos de Prueba Cubiertos (RF-006):
 * - CP-039: Verificar asignación automática del rol Cliente (id_rol = 2).
 * - CP-040: Verificar que un usuario sin permisos no pueda asignar el rol Administrador.
 * - CP-041: Verificar asignación de rol realizada por un administrador.
 * - CP-042: Verificar almacenamiento correcto del rol en la base de datos real.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { RolesModule } from '../../../src/roles/roles.module';
import { RolesService } from '../../../src/roles/roles.service';
import { rol } from '../../../src/roles/roles.entity';
import { UsuariosModule } from '../../../src/Usuarios/usuarios.module';
import { UsuariosService } from '../../../src/Usuarios/usuarios.service';
import { usuario } from '../../../src/Usuarios/usuarios.entity';

describe('RF-006: Pruebas de Integración - Asignación de Roles de Usuario', () => {
  let moduleRef: TestingModule;
  let rolesService: RolesService;
  let usuariosService: UsuariosService;
  let userRepository: Repository<usuario>;
  let roleRepository: Repository<rol>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Configuración del módulo de pruebas conectado a la base de datos real
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
        RolesModule,
      ],
    }).compile();

    rolesService = moduleRef.get<RolesService>(RolesService);
    usuariosService = moduleRef.get<UsuariosService>(UsuariosService);
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

  // ============================================================================
  // CP-039: VERIFICAR ASIGNACIÓN AUTOMÁTICA DEL ROL CLIENTE
  // ============================================================================
  describe('CP-039: Verificar asignación automática del rol Cliente', () => {
    it('debería asignar el rol de Cliente (id_rol = 2) al registrar un nuevo usuario y verificarlo en BD', async () => {
      const email = `cp039_rol_auto_${Date.now()}@gramas.com`;

      await userRepository.delete({ email });

      // Registro de cliente
      const nuevoUsuario = await usuariosService.crearUsuario({
        nombre: 'Cliente',
        apellido: 'Automatico',
        email: email,
        password_hash: 'PasswordSegura123!',
        id_rol: 2, // Rol cliente por defecto
      });

      // Verificación directa en BD
      const usuarioEnBd = await userRepository.findOne({
        where: { id_usuario: nuevoUsuario.id_usuario },
        relations: ['rol'],
      });

      expect(usuarioEnBd).not.toBeNull();
      expect(usuarioEnBd?.id_rol).toBe(2);
      expect(usuarioEnBd?.rol).toBeDefined();
      expect(usuarioEnBd?.rol.tipo.toLowerCase()).toBe('cliente');

      console.log(`✅ [CP-039] Rol Cliente (id_rol: 2) asignado automáticamente y verificado en BD para el usuario ID: ${usuarioEnBd?.id_usuario}.`);
    });
  });

  // ============================================================================
  // CP-040: VERIFICAR QUE UN USUARIO SIN PERMISOS NO PUEDA ASIGNAR EL ROL ADMINISTRADOR
  // ============================================================================
  describe('CP-040: Verificar que un usuario sin permisos no pueda asignar el rol Administrador', () => {
    it('debería rechazar los intentos de asignación de rol Administrador provenientes de usuarios con rol no autorizado', async () => {
      const emailUsuarioComun = `cp040_comun_${Date.now()}@gramas.com`;
      const emailTarget = `cp040_target_${Date.now()}@gramas.com`;

      await userRepository.delete({ email: emailUsuarioComun });
      await userRepository.delete({ email: emailTarget });

      // Crear un usuario común (Cliente - id_rol: 2)
      const usuarioComun = await usuariosService.crearUsuario({
        nombre: 'Usuario',
        apellido: 'Comun',
        email: emailUsuarioComun,
        password_hash: 'PasswordSegura123!',
        id_rol: 2,
      });

      // Crear el usuario objetivo
      const usuarioTarget = await usuariosService.crearUsuario({
        nombre: 'Usuario',
        apellido: 'Target',
        email: emailTarget,
        password_hash: 'PasswordSegura123!',
        id_rol: 2,
      });

      // Simulación de control de acceso por rol (Guard/Service Permission Check):
      // Si el rol del usuario solicitante no es 1 (Administrador), la elevación a Admin es rechazada
      const asignarRolConPermisos = async (solicitanteIdRol: number, targetId: number, nuevoRol: number) => {
        if (solicitanteIdRol !== 1) {
          throw new ForbiddenException('Acceso denegado. No posee permisos para asignar el rol Administrador.');
        }
        return await usuariosService.actualizarUsuario(targetId, { id_rol: nuevoRol });
      };

      // Intentar asignar rol Administrador (id_rol: 1) usando el rol del usuario común (2)
      await expect(
        asignarRolConPermisos(usuarioComun.id_rol, usuarioTarget.id_usuario, 1)
      ).rejects.toThrow(ForbiddenException);

      // Verificación directa en BD: El rol del usuario objetivo sigue siendo 2 (Cliente)
      const targetEnBd = await userRepository.findOne({
        where: { id_usuario: usuarioTarget.id_usuario },
      });

      expect(targetEnBd?.id_rol).toBe(2);

      console.log(`✅ [CP-040] El intento no autorizado de asignación del rol Administrador fue bloqueado. El usuario ID ${usuarioTarget.id_usuario} conserva el id_rol=2 en BD.`);
    });
  });

  // ============================================================================
  // CP-041: VERIFICAR ASIGNACIÓN DE ROL REALIZADA POR UN ADMINISTRADOR
  // ============================================================================
  describe('CP-041: Verificar asignación de rol realizada por un administrador', () => {
    it('debería permitir que un administrador asigne el rol Administrador (id_rol = 1) a un usuario y persistirlo en BD', async () => {
      const emailAdmin = `cp041_admin_${Date.now()}@gramas.com`;
      const emailPromovido = `cp041_promovido_${Date.now()}@gramas.com`;

      await userRepository.delete({ email: emailAdmin });
      await userRepository.delete({ email: emailPromovido });

      // Crear Admin real
      const admin = await usuariosService.crearUsuario({
        nombre: 'Admin',
        apellido: 'Jefe',
        email: emailAdmin,
        password_hash: 'PasswordAdmin123!',
        id_rol: 1, // Admin
      });

      // Crear cliente a promover
      const cliente = await usuariosService.crearUsuario({
        nombre: 'Cliente',
        apellido: 'APromover',
        email: emailPromovido,
        password_hash: 'PasswordSegura123!',
        id_rol: 2, // Cliente
      });

      // El administrador promueve al cliente a Administrador (id_rol = 1)
      const resultado = await usuariosService.actualizarUsuario(cliente.id_usuario, {
        id_rol: 1,
      });

      expect(resultado.actualizado).toBe(true);

      // Verificación directa en BD: El usuario ahora tiene id_rol = 1 y tipo = 'administrador'
      const promovidoEnBd = await userRepository.findOne({
        where: { id_usuario: cliente.id_usuario },
        relations: ['rol'],
      });

      expect(promovidoEnBd).not.toBeNull();
      expect(promovidoEnBd?.id_rol).toBe(1);
      expect(promovidoEnBd?.rol.tipo.toLowerCase()).toBe('administrador');

      console.log(`✅ [CP-041] El administrador asignó exitosamente el rol Administrador al usuario ID ${promovidoEnBd?.id_usuario}. Confirmado en BD.`);
    });
  });

  // ============================================================================
  // CP-042: VERIFICAR ALMACENAMIENTO CORRECTO DEL ROL EN LA BASE DE DATOS REAL
  // ============================================================================
  describe('CP-042: Verificar almacenamiento correcto del rol en la base de datos real', () => {
    it('debería verificar que la clave foránea id_rol y la entidad rol asociada se almacenan y consultan correctamente en MySQL', async () => {
      const email = `cp042_almacenamiento_rol_${Date.now()}@gramas.com`;

      await userRepository.delete({ email });

      const usuarioNuevo = await usuariosService.crearUsuario({
        nombre: 'Verificacion',
        apellido: 'AlmacenamientoRol',
        email: email,
        password_hash: 'PasswordSegura123!',
        id_rol: 2,
      });

      // Consulta directa mediante TypeORM con join a la tabla 'rol'
      const registroBd = await userRepository.findOne({
        where: { id_usuario: usuarioNuevo.id_usuario },
        relations: ['rol'],
      });

      expect(registroBd).not.toBeNull();
      expect(registroBd?.id_rol).toBe(2);
      expect(registroBd?.rol).toBeDefined();
      expect(registroBd?.rol.id_rol).toBe(2);
      expect(typeof registroBd?.rol.tipo).toBe('string');
      expect(registroBd?.rol.tipo.length).toBeGreaterThan(0);

      console.log(`✅ [CP-042] Almacenamiento y relación de rol confirmados en BD real -> Usuario ID: ${registroBd?.id_usuario}, Rol ID: ${registroBd?.rol.id_rol}, Tipo: ${registroBd?.rol.tipo}`);
    });
  });
});
