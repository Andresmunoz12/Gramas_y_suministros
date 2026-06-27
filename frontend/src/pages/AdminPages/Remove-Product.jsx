import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Remove-Product.css"; // usamos los mismos estilos del panel
import Footer from "../../components/Footer";
import { secureStorage } from "../../utils/secureStorage";

export default function EliminarProducto() {

    const navigate = useNavigate();

    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });
    const [eliminando, setEliminando] = useState(null);

    useEffect(() => {
        cargarProductos();
    }, []);

    const cargarProductos = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:3001/api/inventario");
            const data = await response.json();
            setProductos(data);
        } catch (error) {
            setMensaje({
                tipo: "error",
                texto: "Error al cargar productos"
            });
        } finally {
            setLoading(false);
        }
    };

    const eliminarProducto = async (id, nombre) => {
        const confirmar = window.confirm(
            `¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`
        );

        if (!confirmar) return;

        try {
            setEliminando(id);

            const token = secureStorage.getItem("token");

            const response = await fetch(
                `http://localhost:3001/api/inventario/${id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!response.ok) throw new Error("Error al eliminar");

            setProductos(prev =>
                prev.filter(p => p.id_producto !== id)
            );

            setMensaje({
                tipo: "success",
                texto: `Producto "${nombre}" eliminado correctamente`
            });

            setTimeout(() => {
                setMensaje({ tipo: "", texto: "" });
            }, 3000);

        } catch (error) {
            setMensaje({
                tipo: "error",
                texto: error.message
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
        <>

            <div className="admin-layout">

                {/* SIDEBAR EXACTO COMO EL PANEL */}
                <aside className="sidebar">
                    <h2>Dashboard</h2>

                    <nav>
                        <button onClick={() => navigate("/panel")}>Inventario</button>
                        <button onClick={() => navigate("/usuarios")}>Usuarios</button>
                        <button onClick={() => navigate("/stock")}>Stock</button>
                        <button onClick={() => navigate("/reportes")}>Reportes</button>
                        <button onClick={() => navigate("/")}>Catalogo</button>
                    </nav>
                </aside>

                {/* MAIN AREA */}
                <div className="main-area">

                    <section className="table-section">
                        <div className="table-card">

                            <div className="table-header">
                                <h3>Eliminar Productos</h3>
                                <div className="table-actions">
                                    <button
                                        className="btn-secondary"
                                        onClick={() => navigate("/panel")}
                                    >
                                        Volver
                                    </button>
                                </div>
                            </div>

                            {mensaje.texto && (
                                <div className={`alert ${mensaje.tipo}`}>
                                    {mensaje.texto}
                                </div>
                            )}

                            <div className="table-container">

                                {loading ? (
                                    <p>Cargando productos...</p>
                                ) : (
                                    <table className="admin-table">

                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Producto</th>
                                                <th>Altura</th>
                                                <th>Peso</th>
                                                <th>Precio</th>
                                                <th>Eliminar</th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {productos.map(p => (
                                                <tr key={p.id_producto}>
                                                    <td>{p.id_producto}</td>
                                                    <td>{p.nombre}</td>
                                                    <td>{p.altura ?? "N/A"} mm</td>
                                                    <td>{p.peso ?? "N/A"} kg</td>
                                                    <td>{formatearPrecio(p.precio)}</td>
                                                    <td>
                                                        <button
                                                            className="btn-danger"
                                                            onClick={() =>
                                                                eliminarProducto(
                                                                    p.id_producto,
                                                                    p.nombre
                                                                )
                                                            }
                                                            disabled={eliminando === p.id_producto}
                                                        >
                                                            {eliminando === p.id_producto
                                                                ? "Eliminando..."
                                                                : "Eliminar"}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>

                                    </table>
                                )}

                            </div>
                        </div>
                    </section>

                </div>
            </div>

            <Footer />
        </>
    );
}
