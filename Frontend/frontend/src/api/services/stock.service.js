import api from '../axios';

const StockService = {
    getAll: async () => {
        try {
            const response = await api.get('/stock');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getByProducto: async (productoId) => {
        try {
            const response = await api.get(`/stock/producto/${productoId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateStock: async (id, cantidad) => {
        try {
            const response = await api.patch(`/stock/${id}`, { cantidad });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    registrarMovimiento: async (data) => {
        try {
            const response = await api.post('/movimiento', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getMovimientos: async () => {
        try {
            const response = await api.get('/movimiento');
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default StockService;