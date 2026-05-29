import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gramas_y_suministros_movil/Features/auth-login/Register-Screen.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-Sizedbox.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-TextField.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-button.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:gramas_y_suministros_movil/Features/catalog/CatalogScreen.dart';
import 'package:gramas_y_suministros_movil/models/usuarios.model.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'dart:io' show Platform;
import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter/services.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:gramas_y_suministros_movil/Features/Password-reset/Email_Recovery_Screen.dart';

class LoginScreen extends StatelessWidget {
  LoginScreen({super.key});

  final GoogleSignIn _googleSignIn = GoogleSignIn();

  Future<void> signInWithGoogle(BuildContext context) async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser != null) {
        // Obtenemos autenticación (idToken / accessToken) por si la necesitas para el backend
        final GoogleSignInAuthentication auth = await googleUser.authentication;
        debugPrint('GoogleSignIn success: id=${googleUser.id}, email=${googleUser.email}');

        // Mostramos un mensaje breve al usuario
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Iniciando con Google: ${googleUser.email}')),
        );

        // Creamos un Usuario local y notificamos al AuthProvider (flujo existente en tu app)
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        final Usuario usuario = Usuario(
          idUsuario: 0,
          nombre: googleUser.displayName ?? googleUser.email.split('@').first,
          email: googleUser.email,
          // Puedes guardar auth.accessToken o idToken si tu backend lo necesita
          token: auth.idToken,
        );

        await authProvider.login(usuario);

        // Navegar al catálogo
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const CatalogScreen()),
        );
      }
    } on PlatformException catch (e) {
      final String rawMessage = '${e.code}:${e.message}'.toLowerCase();
      debugPrint('GoogleSignIn PlatformException: code=${e.code}, message=${e.message}');

      String userMessage = 'Error al iniciar con Google. Inténtalo de nuevo más tarde.';
      if (e.code == 'sign_in_canceled' || rawMessage.contains('cancel')) {
        userMessage = 'El inicio de sesión fue cancelado.';
      } else if (rawMessage.contains('apiexception') && rawMessage.contains('10')) {
        userMessage = 'Error de autenticación. La firma de la aplicación no coincide con la configuración del servidor.';
      } else if (rawMessage.contains('network')) {
        userMessage = 'No se pudo conectar con los servidores. Revisa tu conexión a internet.';
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(userMessage), backgroundColor: Colors.red),
      );
    } catch (e) {
      debugPrint('GoogleSignIn unexpected error: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al iniciar con Google: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> signInWithApple(BuildContext context) async {
    if (!Platform.isIOS) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('El inicio con iOS solo está disponible en dispositivos Apple'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    try {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );
      // Aquí enviarías credential.identityToken a tu backend
      print('Apple login success: $credential');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al iniciar con Apple: $e'), backgroundColor: Colors.red),
      );
    }
  }

  final TextEditingController userController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  Future<void> login(BuildContext context) async {
    final String urlApi = 'http://localhost:3000/auth/login';
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    try {
      final response = await http.post(
        Uri.parse(urlApi),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': userController.text,
          'password_hash': passwordController.text,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        Usuario usuarioLogueado = Usuario.fromJson(responseData);

        await authProvider.login(usuarioLogueado);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Bienvenido, ${usuarioLogueado.nombre}!'),
            backgroundColor: Colors.green,
          ),
        );

        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => const CatalogScreen(),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Error de credenciales!'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Error de conexion!'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Column(
                  children: [
                    Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        color: const Color(0xFFE7F3DE),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.grass,
                          color: Color(0xFF3D7B2C),
                          size: 40,
                        ),
                      ),
                    ),
                    AppSpaces.verticalSmall,
                    const Text(
                      'Gramas y Suministros',
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1F3D24),
                      ),
                    ),
                    AppSpaces.verticalSmall,
                    const Text(
                      'Vitalidad vibrante para tu jardín',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                    ),
                  ],
                ),
              ),
              AppSpaces.verticalLarge,
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(32),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.06),
                      blurRadius: 24,
                      offset: const Offset(0, 12),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Center(
                      child: Text(
                        'Iniciar Sesión',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF1F3D24),
                        ),
                      ),
                    ),
                    AppSpaces.verticalSmall,
                    const Text(
                      'Ingresa con tu correo y contraseña',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                    ),
                    AppSpaces.verticalLarge,
                    CustomTextField(
                      label: 'Correo electronico',
                      icon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      controller: userController,
                    ),
                    AppSpaces.verticalMedium,
                    CustomTextField(
                      label: 'Contraseña',
                      icon: Icons.lock,
                      isPassword: true,
                      controller: passwordController,
                    ),
                    AppSpaces.verticalSmall,
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => EmailRecoveryScreen(),
                            ),
                          );
                        },
                        style: TextButton.styleFrom(
                          foregroundColor: const Color(0xFF4A7C3E),
                          textStyle: const TextStyle(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        child: const Text('Olvidaste tu contraseña?'),
                      ),
                    ),
                    AppSpaces.verticalMedium,
                    CustomButton(
                      text: 'Iniciar sesión',
                      onPressed: () => login(context),
                    ),
                    AppSpaces.verticalMedium,
                    Row(
                      children: const [
                        Expanded(
                          child: Divider(
                            color: Color(0xFFD1D5DB),
                            thickness: 1,
                          ),
                        ),
                        SizedBox(width: 14),
                        Text(
                          'O',
                          style: TextStyle(
                            color: Color(0xFF6B7280),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        SizedBox(width: 14),
                        Expanded(
                          child: Divider(
                            color: Color(0xFFD1D5DB),
                            thickness: 1,
                          ),
                        ),
                      ],
                    ),
                    AppSpaces.verticalMedium,
                    OutlinedButton.icon(
                      onPressed: () => signInWithGoogle(context),
                      style: OutlinedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: Colors.black87,
                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      icon: Container(
                        width: 28,
                        height: 28,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.white,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(4),
                          child: Image.asset(
                            'assets/icons/Google_logo.svg.webp',
                            fit: BoxFit.contain,
                          ),
                        ),
                      ),
                      label: const Text(
                        'Continuar con Google',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                    AppSpaces.verticalSmall,
                    ElevatedButton.icon(
                      onPressed: () => signInWithApple(context),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      icon: const Icon(Icons.apple, size: 20),
                      label: const Text(
                        'Continuar con iOS',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),
              AppSpaces.verticalMedium,
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'No tienes una cuenta? ',
                    style: TextStyle(color: Color(0xFF6B7280)),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => RegisterScreen(),
                        ),
                      );
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFF4A7C3E),
                      textStyle: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    child: const Text('Crear cuenta'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
