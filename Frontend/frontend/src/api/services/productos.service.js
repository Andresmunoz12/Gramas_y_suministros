// frontend/src/api/services/productos.service.js
import api from '../axios';

const ProductosService = {
    getAll: async () => {
        try {
            const response = await api.get('/productos');
            return response.data;
        } catch (error) {
            console.error('Error en getAll:', error);
            throw error;
        }
    },

    // ✅ AGREGADO: Obtener todos (admin)
    getAllAdmin: async () => {
        try {
            const response = await api.get('/productos/admin/all');
            return response.data;
        } catch (error) {
            console.error('Error en getAllAdmin:', error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const response = await api.get(`/productos/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error en getById:', error);
            throw error;
        }
    },

    create: async (productoData) => {
        try {
            const config = productoData instanceof FormData 
                ? { headers: { 'Content-Type': 'multipart/form-data' } }
                : {};
            
            const response = await api.post('/productos', productoData, config);
            return response.data;
        } catch (error) {
            console.error('Error en create:', error);
            throw error;
        }
    },

    update: async (id, productoData) => {
        try {
            const config = productoData instanceof FormData 
                ? { headers: { 'Content-Type': 'multipart/form-data' } }
                : {};
            
            const response = await api.put(`/productos/${id}`, productoData, config);
            return response.data;
        } catch (error) {
            console.error('Error en update:', error);
            throw error;
        }
    },

    // ✅ AGREGADO: Desactivar producto
    desactivar: async (id) => {
        try {
            const response = await api.patch(`/productos/${id}/desactivar`);
            return response.data;
        } catch (error) {
            console.error('Error en desactivar:', error);
            throw error;
        }
    },

    // ✅ AGREGADO: Activar producto
    activar: async (id) => {
        try {
            const response = await api.patch(`/productos/${id}/activar`);
            return response.data;
        } catch (error) {
            console.error('Error en activar:', error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const response = await api.delete(`/productos/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error en delete:', error);
            throw error;
        }
    }
};

export default ProductosService;