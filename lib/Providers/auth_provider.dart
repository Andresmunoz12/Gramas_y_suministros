import 'package:flutter/material.dart';
import '../models/usuarios.model.dart';

class AuthProvider extends ChangeNotifier {
  Usuario? _usuarioLogueado;
  bool _isLoading = false;

  Usuario? get usuario => _usuarioLogueado;
  bool get isLoading => _isLoading;

  void login(Usuario user) {
    _usuarioLogueado = user;
    notifyListeners(); // Avisa a la App que ya tenemos usuario
  }

  void setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}