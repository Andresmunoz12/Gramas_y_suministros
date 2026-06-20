import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GlobalButton from "../components/GlobalButton";

export default function VerifyCode() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState(params.get("email") || "");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");

  const verificar = async () => {
    // Como el backend verifica el código al cambiar la contraseña, 
    // pasamos el código a la siguiente página.
    if (code.length === 6) {
      navigate(`/reset-password?email=${email}&code=${code}`);
    } else {
      setMsg("El código debe tener 6 dígitos");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Verificar código</h1>

        <label className="auth-label">Correo</label>
        <div className="input-wrapper">
          <img src="http://localhost:3000/uploads/icons/email.png" alt="correo" style={{ width: "20px", marginRight: "12px", opacity: 0.6 }} />
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

        <GlobalButton onClick={verificar} style={{ width: "100%", marginBottom: "15px" }}>
          Verificar
        </GlobalButton>

        <p className="auth-link" onClick={() => navigate("/login")} style={{ textAlign: "center", marginTop: "10px" }}>
          Volver a Iniciar Sesión
        </p>

        <p style={{ marginTop: "10px", color: "red", textAlign: "center" }}>{msg}</p>
      </div>
    </div>
  );
}
