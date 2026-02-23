import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function VerifyCode() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  const verificar = async () => {
    const res = await fetch("http://localhost:3001/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code })
    });

    const data = await res.json();
    setMsg(data.message);

    if (res.ok) {
      navigate("/reset-password?email=" + email);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Verificar código</h1>

        <label className="auth-label">Correo</label>
        <div className="input-wrapper">
          <input
            type="email"
            className="input-field"
            value={email}
            readOnly
          />
        </div>

        <label className="auth-label">Código</label>
        <div className="input-wrapper">
          <input
            type="text"
            className="input-field"
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <button onClick={verificar}>Verificar</button>

        <p style={{ marginTop: "10px", color: "red" }}>{msg}</p>
      </div>
    </div>
  );
}
