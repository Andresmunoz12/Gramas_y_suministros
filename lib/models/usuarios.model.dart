class Usuario {
  final int idUsuario;
  final String nombre;
  final String apellido;
  final String email;
  final int idRol;
  final String? token; // Para guardar el JWT que te devuelva NestJS

  Usuario({
    required this.idUsuario,
    required this.nombre,
    required this.apellido,
    required this.email,
    required this.idRol,
    this.token,
  });

  // Factory Traductor
  factory Usuario.fromJson(Map<String, dynamic> json) {
    final data = json['user'] is Map<String, dynamic> ? json['user'] as Map<String, dynamic> : json;
    return Usuario(
      idUsuario: data['id_usuario'] ?? data['id'] ?? 0,
      nombre: data['nombre'] ?? '',
      apellido: data['apellido'] ?? '',
      email: data['email'] ?? '',
      idRol: data['id_rol'] ?? data['idRol'] ?? data['rol'] ?? 2,
      token: json['access_token'] ?? json['token'] ?? data['access_token'] ?? data['token'],
    );
  }

  Usuario copyWith({
    int? idUsuario,
    String? nombre,
    String? apellido,
    String? email,
    int? idRol,
    String? token,
  }) {
    return Usuario(
      idUsuario: idUsuario ?? this.idUsuario,
      nombre: nombre ?? this.nombre,
      apellido: apellido ?? this.apellido,
      email: email ?? this.email,
      idRol: idRol ?? this.idRol,
      token: token ?? this.token,
    );
  }
}