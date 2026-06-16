import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/models/usuarios.model.dart';
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-TextField.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-button.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-Sizedbox.dart';

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _nombreController;
  late TextEditingController _apellidoController;
  late TextEditingController _emailController;
  
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final Usuario? user = authProvider.usuario;

    _nombreController = TextEditingController(text: user?.nombre ?? '');
    _apellidoController = TextEditingController(text: user?.apellido ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
  }

  @override
  void dispose() {
    _nombreController.dispose();
    _apellidoController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final Usuario? user = authProvider.usuario;

    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Error: No se encontró sesión de usuario activa.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    final nombre = _nombreController.text.trim();
    final apellido = _apellidoController.text.trim();
    final email = _emailController.text.trim();

    if (nombre.isEmpty || apellido.isEmpty || email.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor, completa todos los campos obligatorios.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    final emailRegex = RegExp(r"^[a-zA-Z0-9.a-zA-Z0-9.!#$%&'*+-/=?^_`{|}~]+@[a-zA-Z0-9]+\.[a-zA-Z]+");
    if (!emailRegex.hasMatch(email)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor, ingresa un correo electrónico válido.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final String urlApi = '${ApiConfig.users}/${user.idUsuario}';
      final String? token = user.token;

      final Map<String, String> headers = {
        'Content-Type': 'application/json',
      };
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.put(
        Uri.parse(urlApi),
        headers: headers,
        body: jsonEncode({
          'nombre': nombre,
          'apellido': apellido,
          'email': email,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Actualizamos localmente el objeto de usuario en el provider
        final updatedUser = user.copyWith(
          nombre: nombre,
          apellido: apellido,
          email: email,
        );
        authProvider.updateUsuario(updatedUser);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('¡Perfil actualizado con éxito!'),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
            ),
          );
          Navigator.pop(context);
        }
      } else {
        final errorMsg = jsonDecode(response.body)['message'] ?? 'Error desconocido en el servidor.';
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('No se pudo guardar: $errorMsg'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error de conexión: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2D5A27)),
                ),
              )
            : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Fila de encabezado con botón de atrás estilizado
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.pop(context),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.04),
                                  blurRadius: 16,
                                  offset: const Offset(0, 8),
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.arrow_back_ios_new_rounded,
                              color: Color(0xFF2D5A27),
                              size: 20,
                            ),
                          ),
                        ),
                        const Expanded(
                          child: Text(
                            'Editar Perfil',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF1F3D24),
                            ),
                          ),
                        ),
                        // Espaciador para centrar el título
                        const SizedBox(width: 44),
                      ],
                    ),
                    AppSpaces.verticalLarge,

                    // Avatar y título de bienvenida
                    Center(
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 46,
                            backgroundColor: const Color(0xFFE7F3DE),
                            child: const Icon(
                              Icons.person_rounded,
                              color: Color(0xFF3D7B2C),
                              size: 50,
                            ),
                          ),
                          AppSpaces.verticalSmall,
                          const Text(
                            'Información Personal',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1F3D24),
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Mantén tus datos actualizados para tus envíos',
                            style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                          ),
                        ],
                      ),
                    ),
                    AppSpaces.verticalLarge,

                    // Formulario de edición
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(32),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 20,
                            offset: const Offset(0, 10),
                          ),
                        ],
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            CustomTextField(
                              label: 'Nombre',
                              icon: Icons.person_outline_rounded,
                              controller: _nombreController,
                            ),
                            AppSpaces.verticalMedium,
                            CustomTextField(
                              label: 'Apellido',
                              icon: Icons.person_outline_rounded,
                              controller: _apellidoController,
                            ),
                            AppSpaces.verticalMedium,
                            CustomTextField(
                              label: 'Correo Electrónico',
                              icon: Icons.email_outlined,
                              keyboardType: TextInputType.emailAddress,
                              controller: _emailController,
                            ),
                            AppSpaces.verticalinter,
                            CustomButton(
                              text: 'Guardar Cambios',
                              onPressed: _saveProfile,
                              backgroundColor: const Color(0xFF2D5A27),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
