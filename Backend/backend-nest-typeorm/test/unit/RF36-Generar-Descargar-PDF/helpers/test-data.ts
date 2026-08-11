// test/unit/RF36-Generar-Descargar-PDF/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-036: GENERAR Y DESCARGAR COTIZACIÓN EN PDF
 * CP-239, CP-240, CP-241, CP-242, CP-245, CP-246
 */

export const usuarioCliente = {
  userId: 1,
  email: 'juan@test.com',
  rol: 2, // 2 = Cliente
};

export const usuarioAdmin = {
  userId: 2,
  email: 'admin@test.com',
  rol: 1, // 1 = Administrador
};

export const usuarioAjeno = {
  userId: 3,
  email: 'pedro@test.com',
  rol: 2, // 2 = Cliente
};

export const productoGrama = {
  id_producto: 1,
  nombre: 'Grama Premium',
  precio: 30000,
  estado: 1,
};

// Cotización de Juan (idUsuario = 1)
export const cotizacionJuanMock = {
  idCotizacion: 100,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 30000,
  costoEnvio: 0,
  total: 30000,
  estado: 'pendiente',
  fechaCreacion: new Date('2026-08-11T12:00:00Z'),
  usuario: {
    id_usuario: 1,
    nombre: 'Juan',
    apellido: 'Perez',
    email: 'juan@test.com',
  },
  detalles: [
    {
      idDetalle: 1,
      idCotizacion: 100,
      idProducto: 1,
      cantidad: 1,
      precioUnitario: 30000,
      subtotal: 30000,
      producto: productoGrama,
    },
  ],
};
