// test/unit/RF27-Consultar-Historial/helpers/test-data.ts

export const productoBase = {
  id_producto: 1,
  nombre: 'Grama 50mm',
};

export const usuarioBase = {
  id_usuario: 1,
  nombre: 'Admin Juan',
};

export const entradaBase = {
  id_entrada: 10,
  precio_unitario: 50,
};

export const salidaBase = {
  id_salida: 20,
  motivo: 'Mantenimiento Semestral',
  destino: 'Cancha 5',
};

// ============================================
// Historial Simulado (CP-181)
// ============================================

export const historialConMovimientos = [
  {
    id_movimiento: 100,
    cantidad: 50,
    tipo: 'entrada',
    fecha: new Date('2026-08-10T10:00:00Z'),
    producto: productoBase,
    usuario: usuarioBase,
    entrada: entradaBase,
    salida: null,
  },
  {
    id_movimiento: 101,
    cantidad: 15,
    tipo: 'salida',
    fecha: new Date('2026-08-11T14:30:00Z'),
    producto: productoBase,
    usuario: usuarioBase,
    entrada: null,
    salida: salidaBase, // CP-181: Incluye motivo a través de salida
  },
];

export const historialVacio = [];
