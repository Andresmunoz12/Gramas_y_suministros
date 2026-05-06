class Usuario {
  final int idUsuario;
  final String nombre;
  final String email;
  final String? token; // Para guardar el JWT que te devuelva NestJS

  Usuario({
    required this.idUsuario,
    required this.nombre,
    required this.email,
    this.token,
  });

  // Factory Traductor
  factory Usuario.fromJson(Map<String, dynamic> json) {
    return Usuario(
      idUsuario: json['id_usuario'] ?? 0,
      nombre: json['nombre'] ?? '',
      email: json['email'] ?? '',
      token: json['access_token'], // Ajusta según el nombre que use tu API
    );
  }
}