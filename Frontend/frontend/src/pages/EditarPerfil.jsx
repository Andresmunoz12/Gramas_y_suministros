import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavComponent from "../components/GlobalNav";
import "../styles/EditarPerfil.css";
import "../styles/Perfil.css";

export default function EditarPerfil() {
    const navigate = useNavigate();
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const rawUsuario = localStorage.getItem("usuario");
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        email: "",
        num_telefono: "",
        direccion_facturacion: ""
    });

    useEffect(() => {
        if (!rawUsuario) {
            navigate("/login");
            return;
        }
        const user = JSON.parse(rawUsuario);
        setFormData({
            nombre: user.nombre || "",
            apellido: user.apellido || "",
            email: user.email || "",
            num_telefono: user.num_telefono || "",
            direccion_facturacion: user.direccion_facturacion || ""
        });
    }, [rawUsuario, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const user = JSON.parse(rawUsuario);
            const response = await fetch(`http://localhost:3001/api/auth/perfil/${user.id_usuario}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                setMessage("✅ " + data.message);
                // Actualizar localStorage
                localStorage.setItem("usuario", JSON.stringify({ ...user, ...formData }));
                setTimeout(() => navigate("/perfil"), 2000);
            } else {
                setMessage("❌ " + data.message);
            }
        } catch (err) {
            setMessage("❌ Error al conectar con el servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard">
            <NavComponent />
            <main>
                <div className="edit-profile-card glass-effect">
                    <h2>Editar mi Perfil</h2>
                    <p className="subtitle">Actualiza tu información personal para mejores pedidos</p>

                    <form onSubmit={handleSubmit} className="edit-form">
                        <div className="edit-grid">
                            <div className="input-block">
                                <label>Nombre</label>
                                <input
                                    name="nombre"
                                    placeholder="Tu nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="input-block">
                                <label>Apellido</label>
                                <input
                                    name="apellido"
                                    placeholder="Tu apellido"
                                    value={formData.apellido}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="input-block">
                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="correo@ejemplo.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                            <div className="input-block">
                                <label>Teléfono</label>
                                <input
                                    name="num_telefono"
                                    placeholder="Número de contacto"
                                    value={formData.num_telefono}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="input-block full-width">
                                <label>Dirección de Facturación</label>
                                <input
                                    name="direccion_facturacion"
                                    placeholder="Calle, Ciudad, País"
                                    value={formData.direccion_facturacion}
                                    onChange={handleChange}
                                />
                            </div>

                            {message && (
                                <div className={`status-message ${message.includes('✅') ? 'success' : 'error'}`}>
                                    {message}
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-save" disabled={loading}>
                                {loading ? "Procesando..." : "Guardar Cambios"}
                            </button>
                            <button type="button" className="btn-cancel" onClick={() => navigate("/perfil")}>
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
