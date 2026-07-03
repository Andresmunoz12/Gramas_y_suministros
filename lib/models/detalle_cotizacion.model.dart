// lib/models/detalle_cotizacion.model.dart
import 'package:gramas_y_suministros_movil/models/producto.model.dart';

class DetalleCotizacion {
  final int idDetalle;
  final int idCotizacion;
  final int idProducto;
  final int cantidad;
  final double precioUnitario;
  final double subtotal;
  final Producto? producto;

  DetalleCotizacion({
    required this.idDetalle,
    required this.idCotizacion,
    required this.idProducto,
    required this.cantidad,
    required this.precioUnitario,
    required this.subtotal,
    this.producto,
  });

  factory DetalleCotizacion.fromJson(Map<String, dynamic> json) {
    return DetalleCotizacion(
      idDetalle: json['idDetalle'] ?? json['id_detalle'] ?? 0,
      idCotizacion: json['idCotizacion'] ?? json['id_cotizacion'] ?? 0,
      idProducto: json['idProducto'] ?? json['id_producto'] ?? 0,
      cantidad: json['cantidad'] ?? 1,
      precioUnitario: _parseDouble(json['precioUnitario'] ?? json['precio_unitario']),
      subtotal: _parseDouble(json['subtotal']),
      producto: json['producto'] != null ? Producto.fromJson(json['producto']) : null,
    );
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  Map<String, dynamic> toJson() {
    return {
      'idDetalle': idDetalle,
      'idCotizacion': idCotizacion,
      'idProducto': idProducto,
      'cantidad': cantidad,
      'precioUnitario': precioUnitario,
      'subtotal': subtotal,
    };
  }
}