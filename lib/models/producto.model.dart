import 'package:flutter/material.dart';
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';

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
  final int stock;
  final String? material;
  final String? peso;
  final String? altura;

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
    this.stock = 5,
    this.material = 'Polietileno (PE)',
    this.peso = '2.750 kg',
    this.altura = '50.00 mm',
  });

  factory Producto.fromJson(Map<String, dynamic> json) {
    final precio = json['precio'];
    final String? categoryName = json['categoria']?['nombre']?.toString() ?? json['marca']?.toString();
    final String subtitle = json['descripcion']?.toString() ?? categoryName ?? 'Grama y suministros';
    final int stockVal = int.tryParse(json['stock']?.toString() ?? json['stock_actual']?.toString() ?? '5') ?? 5;

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
      brand: json['marca']?.toString() ?? 'GreenTurf',
      stock: stockVal,
      material: json['material']?.toString() ?? 'Polietileno (PE)',
      peso: json['peso']?.toString() ?? '2.750 kg',
      altura: json['altura']?.toString() ?? '50.00 mm',
    );
  }

  static String? _normalizeImageUrl(String? rawUrl) {
    if (rawUrl == null || rawUrl.trim().isEmpty) {
      return null;
    }

    final String url = rawUrl.trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
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

    final String cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    if (cleanUrl.startsWith('uploads/')) {
      return '${ApiConfig.baseUrl}/$cleanUrl';
    }
    return '${ApiConfig.baseUrl}/uploads/img_products/$cleanUrl';
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
