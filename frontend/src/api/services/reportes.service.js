// src/api/services/reportes.service.js
import api from '../axios';

class ReportesService {
  // Dashboard
  async getDashboard() {
    const response = await api.get('/reportes/dashboard');
    return response.data;
  }

  // Usuarios
  async getResumenUsuarios(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros.estado) params.append('estado', filtros.estado);
    
    const response = await api.get(`/reportes/usuarios/resumen?${params.toString()}`);
    return response.data;
  }

  async getUsuariosNuevosPorDia(fechaInicio, fechaFin) {
    const response = await api.get(`/reportes/usuarios/nuevos-por-dia?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    return response.data;
  }

  async getUsuariosPorRol() {
    const response = await api.get('/reportes/usuarios/por-rol');
    return response.data;
  }

  // Productos
  async getResumenProductos(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.categoria) params.append('categoria', filtros.categoria);
    if (filtros.estado) params.append('estado', filtros.estado);
    
    const response = await api.get(`/reportes/productos/resumen?${params.toString()}`);
    return response.data;
  }

  async getProductosNuevosPorDia(fechaInicio, fechaFin) {
    const response = await api.get(`/reportes/productos/nuevos-por-dia?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
    return response.data;
  }

  async getProductosPorCategoria() {
    const response = await api.get('/reportes/productos/por-categoria');
    return response.data;
  }

  async getEstadoStock() {
    const response = await api.get('/reportes/productos/estado-stock');
    return response.data;
  }

  // Stock
  async getResumenStock() {
    const response = await api.get('/reportes/stock/resumen');
    return response.data;
  }

  async getMovimientos(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    
    const response = await api.get(`/reportes/stock/movimientos?${params.toString()}`);
    return response.data;
  }

  // ✅ Cotizaciones - CON TIMESTAMP PARA EVITAR CACHÉ
  async getResumenCotizaciones(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.fechaInicio) params.append('fechaInicio', filtros.fechaInicio);
    if (filtros.fechaFin) params.append('fechaFin', filtros.fechaFin);
    if (filtros.estado) params.append('estado', filtros.estado);
    
    // ✅ Agregar timestamp para evitar caché
    params.append('_t', Date.now());
    
    console.log('📊 Parámetros enviados:', params.toString());
    
    const response = await api.get(`/reportes/cotizaciones/resumen?${params.toString()}`);
    
    console.log('📊 Respuesta del servidor:', response.data);
    console.log('📊 Cantidad de cotizaciones:', response.data?.cotizaciones?.length);
    
    return response.data;
  }

  async getCotizacionesPorMetodo() {
    const response = await api.get('/reportes/cotizaciones/por-metodo');
    return response.data;
  }

  // Exportaciones
  async exportarExcel() {
    try {
      const response = await api.get('/reportes/exportar/excel', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando Excel:', error);
      throw error;
    }
  }

  async exportarPDF() {
    try {
      const response = await api.get('/reportes/exportar/pdf', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando PDF:', error);
      throw error;
    }
  }
}

export default new ReportesService();