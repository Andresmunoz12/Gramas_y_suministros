  // lib/Features/cart/CartScreen.dart
  import 'package:flutter/material.dart';
  import 'package:provider/provider.dart';
  import 'package:gramas_y_suministros_movil/providers/auth_provider.dart';
  import 'package:gramas_y_suministros_movil/providers/cart_provider.dart';
  import 'package:gramas_y_suministros_movil/shared/Custom-Sizedbox.dart';
  import 'package:cached_network_image/cached_network_image.dart';
  import 'package:gramas_y_suministros_movil/Features/cotizacion/CotizacionScreen.dart';

  class CartScreen extends StatelessWidget {
    final String? token;
    const CartScreen({super.key, this.token});

    Future<String?> _getToken(BuildContext context) async {
      if (token != null) return token;
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      return authProvider.usuario?.token ?? await authProvider.getSavedToken();
    }

    @override
    Widget build(BuildContext context) {
      final cartProvider = Provider.of<CartProvider>(context);
      final cartItems = cartProvider.items;

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
            'Mi Carrito',
            style: TextStyle(
              color: Color(0xFF1F3D24),
              fontWeight: FontWeight.w800,
              fontSize: 20,
            ),
          ),
          centerTitle: true,
          actions: [
            if (cartItems.isNotEmpty)
              TextButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      title: const Text('Vaciar carrito'),
                      content: const Text('¿Estás seguro de que quieres vaciar el carrito?'),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Cancelar'),
                        ),
                        TextButton(
                          onPressed: () {
                            cartProvider.clearCart();
                            Navigator.pop(context);
                          },
                          child: const Text('Vaciar', style: TextStyle(color: Colors.red)),
                        ),
                      ],
                    ),
                  );
                },
                child: const Text(
                  'Vaciar',
                  style: TextStyle(color: Colors.red, fontWeight: FontWeight.w600),
                ),
              ),
          ],
        ),
        body: cartItems.isEmpty
            ? _buildEmptyCart(context)
            : _buildCartContent(context, cartProvider),
      );
    }

    Widget _buildEmptyCart(BuildContext context) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: const Color(0xFFE8F7E5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.shopping_cart_outlined,
                size: 60,
                color: Color(0xFF3D7B2C),
              ),
            ),
            AppSpaces.verticalMedium,
            const Text(
              'Tu carrito está vacío',
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1F3D24),
              ),
            ),
            AppSpaces.verticalSmall,
            const Text(
              'Explora nuestro catálogo y agrega tus productos favoritos.',
              style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
              textAlign: TextAlign.center,
            ),
            AppSpaces.verticalLarge,
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2D5A27),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Ir al Catálogo'),
            ),
          ],
        ),
      );
    }

    Widget _buildCartContent(BuildContext context, CartProvider cartProvider) {
      return Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: cartProvider.items.length,
              itemBuilder: (context, index) {
                final item = cartProvider.items[index];
                return _CartItemCard(
                  item: item,
                  onRemove: () => cartProvider.removeProduct(item.producto.id),
                  onQuantityChanged: (newQuantity) {
                    cartProvider.updateQuantity(item.producto.id, newQuantity);
                  },
                );
              },
            ),
          ),
          _buildCartSummary(context, cartProvider),
        ],
      );
    }

    Widget _buildCartSummary(BuildContext context, CartProvider cartProvider) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 20,
              offset: const Offset(0, -8),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Subtotal',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF4B5563),
                  ),
                ),
                Text(
                  '\$${cartProvider.subtotal.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF2D5A27),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Envío',
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF6B7280),
                  ),
                ),
                const Text(
                  'A calcular',
                  style: TextStyle(
                    fontSize: 14,
                    color: Color(0xFF6B7280),
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Total',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1F3D24),
                  ),
                ),
                Text(
                  '\$${cartProvider.subtotal.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF2D5A27),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final activeToken = await _getToken(context);
                  if (activeToken == null) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('No hay sesión activa. Inicia sesión nuevamente.'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                    return;
                  }
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CotizacionScreen(token: activeToken),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2D5A27),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text(
                  'Continuar con la cotización',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      );
    }
  }

  class _CartItemCard extends StatelessWidget {
    final CartItem item;
    final VoidCallback onRemove;
    final Function(int) onQuantityChanged;

    const _CartItemCard({
      required this.item,
      required this.onRemove,
      required this.onQuantityChanged,
    });

    @override
    Widget build(BuildContext context) {
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
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
        child: Row(
          children: [
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                color: const Color(0xFFE8F7E5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: item.producto.imageUrl != null
                  ? ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: CachedNetworkImage(
                        imageUrl: item.producto.imageUrl!,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const Center(
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        errorWidget: (context, url, error) => const Icon(
                          Icons.grass,
                          color: Color(0xFF3D7B2C),
                        ),
                      ),
                    )
                  : const Icon(Icons.grass, color: Color(0xFF3D7B2C)),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.producto.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: Color(0xFF1F3D24),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.producto.formattedPrice,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                      color: Color(0xFF2D5A27),
                    ),
                  ),
                ],
              ),
            ),
            Column(
              children: [
                Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.remove_circle_outline, size: 24),
                      color: const Color(0xFF6B7280),
                      onPressed: () {
                        onQuantityChanged(item.cantidad - 1);
                      },
                    ),
                    Text(
                      item.cantidad.toString(),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                        color: Color(0xFF1F3D24),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline, size: 24),
                      color: const Color(0xFF2D5A27),
                      onPressed: () {
                        onQuantityChanged(item.cantidad + 1);
                      },
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, size: 20),
                  color: Colors.red,
                  onPressed: onRemove,
                ),
              ],
            ),
          ],
        ),
      );
    }
  }