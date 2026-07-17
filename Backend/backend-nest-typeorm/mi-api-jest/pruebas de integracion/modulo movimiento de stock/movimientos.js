const express = require('express');
const app = express();
app.use(express.json());

// Base de datos simulada en memoria para las pruebas
let stock = {
    1: { id_producto: 1, cantidad_actual: 100 }
};

// Endpoint para el registro de salida de inventario 
app.post('/movimientos/salida', (req, res) => {
    const { id_producto, cantidad } = req.body;

    const producto = stock[id_producto];
    if (!producto) {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }

    if (producto.cantidad_actual < cantidad) {
        return res.status(400).json({ error: 'Stock insuficiente' });
    }

    // Restamos el stock simulando la base de datos
    producto.cantidad_actual -= cantidad;

    // Retornamos éxito tal cual pide el CP-001
    res.status(201).json({
        mensaje: 'Salida de inventario registrada exitosamente',
        id_movimiento: Math.floor(Math.random() * 1000)
    });
});

module.exports = app;
