import 'package:flutter/material.dart';

class Producto {
  final String id;
  final String title;
  final String subtitle;
  final double price; // Valor numérico para cálculos
  final String unit;
  final Color color;
  final Color accentColor;

  const Producto({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.price,
    required this.unit,
    required this.color,
    required this.accentColor,
  });

  // Getter para mostrar el precio con formato
  String get formattedPrice => '\$${price.toStringAsFixed(2)}';
}
