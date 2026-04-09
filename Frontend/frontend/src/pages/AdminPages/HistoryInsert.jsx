// frontend/src/views/HistorialEntradas.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
import StockService from "../../api/services/stock.service";
import ProductosService from "../../api/services/productos.service";
import api from "../../api/axios";
import { secureStorage } from "../../utils/secureStorage";
import "../../styles/HistoryInsert.css";

export default function HistorialEntradas() {
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [entradas, setEntradas] = useState([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

  const [formData, setFormData] = useState({
    cantidad: "",
    id_proveedor: ""
  });

  // Obtener usuario del token
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
    cargarProveedores();
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
        setProductoSeleccionado(data[0]);
      }
    } catch (error) {
      console.error("Error cargando productos:", error);
      setMensaje({ tipo: "error", texto: "Error al cargar productos" });
    } finally {
      setLoading(false);
    }
  };

  const cargarProveedores = async () => {
    try {
      const response = await api.get('/proveedores');
      if (response.data) {
        setProveedores(response.data);
      }
    } catch (error) {
      console.error("Error cargando proveedores:", error);
    }
  };

  const cargarHistorial = async (productId) => {
    try {
      setLoading(true);
      const data = await StockService.getHistorialByProducto(productId);
      const soloEntradas = data.filter(item => item.tipo === 'entrada');

      // Enriquecer con nombre del proveedor
      const entradasConProveedor = await Promise.all(soloEntradas.map(async (ent) => {
        if (ent.entrada?.id_proveedor) {
          try {
            const provRes = await api.get(`/proveedores/${ent.entrada.id_proveedor}`);
            return {
              ...ent,
              proveedor: provRes.data?.nombre || "N/A",
              observaciones: ent.entrada?.observaciones || ent.detalle || "-"
            };
          } catch {
            return {
              ...ent,
              proveedor: "N/A",
              observaciones: ent.entrada?.observaciones || ent.detalle || "-"
            };
          }
        }
        return {
          ...ent,
          proveedor: "N/A",
          observaciones: ent.entrada?.observaciones || ent.detalle || "-"
        };
      }));

      setEntradas(entradasConProveedor);
    } catch (error) {
      console.error("Error cargando historial:", error);
      setMensaje({ tipo: "error", texto: "Error al cargar historial" });
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = () => {
    setFormData({
      cantidad: "",
      id_proveedor: ""
    });
    setMensaje({ tipo: "", texto: "" });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.cantidad || formData.cantidad <= 0) {
      setMensaje({ tipo: "error", texto: "La cantidad debe ser mayor a 0" });
      return;
    }

    if (!formData.id_proveedor) {
      setMensaje({ tipo: "error", texto: "Debe seleccionar un proveedor" });
      return;
    }

    try {
      const data = {
        id_producto: productoSeleccionado.id_producto,
        cantidad: parseInt(formData.cantidad),
        id_proveedor: parseInt(formData.id_proveedor),
        id_usuario: obtenerUsuarioId(),
        observaciones: `Entrada registrada`
      };

      const result = await StockService.registrarEntrada(data);

      if (result) {
        setMensaje({ tipo: "success", texto: "Entrada registrada exitosamente" });
        cerrarModal();
        await cargarHistorial(productoSeleccionado.id_producto);

        setTimeout(() => {
          setMensaje({ tipo: "", texto: "" });
        }, 3000);
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje({ tipo: "error", texto: error.response?.data?.message || "Error al crear entrada" });
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
          <div className={`alert ${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        <div className="stock-header">
          <div className="selector">
            <label htmlFor="producto-select">Seleccionar Producto</label>
            <select
              id="producto-select"
              value={productoSeleccionado?.id_producto || ""}
              onChange={(e) => {
                const producto = productos.find(
                  p => p.id_producto === parseInt(e.target.value)
                );
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

          <h1>
            Historial de entradas -{" "}
            <span>{productoSeleccionado?.nombre || "Cargando..."}</span>
          </h1>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Cantidad</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="empty">Cargando...</td>
                </tr>
              ) : entradas.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty">No hay entradas registradas</td>
                </tr>
              ) : (
                entradas.map((entrada, index) => (
                  <tr key={index}>
                    <td>{formatearFecha(entrada.fecha)}</td>
                    <td>{entrada.proveedor || "N/A"}</td>
                    <td>{entrada.cantidad}</td>
                    <td>{entrada.observaciones || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="button-group">
          <button className="btn-secondary" onClick={() => navigate("/stock")}>
            Regresar
          </button>

          <button className="btn-primary" onClick={abrirModal}>
            Agregar
          </button>
        </div>
      </main>

      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Nueva entrada</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Cantidad</label>
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
                <label>Proveedor</label>
                <select
                  name="id_proveedor"
                  value={formData.id_proveedor}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccione un proveedor</option>
                  {proveedores.map(prov => (
                    <option key={prov.id_proveedor} value={prov.id_proveedor}>
                      {prov.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={cerrarModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}