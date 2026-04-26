import 'package:flutter/material.dart';
import 'package:gramas_y_suministros_movil/Features/auth-login/Register-Screen.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-Sizedbox.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-TextField.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-button.dart';
import 'package:http/http.dart' as http; // es la comunicación con http
import 'dart:convert';//convierte o traduce los json

class LoginScreen extends StatelessWidget {
  LoginScreen({super.key});

  // Controladores para capturar el texto
  final TextEditingController userController = TextEditingController(); //variable que almacena lo que escribimos en el correo
  final TextEditingController passwordController = TextEditingController();//

  Future<void> login(BuildContext context) async {
    // Tu IP de Wi-Fi y el puerto de Docker
    final String urlApi = 'http://192.168.80.28:3000/auth/login';

    try {
      final response = await http.post(//envio de datos http
        Uri.parse(urlApi),
        headers: {'Content-Type': 'application/json'},//envio de paquetes tipo json
        body: jsonEncode({
          'email': userController.text,
          'password_hash': passwordController.text,
        }),
      );
      //respuesta de servidor
      if (response.statusCode == 200 || response.statusCode == 201) {
        print("¡Exito! Conectado a Gramas y Suministros");//mensaje de respuesta en la terminal
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('¡Bienvenido a Gramas y Suministros!'), backgroundColor: Colors.green),//mensaje de respueta al dispoditvo movil
        );
      } else {
        print("Error de credenciales: ${response.body}");//mensaje de respuesta en la terminal
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('¡Error de Credenciales!'), backgroundColor: Colors.red),//mensaje de respueta al dispoditvo movil
        );
      }
    } catch (e) {
      print("Error de conexión: $e");
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('¡Error de conexion!'), backgroundColor: Colors.red),
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
                  'Iniciar Sesión',
                  style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
                ),
                AppSpaces.verticalLarge,
                //buttom usuario
                CustomTextField(label: 'Usuario', icon: Icons.person, controller: userController),
                AppSpaces.verticalMedium,
                //buttom Contraseña
                CustomTextField(label: 'Contraseña', icon: Icons.lock , controller: passwordController),
                AppSpaces.verticalinter,

                // --- BOTÓN DE INGRESAR ---

                CustomButton(text: 'INGRESAR', onPressed: () => login(context)),

                AppSpaces.verticalMedium, // Espacio entre botón y link

                // --- LINK A REGISTRO (Fuera del botón, dentro de la Column) ---
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("¿No tienes cuenta?"),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) =>  RegisterScreen()),
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