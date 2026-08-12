// test/unit/RF40-Exportar-Reportes-PDF-Excel/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA RF-040: EXPORTAR REPORTES A PDF Y EXCEL
 * CP-268, CP-269, CP-272, CP-273
 */

export const mockUsuarios = [
  { id_usuario: 1, nombre: 'Juan Perez', estado: 'activo', rol: { tipo: 'Cliente' } },
  { id_usuario: 2, nombre: 'Admin Master', estado: 'activo', rol: { tipo: 'Administrador' } },
];

export const mockProductos = [
  { id_producto: 1, nombre: 'Grama Premium', precio: 30000, estado: 1, categoria: { nombre: 'Gramas' } },
  { id_producto: 2, nombre: 'Suministro Abono', precio: 15000, estado: 1, categoria: { nombre: 'Suministros' } },
];

export const mockStockData = [
  { id_producto: 1, cantidad_actual: 100, nivel_minimo: 10 },
  { id_producto: 2, cantidad_actual: 50, nivel_minimo: 5 },
];

export const mockCotizaciones = [
  { idCotizacion: 100, total: 30000, estado: 'pagado', usuario: { nombre: 'Juan Perez' } },
  { idCotizacion: 101, total: 15000, estado: 'pendiente', usuario: { nombre: 'Juan Perez' } },
];
