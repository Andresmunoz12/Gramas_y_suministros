import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gramas_y_suministros_movil/Features/auth-login/Login_Screen.dart';
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

  // Cambiamos el nombre de la función a 'registrar' para que sea coherente
  Future<void> registrar(BuildContext context) async {
    final String urlApi = 'http://localhost:3000/usuarios';
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    try {
      final response = await http.post(
        Uri.parse(urlApi),
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
              content: Text('¡Usuario ${nuevoUsuario.nombre} registrado correctamente!'),
              backgroundColor: Colors.green
          ),
        );

        // Opcional: Navegar al Login o Home tras registrarse
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('¡Error en los datos!'), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('¡Error de conexión!'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
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
                  'Registrar Usuario',
                  style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
                ),
                AppSpaces.verticalLarge,
                CustomTextField(label:'Nombre', icon: Icons.person , controller: namecontroller),
                AppSpaces.verticalMedium,
                CustomTextField(label: 'Apellidos', icon: Icons.badge_outlined, controller: apellidocontroller),
                AppSpaces.verticalMedium,
                CustomTextField(label: 'Correo Electronico', icon: Icons.email_outlined, controller: emailcontroller),
                AppSpaces.verticalMedium,
                CustomTextField(label: 'Contraseña', icon: Icons.lock, controller: passwordcontroller),
                AppSpaces.verticalinter,
                // ERROR CORREGIDO: Llamamos a 'registrar(context)'
                CustomButton(text: 'REGISTRARSE', onPressed: () => registrar(context)),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("¿Ya tienes cuenta?"),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => LoginScreen()),
                        );
                      },
                      child: const Text(
                        "Iniciar sesión aquí",
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