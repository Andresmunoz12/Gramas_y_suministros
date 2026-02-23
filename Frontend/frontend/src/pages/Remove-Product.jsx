import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Remove-Product.css";

export default function EliminarProducto() {
    const navigate = useNavigate();

    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
    const [eliminando, setEliminando] = useState(null); // ID del producto que se está eliminando

    // Cargar productos al montar el componente
    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:3001/api/productos");

            if (!response.ok) {
                throw new Error("Error al cargar productos");
            }

            const data = await response.json();
            setProductos(data);
            setMensaje({ tipo: "", texto: "" });
        } catch (error) {
            console.error("Error cargando productos:", error);
            setMensaje({
                tipo: "error",
                texto: "Error al cargar los productos desde la base de datos"
            });
        } finally {
            setLoading(false);
        }
    };

    const eliminarProducto = async (id, nombre) => {
        // Confirmar eliminación
        const confirmar = window.confirm(
            `¿Estás seguro de que deseas eliminar el producto "${nombre}"?\n\nEsta acción no se puede deshacer.`
        );

        if (!confirmar) return;

        try {
            setEliminando(id);
            setMensaje({ tipo: "", texto: "" });

            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:3001/api/productos/${id}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            });

            const result = await response.json();

            if (response.ok) {
                // Eliminar el producto del estado local
                setProductos((prev) => prev.filter((producto) => producto.id_producto !== id));

                setMensaje({
                    tipo: "success",
                    texto: `Producto "${nombre}" eliminado exitosamente`
                });

                // Limpiar mensaje después de 3 segundos
                setTimeout(() => {
                    setMensaje({ tipo: "", texto: "" });
                }, 3000);
            } else {
                throw new Error(result.error || "Error al eliminar el producto");
            }
        } catch (error) {
            console.error("Error eliminando producto:", error);
            setMensaje({
                tipo: "error",
                texto: error.message || "Error al eliminar el producto"
            });
        } finally {
            setEliminando(null);
        }
    };

    const formatearPrecio = (precio) => {
        if (!precio) return "N/A";
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(precio);
    };

    return (
        <div className="eliminar-producto-page">
            <header>
                <div className="logo">
                    <div className="logo-placeholder"></div>
                </div>

                <h2>Administrar Inventarios</h2>

                <div className="user-icon"></div>
            </header>

            <main>
                <h1>Eliminar Productos - Inventario de Grama Sintética</h1>

                {/* Mensaje de éxito o error */}
                {mensaje.texto && (
                    <div style={{
                        padding: "15px",
                        marginBottom: "20px",
                        borderRadius: "10px",
                        textAlign: "center",
                        backgroundColor: mensaje.tipo === "success" ? "#d4edda" : "#f8d7da",
                        color: mensaje.tipo === "success" ? "#155724" : "#721c24",
                        border: `1px solid ${mensaje.tipo === "success" ? "#c3e6cb" : "#f5c6cb"}`,
                        maxWidth: "800px",
                        margin: "0 auto 20px"
                    }}>
                        {mensaje.texto}
                    </div>
                )}

                {loading ? (
                    <div style={{
                        textAlign: "center",
                        padding: "40px",
                        fontSize: "18px",
                        color: "#6bb46b"
                    }}>
                        Cargando productos...
                    </div>
                ) : productos.length === 0 ? (
                    <div style={{
                        textAlign: "center",
                        padding: "40px",
                        fontSize: "16px",
                        color: "#666"
                    }}>
                        No hay productos en el inventario
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table id="tablaInventario">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Producto</th>
                                    <th>Altura</th>
                                    <th>Peso</th>
                                    <th>Stock</th>
                                    <th>Precio x m²</th>
                                    <th>Eliminar</th>
                                </tr>
                            </thead>

                            <tbody>
                                {productos.map((producto) => (
                                    <tr key={producto.id_producto}>
                                        <td>{producto.id_producto}</td>
                                        <td>{producto.nombre}</td>
                                        <td>{producto.altura || "N/A"}</td>
                                        <td>{producto.peso || "N/A"}</td>
                                        <td>{producto.stock || 0}</td>
                                        <td>{formatearPrecio(producto.precio)}</td>
                                        <td>
                                            <button
                                                className="eliminar"
                                                onClick={() => eliminarProducto(producto.id_producto, producto.nombre)}
                                                disabled={eliminando === producto.id_producto}
                                            >
                                                {eliminando === producto.id_producto ? (
                                                    <span>⏳</span>
                                                ) : (
                                                    <span>🗑️</span>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <button
                    className="regresar"
                    onClick={() => {
                        navigate("/Inventario");
                    }}
                >
                    Regresar
                </button>
            </main>
        </div>
    );
}