// frontend/src/pages/AdminPages/SalidasProductos.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
import StockService from "../../api/services/stock.service";
import ProductosService from "../../api/services/productos.service";
import api from "../../api/axios";
import { secureStorage } from "../../utils/secureStorage";
import "../../styles/HistoryInsert.css";

export default function SalidasProductos() {
    const navigate = useNavigate();

    const [modalOpen, setModalOpen] = useState(false);
    const [productos, setProductos] = useState([]);
    const [entradas, setEntradas] = useState([]); // In this case will hold "salidas"
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

    const [formData, setFormData] = useState({
        cantidad: "",
        destino: "",
        motivo: "Venta Directa",
        observaciones: ""
    });

    const obtenerUsuarioId = () => {
        try {
            const user = JSON.parse(secureStorage.getItem("user") || "{}");
            return user.id_usuario || 1;
        } catch {
            return 1;
        }
    };

    useEffect(() => {
        cargarProductos();
    }, []);

    useEffect(() => {
        if (productoSeleccionado) {
            cargarHistorial(productoSeleccionado.id_producto);
        }
    }, [productoSeleccionado]);

    const cargarProductos = async () => {
        try {
            const data = await ProductosService.getAllAdmin();
            setProductos(data);
            if (data.length > 0) {
                // If there was a selected item from Stock, load it
                const savedId = secureStorage.getItem("producto_seleccionado");
                if (savedId) {
                    const prod = data.find((p) => p.id_producto === parseInt(savedId));
                    if (prod) {
                        setProductoSeleccionado(prod);
                        return;
                    }
                }
                setProductoSeleccionado(data[0]);
            }
        } catch (error) {
            console.error("Error cargando productos:", error);
            setMensaje({ tipo: "error", texto: "Error al cargar productos" });
        } finally {
            setLoading(false);
        }
    };

    const cargarHistorial = async (productId) => {
        try {
            setLoading(true);
            const data = await StockService.getHistorialByProducto(productId);
            const soloSalidas = data.filter(item => item.tipo === 'salida');

            // The backend returns the `salida` relation potentially
            const salidasConDetalle = soloSalidas.map((sal) => ({
                ...sal,
                destino: sal.salida?.destino || "N/A",
                motivo: sal.salida?.motivo || "N/A",
                observaciones: sal.salida?.observaciones || sal.detalle || "-"
            }));

            setEntradas(salidasConDetalle);
        } catch (error) {
            console.error("Error cargando historial", error);
        } finally {
            setLoading(false);
        }
    };

    const abrirModal = () => {
        setFormData({
            cantidad: "",
            destino: "",
            motivo: "Venta Directa",
            observaciones: ""
        });
        setMensaje({ tipo: "", texto: "" });
        setModalOpen(true);
    };

    const cerrarModal = () => setModalOpen(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.cantidad || formData.cantidad <= 0) {
            setMensaje({ tipo: "error", texto: "La cantidad debe ser mayor a 0" });
            return;
        }
        if (!formData.destino) {
            setMensaje({ tipo: "error", texto: "Debe proveer un destino" });
            return;
        }
        if (!formData.motivo) {
            setMensaje({ tipo: "error", texto: "Debe proveer un motivo" });
            return;
        }

        try {
            const data = {
                id_producto: productoSeleccionado.id_producto,
                cantidad: parseInt(formData.cantidad),
                destino: formData.destino,
                motivo: formData.motivo,
                observaciones: formData.observaciones,
                id_usuario: obtenerUsuarioId(),
            };

            const result = await api.post('/movimientos/salida', data);

            if (result) {
                setMensaje({ tipo: "success", texto: "Salida registrada exitosamente" });
                cerrarModal();
                await cargarHistorial(productoSeleccionado.id_producto);
                setTimeout(() => setMensaje({ tipo: "", texto: "" }), 3000);
            }
        } catch (error) {
            console.error("Error:", error);
            setMensaje({ tipo: "error", texto: error.response?.data?.message || "Error al crear salida" });
        }
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return "N/A";
        const date = new Date(fecha);
        return date.toLocaleDateString('es-CO');
    };

    return (
        <>
            <NavComponent />
            <main className="stock-container">
                {mensaje.texto && (
                    <div className={`alert ${mensaje.tipo}`}>{mensaje.texto}</div>
                )}

                <div className="stock-header">
                    <div className="selector">
                        <label htmlFor="producto-select">Seleccionar Producto</label>
                        <select
                            id="producto-select"
                            value={productoSeleccionado?.id_producto || ""}
                            onChange={(e) => {
                                const producto = productos.find(p => p.id_producto === parseInt(e.target.value));
                                setProductoSeleccionado(producto);
                            }}
                        >
                            {productos.map(prod => (
                                <option key={prod.id_producto} value={prod.id_producto}>
                                    {prod.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <h1>Historial de salidas - <span>{productoSeleccionado?.nombre || "Cargando..."}</span></h1>
                </div>

                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Destino</th>
                                <th>Motivo</th>
                                <th>Cantidad</th>
                                <th>Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" className="empty">Cargando...</td></tr>
                            ) : entradas.length === 0 ? (
                                <tr><td colSpan="5" className="empty">No hay salidas registradas</td></tr>
                            ) : (
                                entradas.map((salida, index) => (
                                    <tr key={index}>
                                        <td>{formatearFecha(salida.fecha)}</td>
                                        <td>{salida.destino}</td>
                                        <td>{salida.motivo}</td>
                                        <td>{salida.cantidad}</td>
                                        <td>{salida.observaciones}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="button-group">
                    <button className="btn-secondary" onClick={() => navigate("/stock")}>Regresar</button>
                    <button className="btn-delete" onClick={abrirModal}>Generar Salida</button>
                </div>
            </main>

            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h2 style={{ borderBottom: "2px solid #ef4444", paddingBottom: "10px", color: "#ef4444" }}>Registrar Salida</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Cantidad (Reducir del Stock)</label>
                                <input
                                    type="number"
                                    name="cantidad"
                                    value={formData.cantidad}
                                    onChange={handleChange}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Destino</label>
                                <input
                                    type="text"
                                    name="destino"
                                    value={formData.destino}
                                    onChange={handleChange}
                                    placeholder="Ej. Sucursal Norte o Cliente"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Motivo</label>
                                <select name="motivo" value={formData.motivo} onChange={handleChange} required>
                                    <option value="Venta Directa">Venta Directa</option>
                                    <option value="Despacho o Envío">Despacho o Envío</option>
                                    <option value="Devolución a Proveedor">Devolución a Proveedor</option>
                                    <option value="Merma o Pérdida">Merma o Pérdida</option>
                                    <option value="Donación">Donación</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Observaciones</label>
                                <textarea
                                    name="observaciones"
                                    value={formData.observaciones}
                                    onChange={handleChange}
                                    placeholder="Detalles opcionales"
                                    rows="3"
                                    style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ccc" }}
                                />
                            </div>
                            <div className="modal-buttons">
                                <button type="button" className="btn-secondary" onClick={cerrarModal}>Cancelar</button>
                                <button type="submit" className="btn-delete">Guardar Salida</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
