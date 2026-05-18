import 'dart:io'; // Para [SocketException]

import 'package:fpdart/fpdart.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:flutter/services.dart';

import 'package:gramas_y_suministros_movil/core/errors/failures.dart';
import 'package:gramas_y_suministros_movil/core/network/network_info.dart';
import 'package:gramas_y_suministros_movil/features/auth/domain/entities/user.dart';
import 'package:gramas_y_suministros_movil/features/auth/domain/repositories/auth_repository.dart';

/// Implementación concreta de [AuthRepository].
class AuthRepositoryImpl implements AuthRepository {
  final NetworkInfo networkInfo;
  final GoogleSignIn googleSignIn;
  // final SignInWithApple signinWithApple; // En un caso real se inyectaría

  AuthRepositoryImpl({
    required this.networkInfo,
    required this.googleSignIn,
    // required this.signinWithApple,
  });

  @override
  Future<Either<Failure, User>> signInWithGoogle() async {
    if (await networkInfo.isConnected) {
      try {
        final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
        if (googleUser == null) {
          return const Left(AuthFailure(message: 'El inicio de sesión fue cancelado.'));
        }
        // Aquí normalmente se haría una llamada a tu backend para verificar el token
        // y obtener la información completa del usuario.
        // Por simplicidad, creamos un usuario simulado.
        final User user = User(
          id: googleUser.id,
          email: googleUser.email,
          displayName: googleUser.displayName,
        );
        return Right(user);
      } on SocketException {
        return const Left(NetworkFailure(message: 'No hay conexión a internet.'));
      } on PlatformException catch (e) {
        // Mapear errores nativos de Google/Android a Failure explícitos
        final String code = e.code ?? '';
        final String message = e.message ?? e.toString();

        // Error de red detectado por el plugin
        if (code.toLowerCase().contains('network') || message.toLowerCase().contains('network')) {
          return const Left(NetworkFailure(message: 'No hay conexión a internet.'));
        }

        // Caso de cancelación (algunas versiones devuelven códigos/objetos distintos)
        if (code == 'sign_in_canceled' || code == 'user_cancelled' || code == 'CANCELED' || message.toLowerCase().contains('cancel')) {
          return const Left(AuthFailure(message: 'El inicio de sesión fue cancelado.'));
        }

        // Firebase / Google Play services config error (ApiException 10)
        if (code == 'sign_in_failed' || message.contains('ApiException') && message.contains('10')) {
          return const Left(AuthFailure(message: 'Error de autenticación. La firma de la aplicación no coincide con la configuración del servidor.'));
        }

        // Fallback para otros errores de plataforma
        return Left(AuthFailure(message: 'Error al iniciar sesión con Google: $message'));
      } on Exception catch (e) {
        // Captura cualquier otra excepción inesperada durante el proceso de Google Sign-In
        return Left(AuthFailure(message: 'Error al iniciar sesión con Google: ${e.toString()}'));
      }
    } else {
      return const Left(NetworkFailure(message: 'No hay conexión a internet.'));
    }
  }

  @override
  Future<Either<Failure, User>> signInWithApple() async {
    if (await networkInfo.isConnected) {
      try {
        final credential = await SignInWithApple.channel.invokeMethod('signIn');
        if (credential == null) {
          return const Left(AuthFailure(message: 'Inicio de sesión con Apple cancelado.'));
        }

        // Simulación de creación de usuario
        final User user = User(
          id: credential['userIdentifier'] as String,
          email: credential['email'] as String? ?? 'apple_user@example.com',
          displayName: credential['fullName'] != null
              ? '${credential['fullName']['givenName']} ${credential['fullName']['familyName']}'
              : null,
        );
        return Right(user);
      } on SocketException {
        return const Left(NetworkFailure(message: 'No hay conexión a internet.'));
      } on Exception catch (e) {
        return Left(AuthFailure(message: 'Error al iniciar sesión con Apple: ${e.toString()}'));
      }
    } else {
      return const Left(NetworkFailure(message: 'No hay conexión a internet.'));
    }
  }

  @override
  Future<Either<Failure, Unit>> signOut() async {
    if (await networkInfo.isConnected) {
      try {
        await googleSignIn.signOut();
        // Aquí también se cerrarían sesiones de Apple, si aplica, y del backend
        return const Right(unit);
      } on SocketException {
        return const Left(NetworkFailure(message: 'No hay conexión a internet.'));
      } on Exception catch (e) {
        return Left(AuthFailure(message: 'Error al cerrar sesión: ${e.toString()}'));
      }
    } else {
      return const Left(NetworkFailure(message: 'No hay conexión a internet.'));
    }
  }
}
