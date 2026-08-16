// src/api/services/proveedores.service.js
import api from '../axios';

class ProveedoresService {
  // Obtener todos los proveedores
  async getAll() {
    try {
      const response = await api.get('/proveedores');
      return response.data;
    } catch (error) {
      console.error('Error en getAll proveedores:', error);
      throw error;
    }
  }

  // Obtener un proveedor por ID
  async getById(id) {
    try {
      const response = await api.get(`/proveedores/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error en getById proveedor:', error);
      throw error;
    }
  }

  // Crear un nuevo proveedor
  async create(data) {
    try {
      const response = await api.post('/proveedores', data);
      return response.data;
    } catch (error) {
      console.error('Error en create proveedor:', error);
      throw error;
    }
  }

  // Actualizar un proveedor
  async update(id, data) {
    try {
      const response = await api.put(`/proveedores/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error en update proveedor:', error);
      throw error;
    }
  }

  // Eliminar un proveedor
  async delete(id) {
    try {
      const response = await api.delete(`/proveedores/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error en delete proveedor:', error);
      throw error;
    }
  }
}

export default new ProveedoresService();