// test/unit/R19-Eliminar-Proveedor/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA ELIMINAR PROVEEDOR
 * CP-127, CP-128, CP-131
 */

// ✅ Proveedor sin entradas asociadas (se puede eliminar)
export const proveedorSinEntradas = {
  id_proveedor: 1,
  nombre: 'Proveedor Sin Entradas',
  contacto: 'Juan Pérez',
  telefono: '3001234567',
  email: 'contacto@test.com',
  direccion: 'Calle 10 #45-12, Bogotá',
  entradas: [],
};

// ❌ Proveedor con entradas asociadas (NO se puede eliminar)
export const proveedorConEntradas = {
  id_proveedor: 2,
  nombre: 'Proveedor Con Entradas',
  contacto: 'Maria López',
  telefono: '3109876543',
  email: 'maria@test.com',
  direccion: 'Av. 15 #23-45, Medellín',
  entradas: [
    { id_movimiento: 1, fecha: '2026-01-15' },
    { id_movimiento: 2, fecha: '2026-02-20' },
  ],
};

// ❌ Proveedor con muchas entradas
export const proveedorConMuchasEntradas = {
  id_proveedor: 3,
  nombre: 'Proveedor Con Muchas Entradas',
  contacto: 'Carlos Gómez',
  telefono: '3155555555',
  email: 'carlos@test.com',
  direccion: 'Calle 5 #10-20, Cali',
  entradas: [
    { id_movimiento: 3, fecha: '2026-01-10' },
    { id_movimiento: 4, fecha: '2026-01-20' },
    { id_movimiento: 5, fecha: '2026-02-01' },
    { id_movimiento: 6, fecha: '2026-02-15' },
  ],
};

// ✅ Proveedor eliminado (mock)
export const proveedorEliminado = {
  id_proveedor: 1,
  nombre: 'Proveedor Sin Entradas',
  contacto: 'Juan Pérez',
  telefono: '3001234567',
  email: 'contacto@test.com',
  direccion: 'Calle 10 #45-12, Bogotá',
  entradas: [],
};

// 📝 Mensajes esperados
export const mensajesEliminar = {
  eliminacionExitosa: 'Proveedor eliminado exitosamente',
  eliminacionConEntradas: 'No se puede eliminar el proveedor porque tiene entradas asociadas.',
  accesoDenegado: 'Acceso denegado: Se requiere rol de Administrador',
  proveedorNoEncontrado: 'Proveedor no encontrado',
};