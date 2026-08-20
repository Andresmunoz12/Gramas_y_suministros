// src/context/CartContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (e) {
        console.error('Error al cargar carrito:', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (producto, cantidad = 1) => {
    setCart((prev) => {
      const existingItem = prev.find((item) => item.id_producto === producto.id_producto);
      const currentQty = existingItem ? existingItem.cantidad : 0;
      const requestedQty = currentQty + cantidad;

      const stockDisponible = producto.stock?.cantidad_actual ?? producto.stock_disponible ?? (typeof producto.stock === 'number' ? producto.stock : undefined);

      if (stockDisponible !== undefined) {
        if (stockDisponible <= 0) {
          alert(`El producto "${producto.nombre}" no tiene stock disponible.`);
          return prev;
        }
        if (requestedQty > stockDisponible) {
          alert(`La cantidad solicitada del producto "${producto.nombre}" supera el stock disponible (Máximo: ${stockDisponible})`);
          if (existingItem) {
            return prev.map((item) =>
              item.id_producto === producto.id_producto
                ? { ...item, cantidad: stockDisponible }
                : item
            );
          } else {
            return [...prev, { ...producto, cantidad: stockDisponible }];
          }
        }
      }

      if (existingItem) {
        return prev.map((item) =>
          item.id_producto === producto.id_producto
            ? { ...item, cantidad: requestedQty }
            : item
        );
      }
      return [...prev, { ...producto, cantidad }];
    });
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id_producto !== id));
  };

  const updateQuantity = (id, cantidad) => {
    if (cantidad <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id_producto === id) {
          const stockDisponible = item.stock?.cantidad_actual ?? item.stock_disponible ?? (typeof item.stock === 'number' ? item.stock : undefined);
          if (stockDisponible !== undefined && cantidad > stockDisponible) {
            alert(`La cantidad solicitada del producto "${item.nombre}" supera el stock disponible (Máximo: ${stockDisponible})`);
            return { ...item, cantidad: stockDisponible };
          }
          return { ...item, cantidad };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getTotalItems = () => {
    return cart.reduce((acc, item) => acc + item.cantidad, 0);
  };

  const getSubtotal = () => {
    return cart.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getSubtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};