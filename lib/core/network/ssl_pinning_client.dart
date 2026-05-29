import 'dart:io';
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'package:flutter/services.dart';

/// Cliente HTTP seguro basado en Dio que implementa SSL Pinning.
/// 
/// Mitiga ataques Man-in-the-Middle (MitM) en redes no confiables al forzar la conexión 
/// únicamente con servidores que presenten el certificado digital exacto definido por la app, 
/// rechazando cualquier otro certificado firmado por Autoridades de Certificación (CAs) del sistema.
class SslPinningClient {
  final Dio dio;

  SslPinningClient._(this.dio);

  /// Factory para crear e inicializar de forma asíncrona una instancia de [SslPinningClient].
  /// 
  /// Carga el certificado desde el asset indicado por [certificateAssetPath] e inicializa
  /// el adaptador HTTP personalizado de Dio con un [SecurityContext] restrictivo.
  static Future<SslPinningClient> create({
    required String baseUrl,
    required String certificateAssetPath,
    Map<String, dynamic>? headers,
  }) async {
    final dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 10),
        headers: headers ?? {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    // Cargar los bytes del certificado (.pem o .der) desde los assets
    final ByteData certData = await rootBundle.load(certificateAssetPath);
    final List<int> certBytes = certData.buffer.asUint8List();

    // Configurar el adaptador para las plataformas I/O (Android e iOS)
    if (dio.httpClientAdapter is IOHttpClientAdapter) {
      (dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
        // Crear un contexto de seguridad vacío (withTrustedRoots: false).
        // Al deshabilitar las raíces de confianza del sistema, la app NO confiará en ninguna 
        // CA por defecto (como Let's Encrypt, DigiCert, etc.), confiando ÚNICAMENTE en el
        // certificado explícito provisto (SSL Pinning estricto).
        final SecurityContext context = SecurityContext(withTrustedRoots: false);
        
        try {
          // Cargar el certificado PEM o DER de confianza
          context.setTrustedCertificatesBytes(certBytes);
        } catch (e) {
          throw Exception('Error al cargar el certificado en SecurityContext: $e');
        }

        final HttpClient httpClient = HttpClient(context: context);

        // Opcional: Validación adicional de huella digital (SHA-256 Pinning)
        // para mayor control frente a rotación de certificados o verificación estricta de dominios.
        httpClient.badCertificateCallback = (X509Certificate cert, String host, int port) {
          // badCertificateCallback solo se invoca si el certificado presentado no es válido
          // según el SecurityContext. Con withTrustedRoots: false, cualquier otro certificado
          // se considerará inválido y este callback retornará false por seguridad.
          return false; 
        };

        return httpClient;
      };
    }

    return SslPinningClient._(dio);
  }
}
