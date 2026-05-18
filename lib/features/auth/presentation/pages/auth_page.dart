import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'package:gramas_y_suministros_movil/core/errors/failures.dart';
import 'package:gramas_y_suministros_movil/features/auth/presentation/providers/auth_provider.dart';

/// Página de ejemplo para la autenticación.
class AuthPage extends StatefulWidget {
  const AuthPage({super.key});

  @override
  State<AuthPage> createState() => _AuthPageState();
}

class _AuthPageState extends State<AuthPage> {
  /// Muestra un [SnackBar] con el mensaje de error.
  void _showErrorSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Theme.of(context).colorScheme.error,
        behavior: SnackBarBehavior.floating, // Hace que el SnackBar se vea más moderno y flotante
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Autenticación')),
      body: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          // Reaccionar a los cambios de estado y fallos
          if (authProvider.status == AuthStatus.error && authProvider.failure != null) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              String errorMessage = 'Ha ocurrido un error inesperado.';

              // 1) Errores de red
              if (authProvider.failure is NetworkFailure) {
                errorMessage = 'No se pudo conectar con los servidores. Revisa tu conexión a internet.';
              }

              // 2) Errores de autenticación (Google / Apple)
              else if (authProvider.failure is AuthFailure) {
                final raw = authProvider.failure!.message.toLowerCase();

                // Cancelación explícita
                if (raw.contains('cancel') || raw.contains('cancelado') || raw.contains('sign_in_canceled')) {
                  errorMessage = 'El inicio de sesión fue cancelado.';
                }

                // ApiException 10 / firma SHA-1 faltante o incorrecta
                else if (raw.contains('firma') || raw.contains('apiexception') && raw.contains('10') || raw.contains('sign_in_failed')) {
                  errorMessage = 'Error de autenticación. La firma de la aplicación no coincide con la configuración del servidor.';
                }

                // Mensaje genérico de auth
                else {
                  errorMessage = authProvider.failure!.message;
                }
              }

              // 3) Errores de servidor
              else if (authProvider.failure is ServerFailure) {
                errorMessage = 'Error del servidor. Intenta de nuevo más tarde.';
              }

              _showErrorSnackBar(context, errorMessage);
              authProvider.clearFailure();
            });
          }

          if (authProvider.status == AuthStatus.authenticated) {
            // Navegar a la pantalla principal o mostrar información del usuario
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Bienvenido: ${authProvider.user?.displayName ?? authProvider.user?.email}'),
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: authProvider.signOut,
                    child: const Text('Cerrar Sesión'),
                  ),
                ],
              ),
            );
          } else if (authProvider.status == AuthStatus.loading) {
            return const Center(child: CircularProgressIndicator());
          }

          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text('Por favor, inicie sesión.'),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: authProvider.signInWithGoogle,
                  child: const Text('Iniciar con Google'),
                ),
                const SizedBox(height: 10),
                ElevatedButton(
                  onPressed: authProvider.signInWithApple,
                  child: const Text('Iniciar con Apple'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}