// src/pages/AdminPages/Reportes.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import ReportesService from "../../api/services/reportes.service";
import "../../styles/AdminGlobal.css";
import "../../styles/Reportes.css";

const COLORS = ['#2e7d32', '#1976d2', '#f57c00', '#d32f2f', '#9c27b0', '#00897b'];

// ============ DASHBOARD CONTENT ============
function DashboardContent({ data }) {
  const stats = [
    { 
      label: 'Usuarios', 
      value: data.usuarios?.total || 0, 
      sub: `${data.usuarios?.activos || 0} activos`, 
      color: '#2e7d32' 
    },
    { 
      label: 'Productos', 
      value: data.productos?.total || 0, 
      sub: `${data.productos?.activos || 0} activos`, 
      color: '#1976d2' 
    },
    { 
      label: 'Stock Total', 
      value: data.stock?.total || 0, 
      sub: `${data.stock?.sinStock || 0} sin stock`, 
      color: '#f57c00' 
    },
    { 
      label: 'Cotizaciones Pendientes', 
      value: data.cotizaciones?.pendientes || 0, 
      sub: `$${(data.ventasMes || 0).toLocaleString()} ventas mes`, 
      color: '#d32f2f' 
    },
    { 
      label: 'Usuarios en Línea', 
      value: data.usuariosEnLinea?.total || 0, 
      sub: 'activos hoy', 
      color: '#9c27b0' 
    },
  ];

  const stockData = [
    { name: 'Stock Normal', value: Math.max(0, (data.stock?.total || 0) - (data.stock?.sinStock || 0) - (data.stock?.stockBajo || 0)) },
    { name: 'Stock Bajo', value: data.stock?.stockBajo || 0 },
    { name: 'Sin Stock', value: data.stock?.sinStock || 0 },
  ];

  return (
    <div className="reportes-dashboard">
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card" style={{ borderTop: `4px solid ${stat.color}` }}>
            <h3>{stat.value.toLocaleString()}</h3>
            <p>{stat.label}</p>
            <small>{stat.sub}</small>
          </div>
        ))}
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <h4>📊 Estado del Stock</h4>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={stockData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {stockData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h4>📈 Nuevos Registros (Usuarios vs Productos)</h4>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.comparativoNuevos || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="usuarios" stroke="#2e7d32" name="Usuarios" />
              <Line type="monotone" dataKey="productos" stroke="#1976d2" name="Productos" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-card">
          <h4>👥 Usuarios en Línea (hoy)</h4>
          {data.usuariosEnLinea?.usuarios?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
              <p>No hay usuarios que hayan iniciado sesión hoy</p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '8px', color: '#2e7d32', fontWeight: 'bold' }}>
                🟢 {data.usuariosEnLinea?.total || 0} usuarios conectados hoy
              </div>
              <div className="table-container">
                <table className="admin-table" style={{ fontSize: '0.9rem' }}>
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Email</th>
                      <th>Rol</th>
                      <th>Último acceso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.usuariosEnLinea?.usuarios?.map((u) => (
                      <tr key={u.id}>
                        <td><strong>{u.nombre}</strong></td>
                        <td>{u.email}</td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor: u.rol === 'administrador' ? '#c8e6c9' :
                                           u.rol === 'almacenista' ? '#bbdefb' : '#ffecb3',
                            color: u.rol === 'administrador' ? '#1b5e20' :
                                   u.rol === 'almacenista' ? '#0d47a1' : '#e65100',
                          }}>
                            {u.rol}
                          </span>
                        </td>
                        <td>
                          <span style={{ color: '#666', fontSize: '0.85rem' }}>
                            {u.ultimoLogin ? new Date(u.ultimoLogin).toLocaleTimeString() : 'N/A'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '8px' }}>
                <small style={{ color: '#999' }}>
                  📊 Usuarios que iniciaron sesión hoy
                </small>
              </div>
            </>
          )}
        </div>

        <div className="chart-card">
          <h4>💰 Ventas Diarias</h4>
          {data.ventasDiarias?.data?.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <p>No hay ventas registradas</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.ventasDiarias?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="#2e7d32" fill="#4caf50" />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <small style={{ color: '#666' }}>
                  💵 Total: ${(data.ventasDiarias?.totalVentas || 0).toLocaleString()}
                </small>
                <small style={{ color: '#666' }}>
                  📊 Últimos 30 días
                </small>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-charts full-width">
        <div className="chart-card">
          <h4>🆕 Últimos Usuarios Registrados</h4>
          {data.ultimosUsuarios?.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '0.9rem' }}>
              No hay usuarios registrados
            </p>
          ) : (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ultimosUsuarios?.slice(0, 5).map((u, index) => (
                    <tr key={u.id || index}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{u.nombre}</strong>
                        <br />
                        <span className="usuario-email">{u.email}</span>
                      </td>
                      <td>
                        <span className={`rol-badge ${u.rol?.toLowerCase() || 'default'}`}>
                          {u.rol || 'Sin rol'}
                        </span>
                      </td>
                      <td>{u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="chart-card">
          <h4>🆕 Últimos Productos Agregados</h4>
          {data.ultimosProductos?.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: '#999', fontSize: '0.9rem' }}>
              No hay productos registrados
            </p>
          ) : (
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ultimosProductos?.slice(0, 5).map((p, index) => (
                    <tr key={p.id || index}>
                      <td>{index + 1}</td>
                      <td>
                        <strong>{p.nombre}</strong>
                        <br />
                        <span className="producto-precio">${p.precio?.toLocaleString() || 0}</span>
                      </td>
                      <td>
                        <span className="categoria-badge">
                          {p.categoria || 'Sin categoría'}
                        </span>
                      </td>
                      <td>{p.fechaRegistro ? new Date(p.fechaRegistro).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ USUARIOS CONTENT ============
function UsuariosContent({ data }) {
  const porRolData = data?.porRol ? Object.entries(data.porRol).map(([nombre, valor]) => ({ nombre, valor })) : [];

  return (
    <div className="reportes-modulo">
      <div className="stats-grid">
        <div className="stat-card"><h3>{data?.total || 0}</h3><p>Total Usuarios</p></div>
        <div className="stat-card"><h3>{data?.activos || 0}</h3><p>Activos</p></div>
        <div className="stat-card"><h3>{data?.inactivos || 0}</h3><p>Inactivos</p></div>
        <div className="stat-card"><h3>{data?.suspendidos || 0}</h3><p>Suspendidos</p></div>
      </div>

      <div className="chart-card">
        <h4>Usuarios por Rol</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={porRolData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="nombre" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="valor" fill="#2e7d32" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ============ PRODUCTOS CONTENT ============
function ProductosContent({ data }) {
  let categoriasArray = [];
  
  if (data?.porCategoria) {
    if (Array.isArray(data.porCategoria)) {
      categoriasArray = data.porCategoria;
    } else if (typeof data.porCategoria === 'object') {
      categoriasArray = Object.entries(data.porCategoria).map(([nombre, valor]) => ({ nombre, valor }));
    }
  }

  return (
    <div className="reportes-modulo">
      <div className="stats-grid">
        <div className="stat-card"><h3>{data?.total || 0}</h3><p>Total Productos</p></div>
        <div className="stat-card"><h3>{data?.activos || 0}</h3><p>Activos</p></div>
        <div className="stat-card"><h3>{data?.inactivos || 0}</h3><p>Inactivos</p></div>
        <div className="stat-card"><h3>{data?.conStock || 0}</h3><p>Con Stock</p></div>
      </div>

      <div className="chart-card">
        <h4>Distribución por Categoría</h4>
        {categoriasArray.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <p>No hay datos de categorías disponibles</p>
            <p style={{ fontSize: '14px' }}>{data?.total > 0 ? `Hay ${data.total} productos pero no tienen categorías asignadas` : ''}</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoriasArray}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ nombre, valor }) => `${nombre}: ${valor}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="valor"
              >
                {categoriasArray.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ============ STOCK CONTENT ============
function StockContent({ data }) {
  const detalleData = data?.detalle || [];

  return (
    <div className="reportes-modulo">
      <div className="stats-grid">
        <div className="stat-card"><h3>{data?.total || 0}</h3><p>Total Productos</p></div>
        <div className="stat-card"><h3>{data?.normal || 0}</h3><p>Stock Normal</p></div>
        <div className="stat-card"><h3>{data?.bajoStock || 0}</h3><p>Stock Bajo</p></div>
        <div className="stat-card"><h3>{data?.sinStock || 0}</h3><p>Sin Stock</p></div>
      </div>

      <div className="chart-card">
        <h4>Detalle de Productos</h4>
        <div className="table-container" style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Stock Actual</th>
                <th>Stock Mínimo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {detalleData.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No hay productos registrados</td></tr>
              ) : (
                detalleData.map((item) => (
                  <tr key={item.id} style={{
                    backgroundColor: item.estado === 'Sin stock' ? '#fff3f3' :
                                   item.estado === 'Stock bajo' ? '#fff8e7' : 'transparent'
                  }}>
                    <td>
                      <strong>{item.producto}</strong>
                      <br />
                      <small style={{ color: '#999', fontSize: '11px' }}>
                        ID: {item.id}
                      </small>
                    </td>
                    <td>
                      <strong style={{
                        color: item.estado === 'Sin stock' ? '#d32f2f' :
                               item.estado === 'Stock bajo' ? '#f57c00' : '#2e7d32',
                      }}>
                        {item.stock}
                      </strong>
                    </td>
                    <td>{item.minimo}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: item.estado === 'Sin stock' ? '#ffcdd2' :
                                        item.estado === 'Stock bajo' ? '#ffecb3' : '#c8e6c9',
                        color: item.estado === 'Sin stock' ? '#c62828' :
                               item.estado === 'Stock bajo' ? '#e65100' : '#1b5e20',
                      }}>
                        {item.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: '8px', textAlign: 'right', color: '#999', fontSize: '12px' }}>
          Mostrando {detalleData.length} productos
        </div>
      </div>
    </div>
  );
}

// ============ COMPONENTE PRINCIPAL ============
export default function Reportes() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  const [usuarios, setUsuarios] = useState(null);
  const [productos, setProductos] = useState(null);
  const [stock, setStock] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (activeTab === 'usuarios') cargarUsuarios();
    if (activeTab === 'productos') cargarProductos();
    if (activeTab === 'stock') cargarStock();
  }, [activeTab]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await ReportesService.getDashboard();
      setDashboard(data);
      setError(null);
    } catch (err) {
      console.error("Error cargando dashboard:", err);
      setError("No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      const data = await ReportesService.getResumenUsuarios({});
      setUsuarios(data);
    } catch (err) {
      console.error("Error cargando usuarios:", err);
    }
  };

  const cargarProductos = async () => {
    try {
      const data = await ReportesService.getResumenProductos({
        categoria: '',
        estado: '',
      });
      
      if (!data.porCategoria) {
        data.porCategoria = [];
      }
      
      setProductos(data);
    } catch (err) {
      console.error("Error cargando productos:", err);
    }
  };

  const cargarStock = async () => {
    try {
      const data = await ReportesService.getEstadoStock();
      setStock(data);
    } catch (err) {
      console.error("Error cargando stock:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'usuarios', label: '👥 Usuarios' },
    { id: 'productos', label: '📦 Productos' },
    { id: 'stock', label: '📈 Stock' },
  ];

  if (loading) {
    return (
      <div className="admin-layout">
        <aside className="sidebar">
          <h2>Dashboard</h2>
          <div className="user-info"><p>Bienvenido, {user?.nombre}</p></div>
          <nav>
            <button onClick={() => navigate("/panel")}>Inventario</button>
            <button onClick={() => navigate("/usuarios")}>Usuarios</button>
            <button onClick={() => navigate("/stock")}>Stock</button>
            <button onClick={() => navigate("/reportes")}>Reportes</button>
            <button onClick={() => navigate("/gestion-cotizaciones")}>Cotizaciones</button>
            <button onClick={() => navigate("/")}>Catálogo</button>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </nav>
        </aside>
        <div className="main-area">
          <div className="loading-container"><div className="loader"></div><p>Cargando reportes...</p></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-layout">
        <aside className="sidebar">
          <h2>Dashboard</h2>
          <div className="user-info"><p>Bienvenido, {user?.nombre}</p></div>
          <nav>
            <button onClick={() => navigate("/panel")}>Inventario</button>
            <button onClick={() => navigate("/usuarios")}>Usuarios</button>
            <button onClick={() => navigate("/stock")}>Stock</button>
            <button className="active" onClick={() => navigate("/reportes")}>Reportes</button>
            <button onClick={() => navigate("/gestion-cotizaciones")}>Cotizaciones</button>
            <button onClick={() => navigate("/")}>Catálogo</button>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </nav>
        </aside>
        <div className="main-area">
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: '#d32f2f', fontSize: '1.2rem' }}>{error}</p>
            <button onClick={cargarDatos} className="btn-retry">Reintentar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <h2>Dashboard</h2>
        <div className="user-info"><p>Bienvenido, {user?.nombre}</p></div>
        <nav>
          <button onClick={() => navigate("/panel")}>Inventario</button>
          <button onClick={() => navigate("/usuarios")}>Usuarios</button>
          <button onClick={() => navigate("/stock")}>Stock</button>
          <button className="active" onClick={() => navigate("/reportes")}>Reportes</button>
          <button onClick={() => navigate("/gestion-cotizaciones")}>Cotizaciones</button>
          <button onClick={() => navigate("/")}>Catálogo</button>
          <button onClick={handleLogout}>Cerrar Sesión</button>
        </nav>
      </aside>

      <div className="main-area">
        <div className="reportes-header">
          <h1>📊 Reportes y Estadísticas</h1>
          <div className="reportes-actions">
            <button className="btn-excel" onClick={() => ReportesService.exportarExcel()}>
              📊 Exportar Excel
            </button>
            <button className="btn-pdf" onClick={() => ReportesService.exportarPDF()}>
              📄 Exportar PDF
            </button>
          </div>
        </div>

        <div className="reportes-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="reportes-content">
          {activeTab === 'dashboard' && dashboard && <DashboardContent data={dashboard} />}
          {activeTab === 'usuarios' && usuarios && <UsuariosContent data={usuarios} />}
          {activeTab === 'productos' && <ProductosContent data={productos} />}
          {activeTab === 'stock' && <StockContent data={stock} />}
        </div>
      </div>
    </div>
  );
}