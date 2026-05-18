import 'package:equatable/equatable.dart';

/// Clase base abstracta para todos los tipos de fallos en la aplicación.
/// Extiende [Equatable] para permitir la comparación de objetos [Failure].
abstract class Failure extends Equatable {
  /// El mensaje asociado con el fallo.
  final String message;

  /// Constructor para [Failure].
  const Failure({required this.message});

  @override
  List<Object?> get props => [message];
}

/// Representa un fallo relacionado con el servidor (ej. 404, 500).
class ServerFailure extends Failure {
  const ServerFailure({required super.message});
}

/// Representa un fallo relacionado con problemas de red (ej. sin conexión a internet).
class NetworkFailure extends Failure {
  const NetworkFailure({required super.message});
}

/// Representa un fallo relacionado con la caché de datos (ej. datos no encontrados).
class CacheFailure extends Failure {
  const CacheFailure({required super.message});
}

/// Representa un fallo durante la autenticación.
class AuthFailure extends Failure {
  const AuthFailure({required super.message});
}

/// Representa un fallo cuando la operación no está autorizada.
class UnauthorizedFailure extends Failure {
  const UnauthorizedFailure({required super.message});
}

/// Representa un fallo general o desconocido.
class UnknownFailure extends Failure {
  const UnknownFailure({required super.message});
}
