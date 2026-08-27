import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/LoginAndRegister.css";
import GlobalButton from "../components/GlobalButton";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setMsg("");

    try {
      console.log("1. Intentando login con:", { email });

      const data = await login({
        email,
        password_hash: password,
      });

      console.log("2. Respuesta completa:", data);
      console.log("3. User recibido:", data.user);
      console.log("4. Rol del usuario:", data.user?.id_rol);

      setMsg("Inicio de sesión exitoso");

      // REDIRECCIÓN SEGÚN ROL
      if (data.user?.id_rol === 1) {
        console.log("👉 Redirigiendo a /panel (Admin)");
        navigate("/panel");
      } else if (data.user?.id_rol === 2) {
        console.log("👉 Redirigiendo a / (Cliente)");
        navigate("/");
      } else {
        console.log("❌ Rol no reconocido:", data.user?.id_rol);
        setMsg("Rol de usuario no reconocido");
      }

    } catch (error) {
      console.error("❌ Error completo:", error);

      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || "";

        if (
          errorMessage
            .toLowerCase()
            .includes("desactivada")
        ) {
          setMsg(
            "🔒 Tu cuenta ha sido desactivada temporalmente. Comunícate con la línea de atención al cliente para más información."
          );
        } else if (
          errorMessage
            .toLowerCase()
            .includes("suspendida")
        ) {
          setMsg(
            "⛔ Tu cuenta ha sido suspendida. Por favor, contacta al administrador del sistema."
          );
        } else if (
          errorMessage
            .toLowerCase()
            .includes("credenciales")
        ) {
          setMsg(
            "❌ Credenciales inválidas. Por favor, verifica tu email y contraseña."
          );
        } else {
          setMsg(errorMessage);
        }

      } else if (error.response?.status === 401) {
        setMsg(
          "❌ Credenciales inválidas. Por favor, verifica tu email y contraseña."
        );

      } else {
        setMsg(
          error.message || "Error al iniciar sesión"
        );
      }

    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!loading) {
      handleLogin();
    }
  };

  const isWarning =
    msg.toLowerCase().includes("desactivada") ||
    msg.toLowerCase().includes("suspendida");

  const isError =
    msg.toLowerCase().includes("error") ||
    msg.toLowerCase().includes("inválidas") ||
    msg.toLowerCase().includes("inválido") ||
    msg.toLowerCase().includes("credenciales");

  return (
    <div className="auth-page">

      {/* =====================================================
          PANEL IZQUIERDO
          ===================================================== */}

      <section className="auth-showcase">

        {/* BRAND */}

        <div className="auth-brand">

          <div className="auth-brand-icon">
            🌱
          </div>

          <div className="auth-brand-text">

            <span className="auth-brand-name">
              Gramas y Suministros
            </span>

            <span className="auth-brand-subtitle">
              Calidad para cada espacio
            </span>

          </div>

        </div>


        {/* CONTENIDO PRINCIPAL */}

        <div className="auth-showcase-content">

          <h2>
            Todo para crear
            <br />
            espacios <span>increíbles.</span>
          </h2>

          <p>
            Encuentra soluciones de calidad en gramas
            sintéticas y suministros para transformar
            cualquier espacio en un lugar increíble.
          </p>


          {/* BENEFICIOS */}

          <div className="auth-benefits">

            <span className="auth-benefit">
              🌿 Productos de calidad
            </span>

            <span className="auth-benefit">
              📦 Inventario actualizado
            </span>

            <span className="auth-benefit">
              🛒 Compra fácil y rápida
            </span>

          </div>

          <button
            type="button"
            className="showcase-explore-button"
            onClick={() => navigate("/")}
          >
            <span>
              🌿
            </span>

            <span>
              Explorar catálogo
            </span>

            <strong>
              →
            </strong>
          </button>

        </div>


        {/* FOOTER */}

        <div className="auth-showcase-footer">

          <span>
            © 2026 Gramas y Suministros
          </span>

          <span>•</span>

          <span>
            Tu espacio, nuestra calidad
          </span>

        </div>

      </section>


      {/* =====================================================
          PANEL DERECHO
          ===================================================== */}

      <main className="auth-container">

        <form
          className="auth-card"
          onSubmit={handleSubmit}
        >

          {/* TITULO */}

          <h1 className="auth-title">
            Bienvenido de nuevo 👋
          </h1>

          <p className="auth-subtitle">
            Ingresa a tu cuenta para continuar
            disfrutando de nuestros productos.
          </p>


          {/* =================================================
              CORREO
              ================================================= */}

          <label className="auth-label">
            Dirección de correo
            <span>(Correo electrónico)</span>
          </label>

          <div className="input-wrapper">

            <img
              src="http://localhost:3000/uploads/icons/email.png"
              alt="Correo electrónico"
            />

            <input
              type="email"
              className="input-field"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (msg) setMsg("");
              }}
              disabled={loading}
              autoComplete="email"
              required
            />

          </div>


          {/* =================================================
              CONTRASEÑA
              ================================================= */}

          <label className="auth-label">
            Contraseña
          </label>

          <div className="input-wrapper">

            <img
              src="http://localhost:3000/uploads/icons/contraseña.png"
              alt="Contraseña"
            />

            <input
              type="password"
              className="input-field"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (msg) setMsg("");
              }}
              disabled={loading}
              autoComplete="current-password"
              required
            />

          </div>


          {/* =================================================
              BOTÓN
              ================================================= */}

          <GlobalButton
            type="submit"
            style={{
              width: "100%",
              marginBottom: "10px",
            }}
            disabled={loading}
          >
            {loading
              ? "Iniciando sesión..."
              : "Continuar"}
          </GlobalButton>


          {/* =================================================
              RECUPERAR CONTRASEÑA
              ================================================= */}

          <p
            className="auth-link"
            onClick={() =>
              !loading &&
              navigate("/forgot-password")
            }
          >
            ¿Olvidaste tu contraseña?
          </p>


          {/* =================================================
              REGISTRO
              ================================================= */}

          <p
            className="auth-link"
            onClick={() =>
              !loading &&
              navigate("/register")
            }
          >
            ¿No tienes cuenta? Regístrate aquí
          </p>


          {/* =================================================
              MENSAJE
              ================================================= */}

          {msg && (
            <div
              className={`auth-message ${
                isWarning
                  ? ""
                  : isError
                  ? "error"
                  : "success"
              }`}
              style={
                isWarning
                  ? {
                      color: "#856404",
                      backgroundColor: "#fff3cd",
                      border:
                        "1px solid #ffc107",
                    }
                  : undefined
              }
            >
              {msg}
            </div>
          )}

        </form>

      </main>

    </div>
  );
}