// src/api/services/categorias.service.js
import api from '../axios';

class CategoriasService {
  // Obtener todas las categorías
  async getAll() {
    try {
      const response = await api.get('/categorias');
      return response.data;
    } catch (error) {
      console.error('Error en getAll categorías:', error);
      throw error;
    }
  }

  // Obtener una categoría por ID
  async getById(id) {
    try {
      const response = await api.get(`/categorias/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error en getById categoría:', error);
      throw error;
    }
  }

  // Crear una nueva categoría
  async create(data) {
    try {
      const response = await api.post('/categorias', data);
      return response.data;
    } catch (error) {
      console.error('Error en create categoría:', error);
      throw error;
    }
  }

  // Actualizar una categoría
  async update(id, data) {
    try {
      const response = await api.put(`/categorias/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error en update categoría:', error);
      throw error;
    }
  }

  // Eliminar una categoría
  async delete(id) {
    try {
      const response = await api.delete(`/categorias/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error en delete categoría:', error);
      throw error;
    }
  }
}

export default new CategoriasService();