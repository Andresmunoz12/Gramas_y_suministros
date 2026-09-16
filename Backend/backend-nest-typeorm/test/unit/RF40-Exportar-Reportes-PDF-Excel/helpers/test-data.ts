// test/unit/RF40-Exportar-Reportes-PDF-Excel/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-040: EXPORTAR REPORTES A PDF Y EXCEL
 * CP-268, CP-269, CP-272, CP-273
 */

export const mockUsuarios = [
  {
    id_usuario: 1,
    nombre: 'Juan',
    apellido: 'Perez',
    email: 'juan@test.com',
    estado: 'activo',
    rol: { tipo: 'Cliente' },
    createdAt: new Date('2026-01-15'),
    ultimoLogin: new Date('2026-08-10'),
  },
  {
    id_usuario: 2,
    nombre: 'Admin',
    apellido: 'Master',
    email: 'admin@test.com',
    estado: 'activo',
    rol: { tipo: 'Administrador' },
    createdAt: new Date('2026-01-10'),
    ultimoLogin: new Date('2026-08-11'),
  },
];

export const mockProductos = [
  {
    id_producto: 1,
    nombre: 'Grama Premium',
    precio: 30000,
    estado: 1,
    marca: 'Evergreen',
    categoria: { nombre: 'Gramas' },
    createdAt: new Date('2026-02-01'),
  },
  {
    id_producto: 2,
    nombre: 'Suministro Abono',
    precio: 15000,
    estado: 1,
    marca: 'GreenLife',
    categoria: { nombre: 'Suministros' },
    createdAt: new Date('2026-02-15'),
  },
];

export const mockStockData = [
  {
    id_producto: 1,
    cantidad_actual: 100,
    nivel_minimo: 10,
    producto: { nombre: 'Grama Premium' },
    ultima_actualizacion: new Date('2026-08-01'),
  },
  {
    id_producto: 2,
    cantidad_actual: 50,
    nivel_minimo: 5,
    producto: { nombre: 'Suministro Abono' },
    ultima_actualizacion: new Date('2026-08-02'),
  },
];

export const mockCotizaciones = [
  {
    idCotizacion: 100,
    total: 30000,
    estado: 'pagado',
    metodoVenta: 'fisico',
    usuario: { nombre: 'Juan Perez', email: 'juan@test.com' },
    detalles: [{ idDetalle: 1 }],
    fechaCreacion: new Date('2026-08-01'),
  },
  {
    idCotizacion: 101,
    total: 15000,
    estado: 'pendiente',
    metodoVenta: 'envio',
    usuario: { nombre: 'Juan Perez', email: 'juan@test.com' },
    detalles: [{ idDetalle: 2 }],
    fechaCreacion: new Date('2026-08-05'),
  },
];

// ✅ Movimientos mock
export const mockMovimientos = [
  {
    id_movimiento: 1,
    tipo: 'entrada',
    cantidad: 10,
    producto: { nombre: 'Grama Premium' },
    usuario: { nombre: 'Admin Master' },
    detalle: 'Compra a proveedor',
    fecha: new Date('2026-08-01'),
  },
  {
    id_movimiento: 2,
    tipo: 'salida',
    cantidad: 5,
    producto: { nombre: 'Suministro Abono' },
    usuario: { nombre: 'Juan Perez' },
    detalle: 'Venta a cliente',
    fecha: new Date('2026-08-02'),
  },
];