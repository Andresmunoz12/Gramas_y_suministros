import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NavComponent from "../components/GlobalNav";
import "../styles/Perfil.css";

export default function Perfil() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const cargarPerfil = async () => {
      try {
        setLoading(true);
        await refreshUser(); // 👈 Recargar datos desde el backend
      } catch (error) {
        console.error("Error cargando perfil:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarPerfil();
  }, [isAuthenticated, navigate, refreshUser]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleEditarPerfil = () => {
    navigate("/editar-perfil");
  };

  if (loading) {
    return (
      <div className="dashboard">
        <NavComponent />
        <main className="perfil-loading">
          <div className="spinner"></div>
          <p>Cargando perfil...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <NavComponent />
      <main className="perfil-main">
        <div className="perfil-container">
          <div className="perfil-header">
            <div className="perfil-avatar">
              <div className="avatar-circle">
                <span className="avatar-initials">
                  {user?.nombre?.charAt(0)?.toUpperCase() || "U"}
                  {user?.apellido?.charAt(0)?.toUpperCase() || ""}
                </span>
              </div>
              <div className="perfil-badge">
                <span className={`badge-role ${user?.id_rol === 1 ? "admin" : "client"}`}>
                  {user?.id_rol === 1 ? "Administrador" : "Cliente"}
                </span>
                <span className="badge-status active">Activo</span>
              </div>
            </div>
            <div className="perfil-header-info">
              <h1>{user?.nombre} {user?.apellido || ""}</h1>
              <p className="perfil-email">{user?.email}</p>
              <p className="perfil-member-since">
                Miembro desde {new Date().toLocaleDateString("es-CO", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="perfil-grid">
            <div className="perfil-card" onClick={handleEditarPerfil}>
              <div className="card-icon">
                <span>✏️</span>
              </div>
              <h3>Editar Perfil</h3>
              <p>Actualiza tu información personal</p>
            </div>

            <div className="perfil-card" onClick={() => navigate("/mis-cotizaciones")}>
              <div className="card-icon">
                <span>📄</span>
              </div>
              <h3>Mis Cotizaciones</h3>
              <p>Gestiona tus cotizaciones</p>
            </div>

            <div className="perfil-card logout" onClick={handleLogout}>
              <div className="card-icon">
                <span>🚪</span>
              </div>
              <h3>Cerrar Sesión</h3>
              <p>Salir de tu cuenta</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}