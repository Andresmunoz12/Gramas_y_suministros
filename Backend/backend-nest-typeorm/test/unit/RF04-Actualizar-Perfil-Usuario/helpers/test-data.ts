// test/unit/RF04-Actualizar-Perfil-Usuario/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-004: ACTUALIZAR PERFIL DE USUARIO
 * CP-026 a CP-031
 */

export const mockUserRecord = {
  id_usuario: 5,
  nombre: 'Andres Felipe',
  apellido: 'Muñoz',
  email: 'andres@gramas.com',
  id_rol: 2,
};

export const mockUpdatedUserRecord = {
  id_usuario: 5,
  nombre: 'Andres Modificado',
  apellido: 'Muñoz Lombana',
  email: 'andres.new@gramas.com',
  id_rol: 2,
};
