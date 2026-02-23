import { useState, useEffect } from "react";
import NavComponent from "../components/GlobalNav";
import "../styles/Perfil.css";

export default function MisPedidos() {
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const rawUsuario = localStorage.getItem("usuario");
        if (rawUsuario) {
            const user = JSON.parse(rawUsuario);
            fetch(`http://localhost:3001/api/usuarios/pedidos/${user.id_usuario}`)
                .then(res => res.json())
                .then(data => {
                    setPedidos(data);
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
                    <h2>Mis Pedidos</h2>
                    <p>Consulta el historial de tus compras</p>
                </div>

                <div className="glass-effect" style={{ width: '100%', padding: '20px', borderRadius: '24px', marginTop: '20px' }}>
                    {loading ? (
                        <p>Cargando pedidos...</p>
                    ) : pedidos.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--primary-green)' }}>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Fecha</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Producto</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Cantidad</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>Motivo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedidos.map((p) => (
                                        <tr key={p.id_movimiento} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px' }}>{new Date(p.fecha).toLocaleDateString()}</td>
                                            <td style={{ padding: '12px' }}>{p.producto}</td>
                                            <td style={{ padding: '12px' }}>{p.cantidad}</td>
                                            <td style={{ padding: '12px' }}>{p.motivo}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', padding: '20px' }}>No has realizado pedidos todavía.</p>
                    )}
                </div>
            </main>
        </div>
    );
}
