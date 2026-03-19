import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/GlobalNav.css";

export default function NavComponent() {
  const navigate = useNavigate();
  const [isLogged, setIsLogged] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Si hay token → está logueado
    setIsLogged(!!token);

    // Leemos usuario y su rol (si existe)
    try {
      const raw = localStorage.getItem("usuario");
      const usuario = raw ? JSON.parse(raw) : null;
      setIsAdmin(usuario && Number(usuario.id_rol) === 1);
    } catch (e) {
      setIsAdmin(false);
    }
  }, []);

  const handleLogout = () => {
    // Mantengo el comportamiento original: si tienes una ruta /logout que maneja todo,
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("id_rol");
    setIsLogged(false);
    setIsAdmin(false);
    navigate("/");
  };

  return (

    <header className="main-header">
      <div className="logo">
        <h1 className="title-app">Gramas y Suministros</h1>
      </div>

      <nav style={{ display: "flex", gap: "1rem" }}>
        <Link to="/" className="option">Catálogo</Link>
        <Link to="/nosotros" className="option">Nosotros</Link>

        {!isLogged ?
          (
            <>
              <Link to="/register" className="option">Registrarse</Link>
              <Link to="/login" className="option">Iniciar Sesión</Link>
            </>
          ) :

          (
            <>
              {isAdmin ?
                (
                  <Link to="/panel" className="option">Panel</Link>
                ) :

                (
                  <Link to="/perfil" className="option">Mi Perfil</Link>
                )}

              <Link to="/logout" className="option" onClick={() => {
                localStorage.removeItem("token");
                localStorage.removeItem("usuario");
                localStorage.removeItem("id_rol");
              }}>
                Cerrar Sesion
              </Link>
            </>
          )}
      </nav>
    </header>
  );
}
