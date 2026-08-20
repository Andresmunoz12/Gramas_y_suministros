// src/components/ProductCard.jsx
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';

function ProductCard({ producto }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  if (!producto) return null;

  const stockDisponible = producto.stock?.cantidad_actual ?? producto.stock_disponible ?? (typeof producto.stock === 'number' ? producto.stock : undefined);
  const sinStock = stockDisponible !== undefined && stockDisponible <= 0;

  const imagenUrl = producto.imagen
    ? `http://localhost:3000/uploads/img_products/${producto.imagen}`
    : '/placeholder-producto.png';

  const handleVerClick = () => {
    navigate(`/producto/${producto.id_producto}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (sinStock) {
      alert(`El producto "${producto.nombre}" no tiene stock disponible.`);
      return;
    }
    addToCart(producto);
  };

  return (
    <div className="product-card">
      <span className="product-badge">
        {producto.categoria?.nombre || 'Sin categoría'}
      </span>

      <div className="product-image">
        <img
          src={imagenUrl}
          alt={producto.nombre || 'Producto'}
          onError={(e) => {
            e.target.src = '/placeholder-producto.png';
          }}
          loading="lazy"
        />
      </div>

      <div className="card-content">
        <h3>{producto.nombre || 'Producto sin nombre'}</h3>
        <p>{producto.descripcion || 'Sin descripción disponible'}</p>
        {stockDisponible !== undefined && (
          <small style={{ color: sinStock ? '#d32f2f' : '#2e7d32', fontWeight: '600', display: 'block', marginTop: '4px' }}>
            {sinStock ? '⚠️ Sin stock disponible' : `📦 Stock: ${stockDisponible}`}
          </small>
        )}
      </div>

      <div className="card-footer">
        <span className="price">
          ${new Intl.NumberFormat('es-CO').format(producto.precio || 0)}
        </span>

        <div className="card-actions">
          <button className="btn-ver" onClick={handleVerClick}>
            Ver
          </button>
          <button
            className="btn-add"
            onClick={handleAddToCart}
            disabled={sinStock}
            style={sinStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
          >
            {sinStock ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ProductCard);