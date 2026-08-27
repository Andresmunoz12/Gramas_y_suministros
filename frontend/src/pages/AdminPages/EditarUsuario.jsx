import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NavComponent from "../../components/GlobalNav";
import UsuariosService from "../../api/services/usuarios.service";
import "../../styles/UserInsert.css"; // Reutilizamos el mismo CSS

const EditarUsuario = () => {
    const navigate = useNavigate();
    const { id } = useParams();

    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        email: "",
        id_rol: "", // 1 = Admin, 2 = Cliente
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [mensaje, setMensaje] = useState({ tipo: "", texto: "" });

    // Opciones de rol
    const roles = [
        { id: 1, nombre: "Administrador" },
        { id: 2, nombre: "Cliente" },
    ];

    useEffect(() => {
        if (id) {
            cargarUsuario();
        }
    }, [id]);

    const cargarUsuario = async () => {
        try {
            setLoading(true);
            console.log("Cargando usuario con ID:", id);

            const usuario = await UsuariosService.getById(id);
            console.log("Usuario cargado:", usuario);

            setFormData({
                nombre: usuario.nombre || "",
                apellido: usuario.apellido || "",
                email: usuario.email || "",
                id_rol: usuario.id_rol?.toString() || "",
            });
        } catch (error) {
            console.error("Error cargando usuario:", error);
            setMensaje({
                tipo: "error",
                texto: error.response?.data?.message || error.message || "Error al cargar el usuario"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMensaje({ tipo: "", texto: "" });

        try {
            // Validar campos obligatorios
            if (!formData.nombre || !formData.apellido || !formData.email || !formData.id_rol) {
                setMensaje({
                    tipo: "error",
                    texto: "Por favor completa todos los campos obligatorios (*)"
                });
                setSaving(false);
                return;
            }

            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                setMensaje({
                    tipo: "error",
                    texto: "Por favor ingresa un correo electrónico válido"
                });
                setSaving(false);
                return;
            }

            // Preparar datos para enviar (solo los campos editables)
            const userData = {
                nombre: formData.nombre.trim(),
                apellido: formData.apellido.trim(),
                email: formData.email.trim().toLowerCase(),
                id_rol: parseInt(formData.id_rol),
                // ❌ NO incluimos password_hash (solo el usuario puede cambiarla)
            };

            console.log("📤 Enviando actualización:", userData);

            // Enviar actualización al backend
            const result = await UsuariosService.update(id, userData);
            console.log("✅ Usuario actualizado:", result);

            setMensaje({
                tipo: "success",
                texto: `¡Usuario ${result.nombre} ${result.apellido} actualizado exitosamente!`
            });

            // Redirigir después de 2 segundos
            setTimeout(() => {
                navigate("/usuarios");
            }, 2000);

        } catch (error) {
            console.error("❌ Error al actualizar usuario:", error);

            let errorMsg = "Error al actualizar el usuario";
            if (error.response?.data?.message) {
                if (Array.isArray(error.response.data.message)) {
                    errorMsg = error.response.data.message.join(", ");
                } else {
                    errorMsg = error.response.data.message;
                }
            } else if (error.message) {
                errorMsg = error.message;
            }

            setMensaje({
                tipo: "error",
                texto: errorMsg
            });
        } finally {
            setSaving(false);
        }
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <>
                <NavComponent />
                <div className="user-insert-container" style={{ textAlign: 'center', padding: '50px' }}>
                    <div style={{ fontSize: '18px', color: '#666' }}>
                        Cargando usuario...
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <NavComponent />

            <div className="user-insert-container">
                <div className="user-insert-header">
                    <h2>Editar Usuario</h2>
                    <p>Modifica la información del usuario seleccionado</p>
                </div>

                {mensaje.texto && (
                    <div
                        className={`alert ${mensaje.tipo}`}
                        style={{
                            padding: '12px',
                            marginBottom: '20px',
                            borderRadius: '5px',
                            backgroundColor: mensaje.tipo === 'success' ? '#d4edda' :
                                mensaje.tipo === 'error' ? '#f8d7da' : '#fff3cd',
                            color: mensaje.tipo === 'success' ? '#155724' :
                                mensaje.tipo === 'error' ? '#721c24' : '#856404',
                            border: `1px solid ${mensaje.tipo === 'success' ? '#c3e6cb' :
                                    mensaje.tipo === 'error' ? '#f5c6cb' : '#ffeeba'}`
                        }}
                    >
                        {mensaje.texto}
                    </div>
                )}

                <form className="user-insert-grid" onSubmit={handleSubmit}>
                    {/* Columna 1 - Datos personales */}
                    <div className="user-data-column">
                        <h3 className="section-title">Datos Personales</h3>

                        <div className="field">
                            <label htmlFor="nombre">Nombre *</label>
                            <input
                                id="nombre"
                                type="text"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Juan"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="apellido">Apellido *</label>
                            <input
                                id="apellido"
                                type="text"
                                name="apellido"
                                value={formData.apellido}
                                onChange={handleChange}
                                required
                                placeholder="Ej: Pérez"
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="email">Correo Electrónico *</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="ejemplo@correo.com"
                            />
                        </div>
                    </div>

                    {/* Columna 2 - Rol */}
                    <div className="user-data-column">
                        <h3 className="section-title">Rol</h3>

                        <div className="field">
                            <label htmlFor="id_rol">Rol *</label>
                            <select
                                id="id_rol"
                                name="id_rol"
                                value={formData.id_rol}
                                onChange={handleChange}
                                required
                                className="select-role"
                            >
                                <option value="">Seleccione un rol</option>
                                {roles.map((rol) => (
                                    <option key={rol.id} value={rol.id}>
                                        {rol.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="field" style={{ marginTop: '16px' }}>
                            <div style={{
                                padding: '12px 16px',
                                background: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                color: '#6b7280',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                <span style={{ fontSize: '18px' }}>🔒</span>
                                <span>La contraseña solo puede ser cambiada por el usuario</span>
                            </div>
                        </div>
                    </div>

                    {/* Columna 3 - Resumen y Acciones */}
                    <div className="user-data-column">
                        <h3 className="section-title">Resumen</h3>

                        <div className="user-summary">
                            <div className="summary-item">
                                <span className="summary-label">Nombre completo:</span>
                                <span className="summary-value">
                                    {formData.nombre || formData.apellido
                                        ? `${formData.nombre || ""} ${formData.apellido || ""}`.trim()
                                        : "No especificado"}
                                </span>
                            </div>

                            <div className="summary-item">
                                <span className="summary-label">Email:</span>
                                <span className="summary-value">
                                    {formData.email || "No especificado"}
                                </span>
                            </div>

                            <div className="summary-item">
                                <span className="summary-label">Rol:</span>
                                <span className="summary-value">
                                    {formData.id_rol
                                        ? roles.find((r) => r.id === parseInt(formData.id_rol))
                                            ?.nombre || "No seleccionado"
                                        : "No seleccionado"}
                                </span>
                            </div>
                        </div>

                        <div className="actions">
                            <button
                                type="button"
                                onClick={handleGoBack}
                                disabled={saving}
                                className="btn-secondary"
                            >
                                Regresar
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary"
                            >
                                {saving ? "Guardando..." : "Guardar cambios"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
};

export default EditarUsuario;