import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginAndRegister.css";
import GlobalButton from "../components/GlobalButton";
import NavComponent from "../components/GlobalNav";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    id_rol: 2, // Por defecto, usuario normal
  });

  const [msg, setMsg] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("http://localhost:3001/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setMsg(data.message);

    if (res.ok) {
      setMsg("Registro exitoso. Ahora inicia sesión.");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    }
  };


  return (
    <>
      <NavComponent />

      {/* FORMULARIO CON VALIDACIÓN */}
      <form onSubmit={handleSubmit} className="auth-container">
        <div className="auth-card">
          <h1 className="auth-title">Crear cuenta</h1>

          <label className="auth-label">Nombre</label>
          <div className="input-wrapper">
            <img src="Backend/uploads/icons/user.webp" alt="usuario" />
            <input className="input-field" type="text" name="nombre" onChange={handleChange} required />
          </div>

          <label className="auth-label">Apellido</label>
          <div className="input-wrapper">
            <img src="Backend/uploads/icons/apellido.png" alt="ape" />
            <input className="input-field" type="text" name="apellido" onChange={handleChange} required />
          </div>

          <label className="auth-label">Correo electrónico</label>
          <div className="input-wrapper">
            <img src="Backend/uploads/icons/email.png" alt="correo" />
            <input className="input-field" type="email" name="email" onChange={handleChange} required />
          </div>

          <label className="auth-label">Contraseña</label>
          <div className="input-wrapper">
            <img src="Backend/uploads/icons/contraseña.png" alt="cont" />
            <input className="input-field" type="password" name="password" onChange={handleChange} required minLength={6} />
          </div>

          <GlobalButton type="submit" style={{ width: "100%", marginBottom: "15px" }}>Registrarse</GlobalButton>

          <p className="auth-link" onClick={() => navigate("/login")}>
            ¿Ya tienes cuenta? Inicia sesión aquí
          </p>

          <p className={`auth-message ${msg.toLowerCase().includes("exitoso") ? "success" : "error"}`}>{msg}</p>
        </div>
      </form>

    </>
  );
}