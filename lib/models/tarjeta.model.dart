// lib/models/tarjeta.model.dart
class Tarjeta {
  final String numero;
  final String nombre;
  final String expiracion;
  final String cvv;

  Tarjeta({
    required this.numero,
    required this.nombre,
    required this.expiracion,
    required this.cvv,
  });

  bool get esValida {
    final numeroLimpio = numero.replaceAll(' ', '');
    if (numeroLimpio.length < 16) return false;
    if (nombre.trim().length < 3) return false;
    if (expiracion.length < 5) return false;
    if (cvv.length < 3) return false;
    return true;
  }

  Tarjeta copyWith({
    String? numero,
    String? nombre,
    String? expiracion,
    String? cvv,
  }) {
    return Tarjeta(
      numero: numero ?? this.numero,
      nombre: nombre ?? this.nombre,
      expiracion: expiracion ?? this.expiracion,
      cvv: cvv ?? this.cvv,
    );
  }
}