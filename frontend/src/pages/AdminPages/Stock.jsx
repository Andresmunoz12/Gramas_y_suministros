// frontend/src/views/StockGrama.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/AdminGlobal.css";
import "../../styles/Stock.css";
import NavComponent from "../../components/GlobalNav";
import StockService from "../../api/services/stock.service";
import { secureStorage } from "../../utils/secureStorage";

const StockGrama = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [productos, setProductos] = useState([]);
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(true);
  const [accionando, setAccionando] = useState(null);

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    conStock: 0,
    sinStock: 0,
    alerta: 0,
    stockTotal: 0,
  });

  useEffect(() => {
    obtenerStock();
  }, []);

  const obtenerStock = async () => {
    try {
      setCargando(true);
      const data = await StockService.getAll();

      let totalStock = 0;
      let sinStock = 0;
      let alerta = 0;
      let conStock = 0;

      const productosConEstado = data.map((item) => {
        let estado = "Activo";
        let claseEstado = "estado-activo";

        if (item.cantidad_actual === 0) {
          estado = "Sin Stock";
          claseEstado = "estado-inactivo";
          sinStock++;
        } else if (item.cantidad_actual <= item.nivel_minimo) {
          estado = "Alerta";
          claseEstado = "estado-alerta";
          alerta++;
        } else {
          conStock++;
        }

        totalStock += item.cantidad_actual || 0;

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

      setStats({
        total: data.length,
        conStock,
        sinStock,
        alerta,
        stockTotal: totalStock,
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const getEstadoColor = (estado) => {
    const colores = {
      "Activo": "#22c55e",
      "Alerta": "#f59e0b",
      "Sin Stock": "#ef4444",
    };
    return colores[estado] || "#64748b";
  };

  if (cargando) {
    return (
      <div className="admin-layout">
        <aside className="sidebar">
          <h2>Dashboard</h2>
          <div className="user-info">
            <p>Bienvenido, {user?.nombre}</p>
          </div>
          <nav>
            <button onClick={() => navigate("/panel")}>Inventario</button>
            <button onClick={() => navigate("/usuarios")}>Usuarios</button>
            <button onClick={() => navigate("/proveedores")}>Proveedores</button>
            <button className="active" onClick={() => navigate("/stock")}>Stock</button>
            <button onClick={() => navigate("/reportes")}>Reportes</button>
            <button onClick={() => navigate("/gestion-cotizaciones")}>Cotizaciones</button>
            <button onClick={() => navigate("/")}>Catálogo</button>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </nav>
        </aside>
        <div className="main-area">
          <div className="loading-container">
            <div className="loader"></div>
            <p>Cargando stock...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>Dashboard</h2>
        <div className="user-info">
          <p>Bienvenido, {user?.nombre}</p>
        </div>
        <nav>
          <button onClick={() => navigate("/panel")}>Inventario</button>
          <button onClick={() => navigate("/usuarios")}>Usuarios</button>
          <button onClick={() => navigate("/proveedores")}>Proveedores</button>
          <button onClick={() => navigate("/categorias")}>Categorías</button>
          <button className="active" onClick={() => navigate("/stock")}>Stock</button>
          <button onClick={() => navigate("/reportes")}>Reportes</button>
          <button onClick={() => navigate("/gestion-cotizaciones")}>Cotizaciones</button>
          <button onClick={() => navigate("/")}>Catálogo</button>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </nav>
      </aside>

      {/* MAIN AREA */}
      <div className="main-area">
        {/* STATS CARDS */}
        <section className="stats-row">
          <div className="stat-card green">
            <h3>{stats.total}</h3>
            <p>Productos en Stock</p>
          </div>
          <div className="stat-card purple">
            <h3>{stats.conStock}</h3>
            <p>Productos con Stock alto</p>
          </div>
          <div className="stat-card blue">
            <h3>{stats.alerta}</h3>
            <p>En Alerta</p>
            <small>Productos con Stock bajo</small>
          </div>
          <div className="stat-card orange">
            <h3>{stats.sinStock}</h3>
            <p>Productos agotados</p>
          </div>
        </section>

        {/* TABLA DE STOCK */}
        <section className="table-section">
          <div className="table-card">
            <div className="table-header">
              <h3>Stock de Productos</h3>
              <div className="table-actions">
                <button
                  className="btn-secondary"
                  onClick={() => navigate("/salidasProductos")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <polyline points="5 12 12 19 19 12"/>
                  </svg>
                  Nueva Salida
                </button>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/entradasProductos")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"/>
                    <polyline points="5 12 12 5 19 12"/>
                  </svg>
                  Nueva Entrada
                </button>
              </div>
            </div>

            <div className="table-container">
              {msg && <div className="alert error">{msg}</div>}
              {productos.length === 0 ? (
                <p className="no-data">No hay productos en stock</p>
              ) : (
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
                    {productos.map((producto) => (
                      <tr 
                        key={producto.id_producto}
                        className={producto.estado === 'Sin Stock' ? 'sin-stock-row' : ''}
                      >
                        <td>{producto.id_producto}</td>
                        <td>
                          <strong>{producto.nombre}</strong>
                        </td>
                        <td>
                          <span style={{
                            fontWeight: '700',
                            color: producto.estado === 'Sin Stock' ? '#ef4444' :
                                   producto.estado === 'Alerta' ? '#f59e0b' : '#22c55e',
                          }}>
                            {producto.cantidad_actual}
                          </span>
                        </td>
                        <td>{producto.nivel_minimo}</td>
                        <td>
                          <span className="status-badge" style={{
                            backgroundColor: getEstadoColor(producto.estado) + '20',
                            color: getEstadoColor(producto.estado),
                          }}>
                            ● {producto.estado}
                          </span>
                        </td>
                        <td>
                          {new Date(producto.ultima_actualizacion).toLocaleDateString()}
                          <br />
                          <small style={{ color: '#999', fontSize: '0.6rem' }}>
                            {new Date(producto.ultima_actualizacion).toLocaleTimeString()}
                          </small>
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
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default StockGrama;