import * as dotenv from 'dotenv';
dotenv.config();

import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcryptjs';

import { PasswordResetsModule } from '../../../src/password-resets/password-resets.module';
import { AuthService as PasswordResetsService } from '../../../src/password-resets/password-resets.service';
import { PasswordReset } from '../../../src/password-resets/password-resets.entity';
import { UsuariosModule } from '../../../src/Usuarios/usuarios.module';
import { UsuariosService } from '../../../src/Usuarios/usuarios.service';
import { usuario } from '../../../src/Usuarios/usuarios.entity';
import { rol } from '../../../src/roles/roles.entity';
import { SolicitarCodigoDto } from '../../../src/password-resets/dto/Solicitar-codigo.dto';
import { RestablecerPasswordDto } from '../../../src/password-resets/dto/reset-password.dto';

describe('RF-003: Pruebas de Integración - Restablecer Contraseña', () => {
  let moduleRef: TestingModule;
  let resetService: PasswordResetsService;
  let usuariosService: UsuariosService;
  let userRepository: Repository<usuario>;
  let resetRepository: Repository<PasswordReset>;
  let roleRepository: Repository<rol>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // Mock ligero de MailerService para agilizar pruebas sin depender de la latencia SMTP externa
    const mockMailerService = {
      sendMail: jest.fn().mockResolvedValue(true),
    };

    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'mysql',
          url: process.env.DATABASE_URL,
          entities: [usuario, rol, PasswordReset],
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
        TypeOrmModule.forFeature([usuario, rol, PasswordReset]),
        UsuariosModule,
        PasswordResetsModule,
      ],
    })
      .overrideProvider(MailerService)
      .useValue(mockMailerService)
      .compile();

    resetService = moduleRef.get<PasswordResetsService>(PasswordResetsService);
    usuariosService = moduleRef.get<UsuariosService>(UsuariosService);
    userRepository = moduleRef.get<Repository<usuario>>(getRepositoryToken(usuario));
    resetRepository = moduleRef.get<Repository<PasswordReset>>(getRepositoryToken(PasswordReset));
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
  // CP-016: VERIFICAR ENVÍO EXITOSO DEL CÓDIGO DE VERIFICACIÓN
  // ============================================================================
  describe('CP-016: Verificar envío exitoso del código de verificación', () => {
    it('debería generar el código de verificación, guardarlo en BD y procesar la solicitud exitosamente', async () => {
      const email = `cp016_solicitud_${Date.now()}@gramas.com`;

      await resetRepository.delete({ email });
      await userRepository.delete({ email });

      // Crear usuario de prueba
      const user = await usuariosService.crearUsuario({
        nombre: 'Usuario',
        apellido: 'CP016',
        email: email,
        password_hash: 'PasswordInicial123!',
        id_rol: 2,
      });

      // Solicitar código de recuperación
      const respuesta = await resetService.solicitarRecuperacion(email);

      expect(respuesta).toBeDefined();
      expect(respuesta.message).toContain('éxito');

      // Verificación directa en la BD (tabla password_resets)
      const registroResetBd = await resetRepository.findOne({
        where: { email, usado: 0 },
        order: { id: 'DESC' },
      });

      expect(registroResetBd).not.toBeNull();
      expect(registroResetBd?.email).toBe(email);
      expect(registroResetBd?.codigo).toBeDefined();
      expect(registroResetBd?.codigo.length).toBe(6);
      expect(registroResetBd?.usado).toBe(0);

      console.log(`✅ [CP-016] Código generado en BD para ${email} -> Código BD: ${registroResetBd?.codigo}`);
    });
  });

  // ============================================================================
  // CP-017: VERIFICAR QUE CORREO ELECTRÓNICO NO REGISTRADO
  // ============================================================================
  describe('CP-017: Verificar que correo electrónico no registrado', () => {
    it('debería rechazar la solicitud con NotFoundException cuando el correo no existe en la BD', async () => {
      const emailInexistente = `cp017_no_existe_${Date.now()}@gramas.com`;

      // Confirmar que no existe previamente
      const existeUsuario = await userRepository.findOne({ where: { email: emailInexistente } });
      expect(existeUsuario).toBeNull();

      // Solicitar recuperación debe lanzar NotFoundException
      await expect(resetService.solicitarRecuperacion(emailInexistente)).rejects.toThrow(NotFoundException);

      // Verificación directa en BD: No debe haberse creado registro en password_resets
      const registrosBd = await resetRepository.find({ where: { email: emailInexistente } });
      expect(registrosBd.length).toBe(0);

      console.log(`✅ [CP-017] El sistema rechazó correctamente el correo no registrado (${emailInexistente}).`);
    });
  });

  // ============================================================================
  // CP-018: VERIFICAR QUE CÓDIGO DE VERIFICACIÓN INCORRECTO
  // ============================================================================
  describe('CP-018: Verificar que código de verificación incorrecto', () => {
    it('debería rechazar el restablecimiento cuando se ingresa un código erróneo y no alterar la contraseña en BD', async () => {
      const email = `cp018_codigo_erroneo_${Date.now()}@gramas.com`;
      const passOriginal = 'ClaveOriginal123!';

      await resetRepository.delete({ email });
      await userRepository.delete({ email });

      const user = await usuariosService.crearUsuario({
        nombre: 'Prueba',
        apellido: 'CP018',
        email: email,
        password_hash: passOriginal,
        id_rol: 2,
      });

      // Solicitar código real
      await resetService.solicitarRecuperacion(email);

      // Intentar restablecer con un código incorrecto
      const codigoFalso = '999999';
      await expect(
        resetService.restablecerPassword(codigoFalso, 'NuevaClaveIntentada123!')
      ).rejects.toThrow(BadRequestException);

      // Verificación directa en BD: La contraseña debe mantenerse intacta
      const userEnBd = await userRepository.findOne({
        where: { id_usuario: user.id_usuario },
        select: ['id_usuario', 'passwordHash'],
      });

      const coincideConOriginal = await bcrypt.compare(passOriginal, userEnBd!.passwordHash);
      expect(coincideConOriginal).toBe(true);

      console.log(`✅ [CP-018] El código incorrecto fue bloqueado y la contraseña en BD permaneció inalterada.`);
    });
  });

  // ============================================================================
  // CP-019: VERIFICAR QUE CÓDIGO DE VERIFICACIÓN EXPIRADO / YA USADO
  // ============================================================================
  describe('CP-019: Verificar que código de verificación expirado / ya usado', () => {
    it('debería rechazar el intento de restablecer contraseña usando un código marcado como usado', async () => {
      const email = `cp019_codigo_usado_${Date.now()}@gramas.com`;

      await resetRepository.delete({ email });
      await userRepository.delete({ email });

      const user = await usuariosService.crearUsuario({
        nombre: 'CP019',
        apellido: 'Expirado',
        email: email,
        password_hash: 'PasswordInicial123!',
        id_rol: 2,
      });

      // Insertar directamente un registro ya usado en password_resets
      const codigoUsado = '123456';
      await resetRepository.save(
        resetRepository.create({
          email: email,
          codigo: codigoUsado,
          usado: 1, // Ya usado
        })
      );

      // Intentar restablecer con el código usado
      await expect(
        resetService.restablecerPassword(codigoUsado, 'NuevaClave2026!')
      ).rejects.toThrow(BadRequestException);

      console.log(`✅ [CP-019] Se rechazó correctamente el uso de un código marcado como ya utilizado.`);
    });
  });

  // ============================================================================
  // CP-020: VERIFICAR CORREO ELECTRÓNICO EN BLANCO
  // ============================================================================
  describe('CP-020: Verificar correo electrónico en blanco', () => {
    it('debería fallar la validación DTO al enviar un correo vacío en la solicitud de código', async () => {
      const dtoVacio = plainToInstance(SolicitarCodigoDto, {
        email: '',
      });

      const erroresValidacion = await validate(dtoVacio);

      expect(erroresValidacion.length).toBeGreaterThan(0);
      const errorEmail = erroresValidacion.find((err) => err.property === 'email');
      expect(errorEmail).toBeDefined();

      console.log(`✅ [CP-020] La validación DTO bloqueó correctamente el correo en blanco.`);
    });
  });

  // ============================================================================
  // CP-021: VERIFICAR QUE CONTRASEÑA NO CUMPLE CON LOS REQUISITOS
  // ============================================================================
  describe('CP-021: Verificar que contraseña que no cumple con los requisitos', () => {
    it('debería fallar la validación DTO cuando la nueva contraseña tiene menos de 8 caracteres', async () => {
      const dtoPassCorta = plainToInstance(RestablecerPasswordDto, {
        codigo_verificacion: '123456',
        nueva_password: '123', // Insegura / Corta
      });

      const erroresValidacion = await validate(dtoPassCorta);

      expect(erroresValidacion.length).toBeGreaterThan(0);
      const errorPass = erroresValidacion.find((err) => err.property === 'nueva_password');
      expect(errorPass).toBeDefined();

      console.log(`✅ [CP-021] La contraseña de menos de 8 caracteres fue rechazada por la validación DTO.`);
    });
  });

  // ============================================================================
  // CP-022: VERIFICAR RESTABLECIMIENTO EXITOSO DE LA CONTRASEÑA
  // ============================================================================
  describe('CP-022: Verificar restablecimiento exitoso de la contraseña', () => {
    it('debería actualizar la contraseña en BD y marcar el código como usado (usado = 1)', async () => {
      const email = `cp022_exitoso_${Date.now()}@gramas.com`;
      const passInicial = 'ClaveInicial123!';
      const passNueva = 'NuevaClaveSuperSegura2026!';

      await resetRepository.delete({ email });
      await userRepository.delete({ email });

      const user = await usuariosService.crearUsuario({
        nombre: 'Usuario Restablecido',
        apellido: 'Exito',
        email: email,
        password_hash: passInicial,
        id_rol: 2,
      });

      // 1. Solicitar código de recuperación
      await resetService.solicitarRecuperacion(email);

      // 2. Obtener el código generado directamente de la BD
      const registroReset = await resetRepository.findOne({
        where: { email, usado: 0 },
        order: { id: 'DESC' },
      });
      expect(registroReset).not.toBeNull();
      const codigoGenerado = registroReset!.codigo;

      // 3. Ejecutar el restablecimiento de contraseña
      const resultado = await resetService.restablecerPassword(codigoGenerado, passNueva);
      expect(resultado.message).toContain('correctamente');

      // 4. Verificación directa en BD: El registro de código debe estar marcado como usado = 1
      const registroUsadoBd = await resetRepository.findOne({
        where: { id: registroReset!.id },
      });
      expect(registroUsadoBd?.usado).toBe(1);

      // 5. Verificación directa en BD: La contraseña del usuario fue actualizada
      const userActualizadoBd = await userRepository.findOne({
        where: { id_usuario: user.id_usuario },
        select: ['id_usuario', 'passwordHash'],
      });

      const coincideNueva = await bcrypt.compare(passNueva, userActualizadoBd!.passwordHash);
      expect(coincideNueva).toBe(true);

      console.log(`✅ [CP-022] Restablecimiento exitoso. Código en BD marcado usado=1. Usuario ID ${user.id_usuario} actualizado.`);
    });
  });

  // ============================================================================
  // CP-023: VERIFICAR CIFRADO DE LA CONTRASEÑA
  // ============================================================================
  describe('CP-023: Verificar cifrado de la contraseña', () => {
    it('debería almacenar la nueva contraseña encriptada con bcrypt en la columna password_hash', async () => {
      const email = `cp023_cifrado_${Date.now()}@gramas.com`;
      const nuevaPassPlana = 'MiNuevaPasswordCifrada2026!';

      await resetRepository.delete({ email });
      await userRepository.delete({ email });

      const user = await usuariosService.crearUsuario({
        nombre: 'Cifrado',
        apellido: 'Restablecer',
        email: email,
        password_hash: 'ViejaClave123!',
        id_rol: 2,
      });

      await resetService.solicitarRecuperacion(email);

      const resetBd = await resetRepository.findOne({
        where: { email, usado: 0 },
      });

      await resetService.restablecerPassword(resetBd!.codigo, nuevaPassPlana);

      // Verificación directa en la columna password_hash en BD
      const userEnBd = await userRepository.findOne({
        where: { id_usuario: user.id_usuario },
        select: ['id_usuario', 'passwordHash'],
      });

      expect(userEnBd?.passwordHash).toBeDefined();
      expect(userEnBd?.passwordHash).not.toBe(nuevaPassPlana);
      expect(userEnBd?.passwordHash).toMatch(/^\$2[aby]\$/);

      const coincide = await bcrypt.compare(nuevaPassPlana, userEnBd!.passwordHash);
      expect(coincide).toBe(true);

      console.log(`✅ [CP-023] Nueva contraseña encriptada correctamente en BD con formato bcrypt: ${userEnBd?.passwordHash}`);
    });
  });

  // ============================================================================
  // CP-024: VERIFICAR QUE CÓDIGO DE VERIFICACIÓN LLEGÓ AL DESTINATARIO
  // ============================================================================
  describe('CP-024: Verificar que código de verificación llegó al destinatario', () => {
    it('debería verificar que el código fue asignado y registrado para el usuario destinatario específico', async () => {
      const emailDestinatario = `cp024_destinatario_${Date.now()}@gramas.com`;

      await resetRepository.delete({ email: emailDestinatario });
      await userRepository.delete({ email: emailDestinatario });

      await usuariosService.crearUsuario({
        nombre: 'Destinatario',
        apellido: 'Confirmado',
        email: emailDestinatario,
        password_hash: 'PasswordInicial123!',
        id_rol: 2,
      });

      // Solicitar código
      const respuesta = await resetService.solicitarRecuperacion(emailDestinatario);
      expect(respuesta.message).toContain('éxito');

      // Consultar en BD el registro asignado a ese destinatario
      const registroDestinatario = await resetRepository.findOne({
        where: { email: emailDestinatario, usado: 0 },
      });

      expect(registroDestinatario).not.toBeNull();
      expect(registroDestinatario?.email).toBe(emailDestinatario);
      expect(registroDestinatario?.codigo).toMatch(/^\d{6}$/);

      console.log(`✅ [CP-024] Código de verificación (${registroDestinatario?.codigo}) registrado correctamente en BD para destinatario ${emailDestinatario}.`);
    });
  });
});
