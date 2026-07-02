// src/components/ProductCard.jsx
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';

function ProductCard({ producto }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();

  if (!producto) return null;

  const imagenUrl = producto.imagen
    ? `http://localhost:3000/uploads/img_products/${producto.imagen}`
    : '/placeholder-producto.png';

  const handleVerClick = () => {
    navigate(`/producto/${producto.id_producto}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
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
      </div>

      <div className="card-footer">
        <span className="price">
          ${new Intl.NumberFormat('es-CO').format(producto.precio || 0)}
        </span>

        <div className="card-actions">
          <button className="btn-ver" onClick={handleVerClick}>
            Ver
          </button>
          <button className="btn-add" onClick={handleAddToCart}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ProductCard);