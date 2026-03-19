import axios from 'axios';
import AuthService from './services/auth.service'; // 👈 Importar AuthService

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor para agregar el token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('Tiempo de espera agotado');
      return Promise.reject({ message: 'El servidor no responde. Intenta de nuevo.' });
    }

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401: // 👈 Token expirado o no autorizado
          console.log('🔒 Token expirado o no válido - Cerrando sesión');

          // Usar AuthService para limpiar todo
          AuthService.logout();

          // Redirigir al login si no estamos ya ahí
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?session=expired';
          }
          break;

        case 403:
          console.error('Acceso prohibido');
          break;

        case 404:
          console.error('Recurso no encontrado');
          break;

        case 500:
          console.error('Error interno del servidor');
          break;
      }

      return Promise.reject(data || { message: `Error ${status}` });

    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
      return Promise.reject({ message: 'No se pudo conectar con el servidor' });

    } else {
      console.error('Error:', error.message);
      return Promise.reject({ message: 'Error al realizar la petición' });
    }
  }
);

export default api;