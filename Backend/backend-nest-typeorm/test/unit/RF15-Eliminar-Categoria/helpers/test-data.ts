// test/unit/R15-Eliminar-Categoria/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA ELIMINAR CATEGORÍA DE PRODUCTO
 * CP-100, CP-101, CP-104
 */

// ✅ Categoría sin productos (se puede eliminar)
export const categoriaSinProductos = {
  id_categoria: 1,
  nombre: 'Eliminable',
  descripcion: 'Categoría sin productos asociados',
  productos: [],
};

// ❌ Categoría con productos (NO se puede eliminar)
export const categoriaConProductos = {
  id_categoria: 2,
  nombre: 'Deportiva',
  descripcion: 'Productos deportivos',
  productos: [
    { id_producto: 1, nombre: 'Grama ProFut' },
    { id_producto: 2, nombre: 'Grama Sintética' },
  ],
};

// 📦 Categoría que no existe
export const categoriaInexistente = {
  id_categoria: 999,
};

// 📝 Mensajes esperados
export const mensajesEliminar = {
  eliminacionExitosa: 'Categoría eliminada exitosamente',
  eliminacionConProductos: 'No se puede eliminar la categoría porque tiene productos vinculados',
  accesoDenegado: 'Acceso denegado',
  categoriaNoEncontrada: 'Categoría no encontrada',
};