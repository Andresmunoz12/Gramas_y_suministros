import { useState } from "react";
import { useNavigate } from "react-router-dom";
import UsuariosService from "../api/services/usuarios.service";
import "../styles/LoginAndRegister.css";
import GlobalButton from "../components/GlobalButton";
import NavComponent from "../components/GlobalNav";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password_hash: "", // ⚠️ Importante: El backend espera "password_hash"
    id_rol: 2, // Por defecto, rol de cliente (2)
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ texto: "", tipo: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Mapear 'password' del input a 'password_hash' que espera el backend
    const fieldName = name === "password" ? "password_hash" : name;
    setForm({ ...form, [fieldName]: value });
    // Limpiar mensaje cuando el usuario empieza a escribir
    if (msg.texto) setMsg({ texto: "", tipo: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ texto: "", tipo: "" });

    // Validar que la contraseña tenga al menos 6 caracteres
    if (form.password_hash.length < 6) {
      setMsg({ 
        texto: "La contraseña debe tener al menos 6 caracteres", 
        tipo: "error" 
      });
      setLoading(false);
      return;
    }

    try {
      // Datos a enviar al backend
      const datosEnvio = {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password_hash: form.password_hash,
        id_rol: form.id_rol,
      };

      const response = await UsuariosService.create(datosEnvio);
      
      setMsg({ 
        texto: response.mensaje || "Registro exitoso. Ahora inicia sesión.", 
        tipo: "success" 
      });

      // Limpiar formulario
      setForm({
        nombre: "",
        apellido: "",
        email: "",
        password_hash: "",
        id_rol: 2,
      });

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate("/login");
      }, 2000);
      
    } catch (error) {
      console.error("Error en registro:", error);
      
      let errorMsg = "Error al registrarse";
      
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMsg = error.response.data.message.join(", ");
        } else {
          errorMsg = error.response.data.message;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      setMsg({ texto: errorMsg, tipo: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavComponent />

      <form onSubmit={handleSubmit} className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Crear cuenta</h1>

          {msg.texto && (
            <div className={`auth-message ${msg.tipo}`} style={{
              padding: '10px',
              marginBottom: '15px',
              borderRadius: '5px',
              textAlign: 'center',
              backgroundColor: msg.tipo === 'success' ? '#d4edda' : '#f8d7da',
              color: msg.tipo === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${msg.tipo === 'success' ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {msg.texto}
            </div>
          )}

          <label className="auth-label">Nombre *</label>
          <div className="input-wrapper">
            <img src="/Backend/uploads/icons/user.webp" alt="usuario" />
            <input 
              className="input-field" 
              type="text" 
              name="nombre" 
              value={form.nombre}
              onChange={handleChange} 
              required 
            />
          </div>

          <label className="auth-label">Apellido</label>
          <div className="input-wrapper">
            <img src="/Backend/uploads/icons/apellido.png" alt="ape" />
            <input 
              className="input-field" 
              type="text" 
              name="apellido" 
              value={form.apellido}
              onChange={handleChange} 
            />
          </div>

          <label className="auth-label">Correo electrónico *</label>
          <div className="input-wrapper">
            <img src="/Backend/uploads/icons/email.png" alt="correo" />
            <input 
              className="input-field" 
              type="email" 
              name="email" 
              value={form.email}
              onChange={handleChange} 
              required 
            />
          </div>

          <label className="auth-label">Contraseña *</label>
          <div className="input-wrapper">
            <img src="/Backend/uploads/icons/contraseña.png" alt="cont" />
            <input 
              className="input-field" 
              type="password" 
              name="password" 
              value={form.password}
              onChange={handleChange} 
              required 
              minLength={6}
            />
          </div>

          <GlobalButton 
            type="submit" 
            disabled={loading}
            style={{ 
              width: "100%", 
              marginBottom: "15px",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Registrando..." : "Registrarse"}
          </GlobalButton>

          <p className="auth-link" onClick={() => navigate("/login")}>
            ¿Ya tienes cuenta? Inicia sesión aquí
          </p>
        </div>
      </form>
    </>
  );
}