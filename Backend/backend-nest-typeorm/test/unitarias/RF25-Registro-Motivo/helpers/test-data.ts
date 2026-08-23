// test/unit/RF25-Registro-Motivo/helpers/test-data.ts

export const productoExistente = {
  id_producto: 1,
  nombre: 'Producto Motivo',
  estado: true,
};

export const usuarioAdmin = {
  id_usuario: 1,
  nombre: 'Admin Motivo',
  rol: 1,
};

export const stockInicial = {
  id_stock: 1,
  id_producto: 1,
  cantidad_actual: 50,
};

// ============================================
// DTOs para Salidas
// ============================================

export const dtoSalidaMotivoValido = {
  id_producto: 1,
  id_usuario: 1,
  cantidad: 10,
  detalle: 'Salida genérica',
  destino: 'Cancha 1',
  motivo: 'Mantenimiento preventivo', // CP-166: Motivo válido
  observaciones: 'Firma de recibido',
};

export const dtoSalidaSinMotivo = {
  ...dtoSalidaMotivoValido,
  motivo: '', // CP-167: Sin especificar motivo (vacío)
};

export const dtoSalidaMotivoInvalido = {
  ...dtoSalidaMotivoValido,
  motivo: 'A', // CP-168: Motivo demasiado corto o formato inválido (simularemos que es inválido)
};

// Mocks de retorno
export const movimientoCreado = {
  id_movimiento: 25,
  id_producto: 1,
  id_usuario: 1,
  cantidad: 10,
  detalle: 'Salida genérica',
  tipo: 'salida',
};

export const salidaCreada = {
  id_salida: 25,
  id_movimiento: 25,
  destino: 'Cancha 1',
  motivo: 'Mantenimiento preventivo',
  observaciones: 'Firma de recibido',
};
