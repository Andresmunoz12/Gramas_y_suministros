// test/unit/RF06-Asignacion-Roles-Usuario/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-006: ASIGNACIÓN DE ROLES DE USUARIO
 * CP-039 a CP-044
 */

export const mockRolCliente = {
  id_rol: 2,
  tipo: 'cliente',
  descripcion: 'Rol de Cliente',
};

export const mockRolAdmin = {
  id_rol: 1,
  tipo: 'administrador',
  descripcion: 'Rol de Administrador',
};

export const mockUserCreationData = {
  nombre: 'Carlos',
  apellido: 'Lopez',
  email: 'carlos@test.com',
  password_hash: 'password123',
  id_rol: 2, // Cliente por defecto
};

export const mockUserSavedRecord = {
  id_usuario: 15,
  nombre: 'Carlos',
  apellido: 'Lopez',
  email: 'carlos@test.com',
  passwordHash: '$2a$10$hashedpassword123',
  id_rol: 2,
};
