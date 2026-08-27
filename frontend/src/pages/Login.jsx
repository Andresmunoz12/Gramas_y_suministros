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
      
      // ✅ Manejar errores de cuenta desactivada/suspendida
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || "";
        
        if (errorMessage.toLowerCase().includes("desactivada")) {
          setMsg("🔒 Tu cuenta ha sido desactivada temporalmente. Comunícate con la línea de atención al cliente para más información.");
        } else if (errorMessage.toLowerCase().includes("suspendida")) {
          setMsg("⛔ Tu cuenta ha sido suspendida. Por favor, contacta al administrador del sistema.");
        } else if (errorMessage.toLowerCase().includes("credenciales")) {
          setMsg("❌ Credenciales inválidas. Por favor, verifica tu email y contraseña.");
        } else {
          setMsg(errorMessage);
        }
      } else if (error.response?.status === 401) {
        setMsg("❌ Credenciales inválidas. Por favor, verifica tu email y contraseña.");
      } else {
        setMsg(error.message || "Error al iniciar sesión");
      }
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
            <img src="http://localhost:3000/uploads/icons/email.png" alt="correo" />
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
            <img src="http://localhost:3000/uploads/icons/contraseña.png" alt="password" />
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

          {/* ✅ Mensaje mejorado con estilos según el tipo */}
          <p 
            className="auth-message" 
            style={{
              color: msg.toLowerCase().includes("desactivada") || msg.toLowerCase().includes("suspendida") 
                ? '#856404' 
                : msg.toLowerCase().includes("error") || msg.toLowerCase().includes("inválidas") 
                ? '#dc3545' 
                : '#28a745',
              backgroundColor: msg.toLowerCase().includes("desactivada") || msg.toLowerCase().includes("suspendida")
                ? '#fff3cd'
                : msg.toLowerCase().includes("error") || msg.toLowerCase().includes("inválidas")
                ? '#f8d7da'
                : '#d4edda',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: msg.toLowerCase().includes("desactivada") || msg.toLowerCase().includes("suspendida")
                ? '#ffc107'
                : msg.toLowerCase().includes("error") || msg.toLowerCase().includes("inválidas")
                ? '#f5c6cb'
                : '#c3e6cb',
              marginTop: '16px',
              fontSize: '14px',
              lineHeight: '1.5',
              whiteSpace: 'pre-line',
              textAlign: 'center',
              display: msg ? 'block' : 'none'
            }}
          >
            {msg}
          </p>
        </div>
      </div>
    </>
  );
}