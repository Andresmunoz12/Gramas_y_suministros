// test/unit/Gestion-Productos/Filtrar-Catalogo/helpers/test-data.ts

/**
 * DATOS DE PRUEBA PARA FILTRAR CATÁLOGO POR CATEGORÍA
 * CP-080, CP-082, CP-084
 */

// ✅ Categorías existentes
export const categorias = [
  {
    id_categoria: 1,
    nombre: 'Deportiva',
    descripcion: 'Productos para actividades deportivas',
  },
  {
    id_categoria: 2,
    nombre: 'Residencial',
    descripcion: 'Productos para hogar y jardín',
  },
  {
    id_categoria: 3,
    nombre: 'Comercial',
    descripcion: 'Productos para uso comercial',
  },
  {
    id_categoria: 4,
    nombre: 'Suministro',
    descripcion: 'Insumos y accesorios',
  },
];

// ✅ Productos por categoría
export const productosPorCategoria = {
  deportiva: [
    {
      id_producto: 1,
      nombre: 'Grama ProFut 50mm',
      marca: 'GreenTurf',
      peso: 2.75,
      material: 'Monofilamento',
      descripcion: 'Grama de alto rendimiento para canchas de fútbol',
      precio: 89900,
      altura: 5.0,
      estado: 1,
      categoria: { id_categoria: 1, nombre: 'Deportiva' },
      createdAt: new Date('2026-01-15'),
      updatedAt: new Date('2026-01-15'),
    },
    {
      id_producto: 2,
      nombre: 'Grama Sintética Premium',
      marca: 'Evergreen',
      peso: 2.5,
      material: 'Polietileno',
      descripcion: 'Grama de alta calidad para exteriores',
      precio: 45000,
      altura: 3.5,
      estado: 1,
      categoria: { id_categoria: 1, nombre: 'Deportiva' },
      createdAt: new Date('2026-02-20'),
      updatedAt: new Date('2026-02-20'),
    },
  ],
  residencial: [
    {
      id_producto: 3,
      nombre: 'Grama Residencial',
      marca: 'GreenLife',
      peso: 1.8,
      material: 'Polipropileno',
      descripcion: 'Grama suave para jardines residenciales',
      precio: 32000,
      altura: 2.0,
      estado: 1,
      categoria: { id_categoria: 2, nombre: 'Residencial' },
      createdAt: new Date('2026-03-10'),
      updatedAt: new Date('2026-03-10'),
    },
  ],
  comercial: [
    {
      id_producto: 4,
      nombre: 'Grama Comercial',
      marca: 'CityTurf',
      peso: 2.2,
      material: 'Polietileno',
      descripcion: 'Grama para espacios comerciales de alto tráfico',
      precio: 55000,
      altura: 4.0,
      estado: 1,
      categoria: { id_categoria: 3, nombre: 'Comercial' },
      createdAt: new Date('2026-01-25'),
      updatedAt: new Date('2026-01-25'),
    },
  ],
  suministro: [], // ❌ Categoría sin productos
};

// 📦 Categoría con productos
export const categoriaConProductos = {
  id_categoria: 1,
  nombre: 'Deportiva',
  descripcion: 'Productos para actividades deportivas',
  productos: productosPorCategoria.deportiva,
};

// 📦 Categoría sin productos
export const categoriaSinProductos = {
  id_categoria: 4,
  nombre: 'Suministro',
  descripcion: 'Insumos y accesorios',
  productos: [],
};

// 📦 Todas las categorías con sus productos
export const todasLasCategorias = [
  categoriaConProductos,
  {
    id_categoria: 2,
    nombre: 'Residencial',
    descripcion: 'Productos para hogar y jardín',
    productos: productosPorCategoria.residencial,
  },
  {
    id_categoria: 3,
    nombre: 'Comercial',
    descripcion: 'Productos para uso comercial',
    productos: productosPorCategoria.comercial,
  },
  categoriaSinProductos,
];

// 📝 Respuestas esperadas
export const mensajesFiltro = {
  categoriaValida: 'Productos filtrados por categoría correctamente',
  categoriaSinProductos: 'La categoría no tiene productos disponibles',
  tiempoRespuesta: 'El tiempo de respuesta es menor a 2 segundos',
  categoriaNoEncontrada: 'Categoría no encontrada',
};