import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-Sizedbox.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-TextField.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-button.dart';

class ResetPasswordScreen extends StatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> {
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController = TextEditingController();
  bool isLoading = false;

  Future<void> resetPassword(BuildContext context) async {
    if (passwordController.text.isEmpty || confirmPasswordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor completa todos los campos'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    if (passwordController.text != confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Las contraseñas no coinciden'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final String code = authProvider.recoveryCode;
    final String urlApi = ApiConfig.authResetPassword;

    setState(() => isLoading = true);

    try {
      print('Intentando restablecer password con código: $code');
      final response = await http.post(
        Uri.parse(urlApi),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'codigo_verificacion': code,
          'nueva_password': passwordController.text,
        }),
      );

      print('Respuesta del servidor: ${response.statusCode} - ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Contraseña restablecida con éxito'),
            backgroundColor: Colors.green,
          ),
        );

        // Volver al login y limpiar el stack
        Navigator.of(context).popUntil((route) => route.isFirst);
      } else {
        final errorData = jsonDecode(response.body);
        final String errorMessage = errorData['message'] ?? 'Error al restablecer la contraseña';
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error (${response.statusCode}): $errorMessage'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      print('Error de conexión: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error de conexión: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      appBar: AppBar(
        backgroundColor: const Color(0xFFF5F8F2),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1F3D24)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
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
                      width: 80,
                      height: 80,
                      decoration: const BoxDecoration(
                        color: Color(0xFF81D460),
                        shape: BoxShape.circle,
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.lock_reset_outlined,
                          color: Colors.white,
                          size: 40,
                        ),
                      ),
                    ),
                    AppSpaces.verticalMedium,
                    const Text(
                      'Nueva Contraseña',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1F3D24),
                      ),
                    ),
                    AppSpaces.verticalSmall,
                    const Text(
                      'Ingresa tu nueva contraseña para acceder a tu cuenta.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 14,
                        color: Color(0xFF6B7280),
                      ),
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
                    CustomTextField(
                      label: 'Nueva Contraseña',
                      icon: Icons.lock_outline,
                      isPassword: true,
                      controller: passwordController,
                    ),
                    AppSpaces.verticalMedium,
                    CustomTextField(
                      label: 'Confirmar Contraseña',
                      icon: Icons.lock_clock_outlined,
                      isPassword: true,
                      controller: confirmPasswordController,
                    ),
                    AppSpaces.verticalLarge,
                    CustomButton(
                      text: isLoading ? 'Restableciendo...' : 'Restablecer Contraseña',
                      onPressed: isLoading ? null : () => resetPassword(context),
                    ),
                  ],
                ),
              ),
              AppSpaces.verticalLarge,
              const Center(
                child: Text(
                  '© 2024 Gramas y Suministros. Calidad en cada brote.',
                  style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    passwordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }
}
