import NavComponent from "../components/GlobalNav";
import Footer from "../components/Footer";
import "../styles/Nosotros.css";

export default function QuienesSomos() {
  return (
    <div className="app-nosotros">

      <NavComponent />

      {/* HERO */}
      <section className="nosotros-hero">
        <div className="hero-content">
          <h1>Transformamos Espacios, Creamos Experiencias</h1>
          <p>
            Más de 10 años liderando proyectos de grama sintética,
            superficies deportivas y soluciones paisajísticas en Colombia.
          </p>
        </div>
      </section>

      <div className="nosotros-container">

        {/* HISTORIA */}
        <section className="historia">
          <div className="historia-text">
            <h2>Nuestra Historia</h2>
            <p>
              En <strong>Gramas y Suministros</strong> comenzamos como un pequeño
              emprendimiento familiar con una visión clara: elevar la calidad
              de los espacios verdes en Colombia.
              Hoy somos referentes nacionales en soluciones deportivas,
              residenciales y comerciales.
            </p>
          </div>

          <div className="historia-image">
            <div className="placeholder-img-large">🏢</div>
          </div>
        </section>

        {/* ESTADÍSTICAS */}
        <section className="nosotros-stats">
          <div className="stat">
            <h3>+500</h3>
            <p>Proyectos completados</p>
          </div>
          <div className="stat">
            <h3>+10</h3>
            <p>Años de experiencia</p>
          </div>
          <div className="stat">
            <h3>98%</h3>
            <p>Clientes satisfechos</p>
          </div>
        </section>

        {/* MISIÓN & VISIÓN */}
        <section className="mission-vision">
          <div className="mv-card">
            <h2>Misión</h2>
            <p>
              Ofrecer soluciones integrales en superficies sintéticas,
              garantizando innovación, sostenibilidad y excelencia en cada proyecto.
            </p>
          </div>

          <div className="mv-card">
            <h2>Visión</h2>
            <p>
              Ser la empresa líder en Colombia para 2030 en soluciones
              de grama sintética y paisajismo sostenible.
            </p>
          </div>
        </section>

        <section className="nosotros-values">
                    <h2 className="outlined-text section-center">Nuestros Valores</h2>
                    <div className="values-grid">
                        <div className="value-item">
                            <h3>Calidad</h3>
                            <p>No negociamos la excelencia de nuestros productos.</p>
                        </div>
                        <div className="value-item">
                            <h3>Integridad</h3>
                            <p>Actuamos con honestidad y transparencia en cada proyecto.</p>
                        </div>
                        <div className="value-item">
                            <h3>Innovación</h3>
                            <p>Buscamos constantemente nuevas tecnologías y métodos.</p>
                        </div>
                    </div>
                </section>

        {/* POR QUÉ ELEGIRNOS */}
        <section className="por-que">
          <h2>¿Por qué elegirnos?</h2>
          <div className="por-que-grid">
            <div>
              <h4>✔ Materiales Premium</h4>
              <p>Trabajamos con proveedores certificados y tecnología avanzada.</p>
            </div>
            <div>
              <h4>✔ Instalación Profesional</h4>
              <p>Equipo técnico altamente capacitado.</p>
            </div>
            <div>
              <h4>✔ Garantía Real</h4>
              <p>Respaldamos cada proyecto con garantía y soporte continuo.</p>
            </div>
          </div>
        </section>

      </div>

      <Footer />

    </div>
  );
}
