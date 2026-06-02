import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../Providers/auth_provider.dart';
import '../../Providers/cart_provider.dart';
import '../../Shared/Custom-TextField.dart';
import '../../Shared/Custom-button.dart';
import '../../Shared/Custom-Sizedbox.dart';

class CheckoutDialog {
  static void show(BuildContext context, {required VoidCallback onOrderSuccess}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CheckoutForm(onOrderSuccess: onOrderSuccess),
    );
  }
}

class _CheckoutForm extends StatefulWidget {
  final VoidCallback onOrderSuccess;

  const _CheckoutForm({required this.onOrderSuccess});

  @override
  State<_CheckoutForm> createState() => _CheckoutFormState();
}

class _CheckoutFormState extends State<_CheckoutForm> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController nameController = TextEditingController();
  final TextEditingController addressController = TextEditingController();
  final TextEditingController phoneController = TextEditingController();
  String selectedPaymentMethod = 'Efectivo contra entrega';
  bool isSuccess = false;

  final List<String> paymentMethods = [
    'Efectivo contra entrega',
    'Tarjeta de Crédito / Débito',
    'Transferencia Bancaria',
  ];

  @override
  void initState() {
    super.initState();
    // Intentar rellenar el nombre si el usuario está logueado en AuthProvider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      if (authProvider.nombreUsuario.isNotEmpty) {
        nameController.text = authProvider.nombreUsuario;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    if (isSuccess) {
      return _buildSuccessView(context, cartProvider.totalAmount);
    }

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: EdgeInsets.only(
        top: 24,
        left: 24,
        right: 24,
        bottom: 24 + bottomInset,
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Barra indicadora de arrastre
              Center(
                child: Container(
                  width: 48,
                  height: 6,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE5E7EB),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
              ),
              AppSpaces.verticalMedium,
              const Text(
                'Finalizar Compra',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1F3D24),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                'Completa tus datos para procesar el pedido de ${cartProvider.totalItems} artículo(s).',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
              ),
              AppSpaces.verticalLarge,

              // Campo de Nombre
              CustomTextField(
                label: 'Nombre completo',
                icon: Icons.person_outline,
                controller: nameController,
              ),
              AppSpaces.verticalMedium,

              // Campo de Dirección
              CustomTextField(
                label: 'Dirección de entrega',
                icon: Icons.location_on_outlined,
                controller: addressController,
              ),
              AppSpaces.verticalMedium,

              // Campo de Teléfono
              CustomTextField(
                label: 'Teléfono de contacto',
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                controller: phoneController,
              ),
              AppSpaces.verticalMedium,

              // Selector de Método de Pago
              const Text(
                'Método de Pago',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1F3D24),
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF9FAFB),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFE5E7EB)),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: selectedPaymentMethod,
                    isExpanded: true,
                    icon: const Icon(Icons.keyboard_arrow_down, color: Color(0xFF3D7B2C)),
                    onChanged: (newValue) {
                      if (newValue != null) {
                        setState(() {
                          selectedPaymentMethod = newValue;
                        });
                      }
                    },
                    items: paymentMethods.map<DropdownMenuItem<String>>((String value) {
                      return DropdownMenuItem<String>(
                        value: value,
                        child: Text(
                          value,
                          style: const TextStyle(color: Color(0xFF1F3D24), fontSize: 15),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
              AppSpaces.verticalLarge,

              // Resumen de Montos
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFFF4F8F3),
                  borderRadius: BorderRadius.circular(22),
                  border: Border.all(color: const Color(0xFFE2EFE0)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total a pagar:',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1F3D24),
                      ),
                    ),
                    Text(
                      '\$${cartProvider.totalAmount.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF2D5A27),
                      ),
                    ),
                  ],
                ),
              ),
              AppSpaces.verticalLarge,

              // Botón de Confirmación
              CustomButton(
                text: 'Confirmar Pedido',
                onPressed: () {
                  if (nameController.text.trim().isEmpty ||
                      addressController.text.trim().isEmpty ||
                      phoneController.text.trim().isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Por favor completa todos los campos del formulario'),
                        backgroundColor: Colors.orange,
                      ),
                    );
                    return;
                  }

                  // Procesar compra exitosa
                  setState(() {
                    isSuccess = true;
                  });
                },
              ),
              AppSpaces.verticalSmall,
              TextButton(
                onPressed: () => Navigator.pop(context),
                style: TextButton.styleFrom(
                  foregroundColor: const Color(0xFF6B7280),
                ),
                child: const Text('Cancelar'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSuccessView(BuildContext context, double total) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Center(
            child: Icon(
              Icons.check_circle_rounded,
              color: Color(0xFF81D460),
              size: 100,
            ),
          ),
          AppSpaces.verticalMedium,
          const Text(
            '¡Pedido Realizado!',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1F3D24),
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'Hemos registrado tu compra por un valor total de \$${total.toStringAsFixed(2)} con el método "$selectedPaymentMethod".',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 15, color: Color(0xFF6B7280), height: 1.4),
          ),
          const SizedBox(height: 8),
          const Text(
            'Te enviaremos los productos a la dirección especificada y nos pondremos en contacto contigo pronto.',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, color: Color(0xFF9CA3AF), height: 1.4),
          ),
          AppSpaces.verticalLarge,
          CustomButton(
            text: 'Volver al Catálogo',
            onPressed: () {
              Navigator.pop(context); // Cerrar Modal
              widget.onOrderSuccess(); // Ejecutar callback (limpia carrito y vuelve al index 0)
            },
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    nameController.dispose();
    addressController.dispose();
    phoneController.dispose();
    super.dispose();
  }
}
