// src/pages/AdminPages/EditarCategoria.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
import CategoriasService from "../../api/services/categorias.service";
import "../../styles/ProductInsert.css";
import "../../styles/CategoriaInsert.css";

const EditarCategoria = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
  });

  const [loading, setLoading] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  useEffect(() => {
    const cargarCategoria = async () => {
      try {
        const data = await CategoriasService.getById(id);
        setFormData({
          nombre: data.nombre || "",
          descripcion: data.descripcion || "",
        });
      } catch (error) {
        console.error("Error cargando categoría:", error);
        setMensaje({
          tipo: "error",
          texto: "Error al cargar los datos de la categoría"
        });
      } finally {
        setCargandoDatos(false);
      }
    };

    if (id) {
      cargarCategoria();
    }
  }, [id]);

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

      await CategoriasService.update(id, {
        nombre: formData.nombre.trim(),
        descripcion: formData.descripcion.trim(),
      });

      setMensaje({
        tipo: "success",
        texto: "¡Categoría actualizada exitosamente!"
      });

      setTimeout(() => {
        navigate("/categorias");
      }, 2000);

    } catch (error) {
      console.error("Error al actualizar categoría:", error);

      let errorMsg = "Error al actualizar la categoría";
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

  if (cargandoDatos) {
    return (
      <>
        <NavComponent />
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando datos de la categoría...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <NavComponent />

      <div className="insert-container">
        <div className="insert-header">
          <h2>Editar Categoría</h2>
          <p>Actualiza la información de la categoría</p>
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
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-submit"
              >
                {loading ? "Actualizando..." : "Actualizar Categoría"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditarCategoria;