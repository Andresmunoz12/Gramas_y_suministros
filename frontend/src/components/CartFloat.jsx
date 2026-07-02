// src/components/CartFloat.jsx
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import '../styles/CartFloat.css';

export default function CartFloat() {
  const { getTotalItems } = useCart();
  const navigate = useNavigate();
  const total = getTotalItems();

  if (total === 0) return null;

  return (
    <button className="cart-float" onClick={() => navigate('/cotizacion')}>
      <span className="cart-float-icon">🛒</span>
      <span className="cart-float-badge">{total}</span>
      <span className="cart-float-text">Ver cotización</span>
    </button>
  );
}