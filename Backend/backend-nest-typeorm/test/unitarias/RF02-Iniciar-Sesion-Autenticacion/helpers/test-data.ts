// test/unit/RF02-Iniciar-Sesion-Autenticacion/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-002: INICIAR SESIÓN / AUTENTICACIÓN DE USUARIOS
 * CP-009, CP-010, CP-011, CP-012, CP-013, CP-014
 */

export const mockUserRecord = {
  id_usuario: 10,
  nombre: 'Andres Felipe',
  email: 'prueba@gmail.com',
  passwordHash: '$2a$10$vD2hQxXyFq.k2iV/dMskq.N/y3h7o.9xN0X7mZ2rQyQ.z8o4BvWqK', // Bcrypt hash for 'password123'
  id_rol: 2, // Cliente
};

export const validLoginDto = {
  email: 'prueba@gmail.com',
  password_hash: 'password123',
};
