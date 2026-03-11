import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Aquí vive tu Backend de NestJS
});

// Este paso es CLAVE para la seguridad que planeamos:
// Cada vez que hagas una petición, Axios revisará si tienes un token guardado
// y lo enviará automáticamente al servidor.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;