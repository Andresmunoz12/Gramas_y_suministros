import 'package:equatable/equatable.dart';

/// Representa la entidad de un usuario en el dominio de la aplicación.
class User extends Equatable {
  final String id;
  final String email;
  final String? displayName;

  const User({
    required this.id,
    required this.email,
    this.displayName,
  });

  @override
  List<Object?> get props => [id, email, displayName];
}
