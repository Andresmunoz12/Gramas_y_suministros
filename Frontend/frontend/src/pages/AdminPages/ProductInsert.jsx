import { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
import "../../styles/ProductInsert.css";

const InsertarProducto = () => {
  const navigate = useNavigate();

const [formData, setFormData] = useState({
  nombre: "",
  altura: "",
  peso: "",
  material: "",
  marca: "",
  precio: "",
  descripcion: "",
  imagen: null,
});

  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file" && files[0]) {
      setFormData((prevData) => ({
        ...prevData,
        [name]: files[0],
      }));

      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje({ tipo: "", texto: "" });

    try {
      // Crear FormData para enviar archivos
      const data = new FormData();

      // Agregar campos al FormData
      data.append("nombre", formData.nombre);
      data.append("altura", formData.altura);
      data.append("peso", formData.peso);
      data.append("material", formData.material);
      data.append("marca", formData.marca);
      data.append("precio", formData.precio);
      data.append("descripcion", formData.descripcion);

      // Agregar imagen si existe
      if (formData.imagen) {
        data.append("imagen", formData.imagen);
      }

      // Enviar al backend
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/inventario", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      const result = await response.json();

      if (response.ok) {
        setMensaje({
          tipo: "success",
          texto: "¡Producto creado exitosamente!"
        });

        // Limpiar formulario
        setFormData({
          nombre: "",
          altura: "",
          peso: "",
          material: "",
          marca: "",
          precio: "",
          descripcion: "",
          imagen: null,
        });
        setPreviewImage(null);

        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          navigate("/panel");
        }, 2000);
      } else {
        // Mostrar el error específico del backend si existe
        const errorMsg = result.error || "Error al crear el producto";
        const errorDetails = result.details ? ` (${result.details})` : "";

        setMensaje({
          tipo: "error",
          texto: errorMsg + errorDetails
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje({
        tipo: "error",
        texto: "Error al conectar con el servidor"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleImageClick = () => {
    document.getElementById("inputImagen").click();
  };

return (
    <>
      <NavComponent />

      <div className="insert-container">
        <div className="insert-header">
          <h2>Agregar Producto</h2>
          <p>Gestión de inventario</p>
        </div>

        {mensaje.texto && (
          <div className={`alert ${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        <form className="insert-grid" onSubmit={handleSubmit}>

          {/* Columna Imagen */}
          <div className="image-column">
            <div className="image-box" onClick={() => document.getElementById("imagenInput").click()}>
              {previewImage ? (
                <img src={previewImage} alt="preview" />
              ) : (
                <span>Subir imagen</span>
              )}
            </div>
            <input
              id="imagenInput"
              type="file"
              name="imagen"
              accept="image/*"
              hidden
              onChange={handleChange}
            />
          </div>

          {/* Columna Datos 1 */}
          <div className="data-column">
            <div className="field">
              <label>Nombre</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>

            <div className="row">
              <div className="field">
                <label>Altura</label>
                <input type="text" name="altura" value={formData.altura} onChange={handleChange} required />
              </div>

              <div className="field">
                <label>Peso</label>
                <input type="text" name="peso" value={formData.peso} onChange={handleChange} required />
              </div>
            </div>

            <div className="field">
              <label>Material</label>
              <input type="text" name="material" value={formData.material} onChange={handleChange} required />
            </div>
          </div>

          {/* Columna Datos 2 */}
          <div className="data-column">
            <div className="field">
              <label>Marca</label>
              <input type="text" name="marca" value={formData.marca} onChange={handleChange} required />
            </div>

            <div className="field">
              <label>Precio x m²</label>
              <input type="text" name="precio" value={formData.precio} onChange={handleChange} required />
            </div>

            <div className="field grow">
              <label>Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange}></textarea>
            </div>

            <div className="actions">
              <button type="button" onClick={() => navigate(-1)} disabled={loading}>
                Regresar
              </button>
              <button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>

        </form>
      </div>
    </>
  );
};

export default InsertarProducto;