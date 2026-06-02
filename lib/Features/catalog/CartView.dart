import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../Providers/cart_provider.dart';
import '../../Shared/Custom-Sizedbox.dart';
import '../../Shared/Custom-button.dart';
import 'CheckoutDialog.dart';

class CartView extends StatelessWidget {
  final VoidCallback onGoToCatalog;

  const CartView({
    super.key,
    required this.onGoToCatalog,
  });

  @override
  Widget build(BuildContext context) {
    final cartProvider = Provider.of<CartProvider>(context);
    final itemsList = cartProvider.items.values.toList();

    if (cartProvider.items.isEmpty) {
      return _buildEmptyCart(context);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Cabecera de la vista
        const Text(
          'Tu Carrito',
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1F3D24),
          ),
        ),
        AppSpaces.verticalSmall,
        Text(
          'Tienes ${cartProvider.totalItems} artículos en tu carrito.',
          style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
        ),
        AppSpaces.verticalMedium,

        // Lista de artículos
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: itemsList.length,
            separatorBuilder: (context, index) => const SizedBox(height: 16),
            itemBuilder: (context, index) {
              final cartItem = itemsList[index];
              final product = cartItem.producto;
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 18,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    // Miniatura decorativa del producto
                    Container(
                      width: 76,
                      height: 76,
                      decoration: BoxDecoration(
                        color: product.color,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Center(
                        child: Icon(
                          Icons.grass,
                          color: product.accentColor,
                          size: 32,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),

                    // Detalles del producto
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            product.title,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF1F3D24),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Precio: ${product.formattedPrice} ${product.unit}',
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF6B7280),
                            ),
                          ),
                          const SizedBox(height: 8),

                          // Controles de cantidad
                          Row(
                            children: [
                              GestureDetector(
                                onTap: () => cartProvider.decreaseQuantity(product),
                                child: Container(
                                  width: 28,
                                  height: 28,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF3F4F6),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.remove, size: 16, color: Color(0xFF4B5563)),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 14),
                                child: Text(
                                  '${cartItem.cantidad}',
                                  style: const TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                    color: Color(0xFF1F3D24),
                                  ),
                                ),
                              ),
                              GestureDetector(
                                onTap: () => cartProvider.addToCart(product),
                                child: Container(
                                  width: 28,
                                  height: 28,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE8F7E4),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.add, size: 16, color: Color(0xFF2D5A27)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    // Botón de eliminar e importe total
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        IconButton(
                          onPressed: () => cartProvider.removeFromCart(product),
                          icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 22),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                        ),
                        const SizedBox(height: 18),
                        Text(
                          '\$${cartItem.total.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1F3D24),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),

        // Resumen Financiero
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
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
                  const Text('Subtotal', style: TextStyle(color: Color(0xFF6B7280))),
                  Text('\$${cartProvider.totalAmount.toStringAsFixed(2)}',
                      style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1F3D24))),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: const [
                  Text('Envío', style: TextStyle(color: Color(0xFF6B7280))),
                  Text('Gratis', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.green)),
                ],
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Divider(color: Color(0xFFE5E7EB)),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Total',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1F3D24)),
                  ),
                  Text(
                    '\$${cartProvider.totalAmount.toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF2D5A27),
                    ),
                  ),
                ],
              ),
              AppSpaces.verticalMedium,
              CustomButton(
                text: 'Finalizar Compra',
                onPressed: () {
                  CheckoutDialog.show(
                    context,
                    onOrderSuccess: () {
                      cartProvider.clearCart();
                      onGoToCatalog(); // Regresa al catálogo tras compra exitosa
                    },
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyCart(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: const BoxDecoration(
                color: Color(0xFFE7F3DE),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(
                  Icons.shopping_cart_outlined,
                  color: Color(0xFF3D7B2C),
                  size: 54,
                ),
              ),
            ),
            AppSpaces.verticalLarge,
            const Text(
              'Tu carrito está vacío',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1F3D24),
              ),
            ),
            AppSpaces.verticalSmall,
            const Text(
              'Explora nuestro catálogo para encontrar la grama e insumos que tu jardín necesita.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: Color(0xFF6B7280),
                height: 1.4,
              ),
            ),
            AppSpaces.verticalLarge,
            SizedBox(
              width: 200,
              child: CustomButton(
                text: 'Explorar Catálogo',
                onPressed: onGoToCatalog,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
