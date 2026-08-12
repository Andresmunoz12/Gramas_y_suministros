// test/unit/RF33-Estados-Cotizacion/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-033: ESTADOS DE COTIZACIÓN
 * CP-221, CP-222, CP-223, CP-225
 */

export const usuarioExistente = {
  id_usuario: 1,
  nombre: 'Cliente Test',
  id_rol: 2,
};

export const productoGrama = {
  id_producto: 1,
  nombre: 'Grama Premium',
  precio: 30000,
  estado: 1,
};

export const stockSuficiente = {
  id_producto: 1,
  cantidad_actual: 100,
};

// Cotización Pendiente
export const cotizacionPendienteMock = {
  idCotizacion: 70,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 150000,
  costoEnvio: 0,
  total: 150000,
  estado: 'pendiente',
  detalles: [
    {
      idDetalle: 1,
      idCotizacion: 70,
      idProducto: 1,
      cantidad: 5,
      precioUnitario: 30000,
      subtotal: 150000,
      producto: productoGrama,
    },
  ],
};

// Cotización Pagada
export const cotizacionPagadaMock = {
  idCotizacion: 71,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 150000,
  costoEnvio: 0,
  total: 150000,
  estado: 'pagado',
  detalles: [
    {
      idDetalle: 2,
      idCotizacion: 71,
      idProducto: 1,
      cantidad: 5,
      precioUnitario: 30000,
      subtotal: 150000,
      producto: productoGrama,
    },
  ],
};

// Cotización Entregada
export const cotizacionEntregadaMock = {
  idCotizacion: 72,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 150000,
  costoEnvio: 0,
  total: 150000,
  estado: 'entregado',
  detalles: [
    {
      idDetalle: 3,
      idCotizacion: 72,
      idProducto: 1,
      cantidad: 5,
      precioUnitario: 30000,
      subtotal: 150000,
      producto: productoGrama,
    },
  ],
};

// Cotización Cancelada
export const cotizacionCanceladaMock = {
  idCotizacion: 73,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 150000,
  costoEnvio: 0,
  total: 150000,
  estado: 'cancelado',
  detalles: [
    {
      idDetalle: 4,
      idCotizacion: 73,
      idProducto: 1,
      cantidad: 5,
      precioUnitario: 30000,
      subtotal: 150000,
      producto: productoGrama,
    },
  ],
};
