import 'package:flutter/material.dart';
import 'package:provider/provider.dart'; // 👈 Importamos la librería que descargaste
import 'package:gramas_y_suministros_movil/Features/auth-login/Login_Screen.dart';
import 'Providers/auth_provider.dart';

void main() {
  runApp(
    // 1. Envolvemos la App con MultiProvider
    MultiProvider(
      providers: [
        // 2. Registramos tu AuthProvider
        ChangeNotifierProvider(create: (_) => AuthProvider()),
      ],
      child: const Myapp(),
    ),
  );
}

class Myapp extends StatelessWidget {
  const Myapp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Gramas y Suministros',
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF81D460), // Usamos tu verde corporativo
      ),
      // La app inicia en el Login, y esta ya tiene acceso al Provider
      home: LoginScreen(),
    );
  }
}