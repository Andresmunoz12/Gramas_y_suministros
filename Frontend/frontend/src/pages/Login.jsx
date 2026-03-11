import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginAndRegister.css";
import GlobalButton from "../components/GlobalButton";
import NavComponent from "../components/GlobalNav";
import api from "../api/axios";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleLogin = async () => {
    // Validamos que no envíen campos vacíos antes de llamar a la API
    if (!email || !password) {
      setMsg("error: Por favor completa todos los campos.");
      return;
    }

    try {
      const res = await api.post("/auth/login", {
        email: email,
        password_hash: password // <--- Enviamos 'password' pero con el nombre 'password_hash' que pide NestJS
      });

      const data = res.data;

      // GUARDAR DATOS EN LOCALSTORAGE
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("usuario", JSON.stringify(data.user));

      setMsg("¡Bienvenido!");

      // REDIRECCIÓN SEGÚN ROL
      // Asumiendo que id_rol 1 es Admin y 2 es Cliente
      if (data.user.id_rol === 1) {
        navigate("/perfil");
      } else {
        navigate("/");
      }

    } catch (error) {
      // Manejo de errores profesional
      const errorMsg = error.response?.data?.message || "Error: Credenciales inválidas";
      setMsg(`error: ${errorMsg}`);
    }
  };

  return (
    <>
      <NavComponent />
      <div className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Iniciar sesión</h1>

          <label className="auth-label">Dirección de correo <span>(Correo electrónico)</span></label>
          <div className="input-wrapper">
            {/* Asegúrate que la ruta de la imagen sea correcta respecto a tu carpeta public */}
            <img src="/icons/email.png" alt="correo" />
            <input
              type="email"
              className="input-field"
              placeholder="ejemplo@correo.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <label className="auth-label">Contraseña</label>
          <div className="input-wrapper">
            <img src="/icons/contraseña.png" alt="password" />
            <input
              type="password"
              className="input-field"
              placeholder="********"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <GlobalButton onClick={handleLogin} style={{ width: "100%", marginBottom: "15px" }}>
            Continuar
          </GlobalButton>

          <p className="auth-link" onClick={() => navigate("/forgot-password")}>
            ¿Olvidaste tu contraseña?
          </p>
          <br />
          <p className="auth-link" onClick={() => navigate("/register")}>
            ¿No tienes cuenta? Regístrate aquí
          </p>

          {msg && (
            <p className={`auth-message ${msg.toLowerCase().includes("error") ? "error" : "success"}`}>
              {msg.replace("error: ", "")}
            </p>
          )}
        </div>
      </div>
    </>
  );
}