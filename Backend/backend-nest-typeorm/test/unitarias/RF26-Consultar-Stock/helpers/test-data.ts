// test/unit/RF26-Consultar-Stock/helpers/test-data.ts

export const productoKukuyo = {
  id_producto: 10,
  nombre: 'Grama Kukuyo',
  estado: true,
};

export const productoJaponesa = {
  id_producto: 11,
  nombre: 'Grama Japonesa',
  estado: true,
};

// Datos del stock
export const stockKukuyo = {
  id_stock: 1,
  id_producto: 10,
  cantidad_actual: 150,
  producto: productoKukuyo,
};

export const stockJaponesa = {
  id_stock: 2,
  id_producto: 11,
  cantidad_actual: 80,
  producto: productoJaponesa,
};

// Array completo (CP-172, CP-176)
export const inventarioCompleto = [stockKukuyo, stockJaponesa];

// Para casos de error
export const productoInexistenteId = 999;
