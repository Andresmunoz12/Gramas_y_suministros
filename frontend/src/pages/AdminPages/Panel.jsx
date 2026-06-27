import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/AdminGlobal.css";
import "../../styles/Panel.css";
import Footer from "../../components/Footer";
import NavComponent from "../../components/GlobalNav";
import { useAuth } from "../../context/AuthContext";
import ProductosService from "../../api/services/productos.service";
import api from "../../api/axios"; // ✅ Importar axios para usuarios y stock

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accionando, setAccionando] = useState(null);
  const [stats, setStats] = useState({
    usuarios: 0,
    productos: 0,
    stock: 0,
    agotados: 0
  });

  useEffect(() => {
    obtenerDatos();
  }, []);

  const obtenerDatos = async () => {
    try {
      setLoading(true);

      // 🔹 Productos - Usando el servicio (todos, incluyendo inactivos)
      const productosData = await ProductosService.getAllAdmin();
      setProductos(productosData);

      // 🔹 Usuarios - Usando axios con token automático
      const usuariosRes = await api.get("/usuarios");
      const usuariosData = usuariosRes.data;

      // 🔹 Stock - Usando axios con token automático
      const stockRes = await api.get("/stock");
      const stockData = stockRes.data;

      const totalStock = stockData.reduce(
        (sum, item) => sum + (item.cantidad_actual || 0),
        0
      );

      const agotados = stockData.filter(
        item => item.cantidad_actual === 0
      ).length;

      setStats({
        usuarios: usuariosData.length,
        productos: productosData.length,
        stock: totalStock,
        agotados
      });

    } catch (err) {
      console.error("❌ Error al obtener datos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDesactivar = async (id, nombre) => {
    if (accionando) return;

    const confirmar = window.confirm(`¿Estás seguro de que quieres DESACTIVAR el producto "${nombre}"?\n\nLos productos desactivados NO se mostrarán en el catálogo.`);

    if (!confirmar) return;

    try {
      setAccionando(id);
      await ProductosService.desactivar(id);
      alert(`✅ Producto "${nombre}" desactivado correctamente`);
      await obtenerDatos();
    } catch (error) {
      console.error("Error al desactivar:", error);
      alert(`❌ Error al desactivar: ${error.response?.data?.message || error.message}`);
    } finally {
      setAccionando(null);
    }
  };

  const handleActivar = async (id, nombre) => {
    if (accionando) return;

    const confirmar = window.confirm(`¿Estás seguro de que quieres ACTIVAR el producto "${nombre}"?\n\nLos productos activados se mostrarán en el catálogo.`);

    if (!confirmar) return;

    try {
      setAccionando(id);
      await ProductosService.activar(id);
      alert(`✅ Producto "${nombre}" activado correctamente`);
      await obtenerDatos();
    } catch (error) {
      console.error("Error al activar:", error);
      alert(`❌ Error al activar: ${error.response?.data?.message || error.message}`);
    } finally {
      setAccionando(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <>
        <NavComponent />
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando datos...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
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
            <button onClick={() => navigate("/stock")}>Stock</button>
            <button onClick={() => navigate("/reportes")}>Reportes</button>
            <button onClick={() => navigate("/")}>Catálogo</button>
            <button onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </nav>
        </aside>

        {/* MAIN */}
        <div className="main-area">
          {/* STATS */}
          <section className="stats-row">
            <div className="stat-card green">
              <h3>{stats.productos}</h3>
              <p>Productos</p>
            </div>
            <div className="stat-card purple">
              <h3>{stats.usuarios}</h3>
              <p>Usuarios</p>
            </div>
            <div className="stat-card blue">
              <h3>{stats.stock}</h3>
              <p>Stock Total</p>
            </div>
            <div className="stat-card orange">
              <h3>{stats.agotados}</h3>
              <p>Agotados</p>
            </div>
          </section>

          {/* TABLA DE PRODUCTOS */}
          <section className="table-section">
            <div className="table-card">
              <div className="table-header">
                <h3>Inventario</h3>
                <div className="table-actions">
                  {/* <button 
                    className="btn-secondary" 
                    onClick={() => navigate("/eliminarProducto")}
                  >
                    Eliminar
                  </button> */}

                  <button
                    className="btn-primary"
                    onClick={() => navigate("/insertarProducto")}
                  >
                    Agregar
                  </button>
                </div>
              </div>

              <div className="table-container">
                {productos.length === 0 ? (
                  <p className="no-data">No hay productos registrados</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Estado</th>
                        <th>Producto</th>
                        <th>Altura</th>
                        <th>Peso</th>
                        <th>Material</th>
                        <th>Marca</th>
                        <th>Precio</th>
                        <th>Categoría</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productos.map(p => (
                        <tr key={p.id_producto} style={{
                          backgroundColor: p.estado === 0 ? '#fff3f3' : 'transparent',
                          opacity: p.estado === 0 ? 0.7 : 1
                        }}>
                          <td>{p.id_producto}</td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              backgroundColor: p.estado === 1 ? '#d4edda' : '#f8d7da',
                              color: p.estado === 1 ? '#155724' : '#721c24'
                            }}>
                              {p.estado === 1 ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                          </td>
                          <td>{p.nombre}</td>
                          <td>{p.altura ? `${p.altura} m²` : "N/A"}</td>
                          <td>{p.peso ? `${p.peso} kg` : "N/A"}</td>
                          <td>{p.material || "N/A"}</td>
                          <td>{p.marca || "N/A"}</td>
                          <td>${p.precio}</td>
                          <td>{p.categoria?.nombre || "Sin categoría"}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'nowrap' }}>
                              <button
                                className="btn-extra"
                                onClick={() => navigate(`/editar-producto/${p.id_producto}`)}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                              >
                                Modificar
                              </button>

                              {p.estado === 1 ? (
                                <button
                                  className="btn-delete"
                                  onClick={() => handleDesactivar(p.id_producto, p.nombre)}
                                  disabled={accionando === p.id_producto}
                                  style={{
                                    cursor: accionando === p.id_producto ? 'not-allowed' : 'pointer',
                                    opacity: accionando === p.id_producto ? 0.6 : 1,
                                    padding: '6px 12px',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  {accionando === p.id_producto ? 'Procesando...' : 'Desactivar'}
                                </button>
                              ) : (
                                <button
                                  className="btn-extra"
                                  onClick={() => handleActivar(p.id_producto, p.nombre)}
                                  disabled={accionando === p.id_producto}
                                  style={{
                                    cursor: accionando === p.id_producto ? 'not-allowed' : 'pointer',
                                    opacity: accionando === p.id_producto ? 0.6 : 1,
                                    padding: '6px 12px',
                                    fontSize: '0.85rem'
                                  }}
                                >
                                  {accionando === p.id_producto ? 'Procesando...' : 'Activar'}
                                </button>
                              )}
                            </div>
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