// api/services/auth.service.js
import api from '../axios';
import { jwtDecode } from 'jwt-decode';

const AuthService = {
    login: async (credentials) => {
        try {
            const response = await api.post('/auth/login', credentials);
            if (response.data.access_token) {
                const token = response.data.access_token;
                localStorage.setItem('token', token);

                const decoded = jwtDecode(token);

                const user = {
                    ...response.data.user,
                    id_rol: decoded.rol,
                    id_usuario: decoded.sub
                };

                // Guardar en UNA SOLA KEY (user) para simplificar
                localStorage.setItem('user', JSON.stringify(user));

                response.data.user = user;
            }
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    // LOGOUT SEGURO - borra TODO
    logout: () => {
        // Lista de todas las posibles keys que podrían existir
        const keysToRemove = [
            'token',
            'user',
            'usuario',
            'id_rol',
            'access_token',
            'cart', // si tienes carrito
            'rememberMe' // si usas remember me
        ];

        keysToRemove.forEach(key => localStorage.removeItem(key));

        // También podrías limpiar sessionStorage si usas algo ahí
        // sessionStorage.clear();

        console.log('✅ Sesión cerrada, localStorage limpiado');
    },

    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated: () => {
        return !!localStorage.getItem('token');
    },
};

export default AuthService;