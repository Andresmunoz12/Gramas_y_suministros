import 'package:flutter/material.dart';
import 'package:provider/provider.dart'; // 1. IMPORTANTE: Para usar Provider
import 'package:gramas_y_suministros_movil/Features/auth-login/Register-Screen.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-Sizedbox.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-TextField.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-button.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

// 2. Importa tus nuevos archivos de arquitectura
import 'package:gramas_y_suministros_movil/models/usuarios.model.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';

class LoginScreen extends StatelessWidget {
  LoginScreen({super.key});

  final TextEditingController userController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  Future<void> login(BuildContext context) async {
    final String urlApi = 'http://192.168.80.28:3000/auth/login';

    // 3. Referencia al Provider (listen: false porque estamos dentro de una función)
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    try {
      // Opcional: Puedes activar un estado de carga en tu provider aquí
      // authProvider.setLoading(true);

      final response = await http.post(
        Uri.parse(urlApi),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': userController.text,
          'password_hash': passwordController.text,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // --- PASO A: MODELADO (Convertir JSON a Objeto Dart) ---
        final Map<String, dynamic> responseData = jsonDecode(response.body);
        Usuario usuarioLogueado = Usuario.fromJson(responseData);

        // --- PASO B: PROVIDER (Guardar el objeto globalmente) ---
        authProvider.login(usuarioLogueado);

        print("¡Éxito! Usuario modelado: ${usuarioLogueado.nombre}");

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text('¡Bienvenido, ${usuarioLogueado.nombre}!'),
              backgroundColor: Colors.green
          ),
        );

        // 4. Aquí ya podrías navegar al Home sabiendo que los datos están seguros
        // Navigator.pushReplacementNamed(context, '/home');

      } else {
        print("Error de credenciales: ${response.body}");
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('¡Error de Credenciales!'), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      print("Error de conexión: $e");
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('¡Error de conexión!'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // 5. Ejemplo de cómo leer datos del Provider en el UI (opcional)
    // final user = context.watch<AuthProvider>().usuario;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Gramas y Suministros',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: const Color(0xFF81D460),
        elevation: 0,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 30),
        child: Center(
          child: SingleChildScrollView(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Text(
                  'Iniciar Sesión',
                  style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
                ),
                AppSpaces.verticalLarge,
                CustomTextField(label: 'Usuario', icon: Icons.person, controller: userController),
                AppSpaces.verticalMedium,
                CustomTextField(label: 'Contraseña', icon: Icons.lock , controller: passwordController),
                AppSpaces.verticalinter,

                // --- BOTÓN DE INGRESAR ---
                CustomButton(text: 'INGRESAR', onPressed: () => login(context)),

                AppSpaces.verticalMedium,

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("¿No tienes cuenta?"),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => RegisterScreen()),
                        );
                      },
                      child: const Text(
                        "Registrarse",
                        style: TextStyle(
                          color: Color(0xFF81D460),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}