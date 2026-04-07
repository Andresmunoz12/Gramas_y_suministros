import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import UsuariosService from "../api/services/usuarios.service";
import NavComponent from "../components/GlobalNav";
import "../styles/EditarPerfil.css";
import "../styles/Perfil.css";

export default function EditarPerfil() {
  const navigate = useNavigate();
  const { user, isAuthenticated, login } = useAuth(); // login para refrescar el contexto si es necesario
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
  });

  useEffect(() => {
    // Verificar autenticación
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Si es admin, redirigir al panel
    if (user?.id_rol === 1) {
      navigate("/panel");
      return;
    }

    // Cargar datos del usuario desde el contexto
    if (user) {
      setFormData({
        nombre: user.nombre || "",
        apellido: user.apellido || "",
        email: user.email || "",
      });
    }
  }, [user, isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Usar el servicio de usuarios para actualizar
      const response = await UsuariosService.update(user.id_usuario, {
        nombre: formData.nombre,
        apellido: formData.apellido,
        email: formData.email,
      });

      if (response.actualizado) {
        setMessage("✅ " + (response.mensaje || "Perfil actualizado exitosamente"));

        // Actualizar el usuario en localStorage a través del contexto
        // Recargar los datos del usuario
        const updatedUser = {
          ...user,
          nombre: formData.nombre,
          apellido: formData.apellido,
          email: formData.email,
        };
        
        // Actualizar localStorage directamente (el contexto se actualizará al recargar)
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Opcional: Emitir evento para que el contexto se actualice sin recargar
        window.dispatchEvent(new Event("storage"));
        
        setTimeout(() => navigate("/perfil"), 2000);
      } else {
        setMessage("❌ " + (response.mensaje || "Error al actualizar el perfil"));
      }
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      
      let errorMsg = "❌ Error al conectar con el servidor";
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMsg = "❌ " + error.response.data.message.join(", ");
        } else {
          errorMsg = "❌ " + error.response.data.message;
        }
      } else if (error.message) {
        errorMsg = "❌ " + error.message;
      }
      
      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar nada mientras verifica autenticación
  if (!isAuthenticated || user?.id_rol === 1) {
    return null;
  }

  return (
    <div className="dashboard">
      <NavComponent />
      <main>
        <div className="edit-profile-card glass-effect">
          <h2>Editar mi Perfil</h2>
          <p className="subtitle">Actualiza tu información personal para mejores pedidos</p>

          <form onSubmit={handleSubmit} className="edit-form">
            <div className="edit-grid">
              <div className="input-block">
                <label>Nombre *</label>
                <input
                  name="nombre"
                  placeholder="Tu nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="input-block">
                <label>Apellido</label>
                <input
                  name="apellido"
                  placeholder="Tu apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                />
              </div>
              <div className="input-block">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="correo@ejemplo.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {message && (
                <div className={`status-message ${message.includes('✅') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? "Procesando..." : "Guardar Cambios"}
              </button>
              <button type="button" className="btn-cancel" onClick={() => navigate("/perfil")}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}