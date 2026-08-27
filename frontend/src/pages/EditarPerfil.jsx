import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UsuariosService from "../api/services/usuarios.service";
import NavComponent from "../components/GlobalNav";
import { secureStorage } from "../utils/secureStorage";
import "../styles/EditarPerfil.css";

export default function EditarPerfil() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser, refreshUser } = useAuth(); // 👈 AGREGAR updateUser y refreshUser
  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Cargar datos desde el backend para asegurar que tenemos el apellido
    const cargarDatos = async () => {
      try {
        const data = await UsuariosService.getById(user.id_usuario);
        setFormData({
          nombre: data.nombre || "",
          apellido: data.apellido || "",
          email: data.email || "",
        });
      } catch (error) {
        // Fallback a los datos del contexto
        setFormData({
          nombre: user.nombre || "",
          apellido: user.apellido || "",
          email: user.email || "",
        });
      }
    };

    cargarDatos();
  }, [user, isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (message.text) setMessage({ type: "", text: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!formData.nombre.trim() || !formData.apellido.trim() || !formData.email.trim()) {
      setMessage({
        type: "error",
        text: "Todos los campos son obligatorios",
      });
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setMessage({
        type: "error",
        text: "Por favor ingresa un correo electrónico válido",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await UsuariosService.update(user.id_usuario, {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim().toLowerCase(),
      });

      if (response.actualizado) {
        setSuccess(true);
        setMessage({
          type: "success",
          text: response.mensaje || "¡Perfil actualizado exitosamente!",
        });

        // ✅ ACTUALIZAR EL CONTEXTO y localStorage
        const updatedUser = {
          id_usuario: user.id_usuario,
          nombre: formData.nombre.trim(),
          apellido: formData.apellido.trim(),
          email: formData.email.trim().toLowerCase(),
          id_rol: user.id_rol,
        };

        // Actualizar contexto usando updateUser
        updateUser(updatedUser);

        // También actualizar localStorage (updateUser ya lo hace, pero por si acaso)
        secureStorage.setItem("user", JSON.stringify(updatedUser));

        // Redirigir después de 2 segundos
        setTimeout(() => navigate("/perfil"), 2000);
      } else {
        setMessage({
          type: "error",
          text: response.mensaje || "Error al actualizar el perfil",
        });
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);

      let errorMsg = "Error al conectar con el servidor";
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMsg = error.response.data.message.join(", ");
        } else {
          errorMsg = error.response.data.message;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }

      setMessage({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="dashboard">
      <NavComponent />
      <main className="edit-perfil-main">
        <div className="edit-perfil-container">
          <div className="edit-perfil-card">
            <div className="edit-perfil-header">
              <div className="header-icon">✏️</div>
              <div className="header-text">
                <h2>Editar Perfil</h2>
                <p>Actualiza tu información personal</p>
              </div>
            </div>

            {message.text && (
              <div className={`edit-message ${message.type}`}>
                <span>{message.type === "success" ? "✅" : "❌"}</span>
                {message.text}
              </div>
            )}

            {success && (
              <div className="edit-message success">
                <span>✅</span> ¡Perfil actualizado! Redirigiendo...
              </div>
            )}

            <form onSubmit={handleSubmit} className="edit-form">
              <div className="edit-grid">
                <div className="input-group">
                  <label htmlFor="nombre">
                    Nombre <span className="required">*</span>
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    placeholder="Tu nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    disabled={loading || success}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="apellido">
                    Apellido <span className="required">*</span>
                  </label>
                  <input
                    id="apellido"
                    name="apellido"
                    type="text"
                    placeholder="Tu apellido"
                    value={formData.apellido}
                    onChange={handleChange}
                    disabled={loading || success}
                  />
                </div>

                <div className="input-group full-width">
                  <label htmlFor="email">
                    Correo Electrónico <span className="required">*</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading || success}
                  />
                </div>

                <div className="input-group full-width">
                  <div className="info-box">
                    <span>🔒</span>
                    <p>La contraseña no se puede cambiar aquí. Si necesitas cambiarla, utiliza la opción "Olvidé mi contraseña" en el inicio de sesión.</p>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn-save"
                  disabled={loading || success}
                >
                  {loading ? (
                    <>
                      <span className="spinner-small"></span> Guardando...
                    </>
                  ) : success ? (
                    "✅ Guardado"
                  ) : (
                    "Guardar Cambios"
                  )}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => navigate("/perfil")}
                  disabled={loading}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}