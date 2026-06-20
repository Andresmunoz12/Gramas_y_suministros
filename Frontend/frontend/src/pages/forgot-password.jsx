import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GlobalButton from "../components/GlobalButton";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const enviarCodigo = async () => {
    const res = await fetch("http://localhost:3000/auth/solicitar-codigo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    setMsg(data.message);

    if (res.ok) {
      // LLEVA AL USUARIO A INGRESAR EL CÓDIGO
      navigate("/verify-code?email=" + email);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Recuperar contraseña</h1>

        <label className="auth-label">Correo registrado</label>
        <div className="input-wrapper">
          <img src="http://localhost:3000/uploads/icons/email.png" alt="correo" />
          <input
            type="email"
            className="input-field"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <GlobalButton onClick={enviarCodigo} style={{ width: "100%", marginBottom: "15px" }}>
          Enviar código
        </GlobalButton>

        <p className="auth-link" onClick={() => navigate("/login")} style={{ textAlign: "center", marginTop: "10px" }}>
          Volver a Iniciar Sesión
        </p>

        <p style={{ marginTop: "10px", color: "red", textAlign: "center" }}>{msg}</p>
      </div>
    </div>
  );
}
