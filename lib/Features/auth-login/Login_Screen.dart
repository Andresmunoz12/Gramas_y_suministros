import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gramas_y_suministros_movil/Features/auth-login/Register-Screen.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-Sizedbox.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-TextField.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-button.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:gramas_y_suministros_movil/models/usuarios.model.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';

class LoginScreen extends StatelessWidget {
  LoginScreen({super.key});

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

        authProvider.login(usuarioLogueado);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Bienvenido, !'),
            backgroundColor: Colors.green,
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
                          // TODO: Implementar recuperacion de contrasena.
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
                      onPressed: () {
                        // TODO: Implementar inicio con Google.
                      },
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
                      onPressed: () {
                        // TODO: Implementar inicio con Apple/iOS.
                      },
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
