import { Link } from "react-router-dom";
import "../styles/Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Columna 1 - Logo + descripción */}
        <div className="footer-col">
          <h2 className="footer-logo">Gramas y Suministros</h2>
          <p className="footer-description">
            Soluciones en césped sintético y suministros de alta calidad
            para proyectos residenciales y comerciales.
          </p>
        </div>

        {/* Columna 2 */}
        <div className="footer-col">
          <h3>Productos</h3>
          <ul>
            <li><Link to="/">Catálogo</Link></li>
            <li><Link to="/">Cotizaciones</Link></li>
            <li><Link to="/">Instalaciones</Link></li>
            <li><Link to="/">Accesorios</Link></li>
          </ul>
        </div>

        {/* Columna 3 */}
        <div className="footer-col">
          <h3>Servicios</h3>
          <ul>
            <li><Link to="/">Asesoría</Link></li>
            <li><Link to="/">Diseño</Link></li>
            <li><Link to="/">Instalación</Link></li>
            <li><Link to="/">Mantenimiento</Link></li>
          </ul>
        </div>

        {/* Columna 4 */}
        <div className="footer-col">
          <h3>Contacto</h3>
          <p>Email: contacto@gramasysuministros.com</p>
          <p>Tel: +52 123 456 7890</p>

          <div className="footer-social">
            <a href="#">Facebook</a>
            <a href="#">Instagram</a>
            <a href="#">LinkedIn</a>
          </div>
        </div>

      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} Gramas y Suministros — Todos los derechos reservados.
      </div>
    </footer>
  );
}
