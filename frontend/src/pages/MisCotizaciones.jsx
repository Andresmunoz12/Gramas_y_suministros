// src/pages/MisCotizaciones.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavComponent from "../components/GlobalNav";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import CotizacionesService from "../api/services/cotizaciones.service";
import "../styles/MisCotizaciones.css";

export default function MisCotizaciones() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCotizaciones = async () => {
      if (!isAuthenticated || !user) {
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        const data = await CotizacionesService.obtenerMisCotizaciones();
        setCotizaciones(data);
        setError(null);
      } catch (err) {
        console.error("❌ Error al obtener cotizaciones:", err);
        setError("No se pudieron cargar tus cotizaciones");
        setCotizaciones([]);
      } finally {
        setCargando(false);
      }
    };

    fetchCotizaciones();
  }, [isAuthenticated, user]);

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pagado":
        return "#2e7d32"; // Verde
      case "pendiente":
        return "#f57c00"; // Naranja
      case "cancelado":
        return "#d32f2f"; // Rojo
      case "entregado":
        return "#1976d2"; // Azul
      default:
        return "#666";
    }
  };

  const getEstadoLabel = (estado) => {
    switch (estado) {
      case "pagado":
        return "✅ Pagado";
      case "pendiente":
        return "⏳ Pendiente";
      case "cancelado":
        return "❌ Cancelado";
      case "entregado":
        return "📦 Entregado";
      default:
        return estado;
    }
  };

  if (loading) {
    return (
      <div className="dashboard">
        <NavComponent />
        <main>
          <div className="loading-container">
            <div className="loader"></div>
            <p>Cargando perfil...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="dashboard">
      <NavComponent />

      <main className="perfil-container">
        <section className="perfil-header">
          <h2>📝 Mis Cotizaciones</h2>
          <p className="perfil-subtitle">
            {user?.nombre} {user?.apellido || ""} • {cotizaciones.length} cotizaciones
          </p>
        </section>

        {cargando ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Cargando cotizaciones...</p>
          </div>
        ) : error ? (
          <div className="perfil-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="btn-retry">
              Reintentar
            </button>
          </div>
        ) : cotizaciones.length === 0 ? (
          <section className="perfil-empty">
            <div className="empty-icon">📋</div>
            <h3>No tienes cotizaciones</h3>
            <p>Visita el catálogo y agrega productos para crear tu primera cotización.</p>
            <button onClick={() => navigate("/")} className="btn-primary">
              Ir al catálogo
            </button>
          </section>
        ) : (
          <section className="cotizaciones-grid">
            {cotizaciones.map((cotizacion) => (
              <div key={cotizacion.idCotizacion} className="cotizacion-card">
                <div className="cotizacion-header">
                  <span className="cotizacion-id"># {cotizacion.idCotizacion}</span>
                  <span
                    className="cotizacion-estado"
                    style={{ backgroundColor: getEstadoColor(cotizacion.estado) }}
                  >
                    {getEstadoLabel(cotizacion.estado)}
                  </span>
                </div>

                <div className="cotizacion-fecha">
                  📅 {new Date(cotizacion.fechaCreacion).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                <div className="cotizacion-resumen">
                  <div className="cotizacion-productos">
                    <strong>Productos:</strong> {cotizacion.detalles?.length || 0} items
                  </div>
                  <div className="cotizacion-total">
                    <strong>Total:</strong> $
                    {new Intl.NumberFormat("es-CO").format(cotizacion.total || 0)}
                  </div>
                </div>

                <div className="cotizacion-metodos">
                  <span className="metodo-venta">
                    {cotizacion.metodoVenta === "fisico" ? "📍 Punto físico" : "🚚 Entrega al cliente"}
                  </span>
                  <span className="metodo-pago">
                    💳 {cotizacion.metodoPago === "efectivo" ? "Efectivo" : 
                       cotizacion.metodoPago === "tarjeta_debito" ? "Tarjeta débito" : "Tarjeta crédito"}
                  </span>
                </div>

                {cotizacion.direccionEnvio && (
                  <div className="cotizacion-direccion">
                    📬 {cotizacion.direccionEnvio}
                  </div>
                )}

                <div className="cotizacion-actions">
                  <button
                    className="btn-ver-detalle"
                    onClick={() => window.open(`/cotizacion/${cotizacion.idCotizacion}/pdf`, "_blank")}
                  >
                    📄 Ver PDF
                  </button>
                  {cotizacion.estado === "pendiente" && (
                    <button
                      className="btn-pagar"
                      onClick={async () => {
                        try {
                          await CotizacionesService.simularPago(cotizacion.idCotizacion);
                          alert("✅ Pago simulado exitosamente");
                          window.location.reload();
                        } catch (err) {
                          alert("❌ Error al simular pago");
                        }
                      }}
                    >
                      💳 Simular pago
                    </button>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}