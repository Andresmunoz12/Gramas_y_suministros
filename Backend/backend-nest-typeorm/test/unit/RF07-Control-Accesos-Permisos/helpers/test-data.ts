// test/unit/RF07-Control-Accesos-Permisos/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-007: CONTROL DE ACCESOS Y PERMISOS
 * CP-045 a CP-051
 */

export const mockUserAdmin = {
  userId: 1,
  nombre: 'Andres Admin',
  email: 'admin@gramas.com',
  rol: 1, // Rol Administrador
};

export const mockUserCliente = {
  userId: 2,
  nombre: 'Juan Cliente',
  email: 'juan@gramas.com',
  rol: 2, // Rol Cliente
};

export const mockUserSinRol = {
  userId: 3,
  nombre: 'Desconocido',
  email: 'desconocido@test.com',
  rol: undefined, // Sin rol
};
