import api from '../axios';

const StockService = {
    // Obtener todo el stock
    getAll: async () => {
        try {
            const response = await api.get('/stock');
            return response.data;
        } catch (error) {
            console.error('Error en getAll stock:', error);
            throw error;
        }
    },

    // Obtener historial de movimientos de un producto
    getHistorialByProducto: async (id_producto) => {
        try {
            const response = await api.get(`/movimientos`);
            const allMovements = response.data;
            // Filtrar por producto
            return allMovements.filter(mov => mov.id_producto === parseInt(id_producto));
        } catch (error) {
            console.error('Error en getHistorialByProducto:', error);
            throw error;
        }
    },

    // Registrar entrada
    registrarEntrada: async (data) => {
        try {
            const response = await api.post('/movimientos/entrada', data);
            return response.data;
        } catch (error) {
            console.error('Error en registrarEntrada:', error);
            throw error;
        }
    },

    // Registrar salida
    registrarSalida: async (data) => {
        try {
            const response = await api.post('/movimientos/salida', data);
            return response.data;
        } catch (error) {
            console.error('Error en registrarSalida:', error);
            throw error;
        }
    },
};

export default StockService;