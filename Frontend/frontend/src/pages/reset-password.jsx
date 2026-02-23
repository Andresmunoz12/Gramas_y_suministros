import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const email = params.get("email");

  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const cambiar = async () => {
    const res = await fetch("http://localhost:3001/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    setMsg(data.message);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Nueva contraseña</h1>

        <label className="auth-label">Nueva contraseña</label>
        <div className="input-wrapper">
          <input type="password" className="input-field" onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button onClick={cambiar}>Cambiar</button>

        <p style={{ marginTop: "10px", color: "red" }}>{msg}</p>
      </div>
    </div>
  );
}
