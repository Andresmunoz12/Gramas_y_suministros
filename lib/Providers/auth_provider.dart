import 'package:flutter/material.dart';
import '../models/usuarios.model.dart';
import '../core/security/secure_storage_service.dart';

class AuthProvider extends ChangeNotifier {
  final SecureStorageRepository _secureStorage = SecureStorageService();
  
  Usuario? _usuarioLogueado;
  bool _isLoading = false;
  // Variable para el nombre (útil para mostrar bienvenida rápida)
  String _nombreUsuario = '';
  String _recoveryEmail = '';
  String _recoveryCode = '';

  Usuario? get usuario => _usuarioLogueado;
  int? get idRol => _usuarioLogueado?.idRol;
  bool get isAdmin => _usuarioLogueado?.idRol == 1;
  bool get isClient => _usuarioLogueado?.idRol == 2;
  bool get isWarehouseUser => _usuarioLogueado?.idRol == 3;
  bool get isLoading => _isLoading;
  String get nombreUsuario => _nombreUsuario;
  String get recoveryEmail => _recoveryEmail;
  String get recoveryCode => _recoveryCode;

  /// Registra al usuario en memoria y escribe el token de forma cifrada en el almacenamiento seguro.
  Future<void> login(Usuario user) async {
    _usuarioLogueado = user;
    _nombreUsuario = user.nombre;
    notifyListeners();
    
    if (user.token != null) {
      await _secureStorage.write('auth_token', user.token!);
    }
  }

  /// Limpia los datos de sesión en memoria y elimina físicamente todas las claves cifradas.
  Future<void> logout() async {
    _usuarioLogueado = null;
    _nombreUsuario = '';
    notifyListeners();
    await _secureStorage.deleteAll();
  }

  /// Intenta recuperar el token del almacenamiento cifrado para auto-login.
  Future<String?> getSavedToken() async {
    return await _secureStorage.read('auth_token');
  }

  void setRecoveryEmail(String email) {
    _recoveryEmail = email;
    notifyListeners();
  }

  void setRecoveryCode(String code) {
    _recoveryCode = code;
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

  void updateUsuario(Usuario updatedUser) {
    _usuarioLogueado = updatedUser;
    _nombreUsuario = updatedUser.nombre;
    notifyListeners();
  }
}