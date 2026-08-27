import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GlobalButton from "../components/GlobalButton";
import "../styles/LoginAndRegister.css";

export default function VerifyCode() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const emailInicial = params.get("email") || "";

  const [email] = useState(emailInicial);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  const verificar = (e) => {
    e.preventDefault();

    setMsg("");

    if (!code) {
      setMsg("Por favor, ingresa el código de verificación.");
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setMsg("El código debe contener exactamente 6 dígitos.");
      return;
    }

    navigate(
      `/reset-password?email=${encodeURIComponent(
        email
      )}&code=${encodeURIComponent(code)}`
    );
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
            Un paso más
            <br />
            y estarás <span>dentro.</span>
          </h2>

          <p>
            Revisa tu correo electrónico e ingresa
            el código de seis dígitos que recibiste
            para verificar tu identidad.
          </p>


          <div className="auth-benefits">

            <span className="auth-benefit">
              📩 Revisa tu correo
            </span>

            <span className="auth-benefit">
              🔢 Código de 6 dígitos
            </span>

            <span className="auth-benefit">
              🛡️ Acceso protegido
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
          onSubmit={verificar}
        >

          <h1 className="auth-title">
            Verificar código 🔢
          </h1>

          <p className="auth-subtitle">
            Ingresa el código de 6 dígitos que
            enviamos a tu correo electrónico.
          </p>


          {/* CORREO */}

          <label className="auth-label">
            Correo electrónico
          </label>

          <div className="input-wrapper">

            <img
              src="http://localhost:3000/uploads/icons/email.png"
              alt="Correo electrónico"
            />

            <input
              type="email"
              className="input-field"
              value={email}
              readOnly
            />

          </div>


          {/* CÓDIGO */}

          <label className="auth-label">
            Código de verificación
            <span>(6 dígitos)</span>
          </label>

          <div className="input-wrapper">

            <span
              style={{
                fontSize: "20px",
                marginRight: "12px",
                opacity: 0.55,
              }}
            >
              🔢
            </span>

            <input
              type="text"
              className="input-field"
              placeholder="000000"
              value={code}
              onChange={(e) => {
                const value =
                  e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6);

                setCode(value);

                if (msg) {
                  setMsg("");
                }
              }}
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              required
            />

          </div>


          <GlobalButton
            type="submit"
            style={{
              width: "100%",
              marginBottom: "10px",
            }}
          >
            Verificar código
          </GlobalButton>


          {msg && (
            <div className="auth-message error">
              {msg}
            </div>
          )}


          <p
            className="auth-link"
            onClick={() => navigate("/login")}
          >
            ← Volver a iniciar sesión
          </p>

        </form>

      </main>

    </div>
  );
}