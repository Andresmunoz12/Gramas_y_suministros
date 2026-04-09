// Reportes - Página de estadísticas y reportes del sistema
// Muestra diferentes categorías de reportes para el administrador

import { useNavigate } from 'react-router-dom';
import '../../styles/AdminGlobal.css';
import './reportes.css';

export default function Reportes() {
  const navigate = useNavigate();

  const reportCards = [
    { title: 'Reporte de Ventas', icon: 'sales-icon', color: 'green', action: () => alert('Generando reporte de ventas...') },
    { title: 'Productos Más Vendidos', icon: 'best-seller-icon', color: 'green', action: () => alert('Generando reporte de productos...') },
    { title: 'Usuarios Registrados', icon: 'users-icon', color: 'green', action: () => navigate('/usuarios') },
    { title: 'Cotizaciones Generadas', icon: 'quotes-icon', color: 'green', action: () => navigate('/panel') },
    { title: 'Pedidos Finalizados', icon: 'orders-icon', color: 'green', action: () => alert('Generando reporte de pedidos...') },
  ];

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <h2>Dashboard</h2>
        <nav>
          <button onClick={() => navigate("/panel")}>Inventario</button>
          <button onClick={() => navigate("/usuarios")}>Usuarios</button>
          <button onClick={() => navigate("/stock")}>Stock</button>
          <button onClick={() => navigate("/reportes")} className="active">Reportes</button>
          <button onClick={() => navigate("/")}>Catálogo</button>
        </nav>
      </aside>

      <main className="main-area">
        <h1 style={{ color: '#1a3c34', marginBottom: '20px' }}>Dashboard de Reportes</h1>

        <div className="reportes-grid">
          {reportCards.map((card, index) => (
            <div
              key={index}
              className={`report-card card-${card.color}`}
              onClick={card.action}
            >
              <div className={`card-icon ${card.icon}`}></div>
              <h3>{card.title}</h3>
              <p>Clic para ver detalles</p>
            </div>
          ))}
        </div>

        <div className="charts-section">
          <div className="chart-placeholder">
            <h3>Resumen Mensual</h3>
            <div className="fake-chart"></div>
          </div>
        </div>
      </main>
    </div>
  );
}