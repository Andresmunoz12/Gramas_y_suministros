// lib/Features/catalog/CatalogScreen.dart
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'package:cached_network_image/cached_network_image.dart';

import 'package:gramas_y_suministros_movil/Features/cotizacion/MisCotizacionesScreen.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-Sizedbox.dart';
import 'package:gramas_y_suministros_movil/models/producto.model.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/Features/auth-login/Login_Screen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/AdminDashboard.dart';
import 'package:gramas_y_suministros_movil/Features/profile/presentation/EditProfileScreen.dart';
import 'package:gramas_y_suministros_movil/Features/nosotros/nosotros_screen.dart';
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:gramas_y_suministros_movil/core/network/http_cache_service.dart';
import 'package:gramas_y_suministros_movil/Providers/cart_provider.dart';
import 'package:gramas_y_suministros_movil/Features/cart/CartScreen.dart';
import 'package:gramas_y_suministros_movil/Features/catalog/ProductDetailScreen.dart';

class CatalogScreen extends StatefulWidget {
  const CatalogScreen({super.key});

  @override
  State<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends State<CatalogScreen> {
  final List<String> categories = ['Todas', 'Deportiva', 'Residencial', 'Comercial'];
  int selectedCategory = 0;
  int selectedTabIndex = 0;
  String searchQuery = '';

  final HttpCacheService _cacheService = HttpCacheService();
  List<Producto>? _products;
  bool _isLoadingProducts = true;
  String? _productsError;

  List<dynamic>? _orders;
  bool _isLoadingOrders = false;
  String? _ordersError;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    final String? cachedData = await _cacheService.get(ApiConfig.productos);
    if (cachedData != null) {
      try {
        final List<dynamic> jsonList = jsonDecode(cachedData) as List<dynamic>;
        final cachedProducts = jsonList.map((json) {
          return Producto.fromJson(json as Map<String, dynamic>);
        }).toList();
        
        if (mounted) {
          setState(() {
            _products = cachedProducts;
            _isLoadingProducts = false;
          });
        }
        debugPrint('CatalogScreen: Productos cargados desde caché local');
      } catch (e) {
        debugPrint('CatalogScreen: Error al decodificar caché: $e');
      }
    } else {
      if (mounted) {
        setState(() {
          _isLoadingProducts = true;
        });
      }
    }

    try {
      debugPrint('CatalogScreen: solicitando ${ApiConfig.productos}');
      final response = await http.get(Uri.parse(ApiConfig.productos));
      debugPrint('CatalogScreen: status ${response.statusCode}');

      if (response.statusCode == 200) {
        final String responseBody = response.body;
        await _cacheService.save(ApiConfig.productos, responseBody);

        final List<dynamic> jsonList = jsonDecode(responseBody) as List<dynamic>;
        final freshProducts = jsonList.map((json) {
          return Producto.fromJson(json as Map<String, dynamic>);
        }).toList();

        if (mounted) {
          setState(() {
            _products = freshProducts;
            _isLoadingProducts = false;
            _productsError = null;
          });
        }
      } else {
        throw Exception('Error al cargar productos: código ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('CatalogScreen: Error de red: $e');
      if (_products == null) {
        if (mounted) {
          setState(() {
            _productsError = e.toString();
            _isLoadingProducts = false;
          });
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Visualizando catálogo guardado (sin conexión).'),
              duration: Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  Future<void> _loadOrders() async {
    if (!mounted) return;
    setState(() {
      _isLoadingOrders = true;
      _ordersError = null;
    });

    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final token = auth.usuario?.token ?? await auth.getSavedToken();
      if (token == null) {
        throw Exception('Inicia sesión para ver tus pedidos');
      }

      final response = await http.get(
        Uri.parse(ApiConfig.movimientos),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> allMovements = jsonDecode(response.body) as List<dynamic>;
        final userId = auth.usuario?.idUsuario;

        final userOrders = allMovements.where((mov) {
          final isSalida = mov['tipo'] == 'salida';
          final matchesUser = mov['id_usuario'] == userId;
          return isSalida && matchesUser;
        }).toList();

        if (mounted) {
          setState(() {
            _orders = userOrders;
            _isLoadingOrders = false;
          });
        }
      } else {
        throw Exception('Error al obtener pedidos (${response.statusCode})');
      }
    } catch (e) {
      debugPrint('Error cargando pedidos: $e');
      if (mounted) {
        setState(() {
          _ordersError = e.toString().replaceAll('Exception:', '').trim();
          _isLoadingOrders = false;
        });
      }
    }
  }

  String _formatDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr).toLocal();
      final months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return '${date.day} ${months[date.month - 1]}, ${date.year}';
    } catch (e) {
      return dateStr;
    }
  }

  String? _normalizeProductImageUrl(String? rawUrl) {
    if (rawUrl == null || rawUrl.trim().isEmpty) {
      return null;
    }

    final String url = rawUrl.trim();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    final String cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    if (cleanUrl.startsWith('uploads/')) {
      return '${ApiConfig.baseUrl}/$cleanUrl';
    }
    return '${ApiConfig.baseUrl}/uploads/img_products/$cleanUrl';
  }

  Widget _buildProductGrid(List<Producto> products) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: products.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.46,
      ),
      itemBuilder: (context, index) {
        return _ProductCard(product: products[index]);
      },
    );
  }

  List<Producto> _filterProducts(List<Producto> products) {
    return products.where((product) {
      // Filtro por categoría
      bool categoryMatch = true;
      if (selectedCategory != 0) {
        final String selected = categories[selectedCategory].toLowerCase();
        categoryMatch = (product.categoryName?.toLowerCase().contains(selected) ?? false) ||
            product.title.toLowerCase().contains(selected) ||
            product.subtitle.toLowerCase().contains(selected) ||
            (product.brand?.toLowerCase().contains(selected) ?? false);
      }

      // Filtro por texto de búsqueda
      bool searchMatch = true;
      if (searchQuery.trim().isNotEmpty) {
        final String query = searchQuery.trim().toLowerCase();
        final titleMatch = product.title.toLowerCase().contains(query);
        final subtitleMatch = product.subtitle.toLowerCase().contains(query);
        final descriptionMatch = product.description?.toLowerCase().contains(query) ?? false;
        final categoryMatchStr = product.categoryName?.toLowerCase().contains(query) ?? false;
        final brandMatchStr = product.brand?.toLowerCase().contains(query) ?? false;
        searchMatch = titleMatch || subtitleMatch || descriptionMatch || categoryMatchStr || brandMatchStr;
      }

      return categoryMatch && searchMatch;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      drawer: _buildAppDrawer(context),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: selectedTabIndex == 2 ? 3 : selectedTabIndex,
        onTap: (index) {
          if (index == 1) {
            // ✅ Pestaña de Nosotros
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const NosotrosScreen()),
            );
            return;
          }
          if (index == 2) {
            // ✅ Pestaña de Cotizaciones - pasar token
            final authProvider = Provider.of<AuthProvider>(context, listen: false);
            final token = authProvider.usuario?.token;
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => MisCotizacionesScreen(token: token),
              ),
            );
            return;
          }
          setState(() {
            selectedTabIndex = index > 2 ? index - 1 : index;
          });
        },
        type: BottomNavigationBarType.fixed,
        backgroundColor: Colors.white,
        selectedItemColor: const Color(0xFF2D5A27),
        unselectedItemColor: const Color(0xFF94A16E),
        elevation: 8,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.grid_view_rounded),
            label: 'Catálogo',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.info_outline),
            label: 'Nosotros',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.receipt_long_outlined),
            label: 'Cotizaciones',
          ),
          BottomNavigationBarItem(
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
            Builder(
              builder: (context) {
                return GestureDetector(
                  onTap: () => Scaffold.of(context).openDrawer(),
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
                    child: const Icon(Icons.menu, color: Color(0xFF2D5A27)),
                  ),
                );
              },
            ),
            Consumer<CartProvider>(
              builder: (context, cartProvider, child) {
                return GestureDetector(
                  onTap: () async {
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
                  child: Stack(
                    clipBehavior: Clip.none,
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
                        child: const Icon(
                          Icons.receipt_long_outlined,
                          color: Color(0xFF2D5A27),
                        ),
                      ),
                      if (cartProvider.totalItems > 0)
                        Positioned(
                          right: -4,
                          top: -4,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                            constraints: const BoxConstraints(
                              minWidth: 18,
                              minHeight: 18,
                            ),
                            child: Text(
                              '${cartProvider.totalItems}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                    ],
                  ),
                );
              },
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
          child: TextField(
            onChanged: (value) {
              setState(() {
                searchQuery = value;
              });
            },
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.symmetric(vertical: 18, horizontal: 20),
              hintText: 'Buscar grama o fertilizante...',
              prefixIcon: const Icon(Icons.search, color: Color(0xFF4A7C3E)),
              suffixIcon: searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, color: Color(0xFF6B7280)),
                      onPressed: () {
                        setState(() {
                          searchQuery = '';
                        });
                      },
                    )
                  : null,
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
          child: RefreshIndicator(
            onRefresh: () async {
              await _cacheService.invalidate(ApiConfig.productos);
              await _loadProducts();
            },
            color: const Color(0xFF2D5A27),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
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
                  Builder(
                    builder: (context) {
                      if (_isLoadingProducts && (_products == null || _products!.isEmpty)) {
                        return const Center(child: CircularProgressIndicator());
                      }

                      if (_productsError != null && (_products == null || _products!.isEmpty)) {
                        return Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(24),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.05),
                                blurRadius: 20,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: Text(
                            'Error al cargar productos: $_productsError',
                            style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                          ),
                        );
                      }

                      if (_products == null || _products!.isEmpty) {
                        return const Center(
                          child: Text(
                            'No hay productos registrados.',
                            style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                          ),
                        );
                      }

                      final products = _filterProducts(_products!);
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: Text(
                              'Mostrando ${products.length} producto(s)',
                              style: const TextStyle(
                                fontSize: 14,
                                color: Color(0xFF6B7280),
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          if (products.isEmpty)
                            const Center(
                              child: Text(
                                'No hay productos disponibles en esta categoría.',
                                style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                              ),
                            )
                          else
                            _buildProductGrid(products),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildOrdersView(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _loadOrders,
      color: const Color(0xFF2D5A27),
      child: Column(
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
          AppSpaces.verticalMedium,
          Expanded(
            child: Builder(
              builder: (context) {
                if (_isLoadingOrders && (_orders == null || _orders!.isEmpty)) {
                  return const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF3D7B2C)),
                    ),
                  );
                }

                if (_ordersError != null && (_orders == null || _orders!.isEmpty)) {
                  return Center(
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
                          AppSpaces.verticalMedium,
                          Text(
                            'Error al cargar pedidos: $_ordersError',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                          ),
                          AppSpaces.verticalMedium,
                          ElevatedButton(
                            onPressed: _loadOrders,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF3D7B2C),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            child: const Text('Reintentar'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                if (_orders == null || _orders!.isEmpty) {
                  return ListView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    children: [
                      SizedBox(height: MediaQuery.of(context).size.height * 0.15),
                      Center(
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
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 24),
                              child: Text(
                                'Tus pedidos e historial se mostrarán aquí una vez realices tu primera compra.',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  );
                }

                return ListView.builder(
                  physics: const AlwaysScrollableScrollPhysics(),
                  itemCount: _orders!.length,
                  itemBuilder: (context, index) {
                    final order = _orders![index];
                    final double price = double.tryParse(order['producto']?['precio']?.toString() ?? '0') ?? 0.0;
                    final int qty = order['cantidad'] ?? 0;
                    final double totalItem = price * qty;
                    final rawImg = order['producto']?['imagen']?.toString();
                    final imgUrl = _normalizeProductImageUrl(rawImg);

                    return Card(
                      elevation: 0,
                      margin: const EdgeInsets.only(bottom: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(22),
                        side: const BorderSide(color: Color(0xFFE5E7EB)),
                      ),
                      color: Colors.white,
                      child: Padding(
                        padding: const EdgeInsets.all(18),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFE8F7E4),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    'Pedido #${order['id_movimiento']}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF2D5A27),
                                    ),
                                  ),
                                ),
                                Text(
                                  _formatDate(order['fecha'] ?? ''),
                                  style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF3F4F6),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(12),
                                    child: (imgUrl != null && imgUrl.isNotEmpty)
                                        ? CachedNetworkImage(
                                            imageUrl: imgUrl,
                                            fit: BoxFit.cover,
                                            placeholder: (context, url) => const Center(
                                              child: SizedBox(
                                                width: 16,
                                                height: 16,
                                                child: CircularProgressIndicator(
                                                  strokeWidth: 2,
                                                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF3D7B2C)),
                                                ),
                                              ),
                                            ),
                                            errorWidget: (context, url, error) => const Icon(
                                              Icons.grass,
                                              color: Color(0xFF3D7B2C),
                                            ),
                                          )
                                        : const Icon(
                                            Icons.grass,
                                            color: Color(0xFF3D7B2C),
                                          ),
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        order['producto']?['nombre'] ?? 'Producto Desconocido',
                                        style: const TextStyle(
                                          fontSize: 16,
                                          fontWeight: FontWeight.w700,
                                          color: Color(0xFF1F3D24),
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Cantidad: $qty',
                                        style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563)),
                                      ),
                                    ],
                                  ),
                                ),
                                Text(
                                  '\$${totalItem.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF2D5A27),
                                  ),
                                ),
                              ],
                            ),
                            if (order['salida']?['destino'] != null && order['salida']?['destino'].toString().trim().isNotEmpty == true) ...[
                              const SizedBox(height: 12),
                              const Divider(height: 1, color: Color(0xFFF3F4F6)),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  const Icon(Icons.location_on_outlined, size: 16, color: Color(0xFF6B7280)),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      'Destino: ${order['salida']?['destino']}',
                                      style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileView(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final String emailToShow = authProvider.usuario?.email ?? 'usuario@ejemplo.com';
    final String nameToShow = authProvider.usuario?.nombre ?? '';
    final String lastNameToShow = authProvider.usuario?.apellido ?? '';
    final String fullNameToShow = nameToShow.isNotEmpty 
        ? (lastNameToShow.isNotEmpty ? '$nameToShow $lastNameToShow' : nameToShow)
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
                  fullNameToShow.isNotEmpty ? fullNameToShow[0].toUpperCase() : 'U',
                  style: const TextStyle(fontSize: 28, color: Colors.white, fontWeight: FontWeight.w800),
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      fullNameToShow,
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
              IconButton(
                icon: const Icon(Icons.edit_outlined, color: Color(0xFF2D5A27)),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const EditProfileScreen()),
                  );
                },
              ),
            ],
          ),
        ),
        AppSpaces.verticalLarge,
        _buildProfileOption(
          Icons.person_outline,
          'Editar Información Personal',
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const EditProfileScreen()),
            );
          },
        ),
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

  Widget _buildProfileOption(IconData icon, String title, {VoidCallback? onTap}) {
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
        onTap: onTap ?? () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Opción "$title" disponible en la versión final.')),
          );
        },
      ),
    );
  }

  Widget _buildAppDrawer(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            UserAccountsDrawerHeader(
              accountName: Text(
                authProvider.nombreUsuario.isNotEmpty ? authProvider.nombreUsuario : 'Invitado',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
              ),
              accountEmail: Text(
                authProvider.usuario?.email ?? '',
                style: const TextStyle(color: Colors.white70, fontSize: 13),
              ),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.white,
                child: Text(
                  authProvider.nombreUsuario.isNotEmpty ? authProvider.nombreUsuario[0].toUpperCase() : 'U',
                  style: const TextStyle(color: Color(0xFF2E7D32), fontSize: 20, fontWeight: FontWeight.w800),
                ),
              ),
              decoration: const BoxDecoration(
                color: Color(0xFF2E7D32),
              ),
            ),
            if (authProvider.isAdmin)
              ListTile(
                leading: const Icon(Icons.dashboard, color: Color(0xFF3D7B2C)),
                title: const Text('Administrador'),
                onTap: () async {
                  Navigator.pop(context);
                  final token = authProvider.usuario?.token ?? await authProvider.getSavedToken();
                  if (context.mounted) {
                    Navigator.pushReplacement(
                      context,
                      MaterialPageRoute(
                        builder: (_) => AdminDashboard(token: token),
                      ),
                    );
                  }
                },
              ),
            ListTile(
              leading: const Icon(Icons.grid_view_rounded, color: Color(0xFF3D7B2C)),
              title: const Text('Catálogo'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const CatalogScreen()),
                );
              },
            ),
            // ✅ Opción Mis Cotizaciones en el Drawer
            ListTile(
              leading: const Icon(Icons.receipt_long_outlined, color: Color(0xFF3D7B2C)),
              title: const Text('Mis Cotizaciones'),
              onTap: () async {
                Navigator.pop(context);
                final authProvider = Provider.of<AuthProvider>(context, listen: false);
                final token = authProvider.usuario?.token ?? await authProvider.getSavedToken();
                if (context.mounted) {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => MisCotizacionesScreen(token: token),
                    ),
                  );
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.info_outline, color: Color(0xFF3D7B2C)),
              title: const Text('Nosotros'),
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const NosotrosScreen()),
                );
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.redAccent),
              title: const Text('Cerrar Sesión', style: TextStyle(color: Colors.redAccent)),
              onTap: () async {
                Navigator.pop(context);
                await authProvider.logout();
                if (context.mounted) {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(builder: (context) => LoginScreen()),
                  );
                }
              },
            ),
          ],
        ),
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
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Imagen con badge de Categoría flotante
          Stack(
            children: [
              Container(
                height: 115,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: product.color,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(18),
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
                            child: Icon(Icons.grass, size: 42, color: product.accentColor),
                          ),
                        )
                      : Center(
                          child: Icon(Icons.grass, size: 42, color: product.accentColor),
                        ),
                ),
              ),
              if (product.categoryName != null && product.categoryName!.isNotEmpty)
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.92),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Text(
                      product.categoryName!,
                      style: const TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF2D5A27),
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),

          // Título
          Text(
            product.title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1F3D24),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),

          // Descripción / Subtítulo
          Expanded(
            child: Text(
              product.subtitle,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF6B7280),
                height: 1.3,
              ),
              maxLines: 3,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          const SizedBox(height: 6),

          // Stock
          Row(
            children: [
              const Text('📦 ', style: TextStyle(fontSize: 11)),
              Text(
                'Stock: ${product.stock}',
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D5A27),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Divider(height: 1, color: Color(0xFFF3F4F6)),
          const SizedBox(height: 10),

          // Precio Destacado
          Text(
            product.formattedPrice,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: Color(0xFF1F3D24),
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 10),

          // Fila de Botones Ver y Agregar
          Row(
            children: [
              // Botón Ver
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => ProductDetailScreen(product: product),
                      ),
                    );
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F7E4),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Text(
                        'Ver',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2D5A27),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // Botón Agregar
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    final cartProvider = Provider.of<CartProvider>(context, listen: false);
                    cartProvider.addProduct(product);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('✅ ${product.title} agregado a la cotización'),
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
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF65C466),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Center(
                      child: Text(
                        'Agregar',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
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