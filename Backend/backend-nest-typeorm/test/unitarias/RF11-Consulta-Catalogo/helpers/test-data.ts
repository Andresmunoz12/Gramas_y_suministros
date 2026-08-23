// test/unit/Gestion-Productos/Consultar-Catalogo/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA CONSULTAR CATÁLOGO DE PRODUCTOS
 * CP-074 a CP-079
 */

// ✅ Productos activos (estado = 1)
export const productosActivos = [
  {
    id_producto: 1,
    nombre: 'Grama Sintética Premium',
    marca: 'Evergreen',
    peso: 2.5,
    material: 'Polietileno',
    descripcion: 'Grama de alta calidad para exteriores',
    precio: 45000,
    altura: 3.5,
    estado: 1,
    categoria: { id_categoria: 1, nombre: 'Deportiva' },
    createdAt: new Date('2026-01-15'),
    updatedAt: new Date('2026-01-15'),
  },
  {
    id_producto: 2,
    nombre: 'Grama Residencial',
    marca: 'GreenLife',
    peso: 1.8,
    material: 'Polipropileno',
    descripcion: 'Grama suave para jardines residenciales',
    precio: 32000,
    altura: 2.0,
    estado: 1,
    categoria: { id_categoria: 2, nombre: 'Residencial' },
    createdAt: new Date('2026-02-20'),
    updatedAt: new Date('2026-02-20'),
  },
  {
    id_producto: 3,
    nombre: 'Grama ProFut 50mm',
    marca: 'GreenTurf',
    peso: 2.75,
    material: 'Monofilamento',
    descripcion: 'Grama de alto rendimiento para canchas de fútbol',
    precio: 89900,
    altura: 5.0,
    estado: 1,
    categoria: { id_categoria: 1, nombre: 'Deportiva' },
    createdAt: new Date('2026-03-10'),
    updatedAt: new Date('2026-03-10'),
  },
];

// ❌ Productos inactivos (estado = 0)
export const productosInactivos = [
  {
    id_producto: 4,
    nombre: 'Grama Antigua',
    marca: 'OldGrass',
    peso: 2.0,
    material: 'Nylon',
    descripcion: 'Producto descontinuado',
    precio: 15000,
    altura: 2.5,
    estado: 0,
    categoria: { id_categoria: 3, nombre: 'Comercial' },
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2025-12-01'),
  },
  {
    id_producto: 5,
    nombre: 'Grama Desactivada',
    marca: 'Discontinued',
    peso: 1.5,
    material: 'Polietileno',
    descripcion: 'Producto inactivo',
    precio: 10000,
    altura: 1.5,
    estado: 0,
    categoria: { id_categoria: 2, nombre: 'Residencial' },
    createdAt: new Date('2025-11-15'),
    updatedAt: new Date('2025-11-15'),
  },
];

// 📦 Todos los productos (activos + inactivos)
export const todosLosProductos = [...productosActivos, ...productosInactivos];

// 🎯 Producto individual para detalles
export const productoDetalle = {
  id_producto: 1,
  nombre: 'Grama Sintética Premium',
  marca: 'Evergreen',
  peso: 2.5,
  material: 'Polietileno',
  descripcion: 'Grama de alta calidad para exteriores',
  precio: 45000,
  altura: 3.5,
  estado: 1,
  categoria: { id_categoria: 1, nombre: 'Deportiva' },
  imagen: 'grama-premium.jpg',
  createdAt: new Date('2026-01-15'),
  updatedAt: new Date('2026-01-15'),
};

// 📝 Respuestas esperadas
export const mensajesCatalogo = {
  catalogoExitoso: 'Catálogo cargado exitosamente',
  sinProductos: 'No hay productos disponibles',
  soloActivos: 'Solo se muestran productos activos',
  detalleProducto: 'Información completa del producto',
  tiempoCarga: 'El tiempo de carga es menor a 3 segundos',
  conexionBD: 'Conexión con la base de datos exitosa',
};