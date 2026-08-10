// test/unit/Gestion-Usuarios/Registro-Usuarios/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA REGISTRO DE USUARIOS
 * Estos datos se usan en todos los casos de prueba
 */

// ✅ Usuario válido para pruebas exitosas
export const usuarioValido = {
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan.perez@test.com',
  password_hash: 'Password123',
  id_rol: 2, // Cliente
};

// ✅ Otro usuario válido para pruebas de duplicados
export const otroUsuarioValido = {
  nombre: 'Maria',
  apellido: 'Gómez',
  email: 'maria.gomez@test.com',
  password_hash: 'Password456',
  id_rol: 2,
};

// ❌ Usuario con email duplicado
export const usuarioEmailDuplicado = {
  nombre: 'Carlos',
  apellido: 'Lopez',
  email: 'juan.perez@test.com', // Mismo email que usuarioValido
  password_hash: 'Password789',
  id_rol: 2,
};

// ❌ Usuario con campos obligatorios faltantes
export const usuarioSinNombre = {
  // nombre: 'Juan', // ❌ Faltante
  apellido: 'Pérez',
  email: 'sin.nombre@test.com',
  password_hash: 'Password123',
  id_rol: 2,
};

export const usuarioSinEmail = {
  nombre: 'Juan',
  apellido: 'Pérez',
  // email: 'juan@test.com', // ❌ Faltante
  password_hash: 'Password123',
  id_rol: 2,
};

export const usuarioSinPassword = {
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'sin.password@test.com',
  // password_hash: 'Password123', // ❌ Faltante
  id_rol: 2,
};

// ❌ Usuario con email inválido
export const usuarioEmailInvalido = {
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'correo-invalido', // ❌ Formato incorrecto
  password_hash: 'Password123',
  id_rol: 2,
};

// ❌ Usuario con contraseña corta
export const usuarioPasswordCorta = {
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'password.corta@test.com',
  password_hash: '123', // ❌ Menos de 8 caracteres
  id_rol: 2,
};

// ✅ Usuario administrador
export const usuarioAdministrador = {
  nombre: 'Admin',
  apellido: 'Sistema',
  email: 'admin.sistema@test.com',
  password_hash: 'Admin1234',
  id_rol: 1, // Administrador
};

// ✅ Usuario cliente (rol por defecto)
export const usuarioCliente = {
  nombre: 'Cliente',
  apellido: 'Test',
  email: 'cliente.test@test.com',
  password_hash: 'Cliente123',
  id_rol: 2, // Cliente
};

// Respuestas esperadas
export const mensajes = {
  registroExitoso: 'Usuario creado exitosamente.',
  emailDuplicado: 'Email already exists',
  camposObligatorios: 'Campos obligatorios faltantes',
  emailInvalido: 'email must be an email',
  passwordCorta: 'password_hash must be longer than or equal to 8 characters',
  usuarioNoEncontrado: 'Usuario no encontrado con esos criterios',
};