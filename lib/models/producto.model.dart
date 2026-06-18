import 'package:flutter/material.dart';

class Producto {
  final String id;
  final String title;
  final String subtitle;
  final double price; // Valor numérico para cálculos
  final String unit;
  final Color color;
  final Color accentColor;
  final String? imageUrl;
  final String? description;
  final String? categoryName;
  final String? brand;

  const Producto({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.price,
    required this.unit,
    required this.color,
    required this.accentColor,
    this.imageUrl,
    this.description,
    this.categoryName,
    this.brand,
  });

  factory Producto.fromJson(Map<String, dynamic> json) {
    final precio = json['precio'];
    final String? categoryName = json['categoria']?['nombre']?.toString() ?? json['marca']?.toString();
    final String subtitle = json['descripcion']?.toString() ?? categoryName ?? 'Grama y suministros';

    return Producto(
      id: json['id_producto']?.toString() ?? DateTime.now().millisecondsSinceEpoch.toString(),
      title: json['nombre']?.toString() ?? 'Producto sin nombre',
      subtitle: subtitle,
      price: double.tryParse(precio?.toString() ?? '0') ?? 0.0,
      unit: json['unidad']?.toString() ?? '/m²',
      color: _getColor(json['id_producto']),
      accentColor: _getAccentColor(json['id_producto']),
      imageUrl: _normalizeImageUrl(json['imagen']?.toString()),
      description: json['descripcion']?.toString(),
      categoryName: categoryName,
      brand: json['marca']?.toString(),
    );
  }

  static String? _normalizeImageUrl(String? rawUrl) {
    if (rawUrl == null || rawUrl.trim().isEmpty) {
      return null;
    }

    final String url = rawUrl.trim();
    if (url.contains('google.com/imgres') || url.contains('imgurl=')) {
      final uri = Uri.tryParse(url);
      if (uri != null) {
        final imgUrl = uri.queryParameters['imgurl'];
        if (imgUrl != null && imgUrl.isNotEmpty) {
          return Uri.decodeComponent(imgUrl);
        }
      }
    }

    return url;
  }

  static Color _getColor(dynamic seed) {
    final colors = [
      const Color(0xFFE8F7E5),
      const Color(0xFFDFF4E5),
      const Color(0xFFF2F8EE),
      const Color(0xFFF3F6F1),
      const Color(0xFFE4F2E2),
    ];
    final int index = seed?.toString().hashCode.abs() ?? 0;
    return colors[index % colors.length];
  }

  static Color _getAccentColor(dynamic seed) {
    final colors = [
      const Color(0xFF3D7B2C),
      const Color(0xFF2B661C),
      const Color(0xFF4A7C3E),
      const Color(0xFF356B2F),
      const Color(0xFF4C8D44),
    ];
    final int index = seed?.toString().hashCode.abs() ?? 0;
    return colors[index % colors.length];
  }

  // Getter para mostrar el precio con formato
  String get formattedPrice => '\$${price.toStringAsFixed(2)}';
}
