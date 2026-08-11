// test/unit/RF30-Generar-Cotizaciones/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA GENERAR COTIZACIONES
 * CP-202, CP-203, CP-204, CP-205, CP-206, CP-207
 */

// ✅ Usuario existente
export const usuarioExistente = {
  id_usuario: 1,
  nombre: 'Carlos',
  apellido: 'Gómez',
  email: 'carlos.gomez@test.com',
  id_rol: 2, // Cliente
};

// 📦 Productos existentes
export const productoGrama = {
  id_producto: 1,
  nombre: 'Grama Sintética Premium',
  precio: 50000,
  estado: 1, // Activo
};

export const productoAdhesivo = {
  id_producto: 2,
  nombre: 'Adhesivo Especial',
  precio: 15000,
  estado: 1, // Activo
};

export const productoInactivo = {
  id_producto: 3,
  nombre: 'Grama Económica Descontinuada',
  precio: 25000,
  estado: 0, // Inactivo
};

// ✅ Cotización exitosa con un producto (Físico - sin costo de envío)
export const cotizacionUnProductoDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [
    { idProducto: 1, cantidad: 5 }, // 5 * 50000 = 250000 subtotal, envio = 0, total = 250000
  ],
};

// ✅ Cotización exitosa con varios productos (Envío - con costo de envío de 8000)
export const cotizacionVariosProductosDto = {
  metodoVenta: 'envio',
  metodoPago: 'tarjeta_credito',
  direccionEnvio: 'Calle 123 # 45-67',
  items: [
    { idProducto: 1, cantidad: 2 }, // 2 * 50000 = 100000
    { idProducto: 2, cantidad: 3 }, // 3 * 15000 = 45000
  ], // subtotal = 145000, envio = 8000, total = 153000
};

// ❌ Cotización sin productos seleccionados
export const cotizacionSinProductosDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [],
};

// ❌ Cotización con cantidad negativa
export const cotizacionCantidadNegativaDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [
    { idProducto: 1, cantidad: -2 },
  ],
};

// ❌ Cotización con cantidad cero
export const cotizacionCantidadCeroDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [
    { idProducto: 1, cantidad: 0 },
  ],
};

// ❌ Cotización con producto inactivo
export const cotizacionProductoInactivoDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [
    { idProducto: 3, cantidad: 1 }, // Producto 3 está inactivo
  ],
};

// ❌ Cotización con producto inexistente
export const cotizacionProductoInexistenteDto = {
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  items: [
    { idProducto: 999, cantidad: 1 },
  ],
};

// 📝 Respuestas esperadas
export const cotizacionCreadaMock = {
  idCotizacion: 1,
  idUsuario: 1,
  metodoVenta: 'fisico',
  metodoPago: 'efectivo',
  subtotal: 250000,
  costoEnvio: 0,
  total: 250000,
  estado: 'pendiente',
  fechaCreacion: new Date('2026-08-11T12:00:00Z'),
};

export const cotizacionCreadaVariosMock = {
  idCotizacion: 2,
  idUsuario: 1,
  metodoVenta: 'envio',
  metodoPago: 'tarjeta_credito',
  direccionEnvio: 'Calle 123 # 45-67',
  subtotal: 145000,
  costoEnvio: 8000,
  total: 153000,
  estado: 'pendiente',
  fechaCreacion: new Date('2026-08-11T12:00:00Z'),
};

export const mensajesCotizacion = {
  usuarioNoEncontrado: 'Usuario no encontrado',
  productoNoEncontrado: 'Producto ID 999 no encontrado',
  productoInactivo: 'El producto "Grama Económica Descontinuada" está inactivo',
  cantidadInvalida: 'La cantidad debe ser mayor o igual a 1',
  sinProductos: 'Debe seleccionar al menos un producto',
};
