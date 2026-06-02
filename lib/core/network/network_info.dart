import 'package:internet_connection_checker_plus/internet_connection_checker_plus.dart';

/// Interfaz abstracta para verificar el estado de la conexión a internet.
abstract class NetworkInfo {
  /// Retorna un [Future] que indica si el dispositivo tiene conexión a internet.
  Future<bool> get isConnected;
}

/// Implementación concreta de [NetworkInfo] usando la API moderna.
class NetworkInfoImpl implements NetworkInfo {
  final InternetConnection connectionChecker;

  NetworkInfoImpl(this.connectionChecker);

  @override
  Future<bool> get isConnected => connectionChecker.hasInternetAccess;
}