// test/unit/RF34-Modalidades-Entrega-Cotizacion/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-034: MODALIDADES DE ENTREGA DE COTIZACIÓN
 * CP-227, CP-228, CP-232
 */

export const usuarioExistente = {
  id_usuario: 1,
  nombre: 'Usuario Test',
  id_rol: 2,
};

export const productoGrama = {
  id_producto: 1,
  nombre: 'Grama Premium',
  precio: 30000,
  estado: 1,
};

// --- CP-227: Modalidad Entrega Física ---
export const cotizacionFisicaDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [{ idProducto: 1, cantidad: 2 }],
};

export const cotizacionFisicaCreadaMock = {
  idCotizacion: 80,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 60000,
  costoEnvio: 0, // Sin costo de envío
  total: 60000,
  estado: 'pendiente',
  fechaCreacion: new Date(),
  detalles: [
    {
      idDetalle: 1,
      idCotizacion: 80,
      idProducto: 1,
      cantidad: 2,
      precioUnitario: 30000,
      subtotal: 60000,
      producto: productoGrama,
    },
  ],
};

// --- CP-228: Modalidad Entrega a Domicilio (Envío) ---
export const cotizacionEnvioDto = {
  metodoVenta: 'envio',
  metodoPago: 'efectivo',
  items: [{ idProducto: 1, cantidad: 2 }],
  direccionEnvio: 'Calle Falsa 123',
};

export const cotizacionEnvioCreadaMock = {
  idCotizacion: 81,
  idUsuario: 1,
  metodoVenta: 'envio',
  metodoPago: 'efectivo',
  subtotal: 60000,
  costoEnvio: 8000, // Con costo de envío
  total: 68000,
  direccionEnvio: 'Calle Falsa 123',
  estado: 'pendiente',
  fechaCreacion: new Date(),
  detalles: [
    {
      idDetalle: 2,
      idCotizacion: 81,
      idProducto: 1,
      cantidad: 2,
      precioUnitario: 30000,
      subtotal: 60000,
      producto: productoGrama,
    },
  ],
};
