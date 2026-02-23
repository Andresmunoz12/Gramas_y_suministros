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
    stock: 0,
    color: "",
    aplicacion: "",
    material: "",
    marca: "",
    garantia: "",
    precio: "",
    descuento: "",
    descripcion: "",
    campoAdicional: "",
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
      data.append("stock", formData.stock);
      data.append("material", formData.material);
      data.append("marca", formData.marca);
      data.append("precio", formData.precio);

      // Combinar descripción con otros campos
      let descripcionCompleta = formData.descripcion;
      if (formData.color) descripcionCompleta += `\nColor: ${formData.color}`;
      if (formData.aplicacion) descripcionCompleta += `\nAplicación: ${formData.aplicacion}`;
      if (formData.garantia) descripcionCompleta += `\nGarantía: ${formData.garantia}`;
      if (formData.descuento) descripcionCompleta += `\nDescuento: ${formData.descuento}`;
      if (formData.campoAdicional) descripcionCompleta += `\n${formData.campoAdicional}`;

      data.append("descripcion", descripcionCompleta);

      // Agregar imagen si existe
      if (formData.imagen) {
        data.append("imagen", formData.imagen);
      }

      // Enviar al backend
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/productos", {
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
          stock: 0,
          color: "",
          aplicacion: "",
          material: "",
          marca: "",
          garantia: "",
          precio: "",
          descuento: "",
          descripcion: "",
          campoAdicional: "",
          imagen: null,
        });
        setPreviewImage(null);

        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          navigate("/dashboard");
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

      <div className="container">
        <h2>Insertar nuevo producto</h2>

        {/* Mensaje de éxito o error */}
        {mensaje.texto && (
          <div style={{
            padding: "15px",
            marginBottom: "20px",
            borderRadius: "10px",
            textAlign: "center",
            backgroundColor: mensaje.tipo === "success" ? "#d4edda" : "#f8d7da",
            color: mensaje.tipo === "success" ? "#155724" : "#721c24",
            border: `1px solid ${mensaje.tipo === "success" ? "#c3e6cb" : "#f5c6cb"}`
          }}>
            {mensaje.texto}
          </div>
        )}

        <form className="form-grid" onSubmit={handleSubmit}>
          {/* COLUMNA IZQUIERDA */}
          <div className="left-column">
            {/* Campo 01 - Nombre del producto */}
            <div className="nombre-section">
              <label>01</label>
              <input
                type="text"
                name="nombre"
                placeholder="..."
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>

            {/* Sección de imagen */}
            <div className="image-section">
              <div
                className="image-box"
                id="preview"
                onClick={handleImageClick}
                style={{ cursor: "pointer" }}
              >
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      borderRadius: "15px",
                    }}
                  />
                ) : (
                  "png/jpg/jpeg"
                )}
              </div>
              <input
                type="file"
                id="inputImagen"
                name="imagen"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleChange}
              />
            </div>

            {/* Campo adicional con lápiz */}
            <div className="campo-adicional">
              <input
                type="text"
                name="campoAdicional"
                placeholder="..."
                value={formData.campoAdicional}
                onChange={handleChange}
              />
            </div>

            {/* Botones de acción */}
            <div className="actions">
              <button className="btn" type="button" onClick={handleGoBack} disabled={loading}>
                Regresar
              </button>
              <button className="btn" type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="right-column">
            {/* Fila 1: Altura, Peso, Stock, Color */}
            <div className="fields-row">
              <div className="field-compact">
                <label>Altura</label>
                <div className="input-with-icon">
                  <span className="edit-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="altura"
                    placeholder="..."
                    value={formData.altura}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field-compact">
                <label>Peso</label>
                <div className="input-with-icon">
                  <span className="edit-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="peso"
                    placeholder="..."
                    value={formData.peso}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field-compact">
                <label>Stock</label>
                <div className="input-with-icon">
                  <span className="edit-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </span>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field-compact">
                <label>Color</label>
                <div className="input-with-icon">
                  <span className="edit-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="color"
                    placeholder="..."
                    value={formData.color}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Fila 2: Aplicación, Material, Marca */}
            <div className="fields-row">
              <div className="field-compact">
                <label>Aplicación</label>
                <div className="input-with-icon">
                  <span className="edit-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="aplicacion"
                    placeholder="..."
                    value={formData.aplicacion}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field-compact">
                <label>Material</label>
                <div className="input-with-icon">
                  <span className="edit-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="material"
                    placeholder="..."
                    value={formData.material}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field-compact">
                <label>Marca</label>
                <div className="input-with-icon">
                  <span className="edit-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="marca"
                    placeholder="..."
                    value={formData.marca}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Fila 3: Garantía, Precio x m2, Descuento */}
            <div className="fields-row">
              <div className="field-compact">
                <label>Garantía</label>
                <div className="input-with-icon">
                  <span className="edit-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="garantia"
                    placeholder="..."
                    value={formData.garantia}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field-compact">
                <label>Precio x m2</label>
                <div className="input-with-icon">
                  <span className="edit-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="precio"
                    placeholder="..."
                    value={formData.precio}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="field-compact">
                <label>Descuento</label>
                <div className="input-with-icon">
                  <span className="edit-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="descuento"
                    placeholder="..."
                    value={formData.descuento}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Descripción del producto */}
            <div className="description">
              <label>Descripción del producto</label>
              <div className="textarea-with-icon">
                <textarea
                  name="descripcion"
                  placeholder="..."
                  value={formData.descripcion}
                  onChange={handleChange}
                ></textarea>
                <span className="edit-icon-textarea">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default InsertarProducto;