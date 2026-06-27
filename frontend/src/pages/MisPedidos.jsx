import { useState, useEffect } from "react";
import NavComponent from "../components/GlobalNav";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import "../styles/Perfil.css";

export default function MisPedidos() {
    const { user } = useAuth();
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const cargarPedidos = async () => {
            if (!user) return;
            try {
                // Fetch all movements from the backend
                const response = await api.get('/movimientos');
                const todos = response.data;

                // Filter only 'salidas' for the current user (which represent purchases/outgoing stock)
                const misPedidos = todos.filter(
                    (mov) => mov.tipo === 'salida' && mov.id_usuario === user.id_usuario
                );

                // Map to a user-friendly structure
                const pedidosFormateados = misPedidos.map((mov) => ({
                    id_movimiento: mov.id_movimiento,
                    fecha: mov.fecha,
                    producto: mov.producto?.nombre || "Desconocido",
                    cantidad: mov.cantidad,
                    motivo: mov.salida?.motivo || mov.detalle || "—",
                    destino: mov.salida?.destino || "—",
                }));

                setPedidos(pedidosFormateados);
            } catch (err) {
                console.error("Error al cargar pedidos:", err);
                setError("No se pudieron cargar los pedidos. Inténtalo más tarde.");
            } finally {
                setLoading(false);
            }
        };

        cargarPedidos();
    }, [user]);

    return (
        <div className="dashboard">
            <NavComponent />
            <main>
                <div className="profile-welcome glass-effect" style={{ width: '100%' }}>
                    <h2>Mis Pedidos</h2>
                    <p>Consulta el historial de tus compras y despachos</p>
                </div>

                <div className="glass-effect" style={{ width: '100%', padding: '20px', borderRadius: '24px', marginTop: '20px' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', padding: '20px' }}>⏳ Cargando pedidos...</p>
                    ) : error ? (
                        <p style={{ textAlign: 'center', padding: '20px', color: '#ef4444' }}>{error}</p>
                    ) : pedidos.length > 0 ? (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid var(--primary-green)' }}>
                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--primary-green)' }}>Fecha</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--primary-green)' }}>Producto</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--primary-green)' }}>Cantidad</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--primary-green)' }}>Motivo</th>
                                        <th style={{ padding: '12px', textAlign: 'left', color: 'var(--primary-green)' }}>Destino</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pedidos.map((p) => (
                                        <tr key={p.id_movimiento} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '12px' }}>{new Date(p.fecha).toLocaleDateString('es-CO')}</td>
                                            <td style={{ padding: '12px', fontWeight: '600' }}>{p.producto}</td>
                                            <td style={{ padding: '12px' }}>{p.cantidad}</td>
                                            <td style={{ padding: '12px' }}>{p.motivo}</td>
                                            <td style={{ padding: '12px' }}>{p.destino}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <p style={{ fontSize: '1.1rem', color: '#888' }}>📦 No tienes pedidos registrados todavía.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
