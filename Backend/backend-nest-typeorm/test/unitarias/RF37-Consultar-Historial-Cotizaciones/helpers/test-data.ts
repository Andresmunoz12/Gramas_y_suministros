// test/unit/RF37-Consultar-Historial-Cotizaciones/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-037: CONSULTAR HISTORIAL DE COTIZACIONES
 * CP-247, CP-248, CP-249, CP-250, CP-251
 */

export const usuarioCliente = {
  userId: 1,
  email: 'juan@test.com',
  rol: 2, // Cliente
};

export const usuarioAdmin = {
  userId: 2,
  email: 'admin@test.com',
  rol: 1, // Administrador
};

export const usuarioAjeno = {
  userId: 3,
  email: 'pedro@test.com',
  rol: 2, // Cliente
};

// Cotización de Juan (idUsuario = 1)
export const cotizacionJuanMock = {
  idCotizacion: 120,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 50000,
  costoEnvio: 0,
  total: 50000,
  estado: 'pendiente',
  fechaCreacion: new Date('2026-08-11T10:00:00Z'),
  usuario: {
    id_usuario: 1,
    nombre: 'Juan',
    email: 'juan@test.com',
  },
  detalles: [],
};

// Cotización de Pedro (idUsuario = 3)
export const cotizacionPedroMock = {
  idCotizacion: 121,
  idUsuario: 3,
  metodoVenta: 'envio',
  metodoPago: 'tarjeta_debito',
  subtotal: 30000,
  costoEnvio: 8000,
  total: 38000,
  estado: 'pagado',
  fechaCreacion: new Date('2026-08-11T11:00:00Z'),
  usuario: {
    id_usuario: 3,
    nombre: 'Pedro',
    email: 'pedro@test.com',
  },
  detalles: [],
};
