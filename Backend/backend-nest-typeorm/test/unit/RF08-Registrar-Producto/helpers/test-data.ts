// test/unit/RF08-Registrar-Producto/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-008: REGISTRAR PRODUCTO
 * CP-052 a CP-059
 */

export const mockCategoria = {
  id_categoria: 1,
  nombre: 'kikuyo',
  descripcion: 'Categoría de prueba para gramas',
};

export const mockProductCreationDto = {
  nombre: 'Grama Sintética Evergreen',
  marca: 'Evergreen',
  peso: 2.5,
  material: 'Polietileno',
  descripcion: 'Grama de alta calidad',
  precio: 45000,
  altura: 3.5,
  id_categoria: 1,
};

export const mockProductSavedRecord = {
  id_producto: 101,
  nombre: 'Grama Sintética Evergreen',
  marca: 'Evergreen',
  peso: 2.5,
  material: 'Polietileno',
  descripcion: 'Grama de alta calidad',
  precio: 45000,
  altura: 3.5,
  id_categoria: 1,
  categoria: mockCategoria,
  estado: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};
