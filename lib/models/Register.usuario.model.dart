class RegisterUsuario {
  final String nombre;
  final String apellido;
  final String email;
  final String password_hash;

  RegisterUsuario({
    required this.nombre,
    required this.apellido,
    required this.email,
    required this.password_hash,
  });

  // Revisa que la "J" sea mayúscula y que el nombre de la clase coincida
  factory RegisterUsuario.fromJson(Map<String, dynamic> json) {
    return RegisterUsuario(
      nombre: json['nombre'] ?? '',
      apellido: json['apellido'] ?? '',
      email: json['email'] ?? '',
      password_hash: json['password_hash'] ?? '',
    );
  }
}