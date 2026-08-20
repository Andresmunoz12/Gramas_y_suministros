// src/pages/ProductDetail.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import NavComponent from "../components/GlobalNav";
import Footer from "../components/Footer";
import ProductosService from "../api/services/productos.service";
import { useCart } from "../context/CartContext"; // ✅ Importar useCart
import "../styles/ProductDetail.css";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart(); // ✅ Obtener la función addToCart
  const [producto, setProducto] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        setCargando(true);
        const data = await ProductosService.getById(id);
        setProducto(data);
      } catch (err) {
        console.error("❌ Error al obtener producto:", err);
        setError("No se pudo cargar la información del producto.");
      } finally {
        setCargando(false);
      }
    };

    if (id) {
      fetchProducto();
    }
  }, [id]);

  const stockDisponible = producto?.stock?.cantidad_actual ?? producto?.stock_disponible ?? (typeof producto?.stock === 'number' ? producto?.stock : undefined);
  const sinStock = stockDisponible !== undefined && stockDisponible <= 0;

  // ✅ Función para agregar al carrito con validación de stock
  const handleAddToCart = () => {
    if (!producto) return;
    if (sinStock) {
      alert(`El producto "${producto.nombre}" no tiene stock disponible.`);
      return;
    }
    if (stockDisponible !== undefined && cantidad > stockDisponible) {
      alert(`La cantidad solicitada del producto "${producto.nombre}" supera el stock disponible (Máximo: ${stockDisponible})`);
      return;
    }
    addToCart(producto, cantidad);
    alert(`✅ "${producto.nombre}" (${cantidad}) agregado a la cotización`);
  };

  if (cargando) {
    return (
      <>
        <NavComponent />
        <div className="product-detail-loading">
          <div className="loader"></div>
          <p>Cargando producto...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !producto) {
    return (
      <>
        <NavComponent />
        <div className="product-detail-error">
          <p>{error || "Producto no encontrado"}</p>
          <button onClick={() => navigate("/catalogo")} className="btn-back">
            Volver al catálogo
          </button>
        </div>
        <Footer />
      </>
    );
  }

  const imagenUrl = producto.imagen
    ? `http://localhost:3000/uploads/img_products/${producto.imagen}`
    : "/placeholder-producto.png";

  return (
    <>
      <NavComponent />

      <div className="product-detail-container">
        <button onClick={() => navigate('/')} className="btn-back">
          ← Regresar
        </button>

        <div className="product-detail-card">
          <div className="product-detail-image">
            <img
              src={imagenUrl}
              alt={producto.nombre || "Producto"}
              onError={(e) => {
                e.target.src = "/placeholder-producto.png";
              }}
            />
          </div>

          <div className="product-detail-info">
            <span className="product-detail-badge">
              {producto.categoria?.nombre || "Sin categoría"}
            </span>

            <h1>{producto.nombre || "Producto sin nombre"}</h1>

            <div className="product-detail-meta">
              <p>
                <strong>Marca:</strong> {producto.marca || "No especificada"}
              </p>
              <p>
                <strong>Material:</strong> {producto.material || "No especificado"}
              </p>
              {producto.peso && (
                <p>
                  <strong>Peso:</strong> {producto.peso} kg
                </p>
              )}
              {producto.altura && (
                <p>
                  <strong>Altura:</strong> {producto.altura} mm
                </p>
              )}
              {stockDisponible !== undefined && (
                <p>
                  <strong>Stock disponible:</strong>{' '}
                  <span style={{ color: sinStock ? '#d32f2f' : '#2e7d32', fontWeight: 'bold' }}>
                    {sinStock ? 'Sin stock disponible' : `${stockDisponible} unidades`}
                  </span>
                </p>
              )}
            </div>

            <p className="product-detail-description">
              {producto.descripcion || "Sin descripción disponible"}
            </p>

            {!sinStock && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '15px 0' }}>
                <label htmlFor="cantidad-detail"><strong>Cantidad a cotizar:</strong></label>
                <input
                  id="cantidad-detail"
                  type="number"
                  min="1"
                  max={stockDisponible !== undefined ? stockDisponible : 999}
                  value={cantidad}
                  onChange={(e) => {
                    const val = Math.max(1, Number(e.target.value));
                    if (stockDisponible !== undefined && val > stockDisponible) {
                      setCantidad(stockDisponible);
                      alert(`La cantidad solicitada no puede superar el stock disponible (${stockDisponible})`);
                    } else {
                      setCantidad(val);
                    }
                  }}
                  style={{ width: '80px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #ccc' }}
                />
              </div>
            )}

            <div className="product-detail-footer">
              <span className="product-detail-price">
                ${new Intl.NumberFormat("es-CO").format(producto.precio || 0)}
              </span>

              {/* ✅ Botón con validación */}
              <button
                className="btn-add-cart"
                onClick={handleAddToCart}
                disabled={sinStock}
                style={sinStock ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
              >
                {sinStock ? 'Sin stock disponible' : 'Agregar a cotización 🛒'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}