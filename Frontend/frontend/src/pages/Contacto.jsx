import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Contacto.css";
import NavComponent from "../components/GlobalNav";
import GlobalButton from "../components/GlobalButton";

function getUser() {
  try {
    const data = localStorage.getItem("usuario");
    if (!data || data === "undefined") return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

const Contacto = () => {
  const navigate = useNavigate();
  const user = getUser();

  const nombreUsuario = user?.nombre || "usuario";

  return (
    <div className="contacto-page">
      <NavComponent />

      <main className="contacto-main">
        <section className="welcome-section glass-effect">
          <h2 className="saludo">¡Hola, {nombreUsuario}!</h2>
          <p className="subtitulo">¿Qué desea hacer hoy?</p>
        </section>

        <div className="opciones-grid">
          {/* SOLO SE MUESTRA SI HAY SESIÓN */}
          {user && (
            <div className="opcion-card glass-effect" onClick={() => navigate("/dashboard")}>
              <div className="icon">👤</div>
              <p>Ver/editar perfil</p>
            </div>
          )}

          {/* SI NO HAY SESIÓN → mostrar botón para iniciar sesión */}
          {!user && (
            <div className="opcion-card glass-effect" onClick={() => navigate("/login")}>
              <div className="icon">🔑</div>
              <p>Iniciar sesión</p>
            </div>
          )}

          <div className="opcion-card glass-effect" onClick={() => navigate("/recuperar")}>
            <div className="icon">🔒</div>
            <p>Recuperar contraseña</p>
          </div>

          <div className="opcion-card glass-effect" onClick={() => navigate("/soporte")}>
            <div className="icon">💬</div>
            <p>Soporte técnico</p>
          </div>
        </div>

        <div className="action-footer">
          <GlobalButton onClick={() => navigate(-1)} style={{ width: "180px" }}>
            Volver
          </GlobalButton>
        </div>
      </main>
    </div>
  );
};

export default Contacto;