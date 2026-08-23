// test/unit/R17-Actualizar-Proveedor/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA ACTUALIZAR PROVEEDOR
 * CP-113, CP-114, CP-115, CP-117, CP-118, CP-119
 */

// ✅ Proveedor existente
export const proveedorExistente = {
  id_proveedor: 1,
  nombre: 'Vivero El Rosal',
  contacto: 'Juan Pérez',
  telefono: '3001234567',
  email: 'contacto@vivero.com',
  direccion: 'Calle 10 #45-12, Bogotá',
  entradas: [],
};

// ✅ Otro proveedor existente (para pruebas de duplicado)
export const otroProveedorExistente = {
  id_proveedor: 2,
  nombre: 'Suministros Agrícolas',
  contacto: 'Maria López',
  telefono: '3109876543',
  email: 'maria@suministros.com',
  direccion: 'Av. 15 #23-45, Medellín',
  entradas: [],
};

// ✅ Datos válidos para actualizar
export const proveedorActualizadoValido = {
  nombre: 'Vivero El Rosal Actualizado',
  contacto: 'Carlos Gómez',
  telefono: '3119876543',
  email: 'carlos@vivero.com',
  direccion: 'Calle 20 #30-15, Bogotá',
};

// ✅ Actualizar solo nombre
export const actualizarNombre = {
  nombre: 'Nuevo Nombre Proveedor',
};

// ✅ Actualizar solo contacto
export const actualizarContacto = {
  contacto: 'Nuevo Contacto',
};

// ✅ Actualizar solo teléfono
export const actualizarTelefono = {
  telefono: '3105555555',
};

// ❌ Nombre vacío
export const proveedorNombreVacio = {
  nombre: '',
  contacto: 'Juan Pérez',
  telefono: '3001234567',
  email: 'contacto@vivero.com',
  direccion: 'Calle 10 #45-12, Bogotá',
};

// ❌ Nombre con números (no permitido)
export const proveedorNombreConNumeros = {
  nombre: 'Vivero 123',
  contacto: 'Juan Pérez',
  telefono: '3001234567',
  email: 'contacto@vivero.com',
  direccion: 'Calle 10 #45-12, Bogotá',
};

// ❌ Nombre con caracteres especiales
export const proveedorNombreConSimbolos = {
  nombre: 'Vivero@ElRosal',
  contacto: 'Juan Pérez',
  telefono: '3001234567',
  email: 'contacto@vivero.com',
  direccion: 'Calle 10 #45-12, Bogotá',
};

// ❌ Email inválido
export const proveedorEmailInvalido = {
  nombre: 'Vivero El Rosal',
  contacto: 'Juan Pérez',
  telefono: '3001234567',
  email: 'correo-invalido',
  direccion: 'Calle 10 #45-12, Bogotá',
};

// ❌ Teléfono corto
export const proveedorTelefonoCorto = {
  nombre: 'Vivero El Rosal',
  contacto: 'Juan Pérez',
  telefono: '123',
  email: 'contacto@vivero.com',
  direccion: 'Calle 10 #45-12, Bogotá',
};

// ❌ Teléfono con letras
export const proveedorTelefonoConLetras = {
  nombre: 'Vivero El Rosal',
  contacto: 'Juan Pérez',
  telefono: '300ABC4567',
  email: 'contacto@vivero.com',
  direccion: 'Calle 10 #45-12, Bogotá',
};

// ❌ Nombre corto
export const proveedorNombreCorto = {
  nombre: 'Ab',
  contacto: 'Juan Pérez',
  telefono: '3001234567',
  email: 'contacto@vivero.com',
  direccion: 'Calle 10 #45-12, Bogotá',
};

// ✅ Proveedor actualizado (mock)
export const proveedorActualizado = {
  id_proveedor: 1,
  nombre: 'Vivero El Rosal Actualizado',
  contacto: 'Carlos Gómez',
  telefono: '3119876543',
  email: 'carlos@vivero.com',
  direccion: 'Calle 20 #30-15, Bogotá',
  entradas: [],
};

// 📝 Mensajes esperados
export const mensajesActualizar = {
  actualizacionExitosa: 'Proveedor actualizado exitosamente',
  camposObligatorios: 'El nombre del proveedor es obligatorio',
  emailInvalido: 'El formato del email no es válido',
  telefonoCorto: 'El teléfono debe tener entre 7 y 20 dígitos',
  telefonoSoloNumeros: 'El teléfono solo puede contener números',
  nombreSoloLetras: 'El nombre solo puede contener letras y espacios',
  nombreLongitud: 'El nombre debe tener entre 3 y 150 caracteres',
  accesoDenegado: 'Acceso denegado',
  proveedorNoEncontrado: 'Proveedor no encontrado',
  duplicado: 'El registro ya se encuentra registrado',
};