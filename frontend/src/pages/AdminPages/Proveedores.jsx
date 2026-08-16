// src/pages/AdminPages/Proveedores.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import ProveedoresService from "../../api/services/proveedores.service";
import "../../styles/AdminGlobal.css";
import "../../styles/Panel.css";
import "../../styles/Proveedores.css";

export default function Proveedores() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accionando, setAccionando] = useState(null);

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    conContacto: 0,
    sinContacto: 0,
    conEmail: 0,
  });

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ProveedoresService.getAll();
      setProveedores(data);
      calcularEstadisticas(data);
    } catch (err) {
      console.error("Error cargando proveedores:", err);
      setError("No se pudieron cargar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  const calcularEstadisticas = (data) => {
    const total = data.length;
    const conContacto = data.filter(p => p.contacto && p.contacto.trim() !== '').length;
    const sinContacto = data.filter(p => !p.contacto || p.contacto.trim() === '').length;
    const conEmail = data.filter(p => p.email && p.email.trim() !== '').length;

    setStats({ total, conContacto, sinContacto, conEmail });
  };

  const handleEliminar = async (id, nombre) => {
    if (accionando) return;

    const confirmar = window.confirm(
      `¿Estás seguro de que quieres ELIMINAR el proveedor "${nombre}"?\n\n` +
      `Esta acción no se puede deshacer.`
    );

    if (!confirmar) return;

    try {
      setAccionando(id);
      await ProveedoresService.delete(id);
      await cargarProveedores();
      alert(`✅ Proveedor "${nombre}" eliminado correctamente`);
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
            <button onClick={() => navigate("/categorias")}>Categorías</button>
            <button onClick={() => navigate("/stock")}>Stock</button>
            <button onClick={() => navigate("/reportes")}>Reportes</button>
            <button onClick={() => navigate("/gestion-cotizaciones")}>Cotizaciones</button>
            <button onClick={() => navigate("/")}>Catálogo</button>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </nav>
        </aside>
        <div className="main-area">
          <div className="loading-container">
            <div className="loader"></div>
            <p>Cargando proveedores...</p>
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
          <button onClick={() => navigate("/categorias")}>Categorías</button>
          <button onClick={() => navigate("/stock")}>Stock</button>
          <button onClick={() => navigate("/reportes")}>Reportes</button>
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
            <p>Total Proveedores</p>
          </div>
          <div className="stat-card purple">
            <h3>{stats.conContacto}</h3>
            <p>Con Contacto</p>
          </div>
          <div className="stat-card blue">
            <h3>{stats.sinContacto}</h3>
            <p>Sin Contacto</p>
          </div>
          <div className="stat-card orange">
            <h3>{stats.conEmail}</h3>
            <p>Con Email</p>
          </div>
        </section>

        {/* TABLA DE PROVEEDORES */}
        <section className="table-section">
          <div className="table-card">
            <div className="table-header">
              <h3>Gestión de Proveedores</h3>
              <div className="table-actions">
                <button
                  className="btn-primary"
                  onClick={() => navigate("/insertar-proveedor")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14"/>
                    <path d="M5 12h14"/>
                  </svg>
                  Agregar Proveedor
                </button>
              </div>
            </div>

            <div className="table-container">
              {error ? (
                <p className="no-data">{error}</p>
              ) : proveedores.length === 0 ? (
                <p className="no-data">No hay proveedores registrados</p>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Contacto</th>
                      <th>Teléfono</th>
                      <th>Email</th>
                      <th>Dirección</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proveedores.map((p) => (
                      <tr key={p.id_proveedor}>
                        <td>{p.id_proveedor}</td>
                        <td>
                          <strong>{p.nombre}</strong>
                        </td>
                        <td>{p.contacto || "N/A"}</td>
                        <td>{p.telefono || "N/A"}</td>
                        <td>{p.email || "N/A"}</td>
                        <td>{p.direccion || "N/A"}</td>
                        <td>
                          <div className="acciones-container">
                            <button
                              className="btn-extra"
                              onClick={() => navigate(`/editar-proveedor/${p.id_proveedor}`)}
                            >
                              Editar
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleEliminar(p.id_proveedor, p.nombre)}
                              disabled={accionando === p.id_proveedor}
                            >
                              {accionando === p.id_proveedor ? "..." : "Eliminar"}
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