import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:gramas_y_suministros_movil/Features/admin/InventoryScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/UsersScreen.dart';
import 'package:gramas_y_suministros_movil/Features/catalog/CatalogScreen.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';

class ReportMetric {
  final String title;
  final String value;
  final IconData icon;
  final Color backgroundColor;

  const ReportMetric({
    required this.title,
    required this.value,
    required this.icon,
    required this.backgroundColor,
  });
}

class ReportesScreen extends StatefulWidget {
  const ReportesScreen({super.key});

  @override
  State<ReportesScreen> createState() => _ReportesScreenState();
}

class _ReportesScreenState extends State<ReportesScreen> {
  bool _isLoading = true;
  String? _error;

  DateTime _inicio = DateTime.now().subtract(const Duration(days: 30));
  DateTime _fin = DateTime.now();

  Map<String, dynamic> _resumen = {};
  List<dynamic> _usuariosNuevos = [];
  List<dynamic> _productosNuevos = [];
  List<dynamic> _stockCritico = [];
  List<dynamic> _usuariosEnLinea = [];

  @override
  void initState() {
    super.initState();
    _loadReportes();
  }

  Future<void> _loadReportes() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final token = auth.usuario?.token ?? await auth.getSavedToken();
      if (token == null) throw Exception('Token no encontrado');

      final headers = {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      };

      final inicio = _formatDate(_inicio);
      final fin = _formatDate(_fin);

      final responses = await Future.wait([
        http.get(Uri.parse('${ApiConfig.reportes}/resumen'), headers: headers),
        http.get(
          Uri.parse('${ApiConfig.reportes}/usuarios/nuevos?inicio=$inicio&fin=$fin'),
          headers: headers,
        ),
        http.get(
          Uri.parse('${ApiConfig.reportes}/productos/nuevos?inicio=$inicio&fin=$fin'),
          headers: headers,
        ),
        http.get(Uri.parse('${ApiConfig.reportes}/stock-critico'), headers: headers),
        http.get(Uri.parse('${ApiConfig.reportes}/usuarios-en-linea'), headers: headers),
      ]);

      for (final response in responses) {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          throw Exception('Error ${response.statusCode}: ${response.body}');
        }
      }

      if (!mounted) return;
      setState(() {
        _resumen = _asMap(jsonDecode(responses[0].body));
        _usuariosNuevos = _asList(jsonDecode(responses[1].body));
        _productosNuevos = _asList(jsonDecode(responses[2].body));
        _stockCritico = _asList(jsonDecode(responses[3].body));
        _usuariosEnLinea = _asList(jsonDecode(responses[4].body));
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error cargando reportes: $e');
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) return value;
    if (value is Map) return Map<String, dynamic>.from(value);
    return {};
  }

  List<dynamic> _asList(dynamic value) {
    if (value is List) return value;
    if (value is Map) {
      for (final key in ['data', 'items', 'resultados', 'usuarios', 'productos']) {
        final nested = value[key];
        if (nested is List) return nested;
      }
      return [value];
    }
    return [];
  }

  String _formatDate(DateTime date) {
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '${date.year}-$month-$day';
  }

  String _metricValue(List<String> keys, String fallback) {
    for (final key in keys) {
      final value = _resumen[key];
      if (value != null) return value.toString();
    }
    return fallback;
  }

  List<ReportMetric> get _metrics => [
        ReportMetric(
          title: 'Usuarios nuevos',
          value: _metricValue(['usuariosNuevos', 'usuarios_nuevos', 'nuevosUsuarios'], _usuariosNuevos.length.toString()),
          icon: Icons.person_add_alt_1_rounded,
          backgroundColor: const Color(0xFFE8F7E5),
        ),
        ReportMetric(
          title: 'Productos nuevos',
          value: _metricValue(['productosNuevos', 'productos_nuevos', 'nuevosProductos'], _productosNuevos.length.toString()),
          icon: Icons.add_business_rounded,
          backgroundColor: const Color(0xFFF9FBEF),
        ),
        ReportMetric(
          title: 'Stock critico',
          value: _metricValue(['stockCritico', 'stock_critico', 'productosStockCritico'], _stockCritico.length.toString()),
          icon: Icons.warning_amber_rounded,
          backgroundColor: const Color(0xFFFFF1F0),
        ),
        ReportMetric(
          title: 'Usuarios en linea',
          value: _metricValue(['usuariosEnLinea', 'usuarios_en_linea', 'online'], _usuariosEnLinea.length.toString()),
          icon: Icons.online_prediction_rounded,
          backgroundColor: const Color(0xFFE0F0FF),
        ),
      ];

  Future<void> _pickRange() async {
    final range = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now().add(const Duration(days: 1)),
      initialDateRange: DateTimeRange(start: _inicio, end: _fin),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: Theme.of(context).colorScheme.copyWith(
                  primary: const Color(0xFF3D7B2C),
                  onPrimary: Colors.white,
                ),
          ),
          child: child!,
        );
      },
    );

    if (range == null) return;
    setState(() {
      _inicio = range.start;
      _fin = range.end;
    });
    _loadReportes();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      appBar: AppBar(
        backgroundColor: const Color(0xFF3D7B2C),
        foregroundColor: Colors.white,
        title: const Text('Reportes', style: TextStyle(fontWeight: FontWeight.w700)),
        elevation: 0,
        actions: [
          IconButton(
            tooltip: 'Actualizar',
            onPressed: _loadReportes,
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
                    onRefresh: _loadReportes,
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildHeaderCard(),
                          const SizedBox(height: 20),
                          _buildMetrics(),
                          const SizedBox(height: 20),
                          _buildSection(
                            title: 'Usuarios nuevos',
                            icon: Icons.person_add_alt_1_rounded,
                            items: _usuariosNuevos,
                            emptyText: 'No hay usuarios nuevos en este periodo',
                          ),
                          const SizedBox(height: 16),
                          _buildSection(
                            title: 'Productos nuevos',
                            icon: Icons.add_business_rounded,
                            items: _productosNuevos,
                            emptyText: 'No hay productos nuevos en este periodo',
                          ),
                          const SizedBox(height: 16),
                          _buildSection(
                            title: 'Stock critico',
                            icon: Icons.warning_amber_rounded,
                            items: _stockCritico,
                            emptyText: 'No hay productos con stock critico',
                          ),
                          const SizedBox(height: 16),
                          _buildSection(
                            title: 'Usuarios en linea',
                            icon: Icons.online_prediction_rounded,
                            items: _usuariosEnLinea,
                            emptyText: 'No hay usuarios en linea',
                          ),
                          const SizedBox(height: 20),
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
            Text('Error: $_error', textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF4B5563))),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadReportes,
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
            child: const Icon(Icons.bar_chart_rounded, color: Color(0xFF3D7B2C), size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Resumen administrativo',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1F3D24)),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_formatDate(_inicio)} a ${_formatDate(_fin)}',
                  style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Cambiar fechas',
            onPressed: _pickRange,
            icon: const Icon(Icons.date_range_rounded, color: Color(0xFF3D7B2C)),
          ),
        ],
      ),
    );
  }

  Widget _buildMetrics() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 680;
        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _metrics.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: isWide ? 4 : 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: isWide ? 1.55 : 1.35,
          ),
          itemBuilder: (context, index) => _buildMetricCard(_metrics[index]),
        );
      },
    );
  }

  Widget _buildMetricCard(ReportMetric metric) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: metric.backgroundColor,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(14)),
            child: Icon(metric.icon, color: const Color(0xFF3D7B2C)),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(metric.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563))),
              const SizedBox(height: 6),
              Text(metric.value, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Color(0xFF1F3D24))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required IconData icon,
    required List<dynamic> items,
    required String emptyText,
  }) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 18, offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                Icon(icon, color: const Color(0xFF3D7B2C)),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(title, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: Color(0xFF1F3D24))),
                ),
                _buildCountChip(items.length),
              ],
            ),
          ),
          const Divider(height: 1),
          if (items.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 24),
              child: Center(child: Text(emptyText, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFF6B7280)))),
            )
          else
            ...items.take(6).map((item) => _buildReportItem(item)).toList(),
          if (items.length > 6)
            Padding(
              padding: const EdgeInsets.fromLTRB(18, 0, 18, 16),
              child: Text('+ ${items.length - 6} registros adicionales', style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
            ),
        ],
      ),
    );
  }

  Widget _buildCountChip(int count) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: const Color(0xFFE7F3DE), borderRadius: BorderRadius.circular(14)),
      child: Text(
        count.toString(),
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF3D7B2C)),
      ),
    );
  }

  Widget _buildReportItem(dynamic item) {
    final map = item is Map ? Map<String, dynamic>.from(item) : <String, dynamic>{'valor': item};
    final title = _firstValue(map, ['nombre', 'producto', 'email', 'titulo', 'name', 'valor']);
    final subtitle = _firstValue(map, ['apellido', 'categoria', 'marca', 'rol', 'estado', 'fecha_creacion', 'createdAt']);
    final trailing = _firstValue(map, ['stock', 'cantidad', 'existencias', 'precio', 'id_producto', 'id_usuario', 'id']);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: const Color(0xFFF5F8F2), borderRadius: BorderRadius.circular(14)),
                child: const Icon(Icons.analytics_outlined, color: Color(0xFF3D7B2C), size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title.isEmpty ? 'Registro' : title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF1F3D24)),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle.isEmpty ? _compactDetails(map) : subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                    ),
                  ],
                ),
              ),
              if (trailing.isNotEmpty) ...[
                const SizedBox(width: 10),
                Text(trailing, style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF1F3D24))),
              ],
            ],
          ),
        ),
        const Divider(height: 1),
      ],
    );
  }

  String _firstValue(Map<String, dynamic> map, List<String> keys) {
    for (final key in keys) {
      final value = map[key];
      if (value != null && value.toString().trim().isNotEmpty) return value.toString();
    }
    return '';
  }

  String _compactDetails(Map<String, dynamic> map) {
    final entries = map.entries.where((entry) => entry.value != null).take(3);
    return entries.map((entry) => '${entry.key}: ${entry.value}').join('  ');
  }

  Widget _buildBottomMenu() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, -3)),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(Icons.grid_view_rounded, 'Catalogo', false, () {
                Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const CatalogScreen()));
              }),
              _buildNavItem(Icons.people_alt_rounded, 'Usuarios', false, () {
                Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const UsersScreen()));
              }),
              _buildNavItem(Icons.inventory_2_rounded, 'Inventario', false, () {
                Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const InventoryScreen()));
              }),
              _buildNavItem(Icons.bar_chart_rounded, 'Reportes', true, () {
                _loadReportes();
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, bool selected, VoidCallback onTap) {
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
