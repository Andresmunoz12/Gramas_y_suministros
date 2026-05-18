import 'package:get_it/get_it.dart';
import 'package:internet_connection_checker_plus/internet_connection_checker_plus.dart';
import 'package:google_sign_in/google_sign_in.dart';

import 'package:gramas_y_suministros_movil/core/network/network_info.dart';
import 'package:gramas_y_suministros_movil/features/auth/data/repositories/auth_repository_impl.dart';
import 'package:gramas_y_suministros_movil/features/auth/domain/repositories/auth_repository.dart';

final sl = GetIt.instance;

/// Inicializa las dependencias de la aplicación.
Future<void> init() async {
  // Features - Auth
  // Repository
  sl.registerLazySingleton<AuthRepository>(
    () => AuthRepositoryImpl(
      networkInfo: sl(),
      googleSignIn: sl(),
    ),
  );

  // Core
  sl.registerLazySingleton<NetworkInfo>(
    () => NetworkInfoImpl(sl()),
  );

  // External
  sl.registerLazySingleton(() => InternetConnectionCheckerPlus());
  sl.registerLazySingleton(() => GoogleSignIn());
  // sl.registerLazySingleton(() => SignInWithApple()); // Si se necesitara inyectar directamente
}
