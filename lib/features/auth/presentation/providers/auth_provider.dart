import 'package:flutter/material.dart';
import 'package:fpdart/fpdart.dart';

import 'package:gramas_y_suministros_movil/core/errors/failures.dart';
import 'package:gramas_y_suministros_movil/features/auth/domain/entities/user.dart';
import 'package:gramas_y_suministros_movil/features/auth/domain/repositories/auth_repository.dart';

/// Estado para el manejo de la autenticación.
enum AuthStatus {
  initial,
  loading,
  authenticated,
  unauthenticated,
  error,
}

/// [ChangeNotifier] que maneja la lógica de negocio y el estado de autenticación.
class AuthProvider extends ChangeNotifier {
  final AuthRepository authRepository;

  AuthProvider({required this.authRepository});

  AuthStatus _status = AuthStatus.initial;
  User? _user;
  Failure? _failure;

  AuthStatus get status => _status;
  User? get user => _user;
  Failure? get failure => _failure;

  /// Intenta iniciar sesión con Google.
  Future<void> signInWithGoogle() async {
    _status = AuthStatus.loading;
    _failure = null;
    notifyListeners();

    final result = await authRepository.signInWithGoogle();

    result.fold(
      (failure) {
        _status = AuthStatus.error;
        _failure = failure;
        _user = null;
      },
      (user) {
        _status = AuthStatus.authenticated;
        _user = user;
        _failure = null;
      },
    );
    notifyListeners();
  }

  /// Intenta iniciar sesión con Apple.
  Future<void> signInWithApple() async {
    _status = AuthStatus.loading;
    _failure = null;
    notifyListeners();

    final result = await authRepository.signInWithApple();

    result.fold(
      (failure) {
        _status = AuthStatus.error;
        _failure = failure;
        _user = null;
      },
      (user) {
        _status = AuthStatus.authenticated;
        _user = user;
        _failure = null;
      },
    );
    notifyListeners();
  }

  /// Cierra la sesión del usuario actual.
  Future<void> signOut() async {
    _status = AuthStatus.loading;
    _failure = null;
    notifyListeners();

    final result = await authRepository.signOut();

    result.fold(
      (failure) {
        _status = AuthStatus.error;
        _failure = failure;
      },
      (_) {
        _status = AuthStatus.unauthenticated;
        _user = null;
        _failure = null;
      },
    );
    notifyListeners();
  }

  /// Resetea el estado de fallo.
  void clearFailure() {
    _failure = null;
    notifyListeners();
  }
}
