import { useEffect, useState, useMemo } from "react"; // 👈 Importar useMemo
import NavComponent from "../components/GlobalNav";
import ProductCard from "../components/ProductCard";
import "../styles/Catalogo.css";
import Footer from "../components/Footer";
import ProductosService from "../api/services/productos.service";

export default function Index() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [search, setSearch] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todas");

  const categorias = [
    "Todas",
    "Deportiva",
    "Residencial",
    "Comercial",
    "Decorativa",
    "Eventos",
    "Suministro",
    "Mascotas"
  ];

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setCargando(true);
        const data = await ProductosService.getAll();
        console.log("✅ Productos cargados:", data);
        setProductos(data);
      } catch (err) {
        console.error("❌ Error al obtener productos:", err);
        setProductos([]);
      } finally {
        setCargando(false);
      }
    };

    fetchProductos();
  }, []);

  const normalizar = (texto = "") =>
    texto
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/_/g, " ")
      .toUpperCase();

  // 👈 Usar useMemo para evitar recalcular en cada render
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideBusqueda = p.nombre
        .toLowerCase()
        .includes(search.toLowerCase());

      // 👈 CORREGIDO: Acceder a categoria.nombre para la comparación
      const nombreCategoria = p.categoria?.nombre || "";
      const coincideCategoria =
        categoriaActiva === "Todas" ||
        normalizar(nombreCategoria) === normalizar(categoriaActiva);

      return coincideBusqueda && coincideCategoria;
    });
  }, [productos, search, categoriaActiva]);

  return (
    <>
      <NavComponent />

      <div className="filtros-container">
        <div className="filtros-buttons">
          <div className="search-box">
            <img src="http://localhost:3000/uploads/icons/search.png" alt="buscar" />
            <input
              type="text"
              placeholder="Buscar productos..."
              onChange={(e) => setSearch(e.target.value)}
              value={search}
            />
          </div>

          {categorias.map((cat) => (
            <button
              key={cat}
              className={`filtro-btn ${categoriaActiva === cat ? "active" : ""}`}
              onClick={() => setCategoriaActiva(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="catalogo-container">
        {cargando ? (
          <div className="loading-container">
            <div className="loader"></div> {/* 👈 Spinner agregado */}
            <p>Cargando productos...</p>
          </div>
        ) : (
          <>
            <section className="productos-section">
              <h2>
                {categoriaActiva === "Todas"
                  ? "Todos los Productos"
                  : categoriaActiva}
                <span className="product-count"> ({productosFiltrados.length})</span>
              </h2>

              <div className="productos-grid">
                {productosFiltrados.length > 0 ? (
                  productosFiltrados.map((prod) => (
                    <ProductCard
                      key={`prod-${prod.id_producto}`} // 👈 Key más específica
                      producto={prod}
                    />
                  ))
                ) : (
                  <p className="no-products">No hay productos disponibles</p>
                )}
              </div>
            </section>

            <br /><br />
          </>
        )}

        <Footer />
      </div>
    </>
  );
}