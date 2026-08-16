// src/pages/AdminPages/Categorias.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import CategoriasService from "../../api/services/categorias.service";
import "../../styles/AdminGlobal.css";
import "../../styles/Panel.css";
import "../../styles/Categorias.css";

export default function Categorias() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accionando, setAccionando] = useState(null);

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    conProductos: 0,
    sinProductos: 0,
  });

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CategoriasService.getAll();
      setCategorias(data);
      calcularEstadisticas(data);
    } catch (err) {
      console.error("Error cargando categorías:", err);
      setError("No se pudieron cargar las categorías");
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (data) => {
    const total = data.length;
    const conProductos = data.filter(c => c.productos && c.productos.length > 0).length;
    const sinProductos = data.filter(c => !c.productos || c.productos.length === 0).length;

    setStats({ total, conProductos, sinProductos });
  };

  const handleEliminar = async (id, nombre) => {
    if (accionando) return;

    const confirmar = window.confirm(
      `¿Estás seguro de que quieres ELIMINAR la categoría "${nombre}"?\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      setAccionando(id);
      await CategoriasService.delete(id);
      await cargarCategorias();
      alert(`✅ Categoría "${nombre}" eliminada correctamente`);
    } catch (error) {
      console.error("Error al eliminar:", error);
      alert(`❌ Error al eliminar: ${error.response?.data?.message || error.message}`);
    } finally {
      setAccionando(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="admin-layout">
        <aside className="sidebar">
          <h2>Dashboard</h2>
          <div className="user-info">
            <p>Bienvenido, {user?.nombre}</p>
          </div>
            <nav>
            <button onClick={() => navigate("/panel")}>Inventario</button>
            <button onClick={() => navigate("/usuarios")}>Usuarios</button>
            <button onClick={() => navigate("/proveedores")}>Proveedores</button>
            <button className="active" onClick={() => navigate("/categorias")}>Categorías</button>
            <button onClick={() => navigate("/reportes")}>Reportes</button>
            <button onClick={() => navigate("/stock")}>Stock</button>
            <button onClick={() => navigate("/gestion-cotizaciones")}>Cotizaciones</button>
            <button onClick={() => navigate("/")}>Catálogo</button>
            <button onClick={handleLogout}>Cerrar Sesión</button>
            </nav>
        </aside>
        <div className="main-area">
          <div className="loading-container">
            <div className="loader"></div>
            <p>Cargando categorías...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>Dashboard</h2>
        <div className="user-info">
          <p>Bienvenido, {user?.nombre}</p>
        </div>
        <nav>
          <button onClick={() => navigate("/panel")}>Inventario</button>
          <button onClick={() => navigate("/usuarios")}>Usuarios</button>
          <button onClick={() => navigate("/proveedores")}>Proveedores</button>
          <button className="active" onClick={() => navigate("/categorias")}>Categorías</button>
          <button onClick={() => navigate("/reportes")}>Reportes</button>
          <button onClick={() => navigate("/stock")}>Stock</button>
          <button onClick={() => navigate("/gestion-cotizaciones")}>Cotizaciones</button>
          <button onClick={() => navigate("/")}>Catálogo</button>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="main-area">
        {/* STATS CARDS */}
        <section className="stats-row">
          <div className="stat-card green">
            <h3>{stats.total}</h3>
            <p>Total Categorías</p>
          </div>
          <div className="stat-card purple">
            <h3>{stats.conProductos}</h3>
            <p>Con Productos</p>
          </div>
          <div className="stat-card blue">
            <h3>{stats.sinProductos}</h3>
            <p>Sin Productos</p>
          </div>
          <div className="stat-card orange">
            <h3>{categorias.length > 0 ? Math.round((stats.conProductos / stats.total) * 100) : 0}%</h3>
            <p>% Uso</p>
          </div>
        </section>

        {/* TABLA DE CATEGORÍAS */}
        <section className="table-section">
          <div className="table-card">
            <div className="table-header">
              <h3>Gestión de Categorías</h3>
              <div className="table-actions">
                <button
                  className="btn-primary"
                  onClick={() => navigate("/insertar-categoria")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14"/>
                    <path d="M5 12h14"/>
                  </svg>
                  Agregar Categoría
                </button>
              </div>
            </div>

            <div className="table-container">
              {error ? (
                <p className="no-data">{error}</p>
              ) : categorias.length === 0 ? (
                <p className="no-data">No hay categorías registradas</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Productos</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.map((c) => (
                      <tr key={c.id_categoria}>
                        <td>{c.id_categoria}</td>
                        <td>
                          <strong>{c.nombre}</strong>
                        </td>
                        <td>{c.descripcion || "N/A"}</td>
                        <td>
                          <span className={`product-count-badge ${c.productos?.length > 0 ? 'has-products' : 'no-products'}`}>
                            {c.productos?.length || 0}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${c.productos?.length > 0 ? 'active' : 'inactive'}`}>
                            {c.productos?.length > 0 ? 'Activa' : 'Sin productos'}
                          </span>
                        </td>
                        <td>
                          <div className="acciones-container">
                            <button
                              className="btn-extra"
                              onClick={() => navigate(`/editar-categoria/${c.id_categoria}`)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleEliminar(c.id_categoria, c.nombre)}
                              disabled={accionando === c.id_categoria || (c.productos?.length > 0)}
                              title={c.productos?.length > 0 ? "No se puede eliminar una categoría con productos" : ""}
                            >
                              {accionando === c.id_categoria ? "..." : "Eliminar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}