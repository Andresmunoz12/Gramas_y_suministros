import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-Sizedbox.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-TextField.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-button.dart';
import 'Verification_Code_Screen.dart';

class EmailRecoveryScreen extends StatefulWidget {
  const EmailRecoveryScreen({super.key});

  @override
  State<EmailRecoveryScreen> createState() => _EmailRecoveryScreenState();
}

class _EmailRecoveryScreenState extends State<EmailRecoveryScreen> {
  final TextEditingController emailController = TextEditingController();
  bool isLoading = false;

  Future<void> sendRecoveryEmail(BuildContext context) async {
    if (emailController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor ingresa tu correo'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final String urlApi = ApiConfig.authRequestCode;

    setState(() => isLoading = true);

    try {
      final response = await http.post(
        Uri.parse(urlApi.trim()),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': emailController.text,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final authProvider = Provider.of<AuthProvider>(context, listen: false);
        authProvider.setRecoveryEmail(emailController.text);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Código enviado a tu correo'),
            backgroundColor: Colors.green,
          ),
        );

        // Navegar a la pantalla de código de verificación
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => const VerificationCodeScreen(),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Correo no encontrado'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Error de conexión'),
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
              // Header con icono
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
                          Icons.settings_backup_restore,
                          color: Colors.white,
                          size: 40,
                        ),
                      ),
                    ),
                    AppSpaces.verticalMedium,
                    const Text(
                      'Recuperar Contraseña',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1F3D24),
                      ),
                    ),
                    AppSpaces.verticalSmall,
                    const Text(
                      'Introduce tu correo electrónico y te enviaremos las instrucciones para restablecer tu cuenta.',
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
              // Formulario
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
                      label: 'Correo Electrónico',
                      icon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      controller: emailController,
                    ),
                    AppSpaces.verticalLarge,
                    CustomButton(
                      text: isLoading ? 'Enviando...' : 'Enviar Código',
                      onPressed: isLoading
                          ? null
                          : () => sendRecoveryEmail(context),
                    ),
                    AppSpaces.verticalMedium,
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      style: TextButton.styleFrom(
                        foregroundColor: const Color(0xFF4A7C3E),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.arrow_back, size: 16),
                          SizedBox(width: 8),
                          Text(
                            'Volver al inicio de sesión',
                            style: TextStyle(fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
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
    emailController.dispose();
    super.dispose();
  }
}
