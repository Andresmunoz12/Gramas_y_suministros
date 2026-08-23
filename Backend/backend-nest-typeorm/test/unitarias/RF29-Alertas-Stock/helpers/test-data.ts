// test/unit/RF29-Alertas-Stock/helpers/test-data.ts

export const productoBase = {
  nombre: 'Producto Test',
};

// CP-196: Igual al mínimo (Alerta: Stock bajo)
export const stockIgualMinimo = {
  id_producto: 1,
  producto: productoBase,
  cantidad_actual: 15,
  nivel_minimo: 15,
};

// CP-197: Inferior al mínimo (Alerta: Stock bajo)
export const stockInferiorMinimo = {
  id_producto: 2,
  producto: productoBase,
  cantidad_actual: 5,
  nivel_minimo: 20,
};

// CP-198: Superior al mínimo (Estado: Normal)
export const stockSuperiorMinimo = {
  id_producto: 3,
  producto: productoBase,
  cantidad_actual: 50,
  nivel_minimo: 10,
};

// CP-199: Sin configuración (0 y 0) (Estado: Sin stock)
export const stockSinConfiguracion = {
  id_producto: 4,
  producto: productoBase,
  cantidad_actual: 0,
  nivel_minimo: 0, // Por defecto
};

export const inventarioCombinado = [
  stockIgualMinimo,
  stockInferiorMinimo,
  stockSuperiorMinimo,
  stockSinConfiguracion,
];
