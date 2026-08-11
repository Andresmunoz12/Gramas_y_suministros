// test/unit/RF35-Cambio-Estado-Automatico-Pago/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-035: CAMBIO DE ESTADO AUTOMÁTICO POR PAGO
 * CP-233, CP-236
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

// --- CP-233: Cotización nueva genérica ---
export const cotizacionNuevaDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [{ idProducto: 1, cantidad: 2 }],
};

export const cotizacionNuevaMock = {
  idCotizacion: 90,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 60000,
  costoEnvio: 0,
  total: 60000,
  estado: 'pendiente', // Debe ser pendiente por defecto
  fechaCreacion: new Date(),
  detalles: [
    {
      idDetalle: 1,
      idCotizacion: 90,
      idProducto: 1,
      cantidad: 2,
      precioUnitario: 30000,
      subtotal: 60000,
      producto: productoGrama,
    },
  ],
};

// --- CP-236: Cotización con Entrega a Domicilio y Pago Efectivo ---
export const cotizacionDomicilioEfectivoDto = {
  metodoVenta: 'envio',
  metodoPago: 'efectivo', // Diferente a tarjeta (tarjeta_debito / tarjeta_credito)
  items: [{ idProducto: 1, cantidad: 2 }],
  direccionEnvio: 'Calle Falsa 123',
};

export const cotizacionDomicilioEfectivoMock = {
  idCotizacion: 91,
  idUsuario: 1,
  metodoVenta: 'envio',
  metodoPago: 'efectivo',
  subtotal: 60000,
  costoEnvio: 8000,
  total: 68000,
  direccionEnvio: 'Calle Falsa 123',
  estado: 'pendiente', // Permanece en pendiente
  fechaCreacion: new Date(),
  detalles: [
    {
      idDetalle: 2,
      idCotizacion: 91,
      idProducto: 1,
      cantidad: 2,
      precioUnitario: 30000,
      subtotal: 60000,
      producto: productoGrama,
    },
  ],
};
