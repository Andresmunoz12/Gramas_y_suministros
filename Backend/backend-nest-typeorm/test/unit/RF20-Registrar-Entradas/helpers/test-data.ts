// test/unit/R20-Registrar-Entrada/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA REGISTRAR ENTRADA DE INVENTARIO
 * CP-133, CP-136, CP-137, CP-138
 */

// ✅ Entrada válida
export const entradaValida = {
  id_producto: 1,
  id_usuario: 1,
  cantidad: 100,
  detalle: 'Compra de stock mensual',
  id_proveedor: 1,
  precio_unitario: 15.50,
  lote: 'LOTE-2024-ABC',
  observaciones: 'Llegó con empaque sellado',
};

// ✅ Entrada sin campos opcionales
export const entradaMinima = {
  id_producto: 1,
  id_usuario: 1,
  cantidad: 50,
  id_proveedor: 1,
};

// ❌ Entrada con cantidad negativa
export const entradaCantidadNegativa = {
  id_producto: 1,
  id_usuario: 1,
  cantidad: -10,
  id_proveedor: 1,
};

// ❌ Entrada con cantidad cero
export const entradaCantidadCero = {
  id_producto: 1,
  id_usuario: 1,
  cantidad: 0,
  id_proveedor: 1,
};

// ❌ Entrada con producto inexistente
export const entradaProductoInexistente = {
  id_producto: 999,
  id_usuario: 1,
  cantidad: 100,
  id_proveedor: 1,
};

// ❌ Entrada con usuario inexistente
export const entradaUsuarioInexistente = {
  id_producto: 1,
  id_usuario: 999,
  cantidad: 100,
  id_proveedor: 1,
};

// ❌ Entrada con proveedor inexistente
export const entradaProveedorInexistente = {
  id_producto: 1,
  id_usuario: 1,
  cantidad: 100,
  id_proveedor: 999,
};

// ✅ Stock inicial
export const stockInicial = {
  id_producto: 1,
  cantidad_actual: 50,
  nivel_minimo: 10,
  ultima_actualizacion: new Date(),
};

// ✅ Stock después de entrada (100 unidades)
export const stockDespuesEntrada = {
  id_producto: 1,
  cantidad_actual: 150,
  nivel_minimo: 10,
  ultima_actualizacion: new Date(),
};

// ✅ Movimiento creado
export const movimientoCreado = {
  id_movimiento: 1,
  id_producto: 1,
  id_usuario: 1,
  cantidad: 100,
  detalle: 'Compra de stock mensual',
  tipo: 'entrada',
  fecha: new Date(),
};

// ✅ Entrada creada
export const entradaCreada = {
  id_movimiento: 1,
  id_proveedor: 1,
  precio_unitario: 15.50,
  lote: 'LOTE-2024-ABC',
  observaciones: 'Llegó con empaque sellado',
};

// 📦 Producto existente
export const productoExistente = {
  id_producto: 1,
  nombre: 'Grama Sintética Premium',
  estado: 1,
};

// 👤 Usuario existente
export const usuarioExistente = {
  id_usuario: 1,
  nombre: 'Admin',
  email: 'admin@gramas.com',
  id_rol: 1,
};

// 🏢 Proveedor existente
export const proveedorExistente = {
  id_proveedor: 1,
  nombre: 'Vivero El Rosal',
  contacto: 'Juan Pérez',
};

// 📝 Mensajes esperados
export const mensajesEntrada = {
  registroExitoso: 'Entrada de grama registrada exitosamente',
  cantidadInvalida: 'La cantidad debe ser un número positivo',
  productoNoEncontrado: 'Producto no encontrado',
  usuarioNoEncontrado: 'Usuario no encontrado',
  proveedorNoEncontrado: 'Proveedor no encontrado',
  accesoDenegado: 'Acceso denegado: Se requiere rol de Administrador',
};