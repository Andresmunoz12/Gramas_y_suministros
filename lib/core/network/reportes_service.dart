// lib/core/network/reportes_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';

class ReportesService {
  final http.Client _client = http.Client();

  // Dashboard
  Future<Map<String, dynamic>> getDashboard(String token) async {
    try {
      final response = await _client.get(
        Uri.parse('${ApiConfig.reportes}/dashboard'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        Map<String, dynamic> data = jsonDecode(response.body);
        
        if (!data.containsKey('stockDetalle') || data['stockDetalle'] == null) {
          try {
            final stockResponse = await _client.get(
              Uri.parse('${ApiConfig.reportes}/productos/estado-stock'),
              headers: {
                'Authorization': 'Bearer $token',
                'Content-Type': 'application/json',
              },
            );
            if (stockResponse.statusCode == 200) {
              final stockData = jsonDecode(stockResponse.body);
              data['stockDetalle'] = stockData['detalle'] ?? [];
            }
          } catch (e) {
            data['stockDetalle'] = [];
          }
        }
        
        return data;
      } else {
        throw Exception('Error al cargar dashboard: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Usuarios
  Future<Map<String, dynamic>> getResumenUsuarios({
    required String token,
    String? fechaInicio,
    String? fechaFin,
    String? estado,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (fechaInicio != null) queryParams['fechaInicio'] = fechaInicio;
      if (fechaFin != null) queryParams['fechaFin'] = fechaFin;
      if (estado != null) queryParams['estado'] = estado;

      final uri = Uri.parse('${ApiConfig.reportes}/usuarios/resumen')
          .replace(queryParameters: queryParams);

      final response = await _client.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Error al cargar usuarios: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Productos
  Future<Map<String, dynamic>> getResumenProductos({
    required String token,
    String? categoria,
    String? estado,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (categoria != null) queryParams['categoria'] = categoria;
      if (estado != null) queryParams['estado'] = estado;

      final uri = Uri.parse('${ApiConfig.reportes}/productos/resumen')
          .replace(queryParameters: queryParams);

      final response = await _client.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Error al cargar productos: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Stock
  Future<Map<String, dynamic>> getEstadoStock(String token) async {
    try {
      final response = await _client.get(
        Uri.parse('${ApiConfig.reportes}/productos/estado-stock'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Error al cargar stock: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Cotizaciones
  Future<Map<String, dynamic>> getResumenCotizaciones({
    required String token,
    String? fechaInicio,
    String? fechaFin,
    String? estado,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (fechaInicio != null) queryParams['fechaInicio'] = fechaInicio;
      if (fechaFin != null) queryParams['fechaFin'] = fechaFin;
      if (estado != null) queryParams['estado'] = estado;

      final uri = Uri.parse('${ApiConfig.reportes}/cotizaciones/resumen')
          .replace(queryParameters: queryParams);

      final response = await _client.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Error al cargar cotizaciones: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Exportar Excel
  Future<http.Response> exportarExcel(String token) async {
    try {
      final response = await _client.get(
        Uri.parse('${ApiConfig.reportes}/exportar/excel'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return response;
      } else {
        throw Exception('Error al exportar Excel: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Exportar PDF
  Future<http.Response> exportarPDF(String token) async {
    try {
      final response = await _client.get(
        Uri.parse('${ApiConfig.reportes}/exportar/pdf'),
        headers: {
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        return response;
      } else {
        throw Exception('Error al exportar PDF: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }
}