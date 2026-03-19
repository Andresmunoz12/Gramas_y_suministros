import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
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
        imagen: null,
    });

    const [previewImage, setPreviewImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

    // Cargar datos del producto al montar
    useEffect(() => {
        cargarProducto();
    }, [id]);

    const cargarProducto = async () => {
    try {
        const response = await fetch(`http://localhost:3001/api/inventario/${id}`);

        if (!response.ok) {
            throw new Error("Producto no encontrado");
        }

        const producto = await response.json();

        setFormData({
            nombre: producto.nombre || "",
            altura: producto.altura || "",
            peso: producto.peso || "",
            material: producto.material || "",
            marca: producto.marca || "",
            precio: producto.precio || "",
            descripcion: producto.descripcion || "",
            imagen: null,
        });

        if (producto.imagen) {
            setPreviewImage(`http://localhost:3001/${producto.imagen}`);
        }

    } catch (error) {
        console.error("Error cargando producto:", error);
        setMensaje({ tipo: "error", texto: "Error al cargar el producto" });
    } finally {
        setLoading(false);
    }
};

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === "file" && files[0]) {
            setFormData((prevData) => ({
                ...prevData,
                [name]: files[0],
            }));

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
        setSaving(true);
        setMensaje({ tipo: "", texto: "" });

        try {
            const data = new FormData();

            data.append("nombre", formData.nombre);
            data.append("altura", formData.altura);
            data.append("peso", formData.peso);
            data.append("material", formData.material);
            data.append("marca", formData.marca);
            data.append("precio", formData.precio);
            data.append("descripcion", formData.descripcion);

            // Agregar imagen solo si se seleccionó una nueva
            if (formData.imagen) {
                data.append("imagen", formData.imagen);
            }

            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:3001/api/inventario/${id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: data,
            });

            const result = await response.json();

            if (response.ok) {
                setMensaje({
                    tipo: "success",
                    texto: "¡Producto actualizado exitosamente!"
                });

                setTimeout(() => {
                    navigate("/panel");
                }, 2000);
            } else {
                const errorMsg = result.error || "Error al actualizar el producto";
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
                <div className="container">
                    <h2>Cargando producto...</h2>
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
                <div className={`alert ${mensaje.tipo}`}>
                    {mensaje.texto}
                </div>
            )}

            <form className="insert-grid" onSubmit={handleSubmit}>

                {/* COLUMNA IMAGEN */}
                <div className="image-column">
                    <div
                        className="image-box"
                        onClick={handleImageClick}
                    >
                        {previewImage ? (
                            <img src={previewImage} alt="Preview" />
                        ) : (
                            <span>Haz click para subir imagen</span>
                        )}
                    </div>

                    <input
                        type="file"
                        id="inputImagen"
                        name="imagen"
                        accept="image/*"
                        hidden
                        onChange={handleChange}
                    />
                </div>

                {/* COLUMNA DATOS 1 */}
                <div className="data-column">

                    <div className="field">
                        <label>Nombre</label>
                        <input
                            type="text"
                            name="nombre"
                            value={formData.nombre}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="row">
                        <div className="field">
                            <label>Altura</label>
                            <input
                                type="text"
                                name="altura"
                                value={formData.altura}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="field">
                            <label>Peso</label>
                            <input
                                type="text"
                                name="peso"
                                value={formData.peso}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="row">
                        <div className="field">
                            <label>Material</label>
                            <input
                                type="text"
                                name="material"
                                value={formData.material}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="field">
                            <label>Marca</label>
                            <input
                                type="text"
                                name="marca"
                                value={formData.marca}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="field">
                        <label>Precio x m²</label>
                        <input
                            type="text"
                            name="precio"
                            value={formData.precio}
                            onChange={handleChange}
                            required
                        />
                    </div>

                </div>

                {/* COLUMNA DATOS 2 (DESCRIPCIÓN + BOTONES) */}
                <div className="data-column">

                    <div className="field grow">
                        <label>Descripción</label>
                        <textarea
                            name="descripcion"
                            value={formData.descripcion}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="actions">
                        <button
                            type="button"
                            onClick={handleGoBack}
                            disabled={saving}
                        >
                            Regresar
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
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
