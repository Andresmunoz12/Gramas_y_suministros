import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import NavComponent from "../components/GlobalNav";
import Footer from "../components/Footer";
import "../styles/Perfil.css";

export default function Perfil() {
  const navigate = useNavigate();

  // ===== USUARIO DESDE LOCALSTORAGE (más limpio) =====
  const usuario = useMemo(() => {
    try {
      const data = localStorage.getItem("usuario");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, []);

  // ===== PROTECCIÓN GENERAL =====
  useEffect(() => {
    if (!usuario) {
      navigate("/login");
      return;
    }

    if (usuario.id_rol === 1) {
      navigate("/panel");
    }
  }, [usuario, navigate]);

  if (!usuario || usuario.id_rol === 1) return null;

  return (
    <div className="dashboard">
      <NavComponent />

      <main className="perfil-container">
        <section className="perfil-header">
          <h2>Bienvenido, {usuario.nombre}</h2>
          <span className="perfil-badge">Cliente</span>
        </section>

        <section className="perfil-grid">
          <div
            className="perfil-card"
            onClick={() => navigate("/mis-pedidos")}
          >
            <div className="perfil-icon">📦</div>
            <h3>Mis pedidos</h3>
            <p>Consulta el estado y detalles de tus pedidos.</p>
          </div>

          <div
            className="perfil-card"
            onClick={() => navigate("/editar-perfil")}
          >
            <div className="perfil-icon">👤</div>
            <h3>Editar perfil</h3>
            <p>Actualiza tu información personal.</p>
          </div>

          <div
            className="perfil-card"
            onClick={() => navigate("/mis-cotizaciones")}
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
