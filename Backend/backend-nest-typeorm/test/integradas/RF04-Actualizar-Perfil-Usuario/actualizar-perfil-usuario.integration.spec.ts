// test/integradas/RF04-Actualizar-Perfil-Usuario/actualizar-perfil-usuario.integration.spec.ts

/**
 * ============================================================================
 * PRUEBAS DE INTEGRACIÓN DIRECTAS A BASE DE DATOS
 * REQUERIMIENTO FUNCIONAL: RF-004 Actualizar Perfil de Usuario
 * ============================================================================
 * 
 * Restricciones técnicas aplicadas:
 * 1. Sin servidor HTTP (No app.listen(), no supertest, no Axios).
 * 2. Sin frontend.
 * 3. Invocación directa de Servicios / Repositorios del código fuente.
 * 4. Conexión directa a la base de datos real configurada en .env.
 * 5. Verificación directa en BD con expect/assert mediante TypeORM.
 * 6. Los datos modificados/registrados PERMANECEN guardados en la base de datos.
 * 
 * Casos de Prueba Cubiertos (RF-004):
 * - CP-026: Verificar actualización exitosa del perfil.
 * - CP-027: Verificar campos obligatorios vacíos.
 * - CP-028: Verificar información con formato inválido.
 * - CP-029: Verificar correo electrónico duplicado.
 * - CP-030: Verificar actualización en la base de datos real.
 * - CP-031: Verificar que solo el usuario autenticado / válido pueda modificar su perfil.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

import { UsuariosModule } from '../../../src/Usuarios/usuarios.module';
import { UsuariosService } from '../../../src/Usuarios/usuarios.service';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';
import { CreateUsuarioDto } from '../../../src/Usuarios/dto/create-usurio-dto';

describe('RF-004: Pruebas de Integración - Actualizar Perfil de Usuario', () => {
  let moduleRef: TestingModule;
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
      ],
    }).compile();

    usuariosService = moduleRef.get<UsuariosService>(UsuariosService);
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
  }, 30000);

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  }, 30000);

  // ============================================================================
  // CP-026: VERIFICAR ACTUALIZACIÓN EXITOSA DEL PERFIL
  // ============================================================================
  describe('CP-026: Verificar actualización exitosa del perfil', () => {
    it('debería actualizar los datos del perfil y confirmarlos mediante el servicio y TypeORM', async () => {
      const emailInicial = `cp026_perfil_inicial_${Date.now()}@gramas.com`;
      const emailNuevo = `cp026_perfil_actualizado_${Date.now()}@gramas.com`;

      await userRepository.delete({ email: emailInicial });
      await userRepository.delete({ email: emailNuevo });

      // 1. Crear el usuario en BD
      const usuarioCreado = await usuariosService.crearUsuario({
        nombre: 'Nombre Original',
        apellido: 'Apellido Original',
        email: emailInicial,
        password_hash: 'PasswordSegura123!',
        id_rol: 2,
      });

      // 2. Invocar la actualización del perfil
      const resultado = await usuariosService.actualizarUsuario(usuarioCreado.id_usuario, {
        nombre: 'Nombre Actualizado CP026',
        apellido: 'Apellido Actualizado CP026',
        email: emailNuevo,
      });

      expect(resultado).toBeDefined();
      expect(resultado.actualizado).toBe(true);

      // 3. Verificación directa en BD
      const usuarioEnBd = await userRepository.findOne({
        where: { id_usuario: usuarioCreado.id_usuario },
      });

      expect(usuarioEnBd).not.toBeNull();
      expect(usuarioEnBd?.nombre).toBe('Nombre Actualizado CP026');
      expect(usuarioEnBd?.apellido).toBe('Apellido Actualizado CP026');
      expect(usuarioEnBd?.email).toBe(emailNuevo);

      console.log(`✅ [CP-026] Perfil actualizado exitosamente en BD -> ID: ${usuarioEnBd?.id_usuario}, Nuevo Email: ${usuarioEnBd?.email}`);
    });
  });

  // ============================================================================
  // CP-027: VERIFICAR CAMPOS OBLIGATORIOS VACÍOS
  // ============================================================================
  describe('CP-027: Verificar campos obligatorios vacíos', () => {
    it('debería fallar la validación DTO cuando se envían campos obligatorios en blanco', async () => {
      const dtoInvalido = plainToInstance(CreateUsuarioDto, {
        nombre: '', // Nombre vacío
        email: '',  // Email vacío
        password_hash: 'PasswordSegura123!',
        id_rol: 2,
      });

      const erroresValidacion = await validate(dtoInvalido);

      expect(erroresValidacion.length).toBeGreaterThan(0);
      const propiedadesConError = erroresValidacion.map((err) => err.property);
      expect(propiedadesConError).toContain('nombre');
      expect(propiedadesConError).toContain('email');

      console.log(`✅ [CP-027] La validación DTO detectó y bloqueó correctamente los campos obligatorios vacíos.`);
    });
  });

  // ============================================================================
  // CP-028: VERIFICAR INFORMACIÓN CON FORMATO INVÁLIDO
  // ============================================================================
  describe('CP-028: Verificar información con formato inválido', () => {
    it('debería rechazar la actualización cuando el formato del email es incorrecto', async () => {
      const dtoEmailInvalido = plainToInstance(CreateUsuarioDto, {
        nombre: 'Usuario Formato',
        apellido: 'Invalido',
        email: 'correo-sin-formato-valido',
        password_hash: 'PasswordSegura123!',
        id_rol: 2,
      });

      const erroresValidacion = await validate(dtoEmailInvalido);

      expect(erroresValidacion.length).toBeGreaterThan(0);
      const errorEmail = erroresValidacion.find((err) => err.property === 'email');
      expect(errorEmail).toBeDefined();

      console.log(`✅ [CP-028] La validación DTO rechazó correctamente el formato de correo electrónico inválido.`);
    });
  });

  // ============================================================================
  // CP-029: VERIFICAR CORREO ELECTRÓNICO DUPLICADO
  // ============================================================================
  describe('CP-029: Verificar correo electrónico duplicado', () => {
    it('debería bloquear la actualización y lanzar excepción al intentar asignar un correo que pertenece a otro usuario en BD', async () => {
      const emailUsuarioA = `cp029_usuario_a_${Date.now()}@gramas.com`;
      const emailUsuarioB = `cp029_usuario_b_${Date.now()}@gramas.com`;

      await userRepository.delete({ email: emailUsuarioA });
      await userRepository.delete({ email: emailUsuarioB });

      // Crear Usuario A
      const usuarioA = await usuariosService.crearUsuario({
        nombre: 'Usuario A',
        apellido: 'Existente',
        email: emailUsuarioA,
        password_hash: 'PasswordSegura123!',
        id_rol: 2,
      });

      // Crear Usuario B
      const usuarioB = await usuariosService.crearUsuario({
        nombre: 'Usuario B',
        apellido: 'IntentoDuplicar',
        email: emailUsuarioB,
        password_hash: 'PasswordSegura123!',
        id_rol: 2,
      });

      // Intentar actualizar Usuario B asignándole el email de Usuario A
      await expect(
        usuariosService.actualizarUsuario(usuarioB.id_usuario, {
          email: emailUsuarioA,
        })
      ).rejects.toThrow();

      // Verificación directa en BD: Usuario B mantiene su email original
      const usuarioBEnBd = await userRepository.findOne({
        where: { id_usuario: usuarioB.id_usuario },
      });

      expect(usuarioBEnBd?.email).toBe(emailUsuarioB);

      console.log(`✅ [CP-029] Se bloqueó el intento de duplicar correo en BD. El usuario B (ID: ${usuarioB.id_usuario}) conserva su email original.`);
    });
  });

  // ============================================================================
  // CP-030: VERIFICAR ACTUALIZACIÓN EN LA BASE DE DATOS REAL
  // ============================================================================
  describe('CP-030: Verificar actualización en la base de datos real', () => {
    it('debería confirmar que los cambios en el perfil se reflejan de forma persistente en la tabla usuario de MySQL', async () => {
      const email = `cp030_verificacion_bd_${Date.now()}@gramas.com`;

      await userRepository.delete({ email });

      const usuarioCreado = await usuariosService.crearUsuario({
        nombre: 'Nombre BD Antes',
        apellido: 'Apellido BD Antes',
        email: email,
        password_hash: 'PasswordSegura123!',
        id_rol: 2,
      });

      const nuevoNombre = 'Nombre BD Confirmado CP030';
      const nuevoApellido = 'Apellido BD Confirmado CP030';

      // Actualizar perfil
      await usuariosService.actualizarUsuario(usuarioCreado.id_usuario, {
        nombre: nuevoNombre,
        apellido: nuevoApellido,
      });

      // Consulta directa a la base de datos real
      const registoEnBd = await userRepository.findOne({
        where: { id_usuario: usuarioCreado.id_usuario },
      });

      expect(registoEnBd).not.toBeNull();
      expect(registoEnBd?.nombre).toBe(nuevoNombre);
      expect(registoEnBd?.apellido).toBe(nuevoApellido);

      console.log(`✅ [CP-030] Verificación directa en BD exitosa para el usuario ID ${usuarioCreado.id_usuario}: Nombre='${registoEnBd?.nombre}'`);
    });
  });

  // ============================================================================
  // CP-031: VERIFICAR QUE SOLO EL USUARIO AUTÉNTICADO / VÁLIDO PUEDA MODIFICAR SU PERFIL
  // ============================================================================
  describe('CP-031: Verificar que solo el usuario válido pueda modificar su perfil', () => {
    it('debería responder con actualizado=false al intentar modificar un perfil con un ID de usuario inexistente', async () => {
      const idInexistente = 999999;

      const resultado = await usuariosService.actualizarUsuario(idInexistente, {
        nombre: 'Intento Hacker',
      });

      expect(resultado).toBeDefined();
      expect(resultado.actualizado).toBe(false);
      expect(resultado.mensaje).toContain('no encontrado');

      // Verificación directa en BD: Asegurar que el ID 999999 no existe
      const consultaBd = await userRepository.findOne({ where: { id_usuario: idInexistente } });
      expect(consultaBd).toBeNull();

      console.log(`✅ [CP-031] Intento de actualización no autorizado / inexistente (ID ${idInexistente}) bloqueado correctamente.`);
    });
  });
});
