import 'package:flutter/material.dart';
import '../models/producto.model.dart';

class CartItem {
  final Producto producto;
  int cantidad;

  CartItem({
    required this.producto,
    this.cantidad = 1,
  });

  double get total => producto.price * cantidad;
}

class CartProvider extends ChangeNotifier {
  final Map<String, CartItem> _items = {};

  Map<String, CartItem> get items => {..._items};

  // Número de productos distintos en el carrito
  int get totalUniqueItems => _items.length;

  // Número total de unidades en el carrito
  int get totalItems {
    int total = 0;
    _items.forEach((key, item) {
      total += item.cantidad;
    });
    return total;
  }

  // Costo total de los artículos en el carrito
  double get totalAmount {
    double total = 0.0;
    _items.forEach((key, item) {
      total += item.total;
    });
    return total;
  }

  // Agregar un producto al carrito (o aumentar su cantidad si ya existe)
  void addToCart(Producto producto) {
    if (_items.containsKey(producto.id)) {
      _items[producto.id]!.cantidad++;
    } else {
      _items[producto.id] = CartItem(producto: producto);
    }
    notifyListeners();
  }

  // Reducir la cantidad de un producto (o eliminarlo si llega a 0)
  void decreaseQuantity(Producto producto) {
    if (!_items.containsKey(producto.id)) return;

    if (_items[producto.id]!.cantidad > 1) {
      _items[producto.id]!.cantidad--;
    } else {
      _items.remove(producto.id);
    }
    notifyListeners();
  }

  // Eliminar un producto del carrito
  void removeFromCart(Producto producto) {
    _items.remove(producto.id);
    notifyListeners();
  }

  // Vaciar el carrito
  void clearCart() {
    _items.clear();
    notifyListeners();
  }
}
