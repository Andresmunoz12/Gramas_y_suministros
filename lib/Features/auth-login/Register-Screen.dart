import 'package:flutter/material.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-TextField.dart';
import 'dart:convert'; // 👈 Esto arregla el error de jsonEncode
import 'package:http/http.dart' as http; // es la comunicación con http

class RegisterScreen extends StatelessWidget{
   RegisterScreen({super.key});

  final TextEditingController namecontroller = TextEditingController();
  final TextEditingController apellidocontroller = TextEditingController();
  final TextEditingController emailcontroller = TextEditingController();
  final TextEditingController passwordcontroller = TextEditingController();

   Future<void> login(BuildContext context) async {
     // Tu IP de Wi-Fi y el puerto de Docker
     final String urlApi = 'http://192.168.80.28:3000/usuarios';

     try {
       final response = await http.post(//envio de datos http
         Uri.parse(urlApi),
         headers: {'Content-Type': 'application/json'},//envio de paquetes tipo json
         body: jsonEncode({
           'nombre': namecontroller.text,
           'apellido': apellidocontroller.text,
           'email': emailcontroller.text,
           'password_hash': passwordcontroller.text,
           'id_rol': 2,
         }),
       );
       //respuesta de servidor
       if (response.statusCode == 200 || response.statusCode == 201) {
         print("¡Usuario registrado Correctamente !");//mensaje de respuesta en la terminal
         ScaffoldMessenger.of(context).showSnackBar(
           const SnackBar(content: Text('¡Usuario registrado Correctamente !'), backgroundColor: Colors.green),//mensaje de respueta al dispoditvo movil
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
                  'Registrar Usuario',
                  style: TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 40),
                //button Nombre
                 CustomTextField(label:'Nombre', icon: Icons.person , controller: namecontroller),
                const SizedBox(height: 20),
                //button Apellido
                 CustomTextField(label: 'Apellido', icon: Icons.badge_outlined, controller: apellidocontroller),
                const SizedBox(height: 20),
               //button Correo
                 CustomTextField(label: 'Correo Electronico', icon: Icons.email_outlined, controller: emailcontroller),
                const SizedBox(height: 20),
                //button password
                 CustomTextField(label: 'Contraseña', icon: Icons.lock, controller: passwordcontroller),
                const SizedBox(height:30),

                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: ElevatedButton(
                    onPressed: () {
                      // llamamos la funcion
                      login(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF81D460),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30),
                      ),
                      elevation: 5,
                    ),
                    child: const Text(
                      'Continuar',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

}