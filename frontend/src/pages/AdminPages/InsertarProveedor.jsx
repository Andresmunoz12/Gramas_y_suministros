// src/pages/AdminPages/InsertarProveedor.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
import ProveedoresService from "../../api/services/proveedores.service";
import "../../styles/ProductInsert.css";
import "../../styles/ProveedorInsert.css";

const InsertarProveedor = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
  });

  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

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
      if (!formData.nombre.trim()) {
        setMensaje({
          tipo: "error",
          texto: "El nombre del proveedor es obligatorio"
        });
        setLoading(false);
        return;
      }

      // Crear objeto con datos limpios
      const data = {
        nombre: formData.nombre.trim(),
        contacto: formData.contacto.trim() || undefined,
        telefono: formData.telefono.trim() || undefined,
        email: formData.email.trim() || undefined,
        direccion: formData.direccion.trim() || undefined,
      };

      // Validar email si se proporciona
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        setMensaje({
          tipo: "error",
          texto: "El formato del email no es válido"
        });
        setLoading(false);
        return;
      }

      // Validar teléfono si se proporciona
      if (data.telefono && !/^\d+$/.test(data.telefono)) {
        setMensaje({
          tipo: "error",
          texto: "El teléfono solo puede contener números"
        });
        setLoading(false);
        return;
      }

      await ProveedoresService.create(data);

      setMensaje({
        tipo: "success",
        texto: "¡Proveedor creado exitosamente!"
      });

      // Limpiar formulario
      setFormData({
        nombre: "",
        contacto: "",
        telefono: "",
        email: "",
        direccion: "",
      });

      // Redirigir después de 2 segundos
      setTimeout(() => {
        navigate("/proveedores");
      }, 2000);

    } catch (error) {
      console.error("Error al crear proveedor:", error);

      let errorMsg = "Error al crear el proveedor";
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
        texto: errorMsg
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate("/proveedores");
  };

  return (
    <>
      <NavComponent />

      <div className="insert-container">
        <div className="insert-header">
          <h2>Agregar Proveedor</h2>
          <p>Gestión de proveedores - Completa todos los campos obligatorios (*)</p>
        </div>

        {mensaje.texto && (
          <div className={`alert ${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        <form className="insert-grid proveedor-grid" onSubmit={handleSubmit}>
          <div className="data-column full-width">
            <div className="field">
              <label>Nombre del Proveedor *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Vivero El Rosal"
              />
            </div>

            <div className="row">
              <div className="field">
                <label>Contacto</label>
                <input
                  type="text"
                  name="contacto"
                  value={formData.contacto}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div className="field">
                <label>Teléfono</label>
                <input
                  type="text"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                  placeholder="Ej: 3001234567"
                />
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Ej: contacto@vivero.com"
                />
              </div>

              <div className="field">
                <label>Dirección</label>
                <input
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Calle 10 #45-12, Bogotá"
                />
              </div>
            </div>

            <div className="actions">
              <button
                type="button"
                onClick={handleGoBack}
                disabled={loading}
                className="btn-cancel"
              >
                Regresar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-submit"
              >
                {loading ? "Guardando..." : "Guardar Proveedor"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default InsertarProveedor;