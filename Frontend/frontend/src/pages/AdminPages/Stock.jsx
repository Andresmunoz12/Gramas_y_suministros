// frontend/src/views/StockGrama.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/AdminGlobal.css";
import "../../styles/Stock.css";
import NavComponent from "../../components/GlobalNav";
import StockService from "../../api/services/stock.service";
import { secureStorage } from "../../utils/secureStorage";

const StockGrama = () => {
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerStock();
  }, []);

  const obtenerStock = async () => {
    try {
      setCargando(true);
      const data = await StockService.getAll();

      const productosConEstado = data.map((item) => {
        let estado = "Activo";
        let claseEstado = "estado-activo";

        if (item.cantidad_actual === 0) {
          estado = "Inactivo";
          claseEstado = "estado-inactivo";
        } else if (item.cantidad_actual <= item.nivel_minimo) {
          estado = "Alerta";
          claseEstado = "estado-alerta";
        }

        return {
          id_producto: item.id_producto,
          nombre: item.producto?.nombre || "Sin nombre",
          cantidad_actual: item.cantidad_actual,
          nivel_minimo: item.nivel_minimo,
          ultima_actualizacion: item.ultima_actualizacion,
          estado,
          claseEstado,
        };
      });

      setProductos(productosConEstado);
      setCargando(false);
    } catch (error) {
      console.error("Error:", error);
      setMsg(error.response?.data?.message || "Error al cargar el stock");
      setCargando(false);
    }
  };

  const handleVerHistorial = (id) => {
    secureStorage.setItem("producto_seleccionado", id);
    navigate("/entradasProductos");
  };

  if (cargando) {
    return (
      <>
        <NavComponent />
        <div style={{ textAlign: "center", padding: "50px" }}>
          <p>Cargando stock...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="admin-layout">
        <aside className="sidebar">
          <h2>Dashboard</h2>
          <nav>
            <button onClick={() => navigate("/panel")}>Inventario</button>
            <button onClick={() => navigate("/usuarios")}>Usuarios</button>
            <button onClick={() => navigate("/stock")}>Stock</button>
            <button onClick={() => navigate("/reportes")}>Reportes</button>
            <button onClick={() => navigate("/")}>Catálogo</button>
          </nav>
        </aside>

        <div className="main-area">
          <section className="table-section">
            <div className="table-card">
              <div className="table-header">
                <h3>Stock de Productos</h3>
                <div className="table-actions" style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="btn-delete"
                    onClick={() => navigate("/salidasProductos")}
                  >
                    Nueva Salida
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => navigate("/entradasProductos")}
                  >
                    Nueva Entrada
                  </button>
                </div>
              </div>

              <div className="table-container">
                {msg && <div className="alert error">{msg}</div>}
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Producto</th>
                      <th>Stock</th>
                      <th>Nivel Mínimo</th>
                      <th>Estado</th>
                      <th>Última Actualización</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.length === 0 ? (
                      <tr>
                        <td colSpan="7">No hay productos en stock</td>
                      </tr>
                    ) : (
                      productos.map((producto) => (
                        <tr key={producto.id_producto}>
                          <td>{producto.id_producto}</td>
                          <td>{producto.nombre}</td>
                          <td>{producto.cantidad_actual}</td>
                          <td>{producto.nivel_minimo}</td>
                          <td>
                            <span className={`status ${producto.claseEstado}`}>
                              {producto.estado}
                            </span>
                          </td>
                          <td>
                            {new Date(producto.ultima_actualizacion).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              className="btn-extra"
                              onClick={() => handleVerHistorial(producto.id_producto)}
                            >
                              Ver Historial
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default StockGrama;