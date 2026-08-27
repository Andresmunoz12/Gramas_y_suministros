import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlobalButton from "../components/GlobalButton";
import "../styles/LoginAndRegister.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const enviarCodigo = async (e) => {
    e.preventDefault();

    if (!email) {
      setMsg("Por favor, ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await fetch(
        "http://localhost:3000/auth/solicitar-codigo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMsg(
          data.message ||
            "No fue posible procesar la solicitud."
        );
        return;
      }

      setMsg(
        data.message ||
          "Código enviado correctamente."
      );

      setTimeout(() => {
        navigate(
          `/verify-code?email=${encodeURIComponent(email)}`
        );
      }, 700);

    } catch (error) {
      console.error(
        "Error solicitando código:",
        error
      );

      setMsg(
        "No se pudo conectar con el servidor. Inténtalo nuevamente."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      {/* =====================================================
          PANEL IZQUIERDO
          ===================================================== */}

      <section className="auth-showcase">

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


        <div className="auth-showcase-content">

          <h2>
            Recupera el acceso
            <br />
            a tu <span>cuenta.</span>
          </h2>

          <p>
            No te preocupes. Podemos ayudarte a
            recuperar el acceso a tu cuenta de forma
            rápida y segura.
          </p>


          <div className="auth-benefits">

            <span className="auth-benefit">
              🔐 Proceso seguro
            </span>

            <span className="auth-benefit">
              📩 Código de verificación
            </span>

            <span className="auth-benefit">
              ⚡ Recuperación rápida
            </span>

          </div>


          <button
            type="button"
            className="showcase-explore-button"
            onClick={() => navigate("/")}
          >
            <span>🌿</span>

            <span>
              Explorar catálogo
            </span>

            <strong>→</strong>
          </button>

        </div>


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
          onSubmit={enviarCodigo}
        >

          <h1 className="auth-title">
            Recuperar contraseña 🔐
          </h1>

          <p className="auth-subtitle">
            Ingresa el correo asociado a tu cuenta.
            Te enviaremos un código de verificación
            para continuar.
          </p>


          <label className="auth-label">
            Correo electrónico
            <span>(Correo registrado)</span>
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


          <GlobalButton
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              marginBottom: "10px",
            }}
          >
            {loading
              ? "Enviando código..."
              : "Enviar código"}
          </GlobalButton>


          {msg && (
            <div
              className={`auth-message ${
                msg.toLowerCase().includes("correctamente") ||
                msg.toLowerCase().includes("enviado")
                  ? "success"
                  : "error"
              }`}
            >
              {msg}
            </div>
          )}


          <p
            className="auth-link"
            onClick={() =>
              !loading && navigate("/login")
            }
          >
            ← Volver a iniciar sesión
          </p>

        </form>

      </main>

    </div>
  );
}