// lib/Features/cotizacion/CotizacionScreen.dart
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:gramas_y_suministros_movil/Providers/cart_provider.dart';
import 'package:gramas_y_suministros_movil/core/network/cotizacion_service.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-Sizedbox.dart';
import 'package:gramas_y_suministros_movil/Features/cotizacion/MisCotizacionesScreen.dart';
import 'package:gramas_y_suministros_movil/models/tarjeta.model.dart';

class CotizacionScreen extends StatefulWidget {
  final String? token;
  const CotizacionScreen({super.key, this.token});

  @override
  State<CotizacionScreen> createState() => _CotizacionScreenState();
}

class _CotizacionScreenState extends State<CotizacionScreen> {
  final CotizacionService _cotizacionService = CotizacionService();
  bool _isLoading = false;
  String _metodoVenta = 'fisico';
  String _metodoPago = 'efectivo';
  final TextEditingController _direccionController = TextEditingController();

  final TextEditingController _numeroController = TextEditingController();
  final TextEditingController _nombreController = TextEditingController();
  final TextEditingController _expiracionController = TextEditingController();
  final TextEditingController _cvvController = TextEditingController();

  Map<String, dynamic>? _resultado;

  @override
  void dispose() {
    _direccionController.dispose();
    _numeroController.dispose();
    _nombreController.dispose();
    _expiracionController.dispose();
    _cvvController.dispose();
    super.dispose();
  }

  bool _validarTarjeta() {
    if (_metodoVenta == 'fisico') return true;

    final tarjeta = Tarjeta(
      numero: _numeroController.text,
      nombre: _nombreController.text,
      expiracion: _expiracionController.text,
      cvv: _cvvController.text,
    );

    if (!tarjeta.esValida) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor, completa todos los datos de la tarjeta correctamente.'),
          backgroundColor: Colors.orange,
        ),
      );
      return false;
    }
    return true;
  }

  Future<void> _saveAndSharePDF(Uint8List pdfBytes, int cotizacionId) async {
    try {
      final directory = await getApplicationDocumentsDirectory();
      final filePath = '${directory.path}/cotizacion_$cotizacionId.pdf';
      final file = File(filePath);
      await file.writeAsBytes(pdfBytes);

      final xfile = XFile(filePath);
      
      await Share.shareXFiles(
        [xfile],
        text: 'Cotización #$cotizacionId - Gramas y Suministros',
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ PDF compartido correctamente'),
            backgroundColor: Color(0xFF2D5A27),
            duration: Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al compartir PDF: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _crearCotizacion() async {
    final cartProvider = Provider.of<CartProvider>(context, listen: false);

    // ✅ USAR EL TOKEN DEL WIDGET
    final String? token = widget.token;

    print('🔍 Token en CotizacionScreen: ${token != null ? "✅ Sí" : "❌ No"}');

    if (token == null) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('No hay sesión activa. Inicia sesión nuevamente.'),
            backgroundColor: Colors.red,
          ),
        );
      }
      return;
    }

    if (cartProvider.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('El carrito está vacío')),
      );
      return;
    }

    if (_metodoVenta == 'envio' && _direccionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Ingresa una dirección de envío')),
      );
      return;
    }

    if (_metodoVenta == 'envio' && !_validarTarjeta()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final items = cartProvider.items.map((item) => {
        'idProducto': int.parse(item.producto.id),
        'cantidad': item.cantidad,
      }).toList();

      print('🔍 Items a enviar: $items');

      final cotizacion = await _cotizacionService.crearCotizacion(
        token: token,
        metodoVenta: _metodoVenta,
        metodoPago: _metodoPago,
        direccionEnvio: _metodoVenta == 'envio' ? _direccionController.text.trim() : null,
        items: items,
      );
      
      print('✅ Cotización creada: #${cotizacion.idCotizacion}');

      String mensajeExito = '¡Cotización creada exitosamente!';
      String estadoFinal = 'pendiente';
      String mensajeAdicional = '';

      if (_metodoVenta == 'envio') {
        await Future.delayed(const Duration(seconds: 2));

        await _cotizacionService.simularPago(
          token: token,
          idCotizacion: cotizacion.idCotizacion,
        );
        print('✅ Pago simulado');
        
        mensajeExito = '✅ ¡Pago procesado exitosamente!';
        estadoFinal = 'pagado';
        mensajeAdicional = 'El pago ha sido procesado correctamente. Recibirás tu pedido en 3-7 días hábiles.';
      } else {
        mensajeAdicional = 'Lleve este recibo al punto físico de la empresa para completar tu compra.';
      }

      print('🔍 Descargando PDF...');
      final pdfResponse = await _cotizacionService.descargarPDF(
        token: token,
        idCotizacion: cotizacion.idCotizacion,
      );
      print('✅ PDF descargado: ${pdfResponse.bodyBytes.length} bytes');

      await _saveAndSharePDF(pdfResponse.bodyBytes, cotizacion.idCotizacion);
      print('✅ PDF compartido');

      cartProvider.clearCart();
      print('✅ Carrito limpiado');

      _resultado = {
        'id': cotizacion.idCotizacion,
        'total': cotizacion.total,
        'estado': estadoFinal,
        'mensaje': mensajeExito,
        'mensajeAdicional': mensajeAdicional,
        'metodoVenta': _metodoVenta,
      };

      setState(() {});

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => AlertDialog(
            title: Text(estadoFinal == 'pagado' ? '✅ Pago exitoso' : '✅ Cotización creada'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Cotización #${cotizacion.idCotizacion}'),
                const SizedBox(height: 8),
                Text('Total: \$${cotizacion.total.toStringAsFixed(2)}'),
                const SizedBox(height: 8),
                Text(
                  'Estado: ${estadoFinal == 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}',
                  style: TextStyle(
                    color: estadoFinal == 'pagado' ? Colors.green : Colors.orange,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(mensajeAdicional),
                const SizedBox(height: 8),
                const Text('El PDF se ha compartido correctamente.'),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () {
                  Navigator.pop(context);
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => MisCotizacionesScreen(token: token),
                    ),
                  );
                },
                child: const Text('Ver mis cotizaciones'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      print('❌ Error en _crearCotizacion: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);
    final double subtotal = cartProvider.subtotal;
    final double costoEnvio = _metodoVenta == 'envio' ? 8000 : 0;
    final double total = subtotal + costoEnvio;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF2D5A27)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Confirmar Cotización',
          style: TextStyle(
            color: Color(0xFF1F3D24),
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2D5A27)),
                  ),
                  SizedBox(height: 16),
                  Text('Procesando cotización...'),
                ],
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _buildProductList(cartProvider),
                  AppSpaces.verticalLarge,
                  _buildForm(),
                  AppSpaces.verticalLarge,
                  _buildSummary(subtotal, costoEnvio, total),
                  AppSpaces.verticalLarge,
                  _buildConfirmButton(),
                ],
              ),
            ),
    );
  }

  Widget _buildProductList(CartProvider cartProvider) {
    return Container(
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
          const Text(
            'Productos',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              color: Color(0xFF1F3D24),
            ),
          ),
          const SizedBox(height: 8),
          ...cartProvider.items.map((item) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    '${item.cantidad}x ${item.producto.title}',
                    style: const TextStyle(fontSize: 13),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  '\$${(item.producto.price * item.cantidad).toStringAsFixed(2)}',
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildForm() {
    return Container(
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
          const Text(
            'Datos de la cotización',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              color: Color(0xFF1F3D24),
            ),
          ),
          const SizedBox(height: 16),

          const Text(
            'Método de venta',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _buildOptionChip(
                  label: '📍 Punto físico',
                  value: 'fisico',
                  groupValue: _metodoVenta,
                  onChanged: (value) {
                    setState(() {
                      _metodoVenta = value!;
                      if (_metodoVenta == 'fisico') {
                        _metodoPago = 'efectivo';
                        _direccionController.clear();
                        _numeroController.clear();
                        _nombreController.clear();
                        _expiracionController.clear();
                        _cvvController.clear();
                      }
                    });
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _buildOptionChip(
                  label: '🚚 Envío a domicilio',
                  value: 'envio',
                  groupValue: _metodoVenta,
                  onChanged: (value) {
                    setState(() {
                      _metodoVenta = value!;
                      if (_metodoVenta == 'envio') {
                        _metodoPago = 'tarjeta_debito';
                      }
                    });
                  },
                ),
              ),
            ],
          ),

          if (_metodoVenta == 'envio') ...[
            const SizedBox(height: 12),
            TextFormField(
              controller: _direccionController,
              decoration: InputDecoration(
                hintText: 'Dirección de envío',
                prefixIcon: const Icon(Icons.location_on_outlined, color: Color(0xFF6B7280)),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFF2D5A27)),
                ),
              ),
            ),
          ],

          const SizedBox(height: 16),

          const Text(
            'Método de pago',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: [
              if (_metodoVenta == 'fisico')
                _buildOptionChip(
                  label: '💵 Efectivo',
                  value: 'efectivo',
                  groupValue: _metodoPago,
                  onChanged: (value) => setState(() => _metodoPago = value!),
                ),
              if (_metodoVenta == 'envio') ...[
                _buildOptionChip(
                  label: '💳 Tarjeta débito',
                  value: 'tarjeta_debito',
                  groupValue: _metodoPago,
                  onChanged: (value) => setState(() => _metodoPago = value!),
                ),
                _buildOptionChip(
                  label: '💳 Tarjeta crédito',
                  value: 'tarjeta_credito',
                  groupValue: _metodoPago,
                  onChanged: (value) => setState(() => _metodoPago = value!),
                ),
              ],
            ],
          ),

          if (_metodoVenta == 'envio') ...[
            const SizedBox(height: 16),
            _buildTarjetaForm(),
          ],
        ],
      ),
    );
  }

  Widget _buildTarjetaForm() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FA),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE8F5E9), width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '💳 Datos de la tarjeta',
            style: TextStyle(
              fontWeight: FontWeight.w700,
              fontSize: 16,
              color: Color(0xFF2D5A27),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Ingresa los datos de tu tarjeta para procesar el pago',
            style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
          ),
          const SizedBox(height: 12),

          TextFormField(
            controller: _numeroController,
            keyboardType: TextInputType.number,
            maxLength: 19,
            decoration: InputDecoration(
              labelText: 'Número de tarjeta',
              hintText: '1234 5678 9012 3456',
              prefixIcon: const Icon(Icons.credit_card, color: Color(0xFF6B7280)),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFF2D5A27)),
              ),
              counterText: '',
            ),
            onChanged: (value) {
              final cleaned = value.replaceAll(' ', '');
              final formatted = cleaned.replaceAllMapped(
                RegExp(r'.{4}'),
                (match) => '${match.group(0)} ',
              );
              if (formatted != value) {
                _numeroController.value = TextEditingValue(
                  text: formatted.trim(),
                  selection: TextSelection.collapsed(offset: formatted.trim().length),
                );
              }
            },
          ),
          const SizedBox(height: 8),

          TextFormField(
            controller: _nombreController,
            textCapitalization: TextCapitalization.characters,
            decoration: InputDecoration(
              labelText: 'Nombre del titular',
              hintText: 'Como aparece en la tarjeta',
              prefixIcon: const Icon(Icons.person, color: Color(0xFF6B7280)),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFF2D5A27)),
              ),
            ),
          ),
          const SizedBox(height: 8),

          Row(
            children: [
              Expanded(
                child: TextFormField(
                  controller: _expiracionController,
                  keyboardType: TextInputType.number,
                  maxLength: 5,
                  decoration: InputDecoration(
                    labelText: 'Fecha expiración',
                    hintText: 'MM/AA',
                    prefixIcon: const Icon(Icons.calendar_today, color: Color(0xFF6B7280), size: 18),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF2D5A27)),
                    ),
                    counterText: '',
                  ),
                  onChanged: (value) {
                    final cleaned = value.replaceAll('/', '');
                    if (cleaned.length >= 2) {
                      final formatted = '${cleaned.substring(0, 2)}/${cleaned.substring(2)}';
                      if (formatted != value) {
                        _expiracionController.value = TextEditingValue(
                          text: formatted,
                          selection: TextSelection.collapsed(offset: formatted.length),
                        );
                      }
                    }
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: TextFormField(
                  controller: _cvvController,
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  obscureText: true,
                  decoration: InputDecoration(
                    labelText: 'CVV',
                    hintText: '123',
                    prefixIcon: const Icon(Icons.lock_outline, color: Color(0xFF6B7280), size: 18),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF2D5A27)),
                    ),
                    counterText: '',
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFE0E0E0)),
            ),
            child: const Row(
              children: [
                Icon(Icons.security, size: 16, color: Color(0xFF6B7280)),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '🔒 El pago es 100% seguro. Solo se simulará la transacción.',
                    style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOptionChip({
    required String label,
    required String value,
    required String groupValue,
    required Function(String?) onChanged,
  }) {
    final isSelected = groupValue == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) => onChanged(selected ? value : null),
      backgroundColor: const Color(0xFFF5F8F2),
      selectedColor: const Color(0xFFE8F7E5),
      checkmarkColor: const Color(0xFF2D5A27),
      labelStyle: TextStyle(
        color: isSelected ? const Color(0xFF2D5A27) : const Color(0xFF4B5563),
        fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
      ),
    );
  }

  Widget _buildSummary(double subtotal, double costoEnvio, double total) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFE8F7E5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Subtotal', style: TextStyle(fontSize: 14, color: Color(0xFF4B5563))),
              Text('\$${subtotal.toStringAsFixed(2)}', style: const TextStyle(fontSize: 14)),
            ],
          ),
          if (costoEnvio > 0) ...[
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Envío', style: TextStyle(fontSize: 14, color: Color(0xFF4B5563))),
                Text('\$${costoEnvio.toStringAsFixed(2)}', style: const TextStyle(fontSize: 14)),
              ],
            ),
          ],
          const Divider(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1F3D24),
                ),
              ),
              Text(
                '\$${total.toStringAsFixed(2)}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF2D5A27),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: _crearCotizacion,
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF2D5A27),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
        child: Text(
          _metodoVenta == 'envio'
              ? 'Pagar con tarjeta y descargar PDF'
              : 'Confirmar cotización y descargar PDF',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}