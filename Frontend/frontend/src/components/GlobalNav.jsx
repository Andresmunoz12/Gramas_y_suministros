// components/GlobalNav.jsx
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "../styles/GlobalNav.css";
import "../styles/CartDrawer.css";

export default function NavComponent() {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { totalItems, setCartOpen } = useCart();

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

            <button
              onClick={handleLogout}
              className="option"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "0",
                fontSize: "16px",
                fontFamily: "inherit"
              }}
            >
              Cerrar Sesión
            </button>

            {/* Cart icon — only for non-admin users */}
            {!isAdmin && (
              <button
                className="cart-nav-btn"
                onClick={() => setCartOpen(true)}
                title="Ver carrito"
              >
                🛒
                {totalItems > 0 && (
                  <span className="cart-badge">{totalItems}</span>
                )}
              </button>
            )}
          </>
        )}
      </nav>
    </header>
  );
}
