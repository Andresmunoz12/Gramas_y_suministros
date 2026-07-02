// src/pages/Perfil.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NavComponent from "../components/GlobalNav";
import Footer from "../components/Footer";
import "../styles/Perfil.css";

export default function Perfil() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user?.id_rol === 1) {
      navigate("/panel");
      return;
    }
  }, [isAuthenticated, user, navigate, loading]);

  if (loading) {
    return (
      <div className="dashboard">
        <NavComponent />
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>Cargando perfil...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || user?.id_rol === 1) {
    return null;
  }

  return (
    <div className="dashboard">
      <NavComponent />

      <main className="perfil-container">
        <section className="perfil-header">
          <h2>Bienvenido, {user?.nombre || "Usuario"}</h2>
          <span className="perfil-badge">Cliente</span>
        </section>

        <section className="perfil-grid">
          <div
            className="perfil-card"
            onClick={() => navigate("/editar-perfil")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                navigate("/editar-perfil");
              }
            }}
          >
            <div className="perfil-icon">👤</div>
            <h3>Editar perfil</h3>
            <p>Actualiza tu información personal.</p>
          </div>

          <div
            className="perfil-card"
            onClick={() => navigate("/mis-cotizaciones")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                navigate("/mis-cotizaciones");
              }
            }}
          >
            <div className="perfil-icon">📝</div>
            <h3>Mis cotizaciones</h3>
            <p>Revisa las cotizaciones solicitadas.</p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}