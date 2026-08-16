// src/pages/AdminPages/InsertarCategoria.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
import CategoriasService from "../../api/services/categorias.service";
import "../../styles/ProductInsert.css";
import "../../styles/CategoriaInsert.css";

const InsertarCategoria = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
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
      if (!formData.nombre.trim()) {
        setMensaje({
          tipo: "error",
          texto: "El nombre de la categoría es obligatorio"
        });
        setLoading(false);
        return;
      }

      if (formData.nombre.trim().length < 3) {
        setMensaje({
          tipo: "error",
          texto: "El nombre debe tener al menos 3 caracteres"
        });
        setLoading(false);
        return;
      }

      if (!formData.descripcion.trim()) {
        setMensaje({
          tipo: "error",
          texto: "La descripción es obligatoria"
        });
        setLoading(false);
        return;
      }

      await CategoriasService.create({
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
      });

      setMensaje({
        tipo: "success",
        texto: "¡Categoría creada exitosamente!"
      });

      setFormData({ nombre: "", descripcion: "" });

      setTimeout(() => {
        navigate("/categorias");
      }, 2000);

    } catch (error) {
      console.error("Error al crear categoría:", error);

      let errorMsg = "Error al crear la categoría";
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
    navigate("/categorias");
  };

  return (
    <>
      <NavComponent />

      <div className="insert-container">
        <div className="insert-header">
          <h2>Agregar Categoría</h2>
          <p>Gestión de categorías - Completa todos los campos obligatorios (*)</p>
        </div>

        {mensaje.texto && (
          <div className={`alert ${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        <form className="insert-grid categoria-grid" onSubmit={handleSubmit}>
          <div className="data-column full-width">
            <div className="field">
              <label>Nombre de la Categoría *</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
                placeholder="Ej: Deportiva"
              />
            </div>

            <div className="field">
              <label>Descripción *</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                required
                placeholder="Ej: Productos para actividades deportivas"
                rows={4}
                style={{ resize: 'vertical' }}
              />
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
                {loading ? "Guardando..." : "Guardar Categoría"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default InsertarCategoria;