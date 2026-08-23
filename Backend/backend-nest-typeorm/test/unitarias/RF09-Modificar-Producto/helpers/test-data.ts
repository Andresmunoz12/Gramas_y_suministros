// test/unit/RF09-Modificar-Producto/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-009: MODIFICAR PRODUCTO
 * CP-060 a CP-066
 */

export const mockCategoria = {
  id_categoria: 1,
  nombre: 'kikuyo',
  descripcion: 'Categoría de prueba para gramas',
};

export const mockOriginalProduct = {
  id_producto: 101,
  nombre: 'Grama Sintética Antigua',
  marca: 'OldEver',
  peso: 2.0,
  material: 'Plástico',
  descripcion: 'Grama vieja',
  precio: 35000,
  altura: 2.5,
  id_categoria: 1,
  categoria: mockCategoria,
  estado: 1,
};

export const mockProductUpdateDto = {
  nombre: 'Grama Sintética Actualizada',
  marca: 'Evergreen',
  precio: 45000,
};

export const mockModifiedProductRecord = {
  id_producto: 101,
  nombre: 'Grama Sintética Actualizada',
  marca: 'Evergreen',
  peso: 2.0,
  material: 'Plástico',
  descripcion: 'Grama vieja',
  precio: 45000,
  altura: 2.5,
  id_categoria: 1,
  categoria: mockCategoria,
  estado: 1,
};
