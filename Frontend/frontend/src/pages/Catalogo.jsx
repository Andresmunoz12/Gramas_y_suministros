import { useEffect, useState } from "react";
import NavComponent from "../components/GlobalNav";
import "../styles/Catalogo.css";
import GlobalButton from "../components/GlobalButton";

export default function Index() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [search, setSearch] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("TODAS");

  const categorias = [
    "TODAS",
    "GRAMA SINTÉTICA",
    "GRAMA NATURAL",
    "ABONOS",
    "HERRAMIENTAS",
    "ACCESORIOS"
  ];

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        let data = [];

        try {
          const res = await fetch("http://localhost:3001/api/productos");

          if (res.ok) {
            data = await res.json();
          }
        } catch (err) {
          console.error("Error al obtener productos:", err);
        }

        setProductos(data);
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

  const productosFiltrados = productos.filter((p) => {
    const coincideBusqueda = p.nombre
      .toLowerCase()
      .includes(search.toLowerCase());

    const coincideCategoria =
      categoriaActiva === "TODAS" ||
      normalizar(p.categoria) === normalizar(categoriaActiva);

    return coincideBusqueda && coincideCategoria;
  });

  const rawUsuario = localStorage.getItem("usuario");
  const isLoggedIn = !!rawUsuario;

  const handleComprar = async (id_producto) => {
    if (!isLoggedIn) {
      alert("Debes iniciar sesión para comprar");
      return;
    }

    const usuario = JSON.parse(rawUsuario);
    try {
      const res = await fetch("http://localhost:3001/api/usuarios/comprar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_usuario: usuario.id_usuario,
          id_producto: id_producto,
          cantidad: 1
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ " + data.message);
        window.location.reload(); // Recargar para ver el descuento en stock
      } else {
        alert("❌ " + data.message);
      }
    } catch (err) {
      alert("❌ Error al conectar con el servidor.");
    }
  };





  return (
    <div className="app">
      <NavComponent />

      <main className="catalog-main">
        {cargando ? (
          <h2 className="catalog-title">Cargando productos...</h2>
        ) : (
          <>
            <h2 className="catalog-title"> {categoriaActiva === "TODAS" ? "Todos los Productos" : categoriaActiva}{" "} <span>({productosFiltrados.length})</span> </h2>

            <div className="category-tabs">
              {categorias.map((cat) => (
                <button
                  key={cat}
                  className={`category-btn ${categoriaActiva === cat ? "active" : ""
                    }`}
                  onClick={() => setCategoriaActiva(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="search-filter-container">
              <div className="search-box">
                <img src="http://localhost:3001/uploads/icons/search.png" alt="buscar" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button className="filter-btn">Filtrar por</button>
            </div>

            <div className="product-grid">
              {productosFiltrados.length > 0 ? (
                productosFiltrados.map((prod) => (
                  <div key={prod.id_producto} className="product-card">
                    <img
                      src={`http://localhost:3001/uploads/${prod.imagen}`}
                      alt={prod.nombre}
                    />
                    <div className="card-content">
                      <h3>{prod.nombre}</h3>
                      <p>{prod.descripcion}</p>
                      <p className="price">
                        $
                        {new Intl.NumberFormat("es-CO").format(prod.precio)}
                      </p>
                    </div>
                    {isLoggedIn && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
                        <GlobalButton
                          style={{ width: "80%" }}
                          onClick={() => handleComprar(prod.id_producto)}
                        >
                          Comprar Ahora
                        </GlobalButton>
                      </div>
                    )}
                    {!isLoggedIn && (
                      <center style={{ padding: '0 0 20px 0' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Inicia sesión para comprar</p>
                      </center>
                    )}
                  </div>
                ))
              ) : (
                <p>No hay productos disponibles.</p>
              )}
            </div>
          </>
        )}
      </main>

      <footer>
        © {new Date().getFullYear()} Gramas y Suministros — Todos los derechos reservados.
      </footer>
    </div>
  );
}
