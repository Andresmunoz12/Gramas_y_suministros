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

  // ✅ Función para agregar al carrito
  const handleAddToCart = () => {
    if (producto) {
      addToCart(producto);
      // Opcional: mostrar un mensaje o notificación
      alert(`✅ "${producto.nombre}" agregado a la cotización`);
    }
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
            </div>

            <p className="product-detail-description">
              {producto.descripcion || "Sin descripción disponible"}
            </p>

            <div className="product-detail-footer">
              <span className="product-detail-price">
                ${new Intl.NumberFormat("es-CO").format(producto.precio || 0)}
              </span>

              {/* ✅ Botón corregido */}
              <button className="btn-add-cart" onClick={handleAddToCart}>
                Agregar a cotización 🛒
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}