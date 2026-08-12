// test/unit/RF38-Buscar-Filtrar-Historial-Cotizaciones/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-038: BUSCAR Y FILTRAR HISTORIAL DE COTIZACIONES
 * CP-253, CP-254, CP-255, CP-256, CP-257, CP-258
 */

export const usuarioAdmin = {
  userId: 2,
  email: 'admin@test.com',
  rol: 1, // Administrador
};

export const mockCotizaciones = [
  {
    idCotizacion: 151,
    idUsuario: 10,
    metodoVenta: 'fisico',
    metodoPago: 'efectivo',
    subtotal: 30000,
    costoEnvio: 0,
    total: 30000,
    estado: 'pendiente',
    fechaCreacion: new Date('2026-08-01T10:00:00Z'),
    usuario: { id_usuario: 10, nombre: 'Juan Perez', email: 'juan@test.com' },
    detalles: [],
  },
  {
    idCotizacion: 152,
    idUsuario: 11,
    metodoVenta: 'envio',
    metodoPago: 'tarjeta_debito',
    subtotal: 60000,
    costoEnvio: 8000,
    total: 68000,
    estado: 'pagado',
    fechaCreacion: new Date('2026-08-05T10:00:00Z'),
    usuario: { id_usuario: 11, nombre: 'Pedro Gomez', email: 'pedro@test.com' },
    detalles: [],
  },
  {
    idCotizacion: 153,
    idUsuario: 10,
    metodoVenta: 'fisico',
    metodoPago: 'tarjeta_credito',
    subtotal: 90000,
    costoEnvio: 0,
    total: 90000,
    estado: 'entregado',
    fechaCreacion: new Date('2026-08-10T10:00:00Z'),
    usuario: { id_usuario: 10, nombre: 'Juan Perez', email: 'juan@test.com' },
    detalles: [],
  },
  {
    idCotizacion: 154,
    idUsuario: 12,
    metodoVenta: 'envio',
    metodoPago: 'efectivo',
    subtotal: 120000,
    costoEnvio: 8000,
    total: 128000,
    estado: 'cancelado',
    fechaCreacion: new Date('2026-08-11T10:00:00Z'),
    usuario: { id_usuario: 12, nombre: 'Maria Ruiz', email: 'maria@test.com' },
    detalles: [],
  },
];
