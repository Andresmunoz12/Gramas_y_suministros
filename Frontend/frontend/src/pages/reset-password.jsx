import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import GlobalButton from "../components/GlobalButton";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get("email");

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const cambiar = async () => {
    const code = params.get("code");
    const res = await fetch("http://localhost:3000/auth/restablecer-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo_verificacion: code,
        nueva_password: password
      })
    });

    const data = await res.json();
    setMsg(data.message);

    if (res.ok) {
      setTimeout(() => navigate("/login"), 2000);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Nueva contraseña</h1>

        <label className="auth-label">Nueva contraseña</label>
        <div className="input-wrapper">
          <img src="http://localhost:3000/uploads/icons/contraseña.png" alt="password" style={{ width: "20px", marginRight: "12px", opacity: 0.6 }} />
          <input type="password" className="input-field" onChange={(e) => setPassword(e.target.value)} />
        </div>

        <GlobalButton onClick={cambiar} style={{ width: "100%", marginBottom: "15px" }}>
          Cambiar
        </GlobalButton>

        <p className="auth-link" onClick={() => navigate("/login")} style={{ textAlign: "center", marginTop: "10px" }}>
          Volver a Iniciar Sesión
        </p>

        <p style={{ marginTop: "10px", color: "red", textAlign: "center" }}>{msg}</p>
      </div>
    </div>
  );
}
