// src/pages/Reportes/ReportesDashboard.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";
import "../../styles/AdminGlobal.css";
import "../../styles/Panel.css";
import Footer from "../../components/Footer";
import NavComponent from "../../components/GlobalNav";
import { useAuth } from "../../context/AuthContext";
import ReportesService from "../../api/services/reportes.service";

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

export default function ReportesDashboard() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState({
    totalUsuarios: 0,
    usuariosActivos: 0,
    usuariosEnLinea: 0,
    totalProductos: 0,
    totalStock: 0,
    productosSinStock: 0,
    productosStockBajo: 0
  });

  const [fechaInicio, setFechaInicio] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [usuariosNuevos, setUsuariosNuevos] = useState({ total: 0, data: [] });
  const [productosNuevos, setProductosNuevos] = useState({ total: 0, data: [] });
  const [stockCritico, setStockCritico] = useState({ sinStock: { total: 0, productos: [] }, bajoStock: { total: 0, productos: [] } });
  const [usuariosEnLinea, setUsuariosEnLinea] = useState({ total: 0, usuarios: [] });

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      cargarDatosPorRango();
    }
  }, [fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resumenData, stockData, usuariosLineaData] = await Promise.all([
        ReportesService.getResumen(),
        ReportesService.getStockCritico(),
        ReportesService.getUsuariosEnLinea()
      ]);
      setResumen(resumenData);
      setStockCritico(stockData);
      setUsuariosEnLinea(usuariosLineaData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosPorRango = async () => {
    try {
      const [usuarios, productos] = await Promise.all([
        ReportesService.getUsuariosNuevos(fechaInicio, fechaFin),
        ReportesService.getProductosNuevos(fechaInicio, fechaFin)
      ]);
      setUsuariosNuevos(usuarios);
      setProductosNuevos(productos);
    } catch (error) {
      console.error("Error cargando datos por rango:", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Combinar datos para gráfico comparativo
  const datosComparativos = () => {
    const fechas = new Set();
    usuariosNuevos.data.forEach(item => fechas.add(item.fecha));
    productosNuevos.data.forEach(item => fechas.add(item.fecha));
    
    return Array.from(fechas).sort().map(fecha => ({
      fecha,
      usuarios: usuariosNuevos.data.find(u => u.fecha === fecha)?.cantidad || 0,
      productos: productosNuevos.data.find(p => p.fecha === fecha)?.cantidad || 0
    }));
  };

  // Datos para gráfico de stock
  const datosStock = [
    { name: 'Stock Normal', value: resumen.totalProductos - stockCritico.sinStock.total - stockCritico.bajoStock.total },
    { name: 'Stock Bajo', value: stockCritico.bajoStock.total },
    { name: 'Sin Stock', value: stockCritico.sinStock.total }
  ];

  if (loading) {
    return (
      <>
        <NavComponent />
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando reportes...</p>
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
            <button className="active" onClick={() => navigate("/reportes")}>Reportes</button>
            <button onClick={() => navigate("/")}>Catálogo</button>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </nav>
        </aside>

        {/* MAIN */}
        <div className="main-area">
          {/* STATS CARDS */}
          <section className="stats-row">
            <div className="stat-card green">
              <h3>{resumen.totalUsuarios}</h3>
              <p>Usuarios Totales</p>
              <small>{resumen.usuariosActivos} activos</small>
            </div>
            <div className="stat-card blue">
              <h3>{resumen.usuariosEnLinea}</h3>
              <p>Usuarios en Línea Hoy</p>
            </div>
            <div className="stat-card purple">
              <h3>{resumen.totalProductos}</h3>
              <p>Productos Totales</p>
            </div>
            <div className="stat-card orange">
              <h3>{resumen.totalStock}</h3>
              <p>Unidades en Stock</p>
            </div>
          </section>

          {/* FILTRO DE FECHAS */}
          <section className="table-section">
            <div className="table-card">
              <div className="table-header">
                <h3>Filtrar por fecha</h3>
                <div className="table-actions">
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label>
                      Desde:
                      <input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                        style={{ marginLeft: '5px', padding: '5px' }}
                      />
                    </label>
                    <label>
                      Hasta:
                      <input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                        style={{ marginLeft: '5px', padding: '5px' }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* GRÁFICO COMPARATIVO */}
          <section className="table-section">
            <div className="table-card">
              <div className="table-header">
                <h3>Usuarios vs Productos Nuevos</h3>
              </div>
              <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                  <LineChart data={datosComparativos()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="usuarios" stroke="#8884d8" name="Usuarios Nuevos" />
                    <Line type="monotone" dataKey="productos" stroke="#82ca9d" name="Productos Nuevos" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
                <p><strong>Resumen del período:</strong></p>
                <p>📊 Usuarios nuevos: {usuariosNuevos.total}</p>
                <p>📦 Productos nuevos: {productosNuevos.total}</p>
              </div>
            </div>
          </section>

          {/* GRÁFICO DE STOCK y USUARIOS EN LÍNEA */}
          <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Gráfico de stock */}
            <section className="table-section" style={{ margin: 0 }}>
              <div className="table-card">
                <div className="table-header">
                  <h3>Estado del Stock</h3>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={datosStock}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {datosStock.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            {/* Usuarios en línea */}
            <section className="table-section" style={{ margin: 0 }}>
              <div className="table-card">
                <div className="table-header">
                  <h3>Usuarios en Línea Hoy ({usuariosEnLinea.total})</h3>
                </div>
                <div className="table-container" style={{ maxHeight: 300, overflowY: 'auto' }}>
                  {usuariosEnLinea.usuarios.length === 0 ? (
                    <p className="no-data">No hay usuarios en línea hoy</p>
                  ) : (
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Nombre</th>
                          <th>Email</th>
                          <th>Rol</th>
                          <th>Último login</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usuariosEnLinea.usuarios.map(u => (
                          <tr key={u.id}>
                            <td>{u.nombre}</td>
                            <td>{u.email}</td>
                            <td>{u.rol}</td>
                            <td>{new Date(u.ultimoLogin).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* TABLA DE STOCK CRÍTICO */}
          <section className="table-section">
            <div className="table-card">
              <div className="table-header">
                <h3>⚠️ Alertas de Stock</h3>
              </div>
              
              <h4 style={{ margin: '15px 0 10px', color: '#d9534f' }}>Sin Stock ({stockCritico.sinStock.total})</h4>
              <div className="table-container">
                {stockCritico.sinStock.productos.length === 0 ? (
                  <p className="no-data">No hay productos sin stock</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockCritico.sinStock.productos.map(p => (
                        <tr key={p.id} style={{ backgroundColor: '#fff3f3' }}>
                          <td>{p.id}</td>
                          <td>{p.nombre}</td>
                          <td style={{ color: '#d9534f', fontWeight: 'bold' }}>{p.stockActual}</td>
                          <td>{p.stockMinimo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <h4 style={{ margin: '25px 0 10px', color: '#f0ad4e' }}>Stock Bajo ({stockCritico.bajoStock.total})</h4>
              <div className="table-container">
                {stockCritico.bajoStock.productos.length === 0 ? (
                  <p className="no-data">No hay productos con stock bajo</p>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Producto</th>
                        <th>Stock Actual</th>
                        <th>Stock Mínimo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockCritico.bajoStock.productos.map(p => (
                        <tr key={p.id} style={{ backgroundColor: '#fff8e7' }}>
                          <td>{p.id}</td>
                          <td>{p.nombre}</td>
                          <td style={{ color: '#f0ad4e', fontWeight: 'bold' }}>{p.stockActual}</td>
                          <td>{p.stockMinimo}</td>
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