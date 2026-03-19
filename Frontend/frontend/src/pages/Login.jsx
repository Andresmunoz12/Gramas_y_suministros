import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/LoginAndRegister.css";
import GlobalButton from "../components/GlobalButton";
import NavComponent from "../components/GlobalNav";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setMsg("");

    try {
      console.log("1. Intentando login con:", { email });
      const data = await login({ email, password_hash: password });

      console.log("2. Respuesta completa:", data);
      console.log("3. User recibido:", data.user);
      console.log("4. Rol del usuario:", data.user?.id_rol);

      setMsg("Inicio de sesión exitoso");

      // REDIRECCIÓN SEGÚN ROL
      if (data.user?.id_rol === 1) {
        console.log("👉 Redirigiendo a /panel (Admin)");
        navigate("/panel");
      } else if (data.user?.id_rol === 2) {
        console.log("👉 Redirigiendo a / (Cliente)");
        navigate("/");
      } else {
        console.log("❌ Rol no reconocido:", data.user?.id_rol);
        setMsg("Rol de usuario no reconocido");
      }

    } catch (error) {
      console.error("❌ Error completo:", error);
      setMsg(error.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
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
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Contraseña */}
          <label className="auth-label">Contraseña</label>
          <div className="input-wrapper">
            <img src="Backend/uploads/icons/contraseña.png" alt="password" />
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <GlobalButton
            onClick={handleLogin}
            style={{ width: "100%", marginBottom: "15px" }}
            disabled={loading}
          >
            {loading ? "Iniciando sesión..." : "Continuar"}
          </GlobalButton>

          <p className="auth-link" onClick={() => !loading && navigate("/forgot-password")}>
            ¿Olvidaste tu contraseña?
          </p>

          <br />

          <p className="auth-link" onClick={() => !loading && navigate("/register")}>
            ¿No tienes cuenta? Regístrate aquí
          </p>

          <p className={`auth-message ${msg.toLowerCase().includes("error") ? "error" : "success"}`}>
            {msg}
          </p>
        </div>
      </div>
    </>
  );
}