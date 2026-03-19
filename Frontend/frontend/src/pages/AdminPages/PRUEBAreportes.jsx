// Reportes - Página de estadísticas y reportes del sistema
// Muestra diferentes categorías de reportes para el administrador

import { useNavigate } from 'react-router-dom';
import './reportes.css'; // Estilos específicos de reportes
import NavComponent from "../../components/GlobalNav";

export default function Reportes() {
  const navigate = useNavigate();

  // Datos de las tarjetas de reportes
  const reportCards = [
    { title: 'Reporte de Ventas', icon: 'sales-icon', color: 'blue', action: () => alert('Generando reporte de ventas...') },
    { title: 'Productos Más Vendidos', icon: 'best-seller-icon', color: 'green', action: () => alert('Generando reporte de productos...') },
    { title: 'Usuarios Registrados', icon: 'users-icon', color: 'purple', action: () => navigate('/panel-admin/usuarios') },
    { title: 'Cotizaciones Generadas', icon: 'quotes-icon', color: 'orange', action: () => navigate('/panel-admin/cotizaciones') },
    { title: 'Pedidos Finalizados', icon: 'orders-icon', color: 'red', action: () => alert('Generando reporte de pedidos...') },
  ];

  return (
    <>
      
      <NavComponent />

      <main className="reportes-content">
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

        {/* Sección de gráficos (Placeholder para futura implementación) */}
        <div className="charts-section">
          <div className="chart-placeholder">
            <h3>Resumen Mensual</h3>
            <div className="fake-chart"></div>
          </div>
        </div>
      </main>
    </>
  );
}