// test/unit/RF21-Registrar-Salidas/helpers/test-data.ts

export const productoExistente = {
  id_producto: 1,
  nombre: 'Grama Sintética 8mm',
  descripcion: 'Grama para paisajismo',
  estado: true,
  id_categoria: 1,
};

export const productoInactivo = {
  ...productoExistente,
  id_producto: 2,
  estado: false,
};

export const usuarioAdmin = {
  id_usuario: 1,
  nombre: 'Admin',
  rol: 1, // 1 = Admin
};

export const usuarioNormal = {
  id_usuario: 2,
  nombre: 'Empleado',
  rol: 2,
};

export const stockInicial = {
  id_stock: 1,
  id_producto: 1,
  cantidad_actual: 50, // Suficiente para la salida
};

export const stockInsuficiente = {
  id_stock: 2,
  id_producto: 1,
  cantidad_actual: 5, // Insuficiente para una salida de 10
};

export const salidaValida = {
  id_producto: 1,
  id_usuario: 1,
  cantidad: 10,
  detalle: 'Salida para proyecto X',
  destino: 'Cancha Norte',
  motivo: 'Venta',
  observaciones: 'Ninguna',
};

export const salidaProductoInexistente = {
  ...salidaValida,
  id_producto: 999, // Inexistente
};

export const salidaProductoInactivo = {
  ...salidaValida,
  id_producto: 2, // Inactivo
};

export const salidaStockInsuficiente = {
  ...salidaValida,
  cantidad: 100, // Mayor al stockInicial (50)
};

export const salidaCantidadNegativa = {
  ...salidaValida,
  cantidad: -5,
};

export const salidaCantidadCero = {
  ...salidaValida,
  cantidad: 0,
};

export const movimientoCreado = {
  id_movimiento: 1,
  id_producto: salidaValida.id_producto,
  id_usuario: salidaValida.id_usuario,
  cantidad: salidaValida.cantidad,
  detalle: salidaValida.detalle,
  tipo: 'salida',
  fecha: new Date(),
};

export const salidaCreada = {
  id_salida: 1,
  id_movimiento: 1,
  destino: salidaValida.destino,
  motivo: salidaValida.motivo,
  observaciones: salidaValida.observaciones,
};
