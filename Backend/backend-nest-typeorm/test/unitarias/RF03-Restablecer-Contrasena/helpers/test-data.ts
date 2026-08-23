// test/unit/RF03-Restablecer-Contrasena/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-003: RESTABLECER CONTRASEÑA
 * CP-016 a CP-024
 */

export const mockUserRecord = {
  id_usuario: 10,
  nombre: 'Andres Felipe',
  email: 'prueba@gmail.com',
  passwordHash: '$2a$10$oldpasswordhashhere',
  id_rol: 2,
};

export const mockResetRecord = {
  id: 1,
  email: 'prueba@gmail.com',
  codigo: '123456',
  usado: 0,
  tiempo: new Date(),
};
