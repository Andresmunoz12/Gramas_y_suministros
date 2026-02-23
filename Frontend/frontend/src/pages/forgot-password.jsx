import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const navigate = useNavigate();

  const enviarCodigo = async () => {
    const res = await fetch("http://localhost:3001/api/auth/forgot-password", {
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
          <img src="/icons/mail.png" alt="correo" />
          <input
            type="email"
            className="input-field"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <button onClick={enviarCodigo}>Enviar código</button>

        <p style={{ marginTop: "10px", color: "red" }}>{msg}</p>
      </div>
    </div>
  );
}
