// frontend/src/views/EditarProducto.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
import ProductosService from "../../api/services/productos.service";
import "../../styles/ProductInsert.css";

const EditarProducto = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [formData, setFormData] = useState({
        nombre: "",
        altura: "",
        peso: "",
        material: "",
        marca: "",
        precio: "",
        descripcion: "",
        imagen: "", // Puede ser string (URL existente) o File (nueva imagen)
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

    useEffect(() => {
        if (id) {
            cargarProducto();
        }
    }, [id]);

    const cargarProducto = async () => {
        try {
            setLoading(true);
            console.log("Cargando producto con ID:", id);
            
            const producto = await ProductosService.getById(id);
            console.log("Producto cargado:", producto);
            
            setFormData({
                nombre: producto.nombre || "",
                altura: producto.altura !== null && producto.altura !== undefined ? producto.altura.toString() : "",
                peso: producto.peso !== null && producto.peso !== undefined ? producto.peso.toString() : "",
                material: producto.material || "",
                marca: producto.marca || "",
                precio: producto.precio !== null && producto.precio !== undefined ? producto.precio.toString() : "",
                descripcion: producto.descripcion || "",
                imagen: producto.imagen || "", // Guardamos el nombre de la imagen actual
            });

            if (producto.imagen) {
                // Si la imagen es una URL completa, usarla directamente
                const imageUrl = producto.imagen.startsWith('http') 
                    ? producto.imagen 
                    : `http://localhost:3000/uploads/img_products/${producto.imagen}`;
                setPreviewImage(imageUrl);
            }
        } catch (error) {
            console.error("Error cargando producto:", error);
            setMensaje({ 
                tipo: "error", 
                texto: error.response?.data?.message || error.message || "Error al cargar el producto" 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        
        if (type === "file" && files && files[0]) {
            // Es un archivo de imagen
            const file = files[0];
            
            // Validar que sea una imagen
            if (!file.type.startsWith('image/')) {
                setMensaje({
                    tipo: "error",
                    texto: "Por favor selecciona un archivo de imagen válido (jpg, png, gif, etc.)"
                });
                return;
            }
            
            // Validar tamaño (máximo 5MB)
            if (file.size > 5 * 1024 * 1024) {
                setMensaje({
                    tipo: "error",
                    texto: "La imagen no puede superar los 5MB"
                });
                return;
            }
            
            // Guardar el archivo en formData
            setFormData((prevData) => ({
                ...prevData,
                [name]: file, // Guardamos el File object
            }));
            
            // Crear preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewImage(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            // Es un campo de texto normal
            setFormData((prevData) => ({
                ...prevData,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMensaje({ tipo: "", texto: "" });

        try {
            let dataToSend;
            const isNewImage = formData.imagen && typeof formData.imagen !== 'string';
            
            if (isNewImage) {
                // Si hay una nueva imagen, usar FormData
                dataToSend = new FormData();
                
                // Agregar campos de texto
                if (formData.nombre && formData.nombre.trim() !== "") {
                    dataToSend.append("nombre", formData.nombre.trim());
                }
                if (formData.marca && formData.marca.trim() !== "") {
                    dataToSend.append("marca", formData.marca.trim());
                }
                if (formData.material && formData.material.trim() !== "") {
                    dataToSend.append("material", formData.material.trim());
                }
                if (formData.descripcion && formData.descripcion.trim() !== "") {
                    dataToSend.append("descripcion", formData.descripcion.trim());
                }
                if (formData.precio && formData.precio !== "") {
                    dataToSend.append("precio", formData.precio);
                }
                if (formData.altura && formData.altura !== "") {
                    dataToSend.append("altura", formData.altura);
                }
                if (formData.peso && formData.peso !== "") {
                    dataToSend.append("peso", formData.peso);
                }
                
                // Agregar la nueva imagen
                dataToSend.append("imagen", formData.imagen);
                
                console.log("Enviando actualización con imagen nueva");
            } else {
                // Sin imagen nueva, enviar JSON
                dataToSend = {};
                
                if (formData.nombre && formData.nombre.trim() !== "") {
                    dataToSend.nombre = formData.nombre.trim();
                }
                if (formData.marca && formData.marca.trim() !== "") {
                    dataToSend.marca = formData.marca.trim();
                }
                if (formData.material && formData.material.trim() !== "") {
                    dataToSend.material = formData.material.trim();
                }
                if (formData.descripcion && formData.descripcion.trim() !== "") {
                    dataToSend.descripcion = formData.descripcion.trim();
                }
                if (formData.precio && formData.precio !== "") {
                    dataToSend.precio = parseFloat(formData.precio);
                }
                if (formData.altura && formData.altura !== "") {
                    dataToSend.altura = parseFloat(formData.altura);
                }
                if (formData.peso && formData.peso !== "") {
                    dataToSend.peso = parseFloat(formData.peso);
                }
                
                console.log("Enviando actualización sin imagen:", dataToSend);
            }

            // Validar que haya al menos un campo para actualizar
            if ((!isNewImage && Object.keys(dataToSend).length === 0) || 
                (isNewImage && [...dataToSend.keys()].length === 0)) {
                setMensaje({
                    tipo: "warning",
                    texto: "No hay datos para actualizar"
                });
                setSaving(false);
                return;
            }

            // Enviar actualización al backend
            const result = await ProductosService.update(id, dataToSend);
            console.log("Respuesta del servidor:", result);
            
            setMensaje({
                tipo: "success",
                texto: "¡Producto actualizado exitosamente!"
            });

            // Recargar el producto para actualizar la imagen mostrada
            setTimeout(() => {
                cargarProducto();
            }, 1000);

            // Esperar 2 segundos y redirigir
            setTimeout(() => {
                navigate("/panel");
            }, 2000);
            
        } catch (error) {
            console.error("Error al actualizar:", error);
            console.error("Detalles del error:", error.response?.data);
            
            let errorMsg = "Error al actualizar el producto";
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (error.message) {
                errorMsg = error.message;
            }
            
            setMensaje({
                tipo: "error",
                texto: errorMsg
            });
        } finally {
            setSaving(false);
        }
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleImageClick = () => {
        document.getElementById("inputImagen").click();
    };

    if (loading) {
        return (
            <>
                <NavComponent />
                <div className="container" style={{ textAlign: 'center', padding: '50px' }}>
                    <div style={{ fontSize: '18px', color: '#666' }}>
                        Cargando producto...
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <NavComponent />

            <div className="insert-container">
                <div className="insert-header">
                    <h2>Editar producto</h2>
                    <p>Modifica la información del producto seleccionado</p>
                </div>

                {mensaje.texto && (
                    <div className={`alert ${mensaje.tipo}`} style={{
                        padding: '12px',
                        marginBottom: '20px',
                        borderRadius: '5px',
                        backgroundColor: mensaje.tipo === 'success' ? '#d4edda' : 
                                      mensaje.tipo === 'error' ? '#f8d7da' : '#fff3cd',
                        color: mensaje.tipo === 'success' ? '#155724' : 
                               mensaje.tipo === 'error' ? '#721c24' : '#856404',
                        border: `1px solid ${mensaje.tipo === 'success' ? '#c3e6cb' : 
                                        mensaje.tipo === 'error' ? '#f5c6cb' : '#ffeeba'}`
                    }}>
                        {mensaje.texto}
                    </div>
                )}

                <form className="insert-grid" onSubmit={handleSubmit}>
                    {/* COLUMNA IMAGEN */}
                    <div className="image-column">
                        <div 
                            className="image-box" 
                            onClick={handleImageClick}
                            style={{ 
                                width: '100%', 
                                height: '250px', 
                                backgroundColor: '#f8f9fa',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '8px',
                                overflow: 'hidden',
                                border: '1px solid #dee2e6',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.opacity = '0.8';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.opacity = '1';
                            }}
                        >
                            {previewImage ? (
                                <img 
                                    src={previewImage} 
                                    alt="Vista previa del producto" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        console.error("Error cargando imagen:", previewImage);
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '<span>Error al cargar la imagen. Click para seleccionar una nueva.</span>';
                                    }}
                                />
                            ) : (
                                <span style={{ color: '#6c757d' }}>Click para seleccionar imagen</span>
                            )}
                        </div>
                        
                        <input
                            id="inputImagen"
                            type="file"
                            name="imagen"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleChange}
                            style={{ display: 'none' }}
                        />
                        
                        <p style={{ fontSize: '12px', textAlign: 'center', marginTop: '10px', color: '#6c757d' }}>
                            {formData.imagen && typeof formData.imagen === 'string' 
                                ? `Imagen actual: ${formData.imagen.substring(0, 30)}${formData.imagen.length > 30 ? '...' : ''}` 
                                : formData.imagen && typeof formData.imagen !== 'string'
                                ? `Nueva imagen seleccionada: ${formData.imagen.name}`
                                : 'Click en la imagen para seleccionar una nueva'}
                        </p>
                    </div>

                    {/* COLUMNA DATOS 1 */}
                    <div className="data-column">
                        <div className="field">
                            <label htmlFor="nombre">Nombre *</label>
                            <input
                                id="nombre"
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
                                <label htmlFor="altura">Altura (m²)</label>
                                <input
                                    id="altura"
                                    type="number"
                                    step="0.01"
                                    name="altura"
                                    value={formData.altura}
                                    onChange={handleChange}
                                    placeholder="Ej: 3.5"
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="peso">Peso (kg)</label>
                                <input
                                    id="peso"
                                    type="number"
                                    step="0.001"
                                    name="peso"
                                    value={formData.peso}
                                    onChange={handleChange}
                                    placeholder="Ej: 2.5"
                                />
                            </div>
                        </div>

                        <div className="row">
                            <div className="field">
                                <label htmlFor="material">Material *</label>
                                <input
                                    id="material"
                                    type="text"
                                    name="material"
                                    value={formData.material}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: Polietileno"
                                />
                            </div>

                            <div className="field">
                                <label htmlFor="marca">Marca *</label>
                                <input
                                    id="marca"
                                    type="text"
                                    name="marca"
                                    value={formData.marca}
                                    onChange={handleChange}
                                    required
                                    placeholder="Ej: Evergreen"
                                />
                            </div>
                        </div>

                        <div className="field">
                            <label htmlFor="precio">Precio x m² *</label>
                            <input
                                id="precio"
                                type="number"
                                step="0.01"
                                name="precio"
                                value={formData.precio}
                                onChange={handleChange}
                                required
                                placeholder="Ej: 45000"
                            />
                        </div>
                    </div>

                    {/* COLUMNA DATOS 2 */}
                    <div className="data-column">
                        <div className="field grow">
                            <label htmlFor="descripcion">Descripción</label>
                            <textarea
                                id="descripcion"
                                name="descripcion"
                                value={formData.descripcion}
                                onChange={handleChange}
                                rows="8"
                                placeholder="Describe las características del producto..."
                                style={{ resize: 'vertical' }}
                            />
                        </div>

                        <div className="actions" style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                                type="button"
                                onClick={handleGoBack}
                                disabled={saving}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    fontSize: '14px'
                                }}
                            >
                                Regresar
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '5px',
                                    border: 'none',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    backgroundColor: saving ? '#6c757d' : '#007bff',
                                    color: 'white',
                                    fontSize: '14px'
                                }}
                            >
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
};

export default EditarProducto;