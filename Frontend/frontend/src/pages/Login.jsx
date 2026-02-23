import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginAndRegister.css";
import GlobalButton from "../components/GlobalButton";
import NavComponent from "../components/GlobalNav";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    const res = await fetch("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    setMsg(data.message);

    if (!res.ok) return;

    // GUARDAR TOKEN Y DATOS DEL USUARIO
    localStorage.setItem("token", data.token);
    localStorage.setItem("id_rol", data.user.id_rol);

    // 🔥 CLAVE para que funcione Dashboard
    localStorage.setItem("usuario", JSON.stringify(data.user));

    // REDIRECCIÓN SEGÚN ROL

    if (data.user.id_rol === 1) {
      navigate("/perfil");   // Admin
    } else if (data.user.id_rol === 2) {
      navigate("/");    // Cliente
    } else {
      navigate("/login");
    }
  };

  return (
    <>
      <NavComponent />
      <div className="auth-container">

        <div className="auth-card">

          <h1 className="auth-title">Iniciar sesión</h1>

          {/* Correo */}
          <label className="auth-label">Dirección de correo <span>(Correo electrónico)</span></label>
          <div className="input-wrapper">
            <img src="Backend/uploads/icons/email.png" alt="correo" />
            <input type="email" className="input-field" onChange={(e) => setEmail(e.target.value)} />
          </div>

          {/* Contraseña */}
          <label className="auth-label">Contraseña</label>
          <div className="input-wrapper">
            <img src="Backend/uploads/icons/contraseña.png" alt="password" />
            <input type="password" className="input-field" onChange={(e) => setPassword(e.target.value)} />
          </div>

          <GlobalButton onClick={handleLogin} style={{ width: "100%", marginBottom: "15px" }}>Continuar</GlobalButton>

          <p className="auth-link" onClick={() => navigate("/forgot-password")}>
            ¿Olvidaste tu contraseña?
          </p>

          <br />

          <p className="auth-link" onClick={() => navigate("/register")}>
            ¿No tienes cuenta? Regístrate aquí
          </p>

          <p className={`auth-message ${msg.toLowerCase().includes("error") ? "error" : "success"}`}>{msg}</p>
        </div>
      </div>
    </>
  );
}