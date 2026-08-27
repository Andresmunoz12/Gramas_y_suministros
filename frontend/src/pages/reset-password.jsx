import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import GlobalButton from "../components/GlobalButton";
import "../styles/LoginAndRegister.css";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const email = params.get("email");
  const code = params.get("code");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const cambiar = async (e) => {
    e.preventDefault();

    setMsg("");

    if (!password) {
      setMsg("Ingresa una nueva contraseña.");
      return;
    }

    if (password.length < 8) {
      setMsg(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (password !== confirmPassword) {
      setMsg(
        "Las contraseñas no coinciden."
      );
      return;
    }

    if (!code) {
      setMsg(
        "El código de verificación no es válido o ha expirado."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        "http://localhost:3000/auth/restablecer-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            codigo_verificacion: code,
            nueva_password: password,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMsg(
          data.message ||
            "No fue posible cambiar la contraseña."
        );
        return;
      }

      setMsg(
        data.message ||
          "Contraseña actualizada correctamente."
      );

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (error) {
      console.error(
        "Error cambiando contraseña:",
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
            Crea una nueva
            <br />
            contraseña <span>segura.</span>
          </h2>

          <p>
            Ya verificamos tu solicitud. Ahora
            establece una nueva contraseña para
            volver a acceder a tu cuenta.
          </p>


          <div className="auth-benefits">

            <span className="auth-benefit">
              🔐 Mayor seguridad
            </span>

            <span className="auth-benefit">
              ✅ Mínimo 8 caracteres
            </span>

            <span className="auth-benefit">
              🚀 Vuelve a acceder
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
          onSubmit={cambiar}
        >

          <h1 className="auth-title">
            Nueva contraseña 🔐
          </h1>

          <p className="auth-subtitle">
            Crea una nueva contraseña para proteger
            tu cuenta y recuperar el acceso.
          </p>


          {/* NUEVA CONTRASEÑA */}

          <label className="auth-label">
            Nueva contraseña
            <span>(Mínimo 8 caracteres)</span>
          </label>

          <div className="input-wrapper">

            <img
              src="http://localhost:3000/uploads/icons/contraseña.png"
              alt="Contraseña"
            />

            <input
              type="password"
              className="input-field"
              placeholder="Ingresa tu nueva contraseña"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);

                if (msg) {
                  setMsg("");
                }
              }}
              disabled={loading}
              autoComplete="new-password"
              minLength={8}
              required
            />

          </div>


          {/* CONFIRMAR CONTRASEÑA */}

          <label className="auth-label">
            Confirmar contraseña
          </label>

          <div className="input-wrapper">

            <img
              src="http://localhost:3000/uploads/icons/contraseña.png"
              alt="Confirmar contraseña"
            />

            <input
              type="password"
              className="input-field"
              placeholder="Repite tu nueva contraseña"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(
                  e.target.value
                );

                if (msg) {
                  setMsg("");
                }
              }}
              disabled={loading}
              autoComplete="new-password"
              minLength={8}
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
              ? "Actualizando..."
              : "Cambiar contraseña"}
          </GlobalButton>


          {msg && (
            <div
              className={`auth-message ${
                msg.toLowerCase().includes(
                  "correctamente"
                )
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