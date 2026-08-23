// test/unit/Gestion-Productos/Modificar-Categoria/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA MODIFICAR CATEGORÍA DE PRODUCTO
 * CP-093, CP-094, CP-095, CP-097
 */

// ✅ Categoría existente en la base de datos
export const categoriaExistente = {
  id_categoria: 1,
  nombre: 'Deportiva',
  descripcion: 'Productos para actividades deportivas',
};

// ✅ Otra categoría existente (para pruebas de duplicado)
export const otraCategoriaExistente = {
  id_categoria: 2,
  nombre: 'Residencial',
  descripcion: 'Productos para el hogar',
};

// ✅ Datos válidos para modificar categoría
export const categoriaModificadaValida = {
  nombre: 'Deportiva Premium',
  descripcion: 'Productos deportivos de alta calidad',
};

// ✅ Datos válidos para modificar solo el nombre
export const categoriaModificadaNombre = {
  nombre: 'Deportiva Élite',
  descripcion: 'Productos para actividades deportivas',
};

// ✅ Datos válidos para modificar solo la descripción
export const categoriaModificadaDescripcion = {
  nombre: 'Deportiva',
  descripcion: 'Productos deportivos actualizados y mejorados',
};

// ❌ Nombre duplicado (coincide con otraCategoriaExistente)
export const categoriaNombreDuplicado = {
  nombre: 'Residencial',
  descripcion: 'Productos deportivos de alta calidad',
};

// ❌ Nombre vacío
export const categoriaNombreVacio = {
  nombre: '',
  descripcion: 'Productos deportivos de alta calidad',
};

// ❌ Descripción vacía
export const categoriaDescripcionVacia = {
  nombre: 'Deportiva Premium',
  descripcion: '',
};

// ❌ Nombre muy corto
export const categoriaNombreCorto = {
  nombre: 'A',
  descripcion: 'Productos deportivos de alta calidad',
};

// ❌ Ambos campos vacíos
export const categoriaCamposVacios = {
  nombre: '',
  descripcion: '',
};

// 📝 Mensajes de error esperados
export const mensajesModificar = {
  modificacionExitosa: 'Categoría modificada exitosamente',
  nombreDuplicado: 'El registro ya se encuentra registrado',
  camposObligatorios: 'Campos obligatorios vacíos',
  nombreRequerido: 'El nombre es requerido',
  descripcionRequerida: 'La descripción es requerida',
  accesoDenegado: 'Acceso denegado',
  categoriaNoEncontrada: 'Categoría no encontrada',
};