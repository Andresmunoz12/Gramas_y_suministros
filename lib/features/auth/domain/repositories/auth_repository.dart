import 'package:fpdart/fpdart.dart';
import 'package:gramas_y_suministros_movil/core/errors/failures.dart';
import 'package:gramas_y_suministros_movil/features/auth/domain/entities/user.dart';

/// Interfaz abstracta para el repositorio de autenticación.
/// Define los contratos para las operaciones de autenticación.
abstract class AuthRepository {
  /// Inicia sesión con Google.
  /// Retorna un [Either] que contiene un [Failure] en caso de error,
  /// o un [User] en caso de éxito.
  Future<Either<Failure, User>> signInWithGoogle();

  /// Inicia sesión con Apple.
  /// Retorna un [Either] que contiene un [Failure] en caso de error,
  /// o un [User] en caso de éxito.
  Future<Either<Failure, User>> signInWithApple();

  /// Cierra la sesión del usuario actual.
  /// Retorna un [Either] que contiene un [Failure] en caso de error,
  /// o [Unit] en caso de éxito (indicando que no hay valor de retorno).
  Future<Either<Failure, Unit>> signOut();
}
