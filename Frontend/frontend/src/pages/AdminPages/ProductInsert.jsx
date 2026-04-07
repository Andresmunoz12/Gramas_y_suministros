import { useState, useEffect } from "react"; // ✅ AGREGADO useEffect
import { useNavigate } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
import ProductosService from "../../api/services/productos.service";
import api from "../../api/axios"; // ✅ AGREGADO para cargar categorías
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
    id_categoria: "", // Cambiado a string vacío para validar selección
    imagen: null,
  });

  const [categorias, setCategorias] = useState([]); // ✅ AGREGADO para cargar categorías
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  // ✅ AGREGADO: Cargar categorías al montar el componente
  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const response = await api.get('/categorias');
        setCategorias(response.data);
        if (response.data.length > 0) {
          setFormData(prev => ({ ...prev, id_categoria: response.data[0].id_categoria }));
        }
      } catch (error) {
        console.error("Error cargando categorías:", error);
        setMensaje({
          tipo: "error",
          texto: "Error al cargar las categorías"
        });
      }
    };
    cargarCategorias();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;

    if (type === "file" && files && files[0]) {
      const file = files[0];
      
      // Validaciones de imagen
      if (!file.type.startsWith('image/')) {
        setMensaje({
          tipo: "error",
          texto: "Por favor selecciona un archivo de imagen válido (jpg, png, gif, etc.)"
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setMensaje({
          tipo: "error",
          texto: "La imagen no puede superar los 5MB"
        });
        return;
      }
      
      setFormData((prevData) => ({
        ...prevData,
        [name]: file,
      }));

      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
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
      // Validar campos obligatorios
      if (!formData.nombre || !formData.marca || !formData.material || !formData.precio) {
        setMensaje({
          tipo: "error",
          texto: "Por favor completa todos los campos obligatorios (*)"
        });
        setLoading(false);
        return;
      }

      // Validar categoría seleccionada
      if (!formData.id_categoria) {
        setMensaje({
          tipo: "error",
          texto: "Por favor selecciona una categoría"
        });
        setLoading(false);
        return;
      }

      // Crear FormData para enviar archivos
      const data = new FormData();

      // Agregar campos al FormData
      data.append("nombre", formData.nombre);
      data.append("marca", formData.marca);
      data.append("material", formData.material);
      data.append("precio", formData.precio);
      data.append("id_categoria", formData.id_categoria);
      
      // Agregar campos opcionales si tienen valor
      if (formData.altura && formData.altura !== "") {
        data.append("altura", formData.altura);
      }
      if (formData.peso && formData.peso !== "") {
        data.append("peso", formData.peso);
      }
      if (formData.descripcion && formData.descripcion !== "") {
        data.append("descripcion", formData.descripcion);
      }
      if (formData.imagen) {
        data.append("imagen", formData.imagen);
      }

      // Usar el servicio para crear el producto
      const result = await ProductosService.create(data);
      
      console.log("Producto creado:", result);
      
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
        id_categoria: categorias.length > 0 ? categorias[0].id_categoria : "",
        imagen: null,
      });
      setPreviewImage(null);

      // Redirigir al dashboard después de 2 segundos
      setTimeout(() => {
        navigate("/panel");
      }, 2000);
      
    } catch (error) {
      console.error("Error al crear producto:", error);
      
      let errorMsg = "Error al crear el producto";
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
    navigate(-1);
  };

  const handleImageClick = () => {
    document.getElementById("imagenInput").click();
  };

  return (
    <>
      <NavComponent />

      <div className="insert-container">
        <div className="insert-header">
          <h2>Agregar Producto</h2>
          <p>Gestión de inventario - Completa todos los campos obligatorios (*)</p>
        </div>

        {mensaje.texto && (
          <div className={`alert ${mensaje.tipo}`} style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '5px',
            backgroundColor: mensaje.tipo === 'success' ? '#d4edda' : '#f8d7da',
            color: mensaje.tipo === 'success' ? '#155724' : '#721c24',
            border: `1px solid ${mensaje.tipo === 'success' ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {mensaje.texto}
          </div>
        )}

        <form className="insert-grid" onSubmit={handleSubmit}>

          {/* Columna Imagen */}
          <div className="image-column">
            <div 
              className="image-box" 
              onClick={handleImageClick}
              style={{
                cursor: 'pointer',
                width: '100%',
                height: '250px',
                backgroundColor: '#f8f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #dee2e6'
              }}
            >
              {previewImage ? (
                <img src={previewImage} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#6c757d' }}>Click para subir imagen</span>
              )}
            </div>
            <input
              id="imagenInput"
              type="file"
              name="imagen"
              accept="image/jpeg,image/png,image/gif,image/webp"
              hidden
              onChange={handleChange}
            />
            <p style={{ fontSize: '12px', textAlign: 'center', marginTop: '10px', color: '#6c757d' }}>
              Formatos: JPG, PNG, GIF, WEBP (Máx. 5MB)
            </p>
          </div>

          {/* Columna Datos 1 */}
          <div className="data-column">
            <div className="field">
              <label>Nombre *</label>
              <input 
                type="text" 
                name="nombre" 
                value={formData.nombre} 
                onChange={handleChange} 
                required 
                placeholder="Ej: Grama Sintética Premium"
              />
            </div>

            <div className="row">
              <div className="field">
                <label>Altura (m²)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  name="altura" 
                  value={formData.altura} 
                  onChange={handleChange} 
                  placeholder="Ej: 3.5"
                />
              </div>

              <div className="field">
                <label>Peso (kg)</label>
                <input 
                  type="number" 
                  step="0.001" 
                  name="peso" 
                  value={formData.peso} 
                  onChange={handleChange} 
                  placeholder="Ej: 2.5"
                />
              </div>
            </div>

            <div className="field">
              <label>Material *</label>
              <input 
                type="text" 
                name="material" 
                value={formData.material} 
                onChange={handleChange} 
                required 
                placeholder="Ej: Polietileno"
              />
            </div>
          </div>

          {/* Columna Datos 2 */}
          <div className="data-column">
            <div className="field">
              <label>Marca *</label>
              <input 
                type="text" 
                name="marca" 
                value={formData.marca} 
                onChange={handleChange} 
                required 
                placeholder="Ej: Evergreen"
              />
            </div>

            <div className="field">
              <label>Precio x m² *</label>
              <input 
                type="number" 
                step="0.01" 
                name="precio" 
                value={formData.precio} 
                onChange={handleChange} 
                required 
                placeholder="Ej: 45000"
              />
            </div>

            <div className="field">
              <label>Categoría *</label>
              <select 
                name="id_categoria" 
                value={formData.id_categoria} 
                onChange={handleChange}
                required
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">Seleccione una categoría</option>
                {categorias.map(cat => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="field grow">
              <label>Descripción</label>
              <textarea 
                name="descripcion" 
                value={formData.descripcion} 
                onChange={handleChange}
                rows="4"
                placeholder="Describe las características del producto..."
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="actions">
              <button 
                type="button" 
                onClick={handleGoBack} 
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  backgroundColor: '#6c757d',
                  color: 'white'
                }}
              >
                Regresar
              </button>
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  borderRadius: '5px',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  backgroundColor: loading ? '#6c757d' : '#007bff',
                  color: 'white'
                }}
              >
                {loading ? "Guardando..." : "Guardar Producto"}
              </button>
            </div>
          </div>

        </form>
      </div>
    </>
  );
};

export default InsertarProducto;