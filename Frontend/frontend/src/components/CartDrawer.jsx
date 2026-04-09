import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../api/axios";
import "../styles/CartDrawer.css";

export default function CartDrawer() {
    const { cartItems, cartOpen, setCartOpen, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ tipo: "", texto: "" });

    if (!cartOpen) return null;

    const handleConfirmarPedido = async () => {
        if (!user) {
            setCartOpen(false);
            navigate("/login");
            return;
        }

        if (cartItems.length === 0) return;

        setLoading(true);
        setMsg({ tipo: "", texto: "" });

        try {
            // Register one salida per cart item
            for (const item of cartItems) {
                await api.post("/movimientos/salida", {
                    id_producto: item.id_producto,
                    cantidad: item.cantidad,
                    destino: user.nombre + " " + (user.apellido || ""),
                    motivo: "Venta Directa",
                    observaciones: `Pedido realizado por ${user.email}`,
                    id_usuario: user.id_usuario,
                });
            }

            setMsg({ tipo: "success", texto: "✅ ¡Pedido confirmado exitosamente!" });
            clearCart();
            setTimeout(() => {
                setCartOpen(false);
                setMsg({ tipo: "", texto: "" });
                navigate("/mis-pedidos");
            }, 1800);
        } catch (error) {
            const errMsg = error.response?.data?.message || "Error al confirmar el pedido";
            setMsg({ tipo: "error", texto: "❌ " + errMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div className="cart-overlay" onClick={() => setCartOpen(false)} />

            {/* Drawer */}
            <div className="cart-drawer">
                {/* Header */}
                <div className="cart-header">
                    <h2>🛒 Mi Carrito ({totalItems})</h2>
                    <button className="cart-close-btn" onClick={() => setCartOpen(false)}>✕</button>
                </div>

                {/* Items */}
                <div className="cart-items">
                    {cartItems.length === 0 ? (
                        <div className="cart-empty">
                            <span style={{ fontSize: "3rem" }}>🛒</span>
                            <p>Tu carrito está vacío</p>
                        </div>
                    ) : (
                        cartItems.map((item) => (
                            <div className="cart-item" key={item.id_producto}>
                                <img
                                    src={item.imagen ? `http://localhost:3000/uploads/img_products/${item.imagen}` : "/placeholder-producto.png"}
                                    alt={item.nombre}
                                    className="cart-item-img"
                                    onError={(e) => { e.target.src = "/placeholder-producto.png"; }}
                                />
                                <div className="cart-item-info">
                                    <div className="cart-item-name">{item.nombre}</div>
                                    <div className="cart-item-price">
                                        ${new Intl.NumberFormat("es-CO").format((item.precio || 0) * item.cantidad)}
                                    </div>
                                    <div className="cart-item-qty">
                                        <button className="qty-btn" onClick={() => updateQuantity(item.id_producto, item.cantidad - 1)}>−</button>
                                        <span className="qty-value">{item.cantidad}</span>
                                        <button className="qty-btn" onClick={() => updateQuantity(item.id_producto, item.cantidad + 1)}>+</button>
                                    </div>
                                </div>
                                <button className="cart-remove-btn" onClick={() => removeFromCart(item.id_producto)} title="Eliminar">🗑️</button>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="cart-footer">
                    {msg.texto && (
                        <div style={{
                            padding: "10px 14px",
                            borderRadius: "10px",
                            marginBottom: "12px",
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            background: msg.tipo === "success" ? "#dcfce7" : "#fee2e2",
                            color: msg.tipo === "success" ? "#16a34a" : "#dc2626",
                        }}>
                            {msg.texto}
                        </div>
                    )}
                    <div className="cart-summary">
                        <span className="cart-total-label">Total</span>
                        <span className="cart-total-value">
                            ${new Intl.NumberFormat("es-CO").format(totalPrice)}
                        </span>
                    </div>
                    <button
                        className="cart-checkout-btn"
                        onClick={handleConfirmarPedido}
                        disabled={loading || cartItems.length === 0}
                    >
                        {loading ? "Procesando..." : "Confirmar Pedido →"}
                    </button>
                </div>
            </div>
        </>
    );
}
