// src/api/services/reportes.service.ts
import api from '../axios';

class ReportesService {
  async getResumen() {
    const response = await api.get('/reportes/resumen');
    return response.data;
  }

  async getUsuariosNuevos(inicio: string, fin: string) {
    const response = await api.get(`/reportes/usuarios/nuevos?inicio=${inicio}&fin=${fin}`);
    return response.data;
  }

  async getProductosNuevos(inicio: string, fin: string) {
    const response = await api.get(`/reportes/productos/nuevos?inicio=${inicio}&fin=${fin}`);
    return response.data;
  }

  async getStockCritico() {
    const response = await api.get('/reportes/stock-critico');
    return response.data;
  }

  async getUsuariosEnLinea() {
    const response = await api.get('/reportes/usuarios-en-linea');
    return response.data;
  }
}

export default new ReportesService();