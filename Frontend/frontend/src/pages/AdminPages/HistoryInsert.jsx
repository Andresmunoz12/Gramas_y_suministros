import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
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
    fecha: new Date().toISOString().split('T')[0],
    cantidad: "",
    id_proveedor: ""
  });

  // Cargar productos y proveedores al montar
  useEffect(() => {
    cargarProductos();
    cargarProveedores();
  }, []);

  // Cargar entradas cuando se selecciona un producto
  useEffect(() => {
    if (productoSeleccionado) {
      cargarEntradas(productoSeleccionado.id_producto);
    }
  }, [productoSeleccionado]);

  const cargarProductos = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/productos");
      if (response.ok) {
        const data = await response.json();
        setProductos(data);
        // Seleccionar el primer producto por defecto
        if (data.length > 0) {
          setProductoSeleccionado(data[0]);
        }
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
      const response = await fetch("http://localhost:3001/api/proveedores");
      if (response.ok) {
        const data = await response.json();
        setProveedores(data);
      }
    } catch (error) {
      console.error("Error cargando proveedores:", error);
    }
  };

  const cargarEntradas = async (productId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/entries/${productId}`);
      if (response.ok) {
        const data = await response.json();
        // Filtrar solo entradas (tipo='entrada')
        const soloEntradas = data.filter(item => item.tipo === 'entrada');
        setEntradas(soloEntradas);
      }
    } catch (error) {
      console.error("Error cargando entradas:", error);
      setMensaje({ tipo: "error", texto: "Error al cargar historial" });
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = () => {
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      cantidad: "",
      id_proveedor: ""
    });
    setMensaje({ tipo: "", texto: "" });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setFormData({
      fecha: new Date().toISOString().split('T')[0],
      cantidad: "",
      id_proveedor: ""
    });
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
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3001/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          id_producto: productoSeleccionado.id_producto,
          cantidad: parseInt(formData.cantidad),
          id_proveedor: parseInt(formData.id_proveedor),
          id_usuario: 1, // TODO: Obtener del token
          observaciones: `Entrada registrada el ${formData.fecha}`
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMensaje({ tipo: "success", texto: "Entrada registrada exitosamente" });
        cerrarModal();
        // Recargar entradas
        cargarEntradas(productoSeleccionado.id_producto);

        setTimeout(() => {
          setMensaje({ tipo: "", texto: "" });
        }, 3000);
      } else {
        setMensaje({ tipo: "error", texto: result.error || "Error al crear entrada" });
      }
    } catch (error) {
      console.error("Error:", error);
      setMensaje({ tipo: "error", texto: "Error al conectar con el servidor" });
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

      <main>
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

        {/* Selector de producto */}
        <div style={{ marginBottom: "20px", textAlign: "center" }}>
          <label htmlFor="producto-select" style={{ marginRight: "10px", fontWeight: "bold" }}>
            Seleccionar Producto:
          </label>
          <select
            id="producto-select"
            value={productoSeleccionado?.id_producto || ""}
            onChange={(e) => {
              const producto = productos.find(p => p.id_producto === parseInt(e.target.value));
              setProductoSeleccionado(producto);
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: "2px solid #6bb46b",
              fontSize: "14px",
              minWidth: "250px"
            }}
          >
            {productos.map(prod => (
              <option key={prod.id_producto} value={prod.id_producto}>
                {prod.nombre}
              </option>
            ))}
          </select>
        </div>

        <h1>Historial de entradas - {productoSeleccionado?.nombre || "Cargando..."}</h1>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Proveedor</th>
                <th>Cantidad Entrada</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                    Cargando...
                  </td>
                </tr>
              ) : entradas.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: "center", padding: "20px" }}>
                    No hay entradas registradas para este producto
                  </td>
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
          <button className="regresar" onClick={() => navigate("/Stock")}>
            Regresar
          </button>

          <button className="agregar" onClick={abrirModal}>
            Agregar
          </button>
        </div>
      </main>

      {/* MODAL */}
      {modalOpen && (
        <div className="modal show">
          <div className="modal-content">
            <h2>Nueva entrada para "{productoSeleccionado?.nombre}"</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group full">
                <label htmlFor="fecha">Fecha de entrada</label>
                <input
                  type="date"
                  id="fecha"
                  name="fecha"
                  value={formData.fecha}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group full">
                <label htmlFor="cantidad">Cantidad</label>
                <input
                  type="number"
                  id="cantidad"
                  name="cantidad"
                  placeholder="Ingrese la cantidad de entrada"
                  value={formData.cantidad}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              <div className="form-group full">
                <label htmlFor="id_proveedor">Proveedor</label>
                <select
                  id="id_proveedor"
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
                <button
                  type="button"
                  className="descartar"
                  onClick={cerrarModal}
                >
                  Descartar
                </button>

                <button type="submit" className="guardar">
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}