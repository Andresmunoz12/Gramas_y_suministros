// test/unit/RF23-Registro-Fecha/helpers/test-data.ts

export const productoExistente = {
  id_producto: 1,
  nombre: 'Producto Fecha',
  estado: true,
};

export const usuarioAdmin = {
  id_usuario: 1,
  nombre: 'Admin Fecha',
  rol: 1,
};

export const proveedorExistente = {
  id_proveedor: 1,
  nombre: 'Proveedor Fecha',
};

// DTO para Entrada normal
export const dtoEntrada = {
  id_producto: 1,
  id_usuario: 1,
  id_proveedor: 1,
  cantidad: 20,
  detalle: 'Entrada sin fecha explícita',
  precio_unitario: 100,
  lote: 'L-12345',
  observaciones: 'Ninguna',
};

// DTO para Salida normal
export const dtoSalida = {
  id_producto: 1,
  id_usuario: 1,
  cantidad: 10,
  detalle: 'Salida sin fecha explícita',
  destino: 'Cancha',
  motivo: 'Venta',
  observaciones: '',
};

// Mocks de entidades (la base de datos se encarga de asignar la fecha)
// En las pruebas, interceptaremos lo que se manda a "save" o "create"
// para verificar que el backend NO inyecta una fecha, permitiendo que 
// el DEFAULT 'CURRENT_TIMESTAMP' de la base de datos haga su trabajo.

export const movimientoCreado = {
  id_movimiento: 1,
  id_producto: 1,
  id_usuario: 1,
  cantidad: 20,
  detalle: 'Generico',
  tipo: 'entrada',
  // La fecha vendría aquí tras ser guardada por BD, la simulamos para el retorno
  fecha: new Date(), 
};

export const stockInicial = {
  id_stock: 1,
  id_producto: 1,
  cantidad_actual: 50,
};
