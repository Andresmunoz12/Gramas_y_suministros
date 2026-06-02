import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-Sizedbox.dart';
import 'package:gramas_y_suministros_movil/models/producto.model.dart';
import 'package:gramas_y_suministros_movil/Providers/cart_provider.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/Features/auth-login/Login_Screen.dart';
import 'CartView.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  final List<String> categories = ['Todas', 'Deportiva', 'Residencial', 'Comercial'];
  int selectedCategory = 0;
  int selectedTabIndex = 0;

  final List<Producto> products = const [
    Producto(
      id: 'prod_deportiva',
      title: 'Grama Deportiva',
      subtitle: 'Ideal para canchas de alto tráfico.',
      price: 12.50,
      unit: '/m²',
      color: Color(0xFFE8F7E5),
      accentColor: Color(0xFF3D7B2C),
    ),
    Producto(
      id: 'prod_bermuda',
      title: 'Bermuda Grass',
      subtitle: 'Resistente a sequía y sol fuerte.',
      price: 14.00,
      unit: '/m²',
      color: Color(0xFFDFF4E5),
      accentColor: Color(0xFF2B661C),
    ),
    Producto(
      id: 'prod_agustin',
      title: 'San Agustín',
      subtitle: 'Crecimiento denso y color verde oscuro.',
      price: 10.90,
      unit: '/m²',
      color: Color(0xFFF2F8EE),
      accentColor: Color(0xFF4A7C3E),
    ),
    Producto(
      id: 'prod_npk',
      title: 'Fertilizante NPK',
      subtitle: 'Nutrición balanceada para crecimiento rápido.',
      price: 35.00,
      unit: '/20kg',
      color: Color(0xFFF3F6F1),
      accentColor: Color(0xFF4A7C3E),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      floatingActionButton: selectedTabIndex == 0
          ? FloatingActionButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Soporte por chat próximamente disponible.'),
                    behavior: SnackBarBehavior.floating,
                  ),
                );
              },
              backgroundColor: const Color(0xFF3D7B2C),
              foregroundColor: Colors.white,
              child: const Icon(Icons.chat_bubble_outline),
            )
          : null,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: selectedTabIndex,
        onTap: (index) {
          setState(() {
            selectedTabIndex = index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: const Color(0xFF2D5A27),
        unselectedItemColor: const Color(0xFF94A16E),
        elevation: 8,
        items: [
          const BottomNavigationBarItem(
            icon: Icon(Icons.grid_view_rounded),
            label: 'Catálogo',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            label: 'Pedidos',
          ),
          BottomNavigationBarItem(
            icon: Consumer<CartProvider>(
              builder: (context, cart, child) {
                return cart.totalItems > 0
                    ? Badge(
                        label: Text('${cart.totalItems}'),
                        backgroundColor: const Color(0xFFE0533C),
                        textColor: Colors.white,
                        child: const Icon(Icons.shopping_cart_outlined),
                      )
                    : const Icon(Icons.shopping_cart_outlined);
              },
            ),
            label: 'Carrito',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: 'Perfil',
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: _buildBody(context),
        ),
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    switch (selectedTabIndex) {
      case 0:
        return _buildCatalogView(context);
      case 1:
        return _buildOrdersView(context);
      case 2:
        return CartView(
          onGoToCatalog: () {
            setState(() {
              selectedTabIndex = 0;
            });
          },
        );
      case 3:
        return _buildProfileView(context);
      default:
        return _buildCatalogView(context);
    }
  }

  Widget _buildCatalogView(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Icon(Icons.menu, color: Color(0xFF2D5A27)),
            ),
            GestureDetector(
              onTap: () {
                setState(() {
                  selectedTabIndex = 2; // Ir al carrito
                });
              },
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Consumer<CartProvider>(
                  builder: (context, cart, child) {
                    return cart.totalItems > 0
                        ? Badge(
                            label: Text('${cart.totalItems}'),
                            backgroundColor: const Color(0xFFE0533C),
                            child: const Icon(Icons.shopping_cart_outlined, color: Color(0xFF2D5A27)),
                          )
                        : const Icon(Icons.shopping_cart_outlined, color: Color(0xFF2D5A27));
                  },
                ),
              ),
            ),
          ],
        ),
        AppSpaces.verticalLarge,
        const Text(
          'Catálogo',
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1F3D24),
          ),
        ),
        AppSpaces.verticalSmall,
        const Text(
          'Encuentra tu grama o fertilizante ideal.',
          style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
        ),
        AppSpaces.verticalLarge,
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(22),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 24,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: const TextField(
            decoration: InputDecoration(
              contentPadding: EdgeInsets.symmetric(vertical: 18, horizontal: 20),
              hintText: 'Buscar grama o fertilizante...',
              prefixIcon: Icon(Icons.search, color: Color(0xFF4A7C3E)),
              border: InputBorder.none,
            ),
          ),
        ),
        AppSpaces.verticalLarge,
        SizedBox(
          height: 44,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: categories.length,
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final selected = index == selectedCategory;
              return GestureDetector(
                onTap: () {
                  setState(() {
                    selectedCategory = index;
                  });
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18),
                  decoration: BoxDecoration(
                    color: selected ? const Color(0xFF2D5A27) : Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(
                      color: selected ? const Color(0xFF2D5A27) : const Color(0xFFD1D5DB),
                    ),
                  ),
                  child: Center(
                    child: Text(
                      categories[index],
                      style: TextStyle(
                        color: selected ? Colors.white : const Color(0xFF4A7C3E),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
        AppSpaces.verticalLarge,
        Expanded(
          child: SingleChildScrollView(
            child: Column(
              children: [
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF3D7B2C), Color(0xFF81D460)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.08),
                        blurRadius: 30,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'PROMOCIÓN',
                        style: TextStyle(
                          color: Color(0xFFF5FFF3),
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(height: 12),
                      Text(
                        'Grama Premium',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      SizedBox(height: 10),
                      Text(
                        'Descuento del 15% en rollos de San Agustín.',
                        style: TextStyle(
                          color: Color(0xFFF5FFF3),
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                AppSpaces.verticalLarge,
                Row(
                  children: [
                    Expanded(
                      child: _ProductCard(product: products[0]),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _ProductCard(product: products[1]),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _ProductCard(product: products[2]),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _ProductCard(product: products[3]),
                    ),
                  ],
                ),
                AppSpaces.verticalLarge,
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text(
                      'Más Vendidos',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1F3D24),
                      ),
                    ),
                    Text(
                      'Ver todos>',
                      style: TextStyle(
                        color: Color(0xFF4A7C3E),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.06),
                        blurRadius: 20,
                        offset: const Offset(0, 12),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          color: const Color(0xFFE3F3DF),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(
                          Icons.grass,
                          color: Color(0xFF2D5A27),
                          size: 44,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              'Riego Automático Smart',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF1F3D24),
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Kit completo para 50m²',
                              style: TextStyle(
                                fontSize: 14,
                                color: Color(0xFF6B7280),
                              ),
                            ),
                            SizedBox(height: 12),
                            Row(
                              children: [
                                Icon(Icons.star, color: Color(0xFFFFC107), size: 16),
                                SizedBox(width: 6),
                                Text(
                                  '4.9',
                                  style: TextStyle(
                                    color: Color(0xFF4A7C3E),
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        '\$20.00',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF2D5A27),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 100),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildOrdersView(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Mis Pedidos',
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1F3D24),
          ),
        ),
        AppSpaces.verticalSmall,
        const Text(
          'Historial de tus compras realizadas.',
          style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
        ),
        Expanded(
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: const BoxDecoration(
                    color: Color(0xFFE5E7EB),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(
                      Icons.receipt_long_outlined,
                      color: Color(0xFF6B7280),
                      size: 44,
                    ),
                  ),
                ),
                AppSpaces.verticalMedium,
                const Text(
                  'No tienes pedidos activos',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1F3D24),
                  ),
                ),
                AppSpaces.verticalSmall,
                const Text(
                  'Tus pedidos e historial se mostrarán aquí una vez realices tu primera compra.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileView(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final String emailToShow = authProvider.usuario?.email ?? 'usuario@ejemplo.com';
    final String nameToShow = authProvider.nombreUsuario.isNotEmpty 
        ? authProvider.nombreUsuario 
        : 'Cliente Invitado';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Mi Perfil',
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1F3D24),
          ),
        ),
        AppSpaces.verticalLarge,
        // Card de información del usuario
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFE8F7E4), Color(0xFFC7EBC2)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(28),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 36,
                backgroundColor: const Color(0xFF3D7B2C),
                child: Text(
                  nameToShow.isNotEmpty ? nameToShow[0].toUpperCase() : 'U',
                  style: const TextStyle(fontSize: 28, color: Colors.white, fontWeight: FontWeight.w800),
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      nameToShow,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1F3D24),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      emailToShow,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF4B5563),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        AppSpaces.verticalLarge,
        // Opciones del perfil
        _buildProfileOption(Icons.location_on_outlined, 'Direcciones guardadas'),
        _buildProfileOption(Icons.payment_outlined, 'Métodos de pago'),
        _buildProfileOption(Icons.notifications_none_outlined, 'Notificaciones'),
        _buildProfileOption(Icons.help_outline_outlined, 'Ayuda y Soporte'),
        const Spacer(),
        ElevatedButton.icon(
          onPressed: () async {
            await authProvider.logout();
            if (context.mounted) {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (context) => LoginScreen()),
              );
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.redAccent,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
            ),
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          icon: const Icon(Icons.logout),
          label: const Text(
            'Cerrar Sesión',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildProfileOption(IconData icon, String title) {
    return Card(
      color: Colors.white,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      elevation: 0,
      child: ListTile(
        leading: Icon(icon, color: const Color(0xFF3D7B2C)),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w600, color: Color(0xFF1F3D24)),
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16, color: Color(0xFF9CA3AF)),
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Opción "$title" disponible en la versión final.')),
          );
        },
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Producto product;

  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 22,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      padding: const EdgeInsets.all(18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 110,
            decoration: BoxDecoration(
              color: product.color,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Center(
              child: Icon(
                Icons.grass,
                size: 42,
                color: product.accentColor,
              ),
            ),
          ),
          const SizedBox(height: 14),
          Text(
            product.title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1F3D24),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            product.subtitle,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF6B7280),
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.formattedPrice,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1F3D24),
                    ),
                  ),
                  Text(
                    product.unit,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () {
                  final cartProvider = Provider.of<CartProvider>(context, listen: false);
                  cartProvider.addToCart(product);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('¡${product.title} agregado al carrito!'),
                      duration: const Duration(seconds: 1),
                      backgroundColor: const Color(0xFF3D7B2C),
                      behavior: SnackBarBehavior.floating,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                  );
                },
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F7E4),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.add_shopping_cart,
                    size: 18,
                    color: Color(0xFF2D5A27),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
