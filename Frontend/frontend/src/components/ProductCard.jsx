import { memo } from "react"; // 👈 Importar memo
import "../styles/ProductCard.css";
import { useNavigate } from "react-router-dom";

function ProductCard({ producto }) {
  const navigate = useNavigate();

  const handleVerMas = () => {
    navigate(`/producto/${producto.id_producto}`);
  };

  // Verifica que producto y sus propiedades existan
  if (!producto) return null;

  const imagenUrl = producto.imagen
    ? `http://localhost:3000/uploads/img_products/${producto.imagen}`
    : "/placeholder-producto.png";

  return (
    <div className="product-card">

      <span className="product-badge">
        {producto.categoria?.nombre || "Sin categoría"}
      </span>

      <div className="product-image">
        <img
          src={imagenUrl}
          alt={producto.nombre || "Producto"}
          onError={(e) => {
            e.target.src = "/placeholder-producto.png";
          }}
          loading="lazy" // 👈 Carga lazy para mejor rendimiento
        />
      </div>

      <div className="card-content">
        <h3>{producto.nombre || "Producto sin nombre"}</h3>
        <p>{producto.descripcion || "Sin descripción disponible"}</p>
      </div>

      <div className="card-footer">
        <span className="price">
          ${new Intl.NumberFormat("es-CO").format(producto.precio || 0)}
        </span>

        <button className="btn-add" onClick={handleVerMas}>
          VER MÁS
        </button>
      </div>

    </div>
  );
}

// 👈 Exportar con memo para evitar re-renders innecesarios
export default memo(ProductCard);