// test/unit/RF39-Visualizar-Panel-Control/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-039: VISUALIZAR PANEL DE CONTROL (DASHBOARD ADMINISTRADOR)
 * CP-261, CP-262, CP-263, CP-264, CP-265
 */

export const usuarioAdmin = {
  userId: 2,
  email: 'admin@test.com',
  rol: 1, // Administrador
};

export const usuarioCliente = {
  userId: 1,
  email: 'juan@test.com',
  rol: 2, // Cliente (sin permisos para el panel de administración)
};

export const mockDashboardData = {
  total: 10,
  pendiente: 3,
  pagado: 2,
  entregado: 4,
  cancelado: 1,
  ventasTotales: 150000,
  ultimoMes: 8,
  ultimaSemana: 5,
  usuariosRegistrados: 15,
  productosRegistrados: 30,
  stockTotal: 250,
};
