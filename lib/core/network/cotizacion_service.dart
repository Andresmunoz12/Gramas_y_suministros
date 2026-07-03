// lib/core/network/cotizacion_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:gramas_y_suministros_movil/models/cotizacion.model.dart';
import 'package:gramas_y_suministros_movil/models/detalle_cotizacion.model.dart';

class CotizacionService {
  final http.Client _client = http.Client();

  // Crear nueva cotización
  Future<Cotizacion> crearCotizacion({
    required String token,
    required String metodoVenta,
    required String metodoPago,
    String? direccionEnvio,
    required List<Map<String, dynamic>> items,
  }) async {
    try {
      final response = await _client.post(
        Uri.parse(ApiConfig.cotizaciones),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'metodoVenta': metodoVenta,
          'metodoPago': metodoPago,
          'direccionEnvio': direccionEnvio,
          'items': items,
        }),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Cotizacion.fromJson(data);
      } else {
        throw Exception('Error al crear cotización: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Obtener cotizaciones del usuario
  Future<List<Cotizacion>> obtenerMisCotizaciones(String token) async {
    try {
      final response = await _client.get(
        Uri.parse('${ApiConfig.cotizaciones}/mis-cotizaciones'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Cotizacion.fromJson(json)).toList();
      } else {
        throw Exception('Error al obtener cotizaciones: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Obtener cotización por ID
  Future<Cotizacion> obtenerCotizacionPorId({
    required String token,
    required int id,
  }) async {
    try {
      final response = await _client.get(
        Uri.parse('${ApiConfig.cotizaciones}/$id'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Cotizacion.fromJson(data);
      } else {
        throw Exception('Error al obtener cotización: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Simular pago
  Future<Cotizacion> simularPago({
    required String token,
    required int idCotizacion,
  }) async {
    try {
      final response = await _client.post(
        Uri.parse('${ApiConfig.cotizaciones}/$idCotizacion/pagar'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = jsonDecode(response.body);
        return Cotizacion.fromJson(data['cotizacion'] ?? data);
      } else {
        throw Exception('Error al simular pago: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Descargar PDF
  Future<http.Response> descargarPDF({
  required String token,
  required int idCotizacion,
}) async {
  try {
    final response = await _client.get(
      Uri.parse('${ApiConfig.cotizaciones}/$idCotizacion/pdf'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/pdf',
      },
    );

    print('🔍 PDF Response status: ${response.statusCode}');
    print('🔍 PDF Response length: ${response.bodyBytes.length}');

    if (response.statusCode == 200) {
      return response;
    } else {
      throw Exception('Error al descargar PDF: ${response.statusCode}');
    }
  } catch (e) {
    print('❌ Error descargando PDF: $e');
    throw Exception('Error de conexión: $e');
  }
}

  // ============ ADMIN ============

  // Obtener todas las cotizaciones (Admin)
  Future<List<Cotizacion>> obtenerTodasCotizaciones({
    required String token,
    String? estado,
    String? fechaInicio,
    String? fechaFin,
    String? search,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (estado != null) queryParams['estado'] = estado;
      if (fechaInicio != null) queryParams['fechaInicio'] = fechaInicio;
      if (fechaFin != null) queryParams['fechaFin'] = fechaFin;
      if (search != null) queryParams['search'] = search;

      final uri = Uri.parse('${ApiConfig.cotizaciones}/admin/todas')
          .replace(queryParameters: queryParams);

      print('🔍 DEBUG: GET $uri');
      print('🔍 DEBUG: Headers: {"Authorization": "Bearer $token"}');

      final response = await _client.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🔍 DEBUG: Response Code: ${response.statusCode}');
      if (response.statusCode != 200) {
        print('🔍 DEBUG: Response Body: ${response.body}');
      }

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Cotizacion.fromJson(json)).toList();
      } else {
        throw Exception('Error al obtener cotizaciones: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      print('🔍 DEBUG: Exception in obtenerTodasCotizaciones: $e');
      throw Exception('Error de conexión: $e');
    }
  }

  // Cambiar estado de cotización (Admin)
  Future<Cotizacion> cambiarEstado({
    required String token,
    required int idCotizacion,
    required String estado,
  }) async {
    try {
      final response = await _client.patch(
        Uri.parse('${ApiConfig.cotizaciones}/admin/$idCotizacion/estado'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({'estado': estado}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return Cotizacion.fromJson(data['cotizacion'] ?? data);
      } else {
        throw Exception('Error al cambiar estado: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Error de conexión: $e');
    }
  }

  // Obtener estadísticas (Admin)
  Future<Map<String, dynamic>> obtenerEstadisticas(String token) async {
    try {
      final uri = Uri.parse('${ApiConfig.cotizaciones}/admin/estadisticas');
      print('🔍 DEBUG: GET $uri');
      final response = await _client.get(
        uri,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      print('🔍 DEBUG: Response Code: ${response.statusCode}');
      if (response.statusCode != 200) {
        print('🔍 DEBUG: Response Body: ${response.body}');
      }

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Error al obtener estadísticas: ${response.statusCode} - ${response.body}');
      }
    } catch (e) {
      print('🔍 DEBUG: Exception in obtenerEstadisticas: $e');
      throw Exception('Error de conexión: $e');
    }
  }
}