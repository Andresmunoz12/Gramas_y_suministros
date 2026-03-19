import '../styles/StatsCard.css';
export default function StatsCard({ icon, title, value, color = 'blue', onClick }) {
    return (
        // Contenedor principal de la tarjeta con clase dinámica según el color
        <div
            className={`stats-card stats-card-${color}`} // Aplica color dinámico
            onClick={onClick} // Ejecuta función al hacer clic (si existe)
            style={{ cursor: onClick ? 'pointer' : 'default' }} // Cambia cursor si es clickeable
        >
            {/* Contenedor del icono con animación */}
            <div className={`stats-icon ${icon}`}></div>

            {/* Contenedor de la información */}
            <div className="stats-info">
                {/* Título de la estadística */}
                <h3 className="stats-title">{title}</h3>

                {/* Valor numérico con formato */}
                <p className="stats-value">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                </p>
            </div>
        </div>
    );
}
