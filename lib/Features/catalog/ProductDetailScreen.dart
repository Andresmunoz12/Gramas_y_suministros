import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:gramas_y_suministros_movil/models/producto.model.dart';
import 'package:gramas_y_suministros_movil/Providers/cart_provider.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/Features/cart/CartScreen.dart';

class ProductDetailScreen extends StatefulWidget {
  final Producto product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int quantity = 1;

  @override
  Widget build(BuildContext context) {
    final product = widget.product;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Botón Regresar
              ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(Icons.arrow_back, size: 16, color: Colors.black87),
                label: const Text('Regresar', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.w600)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  elevation: 1,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                ),
              ),
              const SizedBox(height: 20),

              // Tarjeta contenedora principal de detalle
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                padding: const EdgeInsets.all(20),
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final isWide = constraints.maxWidth > 600;
                    if (isWide) {
                      return Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(flex: 1, child: _buildImageSection(product)),
                          const SizedBox(width: 24),
                          Expanded(flex: 1, child: _buildInfoSection(context, product)),
                        ],
                      );
                    } else {
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildImageSection(product),
                          const SizedBox(height: 20),
                          _buildInfoSection(context, product),
                        ],
                      );
                    }
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildImageSection(Producto product) {
    return Container(
      height: 280,
      width: double.infinity,
      decoration: BoxDecoration(
        color: product.color,
        borderRadius: BorderRadius.circular(20),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: product.imageUrl != null && product.imageUrl!.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: product.imageUrl!,
                fit: BoxFit.cover,
                width: double.infinity,
                placeholder: (context, url) => Center(
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(product.accentColor),
                  ),
                ),
                errorWidget: (context, url, error) => Center(
                  child: Icon(Icons.grass, size: 64, color: product.accentColor),
                ),
              )
            : Center(
                child: Icon(Icons.grass, size: 64, color: product.accentColor),
              ),
      ),
    );
  }

  Widget _buildInfoSection(BuildContext context, Producto product) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Badge de categoría
        if (product.categoryName != null && product.categoryName!.isNotEmpty)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFE8F7E4),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Text(
              product.categoryName!,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Color(0xFF2D5A27),
              ),
            ),
          ),
        const SizedBox(height: 12),

        // Título
        Text(
          product.title,
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1F3D24),
          ),
        ),
        const SizedBox(height: 16),

        // Grilla de especificaciones clave (Marca, Material, Peso, Altura)
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            _buildSpecChip('Marca', product.brand ?? 'GreenTurf'),
            _buildSpecChip('Material', product.material ?? 'Polietileno (PE)'),
            _buildSpecChip('Peso', product.peso ?? '2.750 kg'),
            _buildSpecChip('Altura', product.altura ?? '50.00 mm'),
          ],
        ),
        const SizedBox(height: 12),

        // Badge de Stock disponible
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFFE8F7E4),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Text(
            'Stock disponible: ${product.stock} unidades',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: Color(0xFF2D5A27),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Descripción con borde verde lateral
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF9FAFB),
            borderRadius: BorderRadius.circular(12),
            border: const Border(
              left: BorderSide(color: Color(0xFF2D5A27), width: 4),
            ),
          ),
          child: Text(
            product.description ?? product.subtitle,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF4B5563),
              height: 1.4,
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Cantidad a cotizar
        Row(
          children: [
            const Text(
              'Cantidad a cotizar: ',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1F3D24),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              decoration: BoxDecoration(
                border: Border.all(color: const Color(0xFFD1D5DB)),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    icon: const Icon(Icons.remove, size: 16),
                    onPressed: quantity > 1
                        ? () {
                            setState(() {
                              quantity--;
                            });
                          }
                        : null,
                  ),
                  Text(
                    '$quantity',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    visualDensity: VisualDensity.compact,
                    icon: const Icon(Icons.add, size: 16),
                    onPressed: () {
                      setState(() {
                        quantity++;
                      });
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // Precio y Botón Agregar a cotización
        Row(
          children: [
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                product.formattedPrice,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1F3D24),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  final cartProvider = Provider.of<CartProvider>(context, listen: false);
                  for (int i = 0; i < quantity; i++) {
                    cartProvider.addProduct(product);
                  }
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('✅ $quantity x ${product.title} agregado a la cotización'),
                      duration: const Duration(seconds: 2),
                      backgroundColor: const Color(0xFF2D5A27),
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      action: SnackBarAction(
                        label: 'Ver cotización',
                        textColor: Colors.white,
                        onPressed: () async {
                          final authProvider = Provider.of<AuthProvider>(context, listen: false);
                          final String? token = authProvider.usuario?.token ?? await authProvider.getSavedToken();
                          if (context.mounted) {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => CartScreen(token: token),
                              ),
                            );
                          }
                        },
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.shopping_cart_outlined, size: 18),
                label: const FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    'Agregar a cotización',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2D5A27),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSpecChip(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0xFFF3F4F6),
        borderRadius: BorderRadius.circular(8),
      ),
      child: RichText(
        text: TextSpan(
          children: [
            TextSpan(
              text: '$label: ',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Color(0xFF2D5A27),
              ),
            ),
            TextSpan(
              text: value,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF374151),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
