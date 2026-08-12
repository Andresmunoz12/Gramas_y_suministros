// test/unit/RF32-Despacho-Entrega-Cotizacion/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-032: DESPACHO Y ENTREGA DE COTIZACIÓN (DESCUENTO DE STOCK)
 * CP-215, CP-217, CP-218, CP-219
 */

export const usuarioExistente = {
  id_usuario: 1,
  nombre: 'Admin',
  email: 'admin@test.com',
  id_rol: 1,
};

export const productoGrama = {
  id_producto: 1,
  nombre: 'Grama Premium',
  precio: 30000,
  estado: 1,
};

// 📦 Stock
export const stockSuficiente = {
  id_producto: 1,
  cantidad_actual: 100,
};

export const stockInsuficiente = {
  id_producto: 1,
  cantidad_actual: 5, // Se requieren 10 en la cotización
};

// 📝 Cotizaciones
export const cotizacionPendienteMock = {
  idCotizacion: 50,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 300000,
  costoEnvio: 0,
  total: 300000,
  estado: 'pendiente',
  detalles: [
    {
      idDetalle: 1,
      idCotizacion: 50,
      idProducto: 1,
      cantidad: 10, // Requerida
      precioUnitario: 30000,
      subtotal: 300000,
      producto: productoGrama,
    },
  ],
};

export const cotizacionEntregadaMock = {
  idCotizacion: 60,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 300000,
  costoEnvio: 0,
  total: 300000,
  estado: 'entregado', // Ya entregada
  detalles: [
    {
      idDetalle: 2,
      idCotizacion: 60,
      idProducto: 1,
      cantidad: 10,
      precioUnitario: 30000,
      subtotal: 300000,
      producto: productoGrama,
    },
  ],
};

export const mensajesErrorStock = {
  insuficiente: 'Stock insuficiente para "Grama Premium". Disponible: 5, Requerido: 10',
  stockNoEncontrado: 'Stock para producto ID 1 no encontrado',
};
