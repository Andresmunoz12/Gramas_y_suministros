import { useState, useEffect } from "react";
import NavComponent from "../components/GlobalNav";
import "../styles/Perfil.css";

export default function MisCotizaciones() {
    const [cotizaciones, setCotizaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const rawUsuario = localStorage.getItem("usuario");
        if (rawUsuario) {
            const user = JSON.parse(rawUsuario);
            fetch(`http://localhost:3001/api/usuarios/cotizaciones/${user.id_usuario}`)
                .then(res => res.json())
                .then(data => {
                    setCotizaciones(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, []);

    return (
        <div className="dashboard">
            <NavComponent />
            <main>
                <div className="profile-welcome glass-effect" style={{ width: '100%' }}>
                    <h2>Mis Cotizaciones</h2>
                    <p>Gestiona tus solicitudes de presupuestos</p>
                </div>

                <div className="glass-effect" style={{ width: '100%', padding: '20px', borderRadius: '24px', marginTop: '20px' }}>
                    {loading ? (
                        <p>Cargando cotizaciones...</p>
                    ) : cotizaciones.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                            {cotizaciones.map((c) => (
                                <div key={c.id} className="link-card glass-effect" style={{ padding: '20px', alignItems: 'flex-start' }}>
                                    <h3 style={{ margin: '0 0 10px 0' }}>{c.descripcion}</h3>
                                    <p><strong>Fecha:</strong> {new Date(c.fecha).toLocaleDateString()}</p>
                                    <p><strong>Total Estimado:</strong> ${c.total.toLocaleString()}</p>
                                    <p><strong>Estado:</strong> <span style={{ color: 'var(--primary-green)', fontWeight: 'bold' }}>{c.estado}</span></p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', padding: '20px' }}>No tienes cotizaciones registradas.</p>
                    )}
                </div>
            </main>
        </div>
    );
}
