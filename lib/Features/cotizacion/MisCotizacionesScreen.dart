// lib/Features/cotizacion/MisCotizacionesScreen.dart
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:gramas_y_suministros_movil/providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/core/network/cotizacion_service.dart';
import 'package:gramas_y_suministros_movil/models/cotizacion.model.dart';
import 'package:gramas_y_suministros_movil/shared/Custom-Sizedbox.dart';

class MisCotizacionesScreen extends StatefulWidget {
  final String? token; // ✅ Recibir token como parámetro
  const MisCotizacionesScreen({super.key, this.token});

  @override
  State<MisCotizacionesScreen> createState() => _MisCotizacionesScreenState();
}

class _MisCotizacionesScreenState extends State<MisCotizacionesScreen> {
  final CotizacionService _cotizacionService = CotizacionService();
  List<Cotizacion> _cotizaciones = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _cargarCotizaciones();
  }

  Future<void> _cargarCotizaciones() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // ✅ Usar el token recibido como parámetro
      String? token = widget.token;

      // Si no hay token, intentar obtenerlo del provider
      if (token == null) {
        try {
          final authProvider = Provider.of<AuthProvider>(context, listen: false);
          token = authProvider.usuario?.token ?? await authProvider.getSavedToken();
        } catch (e) {
          throw Exception('No se pudo obtener el token de autenticación');
        }
      }

      if (token == null) {
        throw Exception('No hay sesión activa');
      }

      final cotizaciones = await _cotizacionService.obtenerMisCotizaciones(token);
      setState(() {
        _cotizaciones = cotizaciones;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _descargarPDF(Cotizacion cotizacion) async {
    try {
      // ✅ Usar el token recibido como parámetro
      String? token = widget.token;

      if (token == null) {
        try {
          final authProvider = Provider.of<AuthProvider>(context, listen: false);
          token = authProvider.usuario?.token ?? await authProvider.getSavedToken();
        } catch (e) {
          throw Exception('No se pudo obtener el token de autenticación');
        }
      }

      if (token == null) {
        throw Exception('No hay sesión activa');
      }

      final response = await _cotizacionService.descargarPDF(
        token: token,
        idCotizacion: cotizacion.idCotizacion,
      );

      final directory = await getApplicationDocumentsDirectory();
      final filePath = '${directory.path}/cotizacion_${cotizacion.idCotizacion}.pdf';
      final file = File(filePath);
      await file.writeAsBytes(response.bodyBytes);

      await Share.shareXFiles(
        [XFile(filePath)],
        text: 'Cotización #${cotizacion.idCotizacion} - Gramas y Suministros',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ PDF compartido correctamente'),
            backgroundColor: Color(0xFF2D5A27),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al descargar PDF: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          'Mis Cotizaciones',
          style: TextStyle(
            color: Color(0xFF1F3D24),
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2D5A27)),
            ),
            SizedBox(height: 16),
            Text('Cargando cotizaciones...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.grey[400],
            ),
            AppSpaces.verticalMedium,
            Text(
              'Error al cargar cotizaciones',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F3D24),
              ),
            ),
            AppSpaces.verticalSmall,
            Text(
              _error!,
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            AppSpaces.verticalMedium,
            ElevatedButton(
              onPressed: _cargarCotizaciones,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2D5A27),
                foregroundColor: Colors.white,
              ),
              child: const Text('Reintentar'),
            ),
          ],
        ),
      );
    }

    if (_cotizaciones.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: const Color(0xFFE8F7E5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.receipt_long_outlined,
                size: 50,
                color: Color(0xFF3D7B2C),
              ),
            ),
            AppSpaces.verticalMedium,
            const Text(
              'No tienes cotizaciones',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1F3D24),
              ),
            ),
            AppSpaces.verticalSmall,
            const Text(
              'Tus cotizaciones aparecerán aquí una vez las generes.',
              style: TextStyle(color: Color(0xFF6B7280)),
            ),
            AppSpaces.verticalLarge,
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2D5A27),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Ir al Catálogo'),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _cotizaciones.length,
      itemBuilder: (context, index) {
        final cotizacion = _cotizaciones[index];
        return _CotizacionCard(
          cotizacion: cotizacion,
          onDownload: () => _descargarPDF(cotizacion),
        );
      },
    );
  }
}

class _CotizacionCard extends StatelessWidget {
  final Cotizacion cotizacion;
  final VoidCallback onDownload;

  const _CotizacionCard({
    required this.cotizacion,
    required this.onDownload,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '#${cotizacion.idCotizacion}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF2D5A27),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: cotizacion.estadoColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  cotizacion.estadoLabel,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: cotizacion.estadoColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 14, color: Color(0xFF6B7280)),
              const SizedBox(width: 4),
              Text(
                _formatDate(cotizacion.fechaCreacion),
                style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.shopping_bag_outlined, size: 14, color: Color(0xFF6B7280)),
              const SizedBox(width: 4),
              Text(
                '${cotizacion.detalles?.length ?? 0} productos',
                style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.payments_outlined, size: 14, color: Color(0xFF6B7280)),
              const SizedBox(width: 4),
              Text(
                cotizacion.metodoPagoLabel,
                style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
              ),
            ],
          ),
          const Divider(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Total: \$${cotizacion.total.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF2D5A27),
                ),
              ),
              Row(
                children: [
                  if (cotizacion.estado == 'pendiente')
                    TextButton(
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (context) => AlertDialog(
                            title: const Text('Simular pago'),
                            content: const Text('¿Quieres simular el pago de esta cotización?'),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context),
                                child: const Text('Cancelar'),
                              ),
                              TextButton(
                                onPressed: () {
                                  Navigator.pop(context);
                                  // Implementar simulación de pago
                                },
                                child: const Text('Pagar'),
                              ),
                            ],
                          ),
                        );
                      },
                      child: const Text(
                        'Pagar',
                        style: TextStyle(color: Color(0xFF2D5A27), fontWeight: FontWeight.w600),
                      ),
                    ),
                  IconButton(
                    icon: const Icon(Icons.download_outlined, color: Color(0xFF2D5A27)),
                    onPressed: onDownload,
                    tooltip: 'Descargar PDF',
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}