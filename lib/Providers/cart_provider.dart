// lib/providers/cart_provider.dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:gramas_y_suministros_movil/models/producto.model.dart';

class CartProvider extends ChangeNotifier {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  static const String _cartKey = 'cart_items';

  List<CartItem> _items = [];

  List<CartItem> get items => _items;

  int get totalItems => _items.fold(0, (sum, item) => sum + item.cantidad);

  double get subtotal => _items.fold(0.0, (sum, item) => sum + (item.producto.price * item.cantidad));

  bool get isEmpty => _items.isEmpty;

  CartProvider() {
    _loadCart();
  }

  // Agregar producto al carrito
  void addProduct(Producto producto, {int cantidad = 1}) {
    final existingIndex = _items.indexWhere(
      (item) => item.producto.id == producto.id,
    );

    if (existingIndex >= 0) {
      _items[existingIndex] = _items[existingIndex].copyWith(
        cantidad: _items[existingIndex].cantidad + cantidad,
      );
    } else {
      _items.add(CartItem(producto: producto, cantidad: cantidad));
    }

    _saveCart();
    notifyListeners();
  }

  // Quitar producto del carrito
  void removeProduct(String productId) {
    _items.removeWhere((item) => item.producto.id == productId);
    _saveCart();
    notifyListeners();
  }

  // Actualizar cantidad
  void updateQuantity(String productId, int cantidad) {
    if (cantidad <= 0) {
      removeProduct(productId);
      return;
    }

    final index = _items.indexWhere((item) => item.producto.id == productId);
    if (index >= 0) {
      _items[index] = _items[index].copyWith(cantidad: cantidad);
      _saveCart();
      notifyListeners();
    }
  }

  // Vaciar carrito
  void clearCart() {
    _items.clear();
    _saveCart();
    notifyListeners();
  }

  // Guardar carrito en almacenamiento seguro
  Future<void> _saveCart() async {
    try {
      final jsonList = _items.map((item) => {
            'productId': item.producto.id,
            'cantidad': item.cantidad,
          }).toList();
      await _storage.write(key: _cartKey, value: jsonEncode(jsonList));
    } catch (e) {
      debugPrint('Error guardando carrito: $e');
    }
  }

  // Cargar carrito desde almacenamiento seguro
  Future<void> _loadCart() async {
    try {
      final String? stored = await _storage.read(key: _cartKey);
      if (stored != null) {
        final List<dynamic> jsonList = jsonDecode(stored);
        // Solo guardamos los IDs y cantidades
        // Los productos completos se cargarán desde el servicio
        _items = [];
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error cargando carrito: $e');
    }
  }

  // Cargar productos completos desde el servicio
  Future<void> loadCartItems(List<Producto> allProducts) async {
    try {
      final String? stored = await _storage.read(key: _cartKey);
      if (stored != null) {
        final List<dynamic> jsonList = jsonDecode(stored);
        final List<CartItem> loadedItems = [];

        for (final item in jsonList) {
          final productId = item['productId']?.toString();
          final cantidad = item['cantidad'] ?? 1;
          final product = allProducts.firstWhere(
            (p) => p.id == productId,
            orElse: () => throw Exception('Producto no encontrado'),
          );
          loadedItems.add(CartItem(producto: product, cantidad: cantidad));
        }

        _items = loadedItems;
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error cargando productos del carrito: $e');
    }
  }
}

class CartItem {
  final Producto producto;
  final int cantidad;

  const CartItem({
    required this.producto,
    required this.cantidad,
  });

  CartItem copyWith({
    Producto? producto,
    int? cantidad,
  }) {
    return CartItem(
      producto: producto ?? this.producto,
      cantidad: cantidad ?? this.cantidad,
    );
  }

  double get subtotal => producto.price * cantidad;
}