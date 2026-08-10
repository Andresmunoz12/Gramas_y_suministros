// test/unit/R18-Consultar-Proveedores/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA CONSULTAR LISTADO DE PROVEEDORES
 * CP-121, CP-124
 */

// ✅ Lista de proveedores existentes
export const listaProveedores = [
  {
    id_proveedor: 1,
    nombre: 'Vivero El Rosal',
    contacto: 'Juan Pérez',
    telefono: '3001234567',
    email: 'contacto@vivero.com',
    direccion: 'Calle 10 #45-12, Bogotá',
    entradas: [
      { id_movimiento: 1, fecha: '2026-01-15' },
      { id_movimiento: 2, fecha: '2026-02-20' },
    ],
  },
  {
    id_proveedor: 2,
    nombre: 'Suministros Agrícolas',
    contacto: 'Maria López',
    telefono: '3109876543',
    email: 'maria@suministros.com',
    direccion: 'Av. 15 #23-45, Medellín',
    entradas: [
      { id_movimiento: 3, fecha: '2026-03-10' },
    ],
  },
  {
    id_proveedor: 3,
    nombre: 'Fertilizantes La Cosecha',
    contacto: 'Carlos Gómez',
    telefono: '3155555555',
    email: 'carlos@cosecha.com',
    direccion: 'Calle 5 #10-20, Cali',
    entradas: [],
  },
];

// ✅ Proveedor individual
export const proveedorIndividual = {
  id_proveedor: 1,
  nombre: 'Vivero El Rosal',
  contacto: 'Juan Pérez',
  telefono: '3001234567',
  email: 'contacto@vivero.com',
  direccion: 'Calle 10 #45-12, Bogotá',
  entradas: [
    { id_movimiento: 1, fecha: '2026-01-15' },
    { id_movimiento: 2, fecha: '2026-02-20' },
  ],
};

// 📦 Lista vacía (sin proveedores)
export const listaVacia = [];

// 📝 Mensajes esperados
export const mensajesConsultar = {
  consultaExitosa: 'Listado de proveedores obtenido correctamente',
  sinProveedores: 'No hay proveedores registrados',
  accesoDenegado: 'Acceso denegado',
};