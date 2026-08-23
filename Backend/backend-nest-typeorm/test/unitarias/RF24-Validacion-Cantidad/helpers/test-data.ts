// test/unit/RF24-Validacion-Cantidad/helpers/test-data.ts

export const productoExistente = {
  id_producto: 1,
  nombre: 'Grama Sintética 10mm',
  estado: true,
};

export const usuarioAdmin = {
  id_usuario: 1,
  nombre: 'Admin de Cantidades',
  rol: 1,
};

export const proveedorExistente = {
  id_proveedor: 1,
  nombre: 'Proveedor Validado',
};

export const stockInicial = {
  id_stock: 1,
  id_producto: 1,
  cantidad_actual: 100, // Stock holgado para pruebas
};

// ============================================
// DTOs para Entradas
// ============================================

export const dtoEntradaValida = {
  id_producto: 1,
  id_usuario: 1,
  id_proveedor: 1,
  cantidad: 50, // CP-159: Cantidad válida
  detalle: 'Entrada válida',
  precio_unitario: 100,
  lote: 'L-VALIDO',
  observaciones: 'Ninguna',
};

export const dtoEntradaCero = {
  ...dtoEntradaValida,
  cantidad: 0, // CP-160
};

export const dtoEntradaNegativa = {
  ...dtoEntradaValida,
  cantidad: -20, // CP-161
};

// ============================================
// DTOs para Salidas
// ============================================

export const dtoSalidaValida = {
  id_producto: 1,
  id_usuario: 1,
  cantidad: 20, // CP-159: Cantidad válida
  detalle: 'Salida válida',
  destino: 'Obra 1',
  motivo: 'Consumo',
  observaciones: '',
};

export const dtoSalidaCero = {
  ...dtoSalidaValida,
  cantidad: 0, // CP-160
};

export const dtoSalidaNegativa = {
  ...dtoSalidaValida,
  cantidad: -10, // CP-161
};

export const dtoSalidaMayorAlStock = {
  ...dtoSalidaValida,
  cantidad: 150, // CP-162: Mayor al stock inicial (100)
};

// Mocks de retorno
export const movimientoCreado = {
  id_movimiento: 99,
  ...dtoEntradaValida,
  tipo: 'entrada',
};

export const entradaCreada = {
  id_entrada: 99,
  id_movimiento: 99,
  id_proveedor: 1,
  precio_unitario: 100,
};
