// lib/Features/admin/AdminDashboard.dart
import 'package:flutter/material.dart';
import 'package:gramas_y_suministros_movil/Features/catalog/CatalogScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/InventoryScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/ReportesScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/StockScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/UsersScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/GestionCotizacionesScreen.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';

class AdminDashboard extends StatefulWidget {
  final String? token;
  const AdminDashboard({super.key, this.token});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  int _totalProducts = 0;
  bool _isLoadingProducts = true;

  int _totalActiveUsers = 0;
  bool _isLoadingUsers = true;

  int _totalStock = 0;
  int _agotados = 0;
  bool _isLoadingStock = true;

  @override
  void initState() {
    super.initState();
    _loadTotalProducts();
    _loadTotalUsers();
    _loadStockSummary();
  }

  Future<String?> _getToken() async {
    if (widget.token != null) {
      return widget.token;
    }
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      return authProvider.usuario?.token ?? await authProvider.getSavedToken();
    } catch (e) {
      return null;
    }
  }

  Future<void> _loadTotalProducts() async {
    try {
      final String? token = await _getToken();
      if (token == null) {
        setState(() => _isLoadingProducts = false);
        return;
      }

      final response = await http.get(
        Uri.parse(ApiConfig.productos),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = jsonDecode(response.body) as List<dynamic>;
        if (mounted) {
          setState(() {
            _totalProducts = jsonList.length;
            _isLoadingProducts = false;
          });
        }
      } else {
        throw Exception('Error: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error cargando productos: $e');
      if (mounted) {
        setState(() => _isLoadingProducts = false);
      }
    }
  }

  Future<void> _loadTotalUsers() async {
    try {
      final String? token = await _getToken();
      if (token == null) {
        setState(() => _isLoadingUsers = false);
        return;
      }

      final response = await http.get(
        Uri.parse(ApiConfig.users),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = jsonDecode(response.body) as List<dynamic>;
        final int activeCount = jsonList.where((u) {
          if (u is! Map<String, dynamic>) return false;
          final estado = u['estado']?.toString() ?? '';
          return estado == 'activo';
        }).length;
        if (mounted) {
          setState(() {
            _totalActiveUsers = activeCount;
            _isLoadingUsers = false;
          });
        }
      } else {
        throw Exception('Error: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error cargando usuarios: $e');
      if (mounted) {
        setState(() => _isLoadingUsers = false);
      }
    }
  }

  Future<void> _loadStockSummary() async {
    try {
      final String? token = await _getToken();
      if (token == null) {
        setState(() => _isLoadingStock = false);
        return;
      }

      final response = await http.get(
        Uri.parse(ApiConfig.stock),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = jsonDecode(response.body) as List<dynamic>;
        
        int totalStock = 0;
        int agotados = 0;

        for (final item in jsonList) {
          if (item is! Map<String, dynamic>) continue;
          final cantidad = _parseInt(item['cantidad_actual'] ?? item['cantidad'] ?? item['stock']);
          totalStock += cantidad;
          if (cantidad <= 0) {
            agotados++;
          }
        }

        if (mounted) {
          setState(() {
            _totalStock = totalStock;
            _agotados = agotados;
            _isLoadingStock = false;
          });
        }
      } else {
        throw Exception('Error: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error cargando stock: $e');
      if (mounted) {
        setState(() => _isLoadingStock = false);
      }
    }
  }

  int _parseInt(dynamic value) {
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) {
      final parsed = int.tryParse(value);
      if (parsed != null) return parsed;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildHeader(context),
              const SizedBox(height: 24),
              _buildStatisticCards(),
              const SizedBox(height: 24),
              _buildQuickActions(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: const [
              Text(
                '¡Hola, Administrador!',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1F3D24),
                ),
              ),
              SizedBox(height: 8),
              Text(
                'Aquí tienes el resumen de tu inventario y ventas de hoy.',
                style: TextStyle(fontSize: 15, color: Color(0xFF6B7280)),
              ),
            ],
          ),
        ),
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: const Color(0xFFE7F3DE),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(Icons.person_outline, color: Color(0xFF3D7B2C)),
        ),
      ],
    );
  }

  Widget _buildStatisticCards() {
    final String productsValue = _isLoadingProducts ? '...' : _totalProducts.toString();
    final String usersValue = _isLoadingUsers ? '...' : _totalActiveUsers.toString();
    final String stockValue = _isLoadingStock ? '...' : _totalStock.toString();
    final String agotadosValue = _isLoadingStock ? '...' : _agotados.toString();

    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildMetricCard('Productos Totales', productsValue, Icons.inventory_2_rounded, const Color(0xFFF9FBEF))),
            const SizedBox(width: 12),
            Expanded(child: _buildMetricCard('Usuarios Activos', usersValue, Icons.people_alt_rounded, const Color(0xFFE8F7E5))),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildMetricCard('Stock Total', stockValue, Icons.storage_rounded, const Color(0xFFF4F1EB))),
            const SizedBox(width: 12),
            Expanded(child: _buildMetricCard('Agotados', agotadosValue, Icons.cancel_outlined, const Color(0xFFFFF1F0))),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon, Color backgroundColor) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFFFFFFFF),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: const Color(0xFF3D7B2C)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563)),
                ),
                const SizedBox(height: 8),
                Text(
                  value,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFF1F3D24)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Accesos rápidos',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF1F3D24)),
        ),
        const SizedBox(height: 14),
        Center(
          child: Wrap(
            alignment: WrapAlignment.center,
            runAlignment: WrapAlignment.center,
            spacing: 12,
            runSpacing: 12,
            children: [
              _buildActionButton(context, Icons.person, 'Usuarios', () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const UsersScreen()),
                );
              }),
              _buildActionButton(context, Icons.bar_chart, 'Reportes', () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => ReportesScreen(token: widget.token),
                  ),
                );
              }),
              _buildActionButton(context, Icons.inventory, 'Inventario', () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const InventoryScreen()),
                );
                _loadTotalProducts();
              }),
              _buildActionButton(context, Icons.inventory_2_rounded, 'Stock', () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const StockScreen()),
                );
              }),
              _buildActionButton(context, Icons.receipt_long_rounded, 'Cotizaciones', () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const GestionCotizacionesScreen()),
                );
              }),
            ],
          ),
        ),
        const SizedBox(height: 30),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF3D7B2C),
                  side: const BorderSide(color: Color(0xFF3D7B2C)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                onPressed: () {
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(builder: (_) => const CatalogScreen()),
                  );
                },
                child: const Text('Ir al Catálogo'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildActionButton(BuildContext context, IconData icon, String label, VoidCallback onTap) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: Material(
        color: const Color(0xFFE8F7E5),
        child: InkWell(
          onTap: onTap,
          child: SizedBox(
            width: 144,
            height: 104,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFFFF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: const Color(0xFF3D7B2C), size: 18),
                  ),
                  const Spacer(),
                  Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF1F3D24))),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}