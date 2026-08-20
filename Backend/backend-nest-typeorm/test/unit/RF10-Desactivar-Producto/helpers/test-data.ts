// test/unit/RF10-Desactivar-Producto/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-010: DESACTIVAR PRODUCTO
 * CP-067 a CP-073
 */

export const mockCategoria = {
  id_categoria: 1,
  nombre: 'kikuyo',
  descripcion: 'Categoría de prueba para gramas',
};

export const mockActiveProduct = {
  id_producto: 101,
  nombre: 'Grama Sintética Activa',
  marca: 'Evergreen',
  peso: 2.0,
  material: 'Plástico',
  descripcion: 'Grama activa',
  precio: 35000,
  altura: 2.5,
  id_categoria: 1,
  categoria: mockCategoria,
  estado: 1, // Activo
};

export const mockInactiveProduct = {
  id_producto: 102,
  nombre: 'Grama Sintética Inactiva',
  marca: 'Evergreen',
  peso: 2.0,
  material: 'Plástico',
  descripcion: 'Grama inactiva',
  precio: 35000,
  altura: 2.5,
  id_categoria: 1,
  categoria: mockCategoria,
  estado: 0, // Inactivo
};
