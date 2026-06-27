import 'package:flutter/material.dart';
import 'package:gramas_y_suministros_movil/Features/catalog/CatalogScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/AddProductScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/EditProductScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/ReportesScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/UsersScreen.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:provider/provider.dart';
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:gramas_y_suministros_movil/core/network/http_cache_service.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';

class InventoryProduct {
  final int id;
  final String estado;
  final String producto;
  final String altura;
  final String peso;
  final String material;
  final String marca;
  final String precio;
  final String categoria;
  final Map<String, dynamic> rawData;

  const InventoryProduct({
    required this.id,
    required this.estado,
    required this.producto,
    required this.altura,
    required this.peso,
    required this.material,
    required this.marca,
    required this.precio,
    required this.categoria,
    required this.rawData,
  });

  factory InventoryProduct.fromJson(Map<String, dynamic> json) {
    return InventoryProduct(
      id: json['id_producto'] ?? 0,
      estado: (json['estado'] == 1 ? 'ACTIVO' : 'INACTIVO'),
      producto: json['nombre']?.toString() ?? 'Sin nombre',
      altura: '${json['altura'] ?? '0'} m²',
      peso: '${json['peso'] ?? '0'} kg',
      material: json['material']?.toString() ?? 'No especificado',
      marca: json['marca']?.toString() ?? 'No especificada',
      precio: '\$${json['precio']?.toString() ?? '0'}',
      categoria: json['categoria']?['nombre']?.toString() ?? 'Sin categoría',
      rawData: json,
    );
  }
}

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final HttpCacheService _cacheService = HttpCacheService();
  List<InventoryProduct> _products = [];
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  final int _pageSize = 5;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _invalidateAndReload() async {
    await _cacheService.invalidate(ApiConfig.productos);
    await _cacheService.invalidate('${ApiConfig.productos}/admin/all');
    await _loadProducts();
  }

  Future<void> _loadProducts() async {
    final String cacheKey = '${ApiConfig.productos}/admin/all';

    // 1. Cargar desde la caché local primero
    final String? cachedData = await _cacheService.get(cacheKey);
    if (cachedData != null) {
      try {
        final List<dynamic> jsonList = jsonDecode(cachedData) as List<dynamic>;
        final cachedProducts = jsonList.map((json) => InventoryProduct.fromJson(json as Map<String, dynamic>)).toList();
        if (mounted) {
          setState(() {
            _products = cachedProducts;
            _isLoading = false;
            _error = null;
          });
        }
      } catch (e) {
        debugPrint('InventoryScreen: Error al decodificar caché: $e');
      }
    } else {
      if (mounted) {
        setState(() {
          _isLoading = true;
          _error = null;
        });
      }
    }

    // 2. Cargar en segundo plano
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final String? token = authProvider.usuario?.token ?? await authProvider.getSavedToken();

      if (token == null) {
        throw Exception('Token no encontrado');
      }

      final response = await http.get(
        Uri.parse(cacheKey),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final String responseBody = response.body;
        await _cacheService.save(cacheKey, responseBody);

        final List<dynamic> jsonList = jsonDecode(responseBody) as List<dynamic>;
        final freshProducts = jsonList.map((json) => InventoryProduct.fromJson(json as Map<String, dynamic>)).toList();

        if (mounted) {
          setState(() {
            _products = freshProducts;
            _isLoading = false;
            _error = null;
          });
        }
      } else {
        throw Exception('Error: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error cargando productos de red: $e');
      if (_products.isEmpty) {
        if (mounted) {
          setState(() {
            _error = e.toString();
            _isLoading = false;
          });
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Visualizando inventario guardado localmente (sin conexión).'),
              duration: Duration(seconds: 2),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  Future<void> _desactivarProducto(int productId, String productName) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final String? token = authProvider.usuario?.token ?? await authProvider.getSavedToken();

      if (token == null) {
        throw Exception('Token no encontrado');
      }

      final response = await http.patch(
        Uri.parse('${ApiConfig.productos}/$productId/desactivar'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$productName desactivado correctamente'), backgroundColor: const Color(0xFF3D7B2C)),
        );
        await _invalidateAndReload();
      } else {
        throw Exception('Error: ${response.statusCode}');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _activarProducto(int productId, String productName) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final String? token = authProvider.usuario?.token ?? await authProvider.getSavedToken();

      if (token == null) {
        throw Exception('Token no encontrado');
      }

      final response = await http.patch(
        Uri.parse('${ApiConfig.productos}/$productId/activar'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$productName activado correctamente'), backgroundColor: const Color(0xFF3D7B2C)),
        );
        await _invalidateAndReload();
      } else {
        throw Exception('Error: ${response.statusCode}');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _eliminarProducto(int productId, String productName) async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final String? token = authProvider.usuario?.token ?? await authProvider.getSavedToken();

      if (token == null) {
        throw Exception('Token no encontrado');
      }

      final response = await http.delete(
        Uri.parse('${ApiConfig.productos}/$productId'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 204) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$productName eliminado correctamente'), backgroundColor: const Color(0xFF3D7B2C)),
        );
        await _invalidateAndReload();
      } else {
        throw Exception('Error: ${response.statusCode}');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error al eliminar: $e'), backgroundColor: Colors.red),
      );
    }
  }

  void _confirmarEliminarProducto(int productId, String productName) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Row(
            children: const [
              Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 28),
              SizedBox(width: 10),
              Text(
                'Confirmar eliminación',
                style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF1F3D24)),
              ),
            ],
          ),
          content: Text(
            '¿Estás seguro de que deseas eliminar permanentemente el producto "$productName"? Esta acción no se puede deshacer y lo borrará de la base de datos.',
            style: const TextStyle(color: Color(0xFF4B5563)),
          ),
          actions: <Widget>[
            TextButton(
              child: const Text('Cancelar', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Eliminar', style: TextStyle(fontWeight: FontWeight.w700)),
              onPressed: () {
                Navigator.of(context).pop();
                _eliminarProducto(productId, productName);
              },
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final int totalProducts = _products.length;
    final int startIndex = totalProducts == 0 ? 0 : (_currentPage - 1) * _pageSize;
    final int endIndex = startIndex + _pageSize;
    final List<InventoryProduct> visibleProducts = totalProducts == 0
        ? []
        : _products.sublist(
            startIndex,
            endIndex > totalProducts ? totalProducts : endIndex,
          );

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      appBar: AppBar(
        backgroundColor: const Color(0xFF3D7B2C),
        title: const Text('Inventario'),
        actions: [
          TextButton.icon(
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AddProductScreen()),
              );
              if (result == true) {
                _invalidateAndReload();
              }
            },
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text(
              'Agregar',
              style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF3D7B2C))),
              )
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, size: 48, color: Colors.red),
                        const SizedBox(height: 16),
                        Text('Error: $_error'),
                        const SizedBox(height: 16),
                        ElevatedButton(onPressed: _loadProducts, child: const Text('Reintentar')),
                      ],
                    ),
                  )
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),
                        _buildHeaderCard(),
                        const SizedBox(height: 20),
                        _products.isEmpty
                            ? Center(
                                child: Padding(
                                  padding: const EdgeInsets.symmetric(vertical: 40),
                                  child: Column(
                                    children: const [
                                      Icon(Icons.inventory_2_outlined, size: 48, color: Color(0xFFD1D5DB)),
                                      SizedBox(height: 16),
                                      Text('No hay productos registrados'),
                                    ],
                                  ),
                                ),
                              )
                            : _buildInventoryTable(visibleProducts),
                        const SizedBox(height: 16),
                        Center(
                          child: Column(
                            children: [
                              Text(
                                'Mostrando ${visibleProducts.length} de $totalProducts productos registrados',
                                style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                              ),
                              const SizedBox(height: 16),
                              _buildPagination(),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
      ),
      bottomNavigationBar: _buildBottomMenu(),
    );
  }

  Widget _buildHeaderCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: const [
          Text(
            'Gestión de Productos',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1F3D24)),
          ),
          SizedBox(height: 8),
          Text(
            'Control centralizado de suministros y gramas.',
            style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
          ),
        ],
      ),
    );
  }

  Widget _buildInventoryTable(List<InventoryProduct> visibleProducts) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 18,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowColor: MaterialStateProperty.all(const Color(0xFF76C776)),
          headingTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
          dataRowHeight: 72,
          dividerThickness: 0,
          columns: const [
            DataColumn(label: Text('ID')),
            DataColumn(label: Text('ESTADO')),
            DataColumn(label: Text('PRODUCTO')),
            DataColumn(label: Text('ALTURA')),
            DataColumn(label: Text('PESO')),
            DataColumn(label: Text('MATERIAL')),
            DataColumn(label: Text('MARCA')),
            DataColumn(label: Text('PRECIO')),
            DataColumn(label: Text('CATEGORÍA')),
            DataColumn(label: Text('ACCIONES')),
          ],
          rows: visibleProducts.map((product) {
            return DataRow(cells: [
              DataCell(Text(product.id.toString(), style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF1F3D24)))),
              DataCell(_buildStatusChip(product.estado)),
              DataCell(Text(product.producto, style: const TextStyle(color: Color(0xFF1F3D24)))),
              DataCell(Text(product.altura)),
              DataCell(Text(product.peso)),
              DataCell(Text(product.material)),
              DataCell(Text(product.marca)),
              DataCell(Text(product.precio, style: const TextStyle(fontWeight: FontWeight.w700))),
              DataCell(Text(product.categoria)),
              DataCell(Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildActionButton(
                    'Modificar',
                    const Color(0xFF3D7B2C),
                    () async {
                      final result = await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => EditProductScreen(productId: product.id, productData: product.rawData),
                        ),
                      );
                      if (result == true) {
                        _invalidateAndReload();
                      }
                    },
                  ),
                  const SizedBox(width: 8),
                  product.estado == 'ACTIVO'
                      ? _buildActionButton(
                          'Desactivar',
                          const Color(0xFFD14343),
                          () => _desactivarProducto(product.id, product.producto),
                        )
                      : _buildActionButton(
                          'Activar',
                          const Color(0xFF3D7B2C),
                          () => _activarProducto(product.id, product.producto),
                        ),
                  const SizedBox(width: 8),
                  _buildActionButton(
                    'Eliminar',
                    const Color(0xFFC62828),
                    () => _confirmarEliminarProducto(product.id, product.producto),
                  ),
                ],
              )),
            ]);
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    final bool isActive = status == 'ACTIVO';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isActive ? const Color(0xFFE7F3DE) : const Color(0xFFFCE8E6),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        status,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: isActive ? const Color(0xFF3D7B2C) : const Color(0xFFA83232),
        ),
      ),
    );
  }

  Widget _buildActionButton(String label, Color color, VoidCallback onTap) {
    return TextButton(
      style: TextButton.styleFrom(
        backgroundColor: color,
        minimumSize: const Size(88, 34),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
      onPressed: onTap,
      child: Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
    );
  }

  Widget _buildPagination() {
    final int totalPages = (_products.length / _pageSize).ceil();
    final int maxPages = totalPages < 1 ? 1 : totalPages;

    List<Widget> children = [];

    // Left arrow button
    children.add(
      _buildPageButton(
        '<',
        _currentPage > 1
            ? () {
                setState(() {
                  _currentPage--;
                });
              }
            : null,
      ),
    );
    children.add(const SizedBox(width: 10));

    // Page number buttons
    for (int i = 1; i <= maxPages; i++) {
      children.add(
        _buildPageNumber(
          i.toString(),
          selected: _currentPage == i,
          onTap: () {
            setState(() {
              _currentPage = i;
            });
          },
        ),
      );
      if (i < maxPages) {
        children.add(const SizedBox(width: 8));
      }
    }

    children.add(const SizedBox(width: 10));

    // Right arrow button
    children.add(
      _buildPageButton(
        '>',
        _currentPage < maxPages
            ? () {
                setState(() {
                  _currentPage++;
                });
              }
            : null,
      ),
    );

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: children,
      ),
    );
  }

  Widget _buildPageButton(String label, VoidCallback? onTap) {
    final bool isEnabled = onTap != null;
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: isEnabled ? 1.0 : 0.4,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFE7F3DE),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Text(
            label,
            style: const TextStyle(color: Color(0xFF3D7B2C), fontWeight: FontWeight.w700),
          ),
        ),
      ),
    );
  }

  Widget _buildPageNumber(String label, {bool selected = false, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34,
        height: 34,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF3D7B2C) : const Color(0xFFF5F8F2),
          borderRadius: BorderRadius.circular(12),
          border: selected ? null : Border.all(color: const Color(0xFFD1D5DB)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : const Color(0xFF4B5563),
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildBottomMenu() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildBottomMenuItem(Icons.grid_view_rounded, 'Catálogo', false, () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const CatalogScreen()),
                );
              }),
              _buildBottomMenuItem(Icons.people_alt_rounded, 'Usuarios', false, () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const UsersScreen()),
                );
              }),
              _buildBottomMenuItem(Icons.inventory_2_rounded, 'Inventario', true, () {
                _loadProducts();
              }),
              _buildBottomMenuItem(Icons.bar_chart_rounded, 'Reportes', false, () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const ReportesScreen()),
                );
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBottomMenuItem(IconData icon, String label, bool selected, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: selected ? const Color(0xFF3D7B2C) : const Color(0xFFF5F8F2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: selected ? Colors.white : const Color(0xFF4B5563), size: 22),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: selected ? const Color(0xFF3D7B2C) : const Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
