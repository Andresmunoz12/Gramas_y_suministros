import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavComponent from "../components/GlobalNav";
import GlobalButton from "../components/GlobalButton";
import '../styles/Perfil.css';

export default function Dashboard() {
  const navigate = useNavigate();

  // Cargar usuario desde localStorage

  const rawUsuario = localStorage.getItem("usuario");
  let usuario = null;

  try {
    usuario = rawUsuario ? JSON.parse(rawUsuario) : null;
  } catch (err) {
    usuario = null;
  }

  // Si no está logueado:

  useEffect(() => {
    if (!usuario) {
      navigate("/login");
    }
  }, [usuario, navigate]);

  if (!usuario) return null;

  const isAdmin = usuario.id_rol === 1;

  return (
    <div className="dashboard">

      <NavComponent />

      <main>
        <div className="profile-welcome glass-effect">
          <h2>Bienvenido, {usuario.nombre}</h2>
          <p>Cuenta de {isAdmin ? "Administrador" : "Cliente"}</p>
        </div>

        {/* USUARIO NORMAL */}
        {!isAdmin && (
          <div className="options-grid">
            <div className="link-card glass-effect" onClick={() => navigate("/mis-pedidos")}>
              <div className="icon-box">📦</div>
              <h3>Mis pedidos</h3>
            </div>
            <div className="link-card glass-effect" onClick={() => navigate("/editar-perfil")}>
              <div className="icon-box">👤</div>
              <h3>Editar perfil</h3>
            </div>
            <div className="link-card glass-effect" onClick={() => navigate("/mis-cotizaciones")}>
              <div className="icon-box">📝</div>
              <h3>Mis cotizaciones</h3>
            </div>
          </div>
        )}

        {/* ADMINISTRADOR */}
        {isAdmin && (
          <div className="panel-admin">
            <h2 className="title-admin">Panel de administración</h2>
            <p>¿Qué desea gestionar hoy?</p>

            <div className="options-grid">
              <Link to="/usuarios" className="link-card glass-effect">
                <div className="icon-box">👥</div>
                <h3>Control de usuarios</h3>
              </Link>

              <Link to="/dashboard" className="link-card glass-effect">
                <div className="icon-box">📊</div>
                <h3>Administrar inventarios</h3>
              </Link>

              <Link to="/admin/cotizaciones" className="link-card glass-effect">
                <div className="icon-box">📄</div>
                <h3>Generar cotizaciones</h3>
              </Link>

              <Link to="/reportes" className="link-card glass-effect reportes-link">
                Ir a reportes profesionales
              </Link>
            </div>
          </div>
        )}
      </main>

      <footer>
        © 2025 Gramas y Suministros — Todos los derechos reservados.
      </footer>
    </div>
  );
}
