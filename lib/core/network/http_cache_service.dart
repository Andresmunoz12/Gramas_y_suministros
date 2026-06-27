import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

/// Servicio para el manejo de caché de peticiones HTTP en almacenamiento local.
/// 
/// Implementa persistencia basada en archivos JSON para almacenar respuestas de API.
/// Esto permite cargas instantáneas de la app (segunda vez en adelante) mediante
/// estrategias como "Cache-First" o "Stale-While-Revalidate".
class HttpCacheService {
  static final HttpCacheService _instance = HttpCacheService._internal();

  factory HttpCacheService() {
    return _instance;
  }

  HttpCacheService._internal();

  /// Directorio donde se guardan los archivos de caché
  Directory? _cacheDir;

  /// Obtiene el directorio de caché, inicializándolo si es necesario.
  Future<Directory> _getCacheDirectory() async {
    if (_cacheDir != null) return _cacheDir!;
    
    final appDir = await getApplicationDocumentsDirectory();
    _cacheDir = Directory('${appDir.path}/http_cache');
    
    if (!await _cacheDir!.exists()) {
      await _cacheDir!.create(recursive: true);
    }
    return _cacheDir!;
  }

  /// Sanitiza la clave de caché (usualmente la URL) para convertirla en un nombre de archivo válido.
  String _sanitizeKey(String key) {
    // Reemplaza caracteres especiales no válidos en nombres de archivos por guiones bajos.
    return key.replaceAll(RegExp(r'[\\/:*?"<>|]'), '_');
  }

  /// Guarda una respuesta HTTP en caché.
  /// 
  /// [key] suele ser la URL de la petición.
  /// [value] es la cadena JSON de respuesta.
  Future<void> save(String key, String value) async {
    try {
      final directory = await _getCacheDirectory();
      final fileName = _sanitizeKey(key);
      final file = File('${directory.path}/$fileName.json');

      final cacheData = {
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'data': value,
      };

      await file.writeAsString(jsonEncode(cacheData));
      debugPrint('HttpCacheService: Caché guardada para $key');
    } catch (e) {
      debugPrint('HttpCacheService Error al guardar caché para $key: $e');
    }
  }

  /// Recupera un valor de la caché.
  /// 
  /// Retorna la cadena JSON original si existe, o [null] si no hay caché.
  Future<String?> get(String key) async {
    try {
      final directory = await _getCacheDirectory();
      final fileName = _sanitizeKey(key);
      final file = File('${directory.path}/$fileName.json');

      if (!await file.exists()) {
        debugPrint('HttpCacheService: No hay caché para $key');
        return null;
      }

      final content = await file.readAsString();
      final Map<String, dynamic> cacheData = jsonDecode(content) as Map<String, dynamic>;
      
      debugPrint('HttpCacheService: Caché recuperada para $key');
      return cacheData['data'] as String?;
    } catch (e) {
      debugPrint('HttpCacheService Error al leer caché para $key: $e');
      return null;
    }
  }

  /// Obtiene la edad de la caché en milisegundos. Retorna [null] si no existe.
  Future<int?> getCacheAge(String key) async {
    try {
      final directory = await _getCacheDirectory();
      final fileName = _sanitizeKey(key);
      final file = File('${directory.path}/$fileName.json');

      if (!await file.exists()) return null;

      final content = await file.readAsString();
      final Map<String, dynamic> cacheData = jsonDecode(content) as Map<String, dynamic>;
      final int timestamp = cacheData['timestamp'] as int;
      
      return DateTime.now().millisecondsSinceEpoch - timestamp;
    } catch (_) {
      return null;
    }
  }

  /// Invalida (elimina) la caché de una petición específica.
  /// 
  /// Útil cuando se modifica/crea un recurso y queremos forzar la recarga desde internet.
  Future<void> invalidate(String key) async {
    try {
      final directory = await _getCacheDirectory();
      final fileName = _sanitizeKey(key);
      final file = File('${directory.path}/$fileName.json');

      if (await file.exists()) {
        await file.delete();
        debugPrint('HttpCacheService: Caché invalidada para $key');
      }
    } catch (e) {
      debugPrint('HttpCacheService Error al invalidar caché para $key: $e');
    }
  }

  /// Elimina todo el historial de caché.
  Future<void> clearAll() async {
    try {
      final directory = await _getCacheDirectory();
      if (await directory.exists()) {
        await directory.delete(recursive: true);
        _cacheDir = null; // Fuerza reinicialización en la próxima llamada
        debugPrint('HttpCacheService: Toda la caché de red ha sido borrada.');
      }
    } catch (e) {
      debugPrint('HttpCacheService Error al borrar toda la caché: $e');
    }
  }
}
