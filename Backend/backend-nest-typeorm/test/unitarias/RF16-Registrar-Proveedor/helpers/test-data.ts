// test/unit/R16-Registrar-Proveedor/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA REGISTRAR PROVEEDOR
 * CP-106, CP-108, CP-109, CP-110, CP-111
 */

// ✅ Proveedor válido para registro exitoso
export const proveedorValido = {
  nombre: 'Vivero El Rosal',
  contacto: 'Juan Pérez',
  telefono: '3001234567',
  email: 'contacto@vivero.com',
  direccion: 'Calle 10 #45-12, Bogotá',
};

// ✅ Otro proveedor válido
export const otroProveedorValido = {
  nombre: 'Suministros Agrícolas',
  contacto: 'Maria López',
  telefono: '3109876543',
  email: 'maria@suministros.com',
  direccion: 'Av. 15 #23-45, Medellín',
};

// ❌ Proveedor sin nombre
export const proveedorSinNombre = {
  nombre: '',
  contacto: 'Juan Pérez',
  telefono: '3001234567',
  email: 'contacto@vivero.com',
  direccion: 'Calle 10 #45-12, Bogotá',
};

// ❌ Proveedor sin contacto
export const proveedorSinContacto = {
  nombre: 'Vivero El Rosal',
  contacto: '',
  telefono: '3001234567',
  email: 'contacto@vivero.com',
  direccion: 'Calle 10 #45-12, Bogotá',
};

// ❌ Proveedor con email inválido
export const proveedorEmailInvalido = {
  nombre: 'Vivero El Rosal',
  contacto: 'Juan Pérez',
  telefono: '3001234567',
  email: 'correo-invalido',
  direccion: 'Calle 10 #45-12, Bogotá',
};

// ❌ Proveedor con teléfono corto
export const proveedorTelefonoCorto = {
  nombre: 'Vivero El Rosal',
  contacto: 'Juan Pérez',
  telefono: '123',
  email: 'contacto@vivero.com',
  direccion: 'Calle 10 #45-12, Bogotá',
};

// ✅ Proveedor registrado (para mock)
export const proveedorRegistrado = {
  id_proveedor: 1,
  ...proveedorValido,
};

// 📝 Mensajes esperados
export const mensajesProveedor = {
  registroExitoso: 'Proveedor registrado exitosamente',
  camposObligatorios: 'Campos obligatorios vacíos',
  emailInvalido: 'El formato del email no es válido',
  telefonoCorto: 'El teléfono debe tener al menos 7 caracteres',
  accesoDenegado: 'Acceso denegado',
  almacenamientoExitoso: 'Información almacenada correctamente en la BD',
};