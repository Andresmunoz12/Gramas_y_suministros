import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import UsuariosService from '../../api/services/usuarios.service';
import '../../styles/AdminGlobal.css';
import '../../styles/PRUEBAusuarios.css';

export default function Usuarios() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [accionando, setAccionando] = useState(null);

    // Estadísticas
    const [stats, setStats] = useState({
        total: 0,
        activos: 0,
        inactivos: 0,
        suspendidos: 0,
        administradores: 0,
        clientes: 0,
    });

    // 🔥 Cargar usuarios reales desde backend usando axios
    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                setLoading(true);
                const data = await UsuariosService.getAll();
                setUsuarios(data);
                calcularEstadisticas(data);
            } catch (error) {
                console.error("Error cargando usuarios:", error);
                setError("No se pudieron cargar los usuarios");
            } finally {
                setLoading(false);
            }
        };

        fetchUsuarios();
    }, []);

    // 📊 Calcular estadísticas
    const calcularEstadisticas = (data) => {
        const total = data.length;
        const activos = data.filter(u => u.estado === 'activo').length;
        const inactivos = data.filter(u => u.estado === 'inactivo').length;
        const suspendidos = data.filter(u => u.estado === 'suspendido').length;
        const administradores = data.filter(u => u.id_rol === 1).length;
        const clientes = data.filter(u => u.id_rol === 2).length;

        setStats({
            total,
            activos,
            inactivos,
            suspendidos,
            administradores,
            clientes,
        });
    };

    // 🗑️ Eliminar usuario real usando axios
    const handleDelete = async (id) => {
        if (accionando) return;
        if (!window.confirm("¿Seguro que quieres eliminar este usuario?")) return;

        try {
            setAccionando(id);
            await UsuariosService.delete(id);

            // Actualizar la lista sin recargar
            const nuevosUsuarios = usuarios.filter(u => u.id_usuario !== id);
            setUsuarios(nuevosUsuarios);
            calcularEstadisticas(nuevosUsuarios);

        } catch (error) {
            console.error("Error eliminando usuario:", error);
            setError("Error al eliminar el usuario");
        } finally {
            setAccionando(null);
        }
    };

    // Función para cambiar estado
    const handleToggleStatus = async (id, estadoActual) => {
        if (accionando) return;
        
        let nuevoEstado;
        if (estadoActual === 'activo') {
            nuevoEstado = 'inactivo';
        } else if (estadoActual === 'inactivo') {
            nuevoEstado = 'activo';
        } else {
            nuevoEstado = 'activo';
        }

        const confirmar = window.confirm(
            `¿Estás seguro de ${estadoActual === 'activo' ? 'DESACTIVAR' : 'ACTIVAR'} este usuario?`
        );
        if (!confirmar) return;

        try {
            setAccionando(id);
            await UsuariosService.cambiarEstado(id, nuevoEstado);

            // Actualizar el estado en la lista
            const usuariosActualizados = usuarios.map(u =>
                u.id_usuario === id
                    ? { ...u, estado: nuevoEstado }
                    : u
            );
            setUsuarios(usuariosActualizados);
            calcularEstadisticas(usuariosActualizados);

        } catch (error) {
            console.error("Error cambiando estado:", error);
            setError("Error al cambiar el estado del usuario");
        } finally {
            setAccionando(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const getEstadoColor = (estado) => {
        const colores = {
            activo: '#22c55e',
            inactivo: '#f59e0b',
            suspendido: '#ef4444',
        };
        return colores[estado] || '#64748b';
    };

    if (error) {
        return (
            <div className="admin-layout">
                <aside className="sidebar">
                    <h2>Dashboard</h2>
                    <div className="user-info">
                        <p>Bienvenido, {user?.nombre}</p>
                    </div>
                    <nav>
                        <button onClick={() => navigate("/panel")}>Inventario</button>
                        <button className="active" onClick={() => navigate("/usuarios")}>Usuarios</button>
                        <button onClick={() => navigate("/proveedores")}>Proveedores</button>
                        <button onClick={() => navigate("/categorias")}>Categorías</button>
                        <button onClick={() => navigate("/stock")}>Stock</button>
                        <button onClick={() => navigate("/reportes")}>Reportes</button>
                        <button onClick={() => navigate("/gestion-cotizaciones")}>Cotizaciones</button>
                        <button onClick={() => navigate("/")}>Catálogo</button>
                        <button onClick={handleLogout}>Cerrar Sesión</button>
                    </nav>
                </aside>
                <div className="main-area">
                    <div className="error-message">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout">

            {/* SIDEBAR */}
            <aside className="sidebar">
                <h2>Dashboard</h2>
                <div className="user-info">
                    <p>Bienvenido, {user?.nombre}</p>
                </div>
                <nav>
                    <button onClick={() => navigate("/panel")}>Inventario</button>
                    <button className="active" onClick={() => navigate("/usuarios")}>Usuarios</button>
                    <button onClick={() => navigate("/proveedores")}>Proveedores</button>
                    <button onClick={() => navigate("/categorias")}>Categorías</button>
                    <button onClick={() => navigate("/stock")}>Stock</button>
                    <button onClick={() => navigate("/reportes")}>Reportes</button>
                    <button onClick={() => navigate("/gestion-cotizaciones")}>Cotizaciones</button>
                    <button onClick={() => navigate("/")}>Catálogo</button>
                    <button onClick={handleLogout}>Cerrar Sesión</button>
                </nav>
            </aside>

            {/* MAIN */}
            <div className="main-area">

                {/* STATS CARDS */}
                <section className="stats-row">
                    <div className="stat-card green">
                        <h3>{stats.total}</h3>
                        <p>Total Usuarios</p>
                    </div>
                    <div className="stat-card purple">
                        <h3>{stats.activos}</h3>
                        <p>Activos</p>
                        <small>{stats.inactivos} inactivos</small>
                    </div>
                    <div className="stat-card blue">
                        <h3>{stats.administradores}</h3>
                        <p>Administradores</p>
                    </div>
                    <div className="stat-card orange">
                        <h3>{stats.clientes}</h3>
                        <p>Clientes</p>
                    </div>
                </section>

                <section className="table-section">
                    <div className="table-card">

                        <div className="table-header">
                            <h3>Gestión de Usuarios</h3>

                            <div className="table-actions">
                                <button
                                    className="btn-primary"
                                    onClick={() => navigate("/crear-usuario")}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="8.5" cy="7" r="4"/>
                                        <line x1="20" y1="8" x2="20" y2="14"/>
                                        <line x1="23" y1="11" x2="17" y2="11"/>
                                    </svg>
                                    Nuevo Usuario
                                </button>
                            </div>
                        </div>

                        <div className="table-container">

                            {loading ? (
                                <div className="loading-container">
                                    <div className="loader"></div>
                                    <p>Cargando usuarios...</p>
                                </div>
                            ) : usuarios.length === 0 ? (
                                <p className="no-data">No hay usuarios registrados</p>
                            ) : (
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Nombre</th>
                                            <th>Email</th>
                                            <th>Rol</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {usuarios.map(user => (
                                            <tr key={user.id_usuario}>
                                                <td>{user.id_usuario}</td>

                                                <td>
                                                    <strong>{user.nombre} {user.apellido || ''}</strong>
                                                </td>

                                                <td>{user.email}</td>

                                                <td>
                                                    <span className={`badge ${user.id_rol === 1
                                                        ? 'badge-admin'
                                                        : user.id_rol === 3
                                                        ? 'badge-almacen'
                                                        : 'badge-client'
                                                        }`}>
                                                        {user.id_rol === 1 ? 'Administrador' :
                                                         user.id_rol === 3 ? 'Almacenista' : 'Cliente'}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="status-badge" style={{
                                                        backgroundColor: getEstadoColor(user.estado) + '20',
                                                        color: getEstadoColor(user.estado),
                                                    }}>
                                                        ● {user.estado}
                                                    </span>
                                                </td>

                                                <td>
                                                    <div className="acciones-container">
                                                        <button
                                                            className="btn-extra"
                                                            onClick={() =>
                                                                navigate(`/editar-usuario/${user.id_usuario}`)
                                                            }
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            className={`btn-${user.estado === 'activo' ? 'warning' : 'success'}`}
                                                            onClick={() =>
                                                                handleToggleStatus(user.id_usuario, user.estado)
                                                            }
                                                            disabled={accionando === user.id_usuario}
                                                        >
                                                            {accionando === user.id_usuario ? '...' : 
                                                             user.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                                        </button>

                                                        <button
                                                            className="btn-danger"
                                                            onClick={() => handleDelete(user.id_usuario)}
                                                            disabled={accionando === user.id_usuario}
                                                        >
                                                            {accionando === user.id_usuario ? '...' : 'Eliminar'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}