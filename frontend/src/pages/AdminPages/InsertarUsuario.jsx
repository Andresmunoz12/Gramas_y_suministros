import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
import UsuariosService from "../../api/services/usuarios.service";
import "../../styles/UserInsert.css";

const InsertarUsuario = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password_hash: "",
    id_rol: "", // 1 = Admin, 2 = Cliente
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
  const [showPassword, setShowPassword] = useState(false);

  // Opciones de rol
  const roles = [
    { id: 1, nombre: "Administrador" },
    { id: 2, nombre: "Cliente" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: "", texto: "" });

    try {
      // Validar campos obligatorios
      if (!formData.nombre || !formData.apellido || !formData.email || !formData.password_hash || !formData.id_rol) {
        setMensaje({
          tipo: "error",
          texto: "Por favor completa todos los campos obligatorios (*)",
        });
        setLoading(false);
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setMensaje({
          tipo: "error",
          texto: "Por favor ingresa un correo electrónico válido",
        });
        setLoading(false);
        return;
      }

      // Validar longitud de contraseña
      if (formData.password_hash.length < 6) {
        setMensaje({
          tipo: "error",
          texto: "La contraseña debe tener al menos 6 caracteres",
        });
        setLoading(false);
        return;
      }

      // Preparar datos para enviar
      const userData = {
        nombre: formData.nombre.trim(),
        apellido: formData.apellido.trim(),
        email: formData.email.trim().toLowerCase(),
        password_hash: formData.password_hash,
        id_rol: parseInt(formData.id_rol),
      };

      console.log("📤 Enviando datos:", userData);

      // Usar el servicio para crear el usuario
      const result = await UsuariosService.create(userData);

      console.log("✅ Usuario creado:", result);

      setMensaje({
        tipo: "success",
        texto: `¡Usuario ${result.nombre} ${result.apellido} creado exitosamente!`,
      });

      // Limpiar formulario
      setFormData({
        nombre: "",
        apellido: "",
        email: "",
        password_hash: "",
        id_rol: "",
      });

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate("/usuarios");
      }, 2000);
    } catch (error) {
      console.error("❌ Error al crear usuario:", error);

      let errorMsg = "Error al crear el usuario";

      // Manejar errores del backend
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          errorMsg = error.response.data.message.join(", ");
        } else {
          errorMsg = error.response.data.message;
        }
      } else if (error.message) {
        errorMsg = error.message;
      }

      setMensaje({
        tipo: "error",
        texto: errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <NavComponent />

      <div className="user-insert-container">
        <div className="user-insert-header">
          <h2>Agregar Usuario</h2>
          <p>Gestión de usuarios - Completa todos los campos obligatorios (*)</p>
        </div>

        {mensaje.texto && (
          <div
            className={`alert ${mensaje.tipo}`}
            style={{
              padding: "12px",
              marginBottom: "20px",
              borderRadius: "5px",
              backgroundColor:
                mensaje.tipo === "success" ? "#d4edda" : "#f8d7da",
              color: mensaje.tipo === "success" ? "#155724" : "#721c24",
              border: `1px solid ${
                mensaje.tipo === "success" ? "#c3e6cb" : "#f5c6cb"
              }`,
            }}
          >
            {mensaje.texto}
          </div>
        )}

        <form className="user-insert-grid" onSubmit={handleSubmit}>
          {/* Columna 1 - Datos personales */}
          <div className="user-data-column">
            <h3 className="section-title">Datos Personales</h3>

            <div className="field">
              <label>Nombre *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Juan"
              />
            </div>

            <div className="field">
              <label>Apellido *</label>
              <input
                type="text"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                required
                placeholder="Ej: Pérez"
              />
            </div>

            <div className="field">
              <label>Correo Electrónico *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="ejemplo@correo.com"
              />
            </div>
          </div>

          {/* Columna 2 - Credenciales y Rol */}
          <div className="user-data-column">
            <h3 className="section-title">Credenciales y Rol</h3>

            <div className="field">
              <label>Contraseña *</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password_hash"
                  value={formData.password_hash}
                  onChange={handleChange}
                  required
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div className="field">
              <label>Rol *</label>
              <select
                name="id_rol"
                value={formData.id_rol}
                onChange={handleChange}
                required
                className="select-role"
              >
                <option value="">Seleccione un rol</option>
                {roles.map((rol) => (
                  <option key={rol.id} value={rol.id}>
                    {rol.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Columna 3 - Resumen y Acciones */}
          <div className="user-data-column">
            <h3 className="section-title">Resumen</h3>

            <div className="user-summary">
              <div className="summary-item">
                <span className="summary-label">Nombre completo:</span>
                <span className="summary-value">
                  {formData.nombre || formData.apellido
                    ? `${formData.nombre || ""} ${formData.apellido || ""}`.trim()
                    : "No especificado"}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Email:</span>
                <span className="summary-value">
                  {formData.email || "No especificado"}
                </span>
              </div>

              <div className="summary-item">
                <span className="summary-label">Rol:</span>
                <span className="summary-value">
                  {formData.id_rol
                    ? roles.find((r) => r.id === parseInt(formData.id_rol))
                        ?.nombre || "No seleccionado"
                    : "No seleccionado"}
                </span>
              </div>
            </div>

            <div className="actions">
              <button
                type="button"
                onClick={handleGoBack}
                disabled={loading}
                className="btn-secondary"
              >
                Regresar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? "Creando usuario..." : "Crear Usuario"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default InsertarUsuario;