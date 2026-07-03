// lib/models/cotizacion.model.dart
import 'package:flutter/material.dart';
import 'package:gramas_y_suministros_movil/models/usuarios.model.dart';
import 'package:gramas_y_suministros_movil/models/detalle_cotizacion.model.dart';

class Cotizacion {
  final int idCotizacion;
  final int idUsuario;
  final String metodoVenta;
  final String metodoPago;
  final double subtotal;
  final double costoEnvio;
  final double total;
  final String? direccionEnvio;
  final String estado;
  final DateTime fechaCreacion;
  final DateTime? fechaPago;
  final List<DetalleCotizacion>? detalles;
  final Usuario? usuario;
  final String? clienteNombre;

  Cotizacion({
    required this.idCotizacion,
    required this.idUsuario,
    required this.metodoVenta,
    required this.metodoPago,
    required this.subtotal,
    required this.costoEnvio,
    required this.total,
    this.direccionEnvio,
    required this.estado,
    required this.fechaCreacion,
    this.fechaPago,
    this.detalles,
    this.usuario,
    this.clienteNombre,
  });

  factory Cotizacion.fromJson(Map<String, dynamic> json) {
    return Cotizacion(
      idCotizacion: json['idCotizacion'] ?? json['id_cotizacion'] ?? 0,
      idUsuario: json['idUsuario'] ?? json['id_usuario'] ?? 0,
      metodoVenta: json['metodoVenta'] ?? json['metodo_venta'] ?? 'fisico',
      metodoPago: json['metodoPago'] ?? json['metodo_pago'] ?? 'efectivo',
      subtotal: _parseDouble(json['subtotal']),
      costoEnvio: _parseDouble(json['costoEnvio'] ?? json['costo_envio']),
      total: _parseDouble(json['total']),
      direccionEnvio: json['direccionEnvio'] ?? json['direccion_envio'],
      estado: json['estado'] ?? 'pendiente',
      fechaCreacion: _parseDate(json['fechaCreacion'] ?? json['fecha_creacion']),
      fechaPago: json['fechaPago'] != null || json['fecha_pago'] != null
          ? _parseDate(json['fechaPago'] ?? json['fecha_pago'])
          : null,
      detalles: json['detalles'] != null
          ? (json['detalles'] as List).map((d) => DetalleCotizacion.fromJson(d)).toList()
          : null,
      usuario: json['usuario'] != null ? Usuario.fromJson(json['usuario']) : null,
      clienteNombre: json['cliente'] ?? json['clienteNombre'],
    );
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static DateTime _parseDate(dynamic value) {
    if (value == null) return DateTime.now();
    if (value is DateTime) return value;
    if (value is String) {
      try {
        return DateTime.parse(value);
      } catch (e) {
        return DateTime.now();
      }
    }
    return DateTime.now();
  }

  String get metodoVentaLabel {
    return metodoVenta == 'fisico' ? '📍 Punto físico' : '🚚 Entrega al cliente';
  }

  String get metodoPagoLabel {
    switch (metodoPago) {
      case 'efectivo':
        return 'Efectivo';
      case 'tarjeta_debito':
        return '💳 Tarjeta débito';
      case 'tarjeta_credito':
        return '💳 Tarjeta crédito';
      default:
        return metodoPago;
    }
  }

  String get estadoLabel {
    switch (estado) {
      case 'pagado':
        return '✅ Pagado';
      case 'pendiente':
        return '⏳ Pendiente';
      case 'entregado':
        return '📦 Entregado';
      case 'cancelado':
        return '❌ Cancelado';
      default:
        return estado;
    }
  }

  Color get estadoColor {
    switch (estado) {
      case 'pagado':
        return const Color(0xFF2E7D32);
      case 'pendiente':
        return const Color(0xFFF57C00);
      case 'entregado':
        return const Color(0xFF1976D2);
      case 'cancelado':
        return const Color(0xFFD32F2F);
      default:
        return Colors.grey;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'idCotizacion': idCotizacion,
      'idUsuario': idUsuario,
      'metodoVenta': metodoVenta,
      'metodoPago': metodoPago,
      'subtotal': subtotal,
      'costoEnvio': costoEnvio,
      'total': total,
      'direccionEnvio': direccionEnvio,
      'estado': estado,
      'fechaCreacion': fechaCreacion.toIso8601String(),
      'fechaPago': fechaPago?.toIso8601String(),
      'detalles': detalles?.map((d) => d.toJson()).toList(),
    };
  }
}