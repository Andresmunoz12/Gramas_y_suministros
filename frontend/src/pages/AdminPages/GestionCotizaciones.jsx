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
  
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState("");
  const [filtroFechaFin, setFiltroFechaFin] = useState("");
  const [filtroSearch, setFiltroSearch] = useState("");
  
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
    
    let mensajeConfirmacion = `¿Estás seguro de cambiar el estado a "${nuevoEstado}"?`;
    
    if (nuevoEstado === 'entregado') {
      const totalItems = cotizaciones.find(c => c.idCotizacion === id)?.detalles?.length || 0;
      mensajeConfirmacion = 
        `¿Estás seguro de marcar esta cotización como ENTREGADA?\n\n` +
        `Esta acción RESTARÁ ${totalItems} producto(s) del inventario.\n` +
        `¿Deseas continuar?`;
    }
    
    const confirmar = window.confirm(mensajeConfirmacion);
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

  const handleLogout = () => {
    logout();
    navigate("/");
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
            <button className="active" onClick={() => navigate("/gestion-cotizaciones")}>Cotizaciones</button>
            <button onClick={() => navigate("/")}>Catálogo</button>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </nav>
        </aside>
        <div className="main-area">
          <div className="loading-container">
            <div className="loader"></div>
            <p>Cargando cotizaciones...</p>
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
          <button className="active" onClick={() => navigate("/gestion-cotizaciones")}>Cotizaciones</button>
          <button onClick={() => navigate("/")}>Catálogo</button>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="main-area">
        {/* STATS CARDS */}
        <section className="stats-row">
          {statsCards.map((stat) => (
            <div key={stat.label} className="stat-card" style={{ borderTop: `4px solid ${stat.color}` }}>
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          ))}
        </section>

        {/* FILTROS */}
        <div className="filtros-wrapper">
          <div className="filtros-container">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="filtro-select"
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">⏳ Pendiente</option>
              <option value="pagado">✅ Pagado</option>
              <option value="entregado">📦 Entregado</option>
              <option value="cancelado">❌ Cancelado</option>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 13 10 21 14 18 14 13 22 3"/>
              </svg>
              Filtrar
            </button>
            <button 
              onClick={() => {
                setFiltroEstado("");
                setFiltroFechaInicio("");
                setFiltroFechaFin("");
                setFiltroSearch("");
                cargarCotizaciones();
              }} 
              className="btn-limpiar"
            >
              Limpiar
            </button>
          </div>
        </div>

        {/* TABLA DE COTIZACIONES */}
        <section className="table-section">
          <div className="table-card">
            <div className="table-header">
              <h3>Cotizaciones ({cotizaciones.length})</h3>
              <div className="table-actions">
                <button className="btn-secondary" onClick={() => navigate("/reportes")}>
                  Ver Reportes
                </button>
              </div>
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
                        <td>
                          <strong>#{c.idCotizacion}</strong>
                        </td>
                        <td>
                          <strong>{c.usuario?.nombre || c.usuario?.email || 'Anónimo'}</strong>
                          <br />
                          <small style={{ color: "#999", fontSize: "0.7rem" }}>
                            {c.usuario?.email || 'Sin email'}
                          </small>
                        </td>
                        <td>
                          {new Date(c.fechaCreacion).toLocaleDateString("es-CO")}
                          <br />
                          <small style={{ color: "#999", fontSize: "0.6rem" }}>
                            {new Date(c.fechaCreacion).toLocaleTimeString("es-CO")}
                          </small>
                        </td>
                        <td>
                          <strong style={{ color: "#2e7d32" }}>
                            ${new Intl.NumberFormat("es-CO").format(c.total)}
                          </strong>
                          <br />
                          <small style={{ color: "#999", fontSize: "0.6rem" }}>
                            {c.detalles?.length || 0} items
                          </small>
                        </td>
                        <td>
                          {c.metodoVenta === "fisico" ? "📍 Físico" : "🚚 Envío"}
                          <br />
                          <small style={{ color: "#999", fontSize: "0.6rem" }}>
                            {c.metodoPago === "efectivo" ? "Efectivo" :
                             c.metodoPago === "tarjeta_debito" ? "Tarjeta débito" :
                             c.metodoPago === "tarjeta_credito" ? "Tarjeta crédito" : ""}
                          </small>
                        </td>
                        <td>
                          <span className="status-badge" style={{
                            backgroundColor: getEstadoColor(c.estado) + '20',
                            color: getEstadoColor(c.estado),
                          }}>
                            ● {getEstadoLabel(c.estado)}
                          </span>
                        </td>
                        <td>
                          <div className="acciones-container">
                            <button
                              className="btn-pdf"
                              onClick={() => handleDescargarPDF(c.idCotizacion)}
                              title="Descargar PDF"
                            >
                              📄
                            </button>

                            {c.estado === "pendiente" && (
                              <>
                                <button
                                  className="btn-pagar"
                                  onClick={() => handleCambiarEstado(c.idCotizacion, "pagado")}
                                  disabled={accionando === c.idCotizacion}
                                >
                                  Pagar
                                </button>
                                <button
                                  className="btn-cancelar"
                                  onClick={() => handleCambiarEstado(c.idCotizacion, "cancelado")}
                                  disabled={accionando === c.idCotizacion}
                                >
                                  Cancelar
                                </button>
                              </>
                            )}

                            {c.estado === "pagado" && (
                              <button
                                className="btn-entregar"
                                onClick={() => handleCambiarEstado(c.idCotizacion, "entregado")}
                                disabled={accionando === c.idCotizacion}
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
            <div className="table-footer">
              <span>Mostrando {cotizaciones.length} cotizaciones</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}