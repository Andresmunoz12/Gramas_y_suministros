import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Interfaz para el repositorio de almacenamiento seguro.
/// Define las operaciones esenciales de persistencia de tokens y datos sensibles.
abstract class SecureStorageRepository {
  Future<void> write(String key, String value);
  Future<String?> read(String key);
  Future<void> delete(String key);
  Future<void> deleteAll();
}

/// Implementación del repositorio de almacenamiento seguro utilizando flutter_secure_storage.
/// Aplica cifrado de hardware en Android (Keystore/EncryptedSharedPreferences) 
/// y Keychain Services con políticas de accesibilidad restrictivas en iOS.
class SecureStorageService implements SecureStorageRepository {
  final FlutterSecureStorage _storage;

  SecureStorageService()
      : _storage = const FlutterSecureStorage(
          aOptions: AndroidOptions(
            encryptedSharedPreferences: true,
            // Permite especificar un archivo de preferencias específico e independiente
            sharedPreferencesName: 'app_secure_prefs',
            // Configuración recomendada para regenerar las llaves en caso de corrupción
            resetOnError: true,
          ),
          iOptions: IOSOptions(
            // El llavero de iOS (Keychain) restringe el acceso al token hasta que el dispositivo 
            // se desbloquee por primera vez después del arranque. Esto protege los datos incluso
            // durante procesos en segundo plano antes de la primera interacción física del usuario.
            accessibility: KeychainAccessibility.first_unlock,
            // Habilita el guardado sincronizado si es requerido o lo bloquea para el dispositivo local.
            synchronizable: false,
          ),
        );

  /// Escribe un par clave-valor de manera cifrada.
  @override
  Future<void> write(String key, String value) async {
    try {
      await _storage.write(key: key, value: value);
    } catch (e) {
      // Manejar la excepción o propagarla de forma segura
      throw Exception('Secure Storage Write Error: ${e.toString()}');
    }
  }

  /// Lee un valor a partir de su clave. Retorna [null] si no existe.
  @override
  Future<String?> read(String key) async {
    try {
      return await _storage.read(key: key);
    } catch (e) {
      throw Exception('Secure Storage Read Error: ${e.toString()}');
    }
  }

  /// Elimina un registro específico por su clave (por ejemplo, el JWT o Refresh Token).
  @override
  Future<void> delete(String key) async {
    try {
      await _storage.delete(key: key);
    } catch (e) {
      throw Exception('Secure Storage Delete Error: ${e.toString()}');
    }
  }

  /// Borra por completo el almacenamiento seguro. Ideal para procesos de logout.
  @override
  Future<void> deleteAll() async {
    try {
      await _storage.deleteAll();
    } catch (e) {
      throw Exception('Secure Storage Clear Error: ${e.toString()}');
    }
  }
}
