// src/pages/AdminPages/GestionCotizaciones.jsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import CotizacionesService from "../../api/services/cotizaciones.service";
import "../../styles/AdminGlobal.css";
import "../../styles/GestionCotizaciones.css";

export default function GestionCotizaciones() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [estadisticas, setEstadisticas] = useState(null);
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");
  const [filtroSearch, setFiltroSearch] = useState("");
  
  // Accionando (para evitar doble click)
  const [accionando, setAccionando] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    cargarCotizaciones();
  }, [filtroEstado, filtroFechaInicio, filtroFechaFin, filtroSearch]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [cotizacionesData, statsData] = await Promise.all([
        CotizacionesService.obtenerTodasAdmin(),
        CotizacionesService.obtenerEstadisticas(),
      ]);
      setCotizaciones(cotizacionesData);
      setEstadisticas(statsData);
      setError(null);
    } catch (err) {
      console.error("Error cargando datos:", err);
      setError("No se pudieron cargar las cotizaciones");
    } finally {
      setLoading(false);
    }
  };

  const cargarCotizaciones = async () => {
    try {
      setLoading(true);
      const data = await CotizacionesService.obtenerTodasAdmin({
        estado: filtroEstado || undefined,
        fechaInicio: filtroFechaInicio || undefined,
        fechaFin: filtroFechaFin || undefined,
        search: filtroSearch || undefined,
      });
      setCotizaciones(data);
      setError(null);
    } catch (err) {
      console.error("Error cargando cotizaciones:", err);
      setError("No se pudieron cargar las cotizaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    if (accionando) return;
    
    const confirmar = window.confirm(
      `¿Estás seguro de cambiar el estado a "${nuevoEstado}"?`
    );
    if (!confirmar) return;

    try {
      setAccionando(id);
      await CotizacionesService.actualizarEstado(id, nuevoEstado);
      await cargarDatos();
      alert("✅ Estado actualizado correctamente");
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      alert("❌ Error al cambiar estado");
    } finally {
      setAccionando(null);
    }
  };

  const handleDescargarPDF = (id) => {
    CotizacionesService.descargarPDF(id);
  };

  const getEstadoColor = (estado) => {
    const colores = {
      pagado: "#2e7d32",
      pendiente: "#f57c00",
      cancelado: "#d32f2f",
      entregado: "#1976d2",
    };
    return colores[estado] || "#666";
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      pagado: "✅ Pagado",
      pendiente: "⏳ Pendiente",
      cancelado: "❌ Cancelado",
      entregado: "📦 Entregado",
    };
    return labels[estado] || estado;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Estadísticas resumen
  const statsCards = useMemo(() => {
    if (!estadisticas) return [];
    return [
      { label: "Total", value: estadisticas.total, color: "#2e7d32" },
      { label: "Pendientes", value: estadisticas.pendiente, color: "#f57c00" },
      { label: "Pagados", value: estadisticas.pagado, color: "#1976d2" },
      { label: "Entregados", value: estadisticas.entregado, color: "#2e7d32" },
      { label: "Cancelados", value: estadisticas.cancelado, color: "#d32f2f" },
    ];
  }, [estadisticas]);

  if (loading && !cotizaciones.length) {
    return (
      <>
        <NavComponent />
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando cotizaciones...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
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
            <button onClick={() => navigate("/stock")}>Stock</button>
            <button onClick={() => navigate("/reportes")}>Reportes</button>
            <button className="active" onClick={() => navigate("/gestion-cotizaciones")}>
              Cotizaciones
            </button>
            <button onClick={() => navigate("/")}>Catálogo</button>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </nav>
        </aside>

        {/* MAIN */}
        <div className="main-area">
          {/* STATS */}
          <section className="stats-row">
            {statsCards.map((stat) => (
              <div key={stat.label} className="stat-card" style={{ borderTop: `4px solid ${stat.color}` }}>
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </section>

          {/* FILTROS */}
          <section className="table-section">
            <div className="table-card">
              <div className="table-header">
                <h3>Filtros</h3>
                <div className="filtros-container">
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="filtro-select"
                  >
                    <option value="">Todos los estados</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="pagado">Pagado</option>
                    <option value="entregado">Entregado</option>
                    <option value="cancelado">Cancelado</option>
                  </select>

                  <input
                    type="date"
                    value={filtroFechaInicio}
                    onChange={(e) => setFiltroFechaInicio(e.target.value)}
                    className="filtro-input"
                    placeholder="Fecha inicio"
                  />
                  <input
                    type="date"
                    value={filtroFechaFin}
                    onChange={(e) => setFiltroFechaFin(e.target.value)}
                    className="filtro-input"
                    placeholder="Fecha fin"
                  />
                  <input
                    type="text"
                    value={filtroSearch}
                    onChange={(e) => setFiltroSearch(e.target.value)}
                    className="filtro-input"
                    placeholder="Buscar cliente..."
                  />
                  <button onClick={cargarCotizaciones} className="btn-filtrar">
                    Filtrar
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* TABLA DE COTIZACIONES */}
          <section className="table-section">
            <div className="table-card">
              <div className="table-header">
                <h3>Cotizaciones ({cotizaciones.length})</h3>
              </div>

              <div className="table-container">
                {error ? (
                  <p className="no-data">{error}</p>
                ) : cotizaciones.length === 0 ? (
                  <p className="no-data">No hay cotizaciones registradas</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Método</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cotizaciones.map((c) => (
                        <tr key={c.idCotizacion}>
                          <td>#{c.idCotizacion}</td>
                          <td>
                            <strong>{c.usuario?.nombre}</strong><br />
                            <small style={{ color: "#666" }}>{c.usuario?.email}</small>
                          </td>
                          <td>
                            {new Date(c.fechaCreacion).toLocaleDateString("es-CO")}
                            <br />
                            <small style={{ color: "#666" }}>
                              {new Date(c.fechaCreacion).toLocaleTimeString("es-CO")}
                            </small>
                          </td>
                          <td>
                            <strong style={{ color: "#2e7d32" }}>
                              ${new Intl.NumberFormat("es-CO").format(c.total)}
                            </strong>
                            <br />
                            <small style={{ color: "#666" }}>
                              {c.detalles?.length || 0} items
                            </small>
                          </td>
                          <td>
                            {c.metodoVenta === "fisico" ? "📍 Físico" : "🚚 Envío"}
                            <br />
                            <small style={{ color: "#666" }}>
                              {c.metodoPago === "efectivo" ? "Efectivo" :
                               c.metodoPago === "tarjeta_debito" ? "Tarjeta débito" :
                               "Tarjeta crédito"}
                            </small>
                          </td>
                          <td>
                            <span
                              style={{
                                display: "inline-block",
                                padding: "4px 12px",
                                borderRadius: "20px",
                                backgroundColor: getEstadoColor(c.estado),
                                color: "white",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            >
                              {getEstadoLabel(c.estado)}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                              <button
                                className="btn-extra"
                                onClick={() => handleDescargarPDF(c.idCotizacion)}
                                style={{ fontSize: "0.75rem" }}
                              >
                                📄 PDF
                              </button>

                              {c.estado === "pendiente" && (
                                <>
                                  <button
                                    className="btn-success"
                                    onClick={() => handleCambiarEstado(c.idCotizacion, "pagado")}
                                    disabled={accionando === c.idCotizacion}
                                    style={{
                                      fontSize: "0.75rem",
                                      background: "#2e7d32",
                                      color: "white",
                                      border: "none",
                                      padding: "4px 10px",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Pagar
                                  </button>
                                  <button
                                    className="btn-danger"
                                    onClick={() => handleCambiarEstado(c.idCotizacion, "cancelado")}
                                    disabled={accionando === c.idCotizacion}
                                    style={{
                                      fontSize: "0.75rem",
                                      background: "#d32f2f",
                                      color: "white",
                                      border: "none",
                                      padding: "4px 10px",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Cancelar
                                  </button>
                                </>
                              )}

                              {c.estado === "pagado" && (
                                <button
                                  className="btn-primary"
                                  onClick={() => handleCambiarEstado(c.idCotizacion, "entregado")}
                                  disabled={accionando === c.idCotizacion}
                                  style={{
                                    fontSize: "0.75rem",
                                    background: "#1976d2",
                                    color: "white",
                                    border: "none",
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                  }}
                                >
                                  Entregar
                                </button>
                              )}
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
      <Footer />
    </>
  );
}