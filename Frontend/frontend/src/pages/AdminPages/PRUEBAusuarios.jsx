import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UsuariosService from '../../api/services/usuarios.service';
import '../../styles/AdminGlobal.css';
import '../../styles/PRUEBAusuarios.css';
import NavComponent from "../../components/GlobalNav";

export default function Usuarios() {
    const navigate = useNavigate();
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // 🔥 Cargar usuarios reales desde backend usando axios
    useEffect(() => {
        const fetchUsuarios = async () => {
            try {
                setLoading(true);
                const data = await UsuariosService.getAll();
                setUsuarios(data);
            } catch (error) {
                console.error("Error cargando usuarios:", error);
                setError("No se pudieron cargar los usuarios");
            } finally {
                setLoading(false);
            }
        };

        fetchUsuarios();
    }, []);

    // 🗑️ Eliminar usuario real usando axios
    const handleDelete = async (id) => {
        if (!window.confirm("¿Seguro que quieres eliminar este usuario?")) return;

        try {
            await UsuariosService.delete(id);

            // Actualizar la lista sin recargar
            setUsuarios(prev =>
                prev.filter(u => u.id_usuario !== id)
            );

        } catch (error) {
            console.error("Error eliminando usuario:", error);
            setError("Error al eliminar el usuario");
        }
    };

    // Función para cambiar estado
    const handleToggleStatus = async (id, estadoActual) => {
        const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';

        try {
            await UsuariosService.cambiarEstado(id, nuevoEstado);

            // Actualizar el estado en la lista
            setUsuarios(prev =>
                prev.map(u =>
                    u.id_usuario === id
                        ? { ...u, estado: nuevoEstado }
                        : u
                )
            );

        } catch (error) {
            console.error("Error cambiando estado:", error);
            setError("Error al cambiar el estado del usuario");
        }
    };

    if (error) {
        return (
            <div className="admin-layout">
                <aside className="sidebar">
                    <h2>Dashboard</h2>
                    <nav>
                        <button onClick={() => navigate("/panel")}>Inventario</button>
                        <button onClick={() => navigate("/usuarios")}>Usuarios</button>
                        <button onClick={() => navigate("/stock")}>Stock</button>
                        <button onClick={() => navigate("/reportes")}>Reportes</button>
                        <button onClick={() => navigate("/")}>Catalogo</button>
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

                <nav>
                    <button onClick={() => navigate("/panel")}>Inventario</button>
                    <button onClick={() => navigate("/usuarios")}>Usuarios</button>
                    <button onClick={() => navigate("/stock")}>Stock</button>
                    <button onClick={() => navigate("/reportes")}>Reportes</button>
                    <button onClick={() => navigate("/")}>Catalogo</button>
                </nav>
            </aside>

            {/* MAIN */}
            <div className="main-area">

                <section className="table-section">
                    <div className="table-card">

                        <div className="table-header">
                            <h3>Gestión de Usuarios</h3>

                            <div className="table-actions">

                                {/* <button
                                    className="btn-primary"
                                    onClick={() => navigate("/crear-usuario")}
                                >
                                    Nuevo Usuario
                                </button> */}
                            </div>
                        </div>

                        <div className="table-container">

                            {loading ? (
                                <p style={{ padding: "20px" }}>
                                    Cargando usuarios...
                                </p>
                            ) : usuarios.length === 0 ? (
                                <p style={{ padding: "20px" }}>
                                    No hay usuarios registrados
                                </p>
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
                                                    {user.nombre} {user.apellido}
                                                </td>

                                                <td>{user.email}</td>

                                                <td>
                                                    <span className={`badge ${user.id_rol === 1
                                                        ? 'badge-admin'
                                                        : 'badge-client'
                                                        }`}>
                                                        {user.id_rol === 1 ? 'Administrador' : 'Cliente'}
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className={`status estado-${user.estado}`}>
                                                        {user.estado}
                                                    </span>
                                                </td>

                                                <td>
                                                    <button
                                                        className="btn-extra"
                                                        onClick={() =>
                                                            navigate("/editar-perfil")
                                                        }
                                                    >
                                                        Editar
                                                    </button>

                                                    <button
                                                        className="btn-danger"
                                                        onClick={() =>
                                                            handleToggleStatus(user.id_usuario, user.estado)
                                                        }
                                                    >
                                                        {user.estado === 'activo' ? 'Desactivar' : 'Activar'}
                                                    </button>

                                                    <button
                                                        className="btn-danger"
                                                        onClick={() => handleDelete(user.id_usuario)}
                                                    >
                                                        Eliminar
                                                    </button>
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