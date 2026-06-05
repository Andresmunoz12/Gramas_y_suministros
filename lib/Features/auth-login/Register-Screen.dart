import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gramas_y_suministros_movil/Features/auth-login/Login_Screen.dart';
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-Sizedbox.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-TextField.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-button.dart';
import 'package:gramas_y_suministros_movil/models/Register.usuario.model.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

class RegisterScreen extends StatelessWidget {
  RegisterScreen({super.key});

  final TextEditingController namecontroller = TextEditingController();
  final TextEditingController apellidocontroller = TextEditingController();
  final TextEditingController emailcontroller = TextEditingController();
  final TextEditingController passwordcontroller = TextEditingController();
  final TextEditingController confirmPasswordController =
      TextEditingController();

  // Cambiamos el nombre de la función a 'registrar' para que sea coherente
  Future<void> registrar(BuildContext context) async {
    final String urlApi = ApiConfig.users;
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    try {
      final response = await http.post(
        Uri.parse(urlApi.trim()),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'nombre': namecontroller.text,
          'apellido': apellidocontroller.text,
          'email': emailcontroller.text,
          'password_hash': passwordcontroller.text,
          'id_rol': 2,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final Map<String, dynamic> responseData = jsonDecode(response.body);

        // PASO A: MODELADO
        RegisterUsuario nuevoUsuario = RegisterUsuario.fromJson(responseData);

        // PASO B: PROVIDER
        // ERROR CORREGIDO: Antes intentabas usar 'usuarioLogueado' que no existía.
        // Ahora usamos 'nuevoUsuario' que es la variable que acabas de crear arriba.
        authProvider.setUserName(nuevoUsuario.nombre);

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '¡Usuario ${nuevoUsuario.nombre} registrado correctamente!',
            ),
            backgroundColor: Colors.green,
          ),
        );

        // Opcional: Navegar al Login o Home tras registrarse
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('¡Error en los datos!'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('¡Error de conexión!'),
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
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Logo y título de la app
              Container(
                padding: const EdgeInsets.symmetric(vertical: 40),
                decoration: BoxDecoration(
                  color: const Color(0xFFE7F3DE),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Center(
                  child: Icon(Icons.grass, color: Color(0xFF3D7B2C), size: 40),
                ),
              ),
              AppSpaces.verticalSmall,
              const Text(
                'Gramas y Suministros',
                textAlign: TextAlign.center,
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
              AppSpaces.verticalLarge,
              // Formulario de registro
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(32),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
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
                        'Crear cuenta',
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
                      'Únete a nuestra comunidad de expertos en paisajismo.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                    ),
                    AppSpaces.verticalLarge,
                    CustomTextField(
                      label: 'Nombre completo',
                      icon: Icons.person,
                      keyboardType: TextInputType.name,
                      controller: namecontroller,
                    ),
                    AppSpaces.verticalMedium,
                    CustomTextField(
                      label: 'Apellido',
                      icon: Icons.person_outline,
                      keyboardType: TextInputType.name,
                      controller: apellidocontroller,
                    ),
                    AppSpaces.verticalMedium,
                    CustomTextField(
                      label: 'Correo electronico',
                      icon: Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress,
                      controller: emailcontroller,
                    ),
                    AppSpaces.verticalMedium,
                    CustomTextField(
                      label: 'Contraseña',
                      icon: Icons.lock,
                      isPassword: true,
                      controller: passwordcontroller,
                    ),
                    AppSpaces.verticalMedium,
                    CustomTextField(
                      label: 'Confirmar contraseña',
                      icon: Icons.lock_outline,
                      isPassword: true,
                      controller: confirmPasswordController,
                    ),
                    AppSpaces.verticalLarge,
                    CustomButton(
                      text: 'Registrarse',
                      onPressed: () => registrar(context),
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
                        // TODO: Implementar registro con Google.
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
                      label: const Text('Continuar con Google'),
                    ),
                    AppSpaces.verticalSmall,
                    ElevatedButton.icon(
                      onPressed: () {
                        // TODO: Implementar registro con iOS.
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
                    'Ya tienes cuenta? ',
                    style: TextStyle(color: Color(0xFF6B7280)),
                  ),
                  TextButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => LoginScreen()),
                      );
                    },
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFF4A7C3E),
                      textStyle: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    child: const Text('Inicia sesión'),
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
