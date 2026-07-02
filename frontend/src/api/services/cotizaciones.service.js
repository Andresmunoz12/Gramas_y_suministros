// src/api/services/cotizaciones.service.js
import api from '../axios';

class CotizacionesService {
  async crear(data) {
    const response = await api.post('/cotizaciones', data);
    return response.data;
  }

  async obtenerMisCotizaciones() {
    const response = await api.get('/cotizaciones/mis-cotizaciones');
    return response.data;
  }

  async obtenerPorId(id) {
    const response = await api.get(`/cotizaciones/${id}`);
    return response.data;
  }

  async simularPago(id) {
    const response = await api.post(`/cotizaciones/${id}/pagar`);
    return response.data;
  }

  async descargarPDF(id) {
    try {
      const response = await api.get(`/cotizaciones/${id}/pdf`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cotizacion_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      throw error;
    }
  }

  // 👇 ADMIN
  async obtenerTodasAdmin(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.estado) params.append('estado', filtros.estado);
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros.search) params.append('search', filtros.search);
    
    const response = await api.get(`/cotizaciones/admin/todas?${params.toString()}`);
    return response.data;
  }

  async actualizarEstado(id, estado) {
    const response = await api.patch(`/cotizaciones/admin/${id}/estado`, { estado });
    return response.data;
  }

  async obtenerEstadisticas() {
    const response = await api.get('/cotizaciones/admin/estadisticas');
    return response.data;
  }
}

export default new CotizacionesService();