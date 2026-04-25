import 'package:flutter/material.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-TextField.dart';
import '';

class RegisterScreen extends StatelessWidget{
  const RegisterScreen({super.key});

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
                const CustomTextField(label:'Nombre', icon: Icons.person),
                const SizedBox(height: 20),
                //button Apellido
                const CustomTextField(label: 'Apellido', icon: Icons.badge_outlined),
                const SizedBox(height: 20),
               //button Correo
                const CustomTextField(label: 'Correo Electronico', icon: Icons.email_outlined),
                const SizedBox(height: 20),
                //button password
                const CustomTextField(label: 'Contraseña', icon: Icons.password_outlined),
                const SizedBox(height:30),

                SizedBox(
                  width: double.infinity,
                  height: 55,
                  child: ElevatedButton(
                    onPressed: () {
                      // llamamos la funcion
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