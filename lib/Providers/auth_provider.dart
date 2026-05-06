import 'package:flutter/material.dart';
import '../models/usuarios.model.dart';

class AuthProvider extends ChangeNotifier {
  Usuario? _usuarioLogueado;
  bool _isLoading = false;

  // Variable para el nombre (útil para mostrar bienvenida rápida)
  String _nombreUsuario = '';

  Usuario? get usuario => _usuarioLogueado;
  bool get isLoading => _isLoading;
  String get nombreUsuario => _nombreUsuario;

  void login(Usuario user) {
    _usuarioLogueado = user;
    _nombreUsuario = user.nombre; // Guardamos el nombre también aquí
    notifyListeners();
  }

  void setUserName(String name) {
    _nombreUsuario = name;
    notifyListeners(); // 👈 Esto quita el error y avisa a la UI
  }

  void setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}