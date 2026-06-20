import { createContext, useContext, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);

    const addToCart = (producto) => {
        setCartItems((prev) => {
            const existing = prev.find((i) => i.id_producto === producto.id_producto);
            if (existing) {
                return prev.map((i) =>
                    i.id_producto === producto.id_producto
                        ? { ...i, cantidad: i.cantidad + 1 }
                        : i
                );
            }
            return [...prev, { ...producto, cantidad: 1 }];
        });
        setCartOpen(true);
    };

    const removeFromCart = (id_producto) => {
        setCartItems((prev) => prev.filter((i) => i.id_producto !== id_producto));
    };

    const updateQuantity = (id_producto, cantidad) => {
        if (cantidad <= 0) {
            removeFromCart(id_producto);
            return;
        }
        setCartItems((prev) =>
            prev.map((i) => (i.id_producto === id_producto ? { ...i, cantidad } : i))
        );
    };

    const clearCart = () => setCartItems([]);

    const totalItems = cartItems.reduce((acc, i) => acc + i.cantidad, 0);
    const totalPrice = cartItems.reduce(
        (acc, i) => acc + (i.precio || 0) * i.cantidad,
        0
    );

    return (
        <CartContext.Provider
            value={{
                cartItems,
                cartOpen,
                setCartOpen,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                totalItems,
                totalPrice,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    return useContext(CartContext);
}
