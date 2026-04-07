// components/GlobalNav.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/GlobalNav.css";

export default function NavComponent() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth(); // isAuthenticated es booleano

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isAdmin = user?.id_rol === 1;

  return (
    <header className="main-header">
      <div className="logo">
        <h1 className="title-app">Gramas y Suministros</h1>
      </div>

      <nav style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link to="/" className="option">Catálogo</Link>
        <Link to="/nosotros" className="option">Nosotros</Link>

        {!isAuthenticated ? (
          <>
            <Link to="/register" className="option">Registrarse</Link>
            <Link to="/login" className="option">Iniciar Sesión</Link>
          </>
        ) : (
          <>
            {isAdmin ? (
              <Link to="/panel" className="option">Panel Admin</Link>
            ) : (
              <Link to="/perfil" className="option">Mi Perfil</Link>
            )}
            
            <span className="option" style={{ color: "#ffffff" }}>
              Hola, {user?.nombre || "Usuario"}
            </span>
            
            <button 
              onClick={handleLogout} 
              className="option logout-btn"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#ffffff"
              }}
            >
              Cerrar Sesión
            </button>
          </>
        )}
      </nav>
    </header>
  );
}