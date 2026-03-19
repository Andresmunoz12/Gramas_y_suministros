import api from '../axios';

const UsuariosService = {
    // Obtener todos los usuarios
    getAll: async () => {
        try {
            const response = await api.get('/usuarios');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Obtener usuario por ID
    getById: async (id) => {
        try {
            const response = await api.get(`/usuarios/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Crear usuario
    create: async (userData) => {
        try {
            const response = await api.post('/usuarios', userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Actualizar usuario
    update: async (id, userData) => {
        try {
            const response = await api.put(`/usuarios/${id}`, userData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Eliminar usuario
    delete: async (id) => {
        try {
            const response = await api.delete(`/usuarios/${id}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // Cambiar estado del usuario
    cambiarEstado: async (id, estado) => {
        try {
            const response = await api.patch(`/usuarios/${id}/estado`, { estado });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
};

export default UsuariosService;