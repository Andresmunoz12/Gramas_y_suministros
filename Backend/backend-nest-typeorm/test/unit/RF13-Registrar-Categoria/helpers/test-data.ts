// test/unit/Gestion-Productos/Registrar-Categoria/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA REGISTRAR CATEGORÍA DE PRODUCTO
 * CP-086 a CP-091
 */

// ✅ Categoría válida para registro exitoso
export const categoriaValida = {
  nombre: 'Jardinería',
  descripcion: 'Productos para jardinería y cuidado de plantas',
};

// ✅ Otra categoría válida
export const otraCategoriaValida = {
  nombre: 'Ferretería',
  descripcion: 'Herramientas y accesorios de ferretería',
};

// ❌ Categoría duplicada (mismo nombre que categoriaValida)
export const categoriaDuplicada = {
  nombre: 'Jardinería',
  descripcion: 'Productos para jardinería y cuidado de plantas',
};

// ❌ Categoría con nombre vacío
export const categoriaSinNombre = {
  nombre: '',
  descripcion: 'Descripción sin nombre',
};

// ❌ Categoría con descripción vacía
export const categoriaSinDescripcion = {
  nombre: 'SinDescripción',
  descripcion: '',
};

// ❌ Categoría con nombre muy corto
export const categoriaNombreCorto = {
  nombre: 'A',
  descripcion: 'Descripción de categoría',
};

// ❌ Categoría con caracteres especiales
export const categoriaCaracteresEspeciales = {
  nombre: 'Categoría!@#$%',
  descripcion: 'Descripción con caracteres especiales',
};

// 📦 Categoría existente en BD
export const categoriaExistente = {
  id_categoria: 1,
  nombre: 'Jardinería',
  descripcion: 'Productos para jardinería y cuidado de plantas',
  productos: [],
};

// 📦 Categoría creada exitosamente
export const categoriaCreada = {
  id_categoria: 5,
  nombre: 'Jardinería',
  descripcion: 'Productos para jardinería y cuidado de plantas',
};

// 📝 Mensajes de error esperados
export const mensajesCategoria = {
  registroExitoso: 'Categoría registrada exitosamente',
  duplicada: 'La categoría ya existe',
  camposObligatorios: 'Campos obligatorios vacíos',
  nombreRequerido: 'El nombre es requerido',
  descripcionRequerida: 'La descripción es requerida',
  accesoDenegado: 'Acceso denegado',
  almacenamientoExitoso: 'Información almacenada correctamente en la BD',
};