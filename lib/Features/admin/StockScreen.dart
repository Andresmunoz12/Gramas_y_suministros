import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:gramas_y_suministros_movil/Features/admin/InventoryScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/ReportesScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/UsersScreen.dart';
import 'package:gramas_y_suministros_movil/Features/catalog/CatalogScreen.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';

class StockItem {
  final int idProducto;
  final String nombre;
  final int cantidad;
  final int nivelMinimo;
  final String categoria;
  final String? unidad;
  final String? marca;
  final DateTime? ultimaActualizacion;
  final Map<String, dynamic> rawData;

  const StockItem({
    required this.idProducto,
    required this.nombre,
    required this.cantidad,
    required this.nivelMinimo,
    required this.categoria,
    this.unidad,
    this.marca,
    this.ultimaActualizacion,
    required this.rawData,
  });

  bool get isBajo => cantidad <= nivelMinimo;

  factory StockItem.fromJson(Map<String, dynamic> json) {
    final producto = json['producto'];
    final productoMap = producto is Map<String, dynamic> ? producto : null;
    final nombre = (productoMap?['nombre'] ?? json['nombre'] ?? json['producto'] ?? 'Sin nombre').toString();

    final categoria = productoMap?['categoria'] is Map<String, dynamic>
        ? (productoMap!['categoria']['nombre'] ?? 'Sin categoría').toString()
        : (json['categoria'] ?? 'Sin categoría').toString();

    final cantidad = _toInt([
      json['cantidad_actual'],
      json['cantidad'],
      json['stock'],
      json['stock_actual'],
      productoMap?['stock']
    ]);

    final nivelMinimo = _toInt([
      json['nivel_minimo'],
      json['nivelMinimo'],
      json['stock_minimo'],
      productoMap?['nivel_minimo']
    ]);

    return StockItem(
      idProducto: _toInt([
        json['id_producto'],
        json['idProducto'],
        json['producto']?['id_producto'],
        json['producto']?['idProducto'],
      ]),
      nombre: nombre,
      cantidad: cantidad,
      nivelMinimo: nivelMinimo,
      categoria: categoria,
      unidad: productoMap?['unidad']?.toString(),
      marca: productoMap?['marca']?.toString(),
      ultimaActualizacion: _toDateTime(json['ultima_actualizacion'] ?? json['ultimaActualizacion']),
      rawData: json,
    );
  }

  static int _toInt(List<dynamic> values) {
    for (final value in values) {
      if (value == null) continue;
      if (value is int) return value;
      if (value is double) return value.toInt();
      if (value is String) {
        final parsed = int.tryParse(value);
        if (parsed != null) return parsed;
      }
    }
    return 0;
  }

  static DateTime? _toDateTime(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String) {
      final parsed = DateTime.tryParse(value);
      if (parsed != null) return parsed;
    }
    return null;
  }
}

class StockScreen extends StatefulWidget {
  const StockScreen({super.key});

  @override
  State<StockScreen> createState() => _StockScreenState();
}

class _StockScreenState extends State<StockScreen> {
  bool _isLoading = true;
  String? _error;
  List<StockItem> _stock = [];

  @override
  void initState() {
    super.initState();
    _loadStock();
  }

  Future<void> _loadStock() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.usuario?.token ?? await authProvider.getSavedToken();
      if (token == null) {
        throw Exception('Token no encontrado');
      }

      final response = await http.get(
        Uri.parse(ApiConfig.stock),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw Exception('Error ${response.statusCode}: ${response.body}');
      }

      final decoded = jsonDecode(response.body);
      final items = decoded is List
          ? decoded.map((e) => e as Map<String, dynamic>).toList()
          : decoded is Map && decoded['data'] is List
              ? (decoded['data'] as List).map((e) => e as Map<String, dynamic>).toList()
              : <Map<String, dynamic>>[];

      if (!mounted) return;
      setState(() {
        _stock = items.map((item) => StockItem.fromJson(item)).toList();
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error cargando stock: $e');
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalItems = _stock.length;
    final totalUnidades = _stock.fold<int>(0, (sum, item) => sum + item.cantidad);
    final bajoStock = _stock.where((item) => item.isBajo).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      appBar: AppBar(
        backgroundColor: const Color(0xFF3D7B2C),
        foregroundColor: Colors.white,
        title: const Text('Stock', style: TextStyle(fontWeight: FontWeight.w700)),
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Actualizar',
            onPressed: _loadStock,
            icon: const Icon(Icons.refresh_rounded),
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF3D7B2C))),
              )
            : _error != null
                ? _buildError()
                : RefreshIndicator(
                    color: const Color(0xFF3D7B2C),
                    onRefresh: _loadStock,
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildHeaderCard(),
                          const SizedBox(height: 16),
                          _buildSummaryCards(totalItems, totalUnidades, bajoStock),
                          const SizedBox(height: 16),
                          _buildStockList(),
                        ],
                      ),
                    ),
                  ),
      ),
      bottomNavigationBar: _buildBottomMenu(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text('No se pudo cargar el stock.\n$_error', textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF4B5563))),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadStock,
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3D7B2C), foregroundColor: Colors.white),
              child: const Text('Reintentar'),
            ),
          ],
        ),
      ),
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
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 18, offset: const Offset(0, 10)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: const Color(0xFFE8F7E5),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.inventory_2_rounded, color: Color(0xFF3D7B2C), size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Control de inventario',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1F3D24)),
                ),
                SizedBox(height: 4),
                Text(
                  'Stock actualizado desde la base de datos',
                  style: TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCards(int totalItems, int totalUnidades, int bajoStock) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 680;
        return GridView(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: isWide ? 3 : 1,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: isWide ? 2.8 : 2.2,
          ),
          children: [
            _buildSummaryCard(
              title: 'Productos',
              value: totalItems.toString(),
              icon: Icons.widgets_rounded,
              color: const Color(0xFFE8F7E5),
            ),
            _buildSummaryCard(
              title: 'Unidades',
              value: totalUnidades.toString(),
              icon: Icons.storage_rounded,
              color: const Color(0xFFF9FBEF),
            ),
            _buildSummaryCard(
              title: 'Bajo stock',
              value: bajoStock.toString(),
              icon: Icons.warning_amber_rounded,
              color: const Color(0xFFFFF1F0),
            ),
          ],
        );
      },
    );
  }

  Widget _buildSummaryCard({required String title, required String value, required IconData icon, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: const Color(0xFF3D7B2C)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(title, style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563))),
                const SizedBox(height: 4),
                Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFF1F3D24))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStockList() {
    if (_stock.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(vertical: 40),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
        ),
        child: const Center(
          child: Column(
            children: [
              Icon(Icons.inventory_2_outlined, size: 48, color: Color(0xFFD1D5DB)),
              SizedBox(height: 12),
              Text('No hay registros de stock'),
            ],
          ),
        ),
      );
    }

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 18, offset: const Offset(0, 10)),
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minWidth: 700),
          child: DataTable(
            headingRowColor: MaterialStateProperty.all(const Color(0xFF76C776)),
            headingTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
            dataRowHeight: 72,
            columnSpacing: 18,
            dividerThickness: 0,
            columns: const [
              DataColumn(label: Text('PRODUCTO')),
              DataColumn(label: Text('CATEGORÍA')),
              DataColumn(label: Text('STOCK')),
              DataColumn(label: Text('MÍNIMO')),
              DataColumn(label: Text('ESTADO')),
            ],
            rows: _stock.map((item) {
              return DataRow(cells: [
                DataCell(
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(item.nombre, style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF1F3D24))),
                      if (item.marca != null)
                        Text(item.marca!, style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
                    ],
                  ),
                ),
                DataCell(Text(item.categoria)),
                DataCell(Text(item.cantidad.toString(), style: const TextStyle(fontWeight: FontWeight.w700))),
                DataCell(Text(item.nivelMinimo.toString())),
                DataCell(_buildStatusChip(item)),
              ]);
            }).toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusChip(StockItem item) {
    final isLow = item.isBajo;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: isLow ? const Color(0xFFFFF1F0) : const Color(0xFFE7F3DE),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        isLow ? 'Bajo' : 'Normal',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: isLow ? const Color(0xFFD14343) : const Color(0xFF3D7B2C),
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
              _buildBottomMenuItem(Icons.inventory_2_rounded, 'Inventario', false, () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const InventoryScreen()),
                );
              }),
              _buildBottomMenuItem(Icons.bar_chart_rounded, 'Reportes', false, () {
                final authProvider = Provider.of<AuthProvider>(context, listen: false);
                final String? token = authProvider.usuario?.token;
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => ReportesScreen(token: token)),
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
