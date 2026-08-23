// test/unit/RF31-Calculo-Automatico-Total/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-031: CÁLCULO AUTOMÁTICO DEL VALOR TOTAL de cotización
 * CP-209, CP-210, CP-211, CP-214
 */

export const usuarioExistente = {
  id_usuario: 1,
  nombre: 'Carlos',
  email: 'carlos.gomez@test.com',
};

// 📦 Productos con precios definidos
export const productoA = {
  id_producto: 1,
  nombre: 'Grama Premium',
  precio: 30000,
  estado: 1,
};

export const productoB = {
  id_producto: 2,
  nombre: 'Adhesivo Especial',
  precio: 15000,
  estado: 1,
};

// --- CP-209: Calcular valor total con varios productos ---
export const cotizacionVariosProductosDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [
    { idProducto: 1, cantidad: 2 }, // 2 * 30000 = 60000
    { idProducto: 2, cantidad: 3 }, // 3 * 15000 = 45000
  ], // Total = 105000
};

// --- CP-210: Recálculo automático al modificar cantidades ---
export const cotizacionCantidadInicialDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [
    { idProducto: 1, cantidad: 2 }, // 2 * 30000 = 60000
  ],
};

export const cotizacionCantidadModificadaDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [
    { idProducto: 1, cantidad: 5 }, // 5 * 30000 = 150000
  ],
};

// --- CP-211: Recálculo al agregar o eliminar productos ---
export const cotizacionUnSoloProductoDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [
    { idProducto: 1, cantidad: 2 }, // 2 * 30000 = 60000
  ],
};

export const cotizacionDosProductosDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [
    { idProducto: 1, cantidad: 2 }, // 2 * 30000 = 60000
    { idProducto: 2, cantidad: 1 }, // 1 * 15000 = 15000
  ], // Total = 75000
};

export const cotizacionProductoEliminadoDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [
    { idProducto: 2, cantidad: 1 }, // 1 * 15000 = 15000
  ],
};

// --- CP-214: Intentar enviar valores de total manualmente ---
export const cotizacionConTotalManualDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [
    { idProducto: 1, cantidad: 2 }, // 2 * 30000 = 60000
  ],
  total: 500, // ❌ Total manual inválido que el cliente intenta inyectar
  subtotal: 300, // ❌ Subtotal manual
};

// Mocks de cotizaciones guardadas
export const cotizacionCreadaVariosMock = {
  idCotizacion: 10,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 105000,
  costoEnvio: 0,
  total: 105000,
  estado: 'pendiente',
  fechaCreacion: new Date(),
};

export const cotizacionCreadaInicialMock = {
  idCotizacion: 11,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 60000,
  costoEnvio: 0,
  total: 60000,
  estado: 'pendiente',
  fechaCreacion: new Date(),
};

export const cotizacionCreadaModificadaMock = {
  idCotizacion: 11,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 150000,
  costoEnvio: 0,
  total: 150000,
  estado: 'pendiente',
  fechaCreacion: new Date(),
};

export const cotizacionCreadaDosProductosMock = {
  idCotizacion: 12,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 75000,
  costoEnvio: 0,
  total: 75000,
  estado: 'pendiente',
  fechaCreacion: new Date(),
};

export const cotizacionCreadaProductoEliminadoMock = {
  idCotizacion: 13,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 15000,
  costoEnvio: 0,
  total: 15000,
  estado: 'pendiente',
  fechaCreacion: new Date(),
};

export const mensajesError = {
  propiedadNoPermitida: 'property total should not exist',
};
