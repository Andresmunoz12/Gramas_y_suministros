// test/unit/RF22-Actualizacion-Stock/helpers/test-data.ts

export const productoExistente = {
  id_producto: 1,
  nombre: 'Semilla Paspalum',
  descripcion: 'Semilla para clima cálido',
  estado: true,
  id_categoria: 1,
};

export const usuarioAdmin = {
  id_usuario: 1,
  nombre: 'Administrador Principal',
  rol: 1,
};

export const proveedorExistente = {
  id_proveedor: 1,
  nombre: 'Provedores Verdes S.A.',
};

export const stockInicial = {
  id_stock: 1,
  id_producto: 1,
  cantidad_actual: 50,
};

export const stockInsuficiente = {
  id_stock: 1,
  id_producto: 1,
  cantidad_actual: 5,
};

export const dtoEntrada = {
  id_producto: 1,
  id_usuario: 1,
  id_proveedor: 1,
  cantidad: 20, // Suma: 50 + 20 = 70
  detalle: 'Compra de lote nuevo',
  precio_unitario: 100,
  lote: 'L-12345',
  observaciones: 'Ninguna',
};

export const dtoSalidaValida = {
  id_producto: 1,
  id_usuario: 1,
  cantidad: 30, // Resta: 50 - 30 = 20
  detalle: 'Uso en proyecto X',
  destino: 'Cancha Estadio',
  motivo: 'Venta',
  observaciones: '',
};

export const dtoSalidaInsuficiente = {
  ...dtoSalidaValida,
  cantidad: 60, // Intento de sacar 60 cuando solo hay 50
};

export const dtoSalidaFuerzaNegativo = {
  ...dtoSalidaValida,
  cantidad: 51, // Intentaría dejar el stock en -1
};

export const movimientoCreado = {
  id_movimiento: 10,
  ...dtoEntrada,
  tipo: 'entrada',
};

export const entradaCreada = {
  id_entrada: 5,
  id_movimiento: 10,
  id_proveedor: 1,
  precio_unitario: 100,
  lote: 'L-12345',
};

export const salidaCreada = {
  id_salida: 6,
  id_movimiento: 10,
  destino: dtoSalidaValida.destino,
  motivo: dtoSalidaValida.motivo,
};
