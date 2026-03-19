// frontend/src/api/services/productos.service.js
import api from '../axios';

const ProductosService = {
    // Obtener todos los productos
    getAll: async () => {
        try {
            const response = await api.get('/producto');
            return response.data;
        } catch (error) {
            console.error('Error en getAll:', error);
            throw error;
        }
    },

    // Obtener un producto por ID
    getById: async (id) => {
        try {
            const response = await api.get(`/producto/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error en getById:', error);
            throw error;
        }
    },

    // Crear un producto
    create: async (productoData) => {
        try {
            const response = await api.post('/producto', productoData);
            return response.data;
        } catch (error) {
            console.error('Error en create:', error);
            throw error;
        }
    },

    // Actualizar un producto
    update: async (id, productoData) => {
        try {
            const response = await api.put(`/producto/${id}`, productoData);
            return response.data;
        } catch (error) {
            console.error('Error en update:', error);
            throw error;
        }
    },

    // Eliminar un producto
    delete: async (id) => {
        try {
            const response = await api.delete(`/producto/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error en delete:', error);
            throw error;
        }
    }
};

export default ProductosService;