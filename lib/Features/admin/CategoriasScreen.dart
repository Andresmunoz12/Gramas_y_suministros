import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:provider/provider.dart';
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/Features/catalog/CatalogScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/InventoryScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/ReportesScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/UsersScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/ProveedoresScreen.dart';

class CategoriaItem {
  final int id;
  final String nombre;
  final String descripcion;
  final int totalProductos;
  final bool activa;

  CategoriaItem({
    required this.id,
    required this.nombre,
    required this.descripcion,
    required this.totalProductos,
    required this.activa,
  });

  factory CategoriaItem.fromJson(Map<String, dynamic> json) {
    int count = 0;
    if (json['productos'] is List) {
      count = (json['productos'] as List).length;
    } else if (json['totalProductos'] != null) {
      count = int.tryParse(json['totalProductos'].toString()) ?? 0;
    } else if (json['count_productos'] != null) {
      count = int.tryParse(json['count_productos'].toString()) ?? 0;
    }

    final estadoStr = json['estado']?.toString() ?? 'Activa';
    final bool isActiva = json['activa'] == true || estadoStr.toLowerCase() == 'activa';

    return CategoriaItem(
      id: json['id_categoria'] ?? json['id'] ?? 0,
      nombre: json['nombre']?.toString() ?? '',
      descripcion: json['descripcion']?.toString() ?? '',
      totalProductos: count,
      activa: isActiva,
    );
  }
}

class CategoriasScreen extends StatefulWidget {
  const CategoriasScreen({super.key});

  @override
  State<CategoriasScreen> createState() => _CategoriasScreenState();
}

class _CategoriasScreenState extends State<CategoriasScreen> {
  List<CategoriaItem> _categorias = [];
  List<CategoriaItem> _filtered = [];
  bool _isLoading = true;
  String? _error;

  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadCategorias();
    _searchController.addListener(_applySearch);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadCategorias() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final token = auth.usuario?.token ?? await auth.getSavedToken();

      if (token == null) throw Exception('Token no encontrado');

      final response = await http.get(
        Uri.parse(ApiConfig.categorias),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = jsonDecode(response.body) as List<dynamic>;
        final items = jsonList.map((j) => CategoriaItem.fromJson(j as Map<String, dynamic>)).toList();
        setState(() {
          _categorias = items;
          _filtered = items;
          _isLoading = false;
        });
      } else {
        throw Exception('Error ${response.statusCode}');
      }
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('Exception:', '').trim();
        _isLoading = false;
      });
      debugPrint('Error cargando categorías: $e');
    }
  }

  void _applySearch() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _filtered = _categorias.where((c) {
        return c.nombre.toLowerCase().contains(query) ||
            c.descripcion.toLowerCase().contains(query);
      }).toList();
    });
  }

  // ── Modales Agregar / Editar ─────────────────────
  void _openCategoriaModal([CategoriaItem? item]) {
    final isEdit = item != null;
    final nombreCtrl = TextEditingController(text: item?.nombre ?? '');
    final descripcionCtrl = TextEditingController(text: item?.descripcion ?? '');

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          isEdit ? 'Editar Categoría' : 'Agregar Categoría',
          style: const TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF1F3D24)),
        ),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildModalField('Nombre de Categoría', nombreCtrl, Icons.category),
              const SizedBox(height: 12),
              _buildModalField('Descripción', descripcionCtrl, Icons.description, maxLines: 3),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3D7B2C),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              await _saveCategoria(
                id: item?.id,
                nombre: nombreCtrl.text.trim(),
                descripcion: descripcionCtrl.text.trim(),
              );
            },
            child: Text(isEdit ? 'Guardar' : 'Agregar', style: const TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildModalField(String label, TextEditingController controller, IconData icon, {int maxLines = 1}) {
    return TextField(
      controller: controller,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: const Color(0xFF3D7B2C), size: 20),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }

  Future<void> _saveCategoria({
    int? id,
    required String nombre,
    required String descripcion,
  }) async {
    if (nombre.isEmpty) {
      _showSnack('El nombre de la categoría es obligatorio', success: false);
      return;
    }
    if (nombre.length < 3) {
      _showSnack('El nombre debe tener al menos 3 caracteres', success: false);
      return;
    }

    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final token = auth.usuario?.token ?? await auth.getSavedToken();
      if (token == null) throw Exception('Token no encontrado');

      final bodyData = {
        'nombre': nombre,
        'descripcion': descripcion.isNotEmpty ? descripcion : 'Sin descripción',
      };

      http.Response response;
      if (id != null) {
        // Editar
        response = await http.put(
          Uri.parse('${ApiConfig.categorias}/$id'),
          headers: {
            'Authorization': 'Bearer $token',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: jsonEncode(bodyData),
        );
      } else {
        // Crear
        response = await http.post(
          Uri.parse(ApiConfig.categorias),
          headers: {
            'Authorization': 'Bearer $token',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: jsonEncode(bodyData),
        );
      }

      if (response.statusCode == 200 || response.statusCode == 201) {
        _showSnack(id != null ? 'Categoría actualizada' : 'Categoría agregada', success: true);
        _loadCategorias();
      } else {
        final resBody = jsonDecode(response.body);
        final msg = resBody['message'] is List ? (resBody['message'] as List).join(', ') : resBody['message']?.toString();
        throw Exception(msg ?? 'Error ${response.statusCode}');
      }
    } catch (e) {
      _showSnack('Error: ${e.toString().replaceAll('Exception:', '').trim()}', success: false);
    }
  }

  Future<void> _eliminarCategoria(CategoriaItem item) async {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(children: const [
          Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 28),
          SizedBox(width: 10),
          Text('Confirmar eliminación', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF1F3D24))),
        ]),
        content: Text('¿Eliminar la categoría "${item.nombre}"? Esta acción no se puede deshacer.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                final auth = Provider.of<AuthProvider>(context, listen: false);
                final token = auth.usuario?.token ?? await auth.getSavedToken();
                if (token == null) throw Exception('Token no encontrado');

                final response = await http.delete(
                  Uri.parse('${ApiConfig.categorias}/${item.id}'),
                  headers: {
                    'Authorization': 'Bearer $token',
                    'Accept': 'application/json',
                  },
                );

                if (response.statusCode == 200 || response.statusCode == 204) {
                  _showSnack('Categoría eliminada', success: true);
                  _loadCategorias();
                } else {
                  throw Exception('Error ${response.statusCode}');
                }
              } catch (e) {
                _showSnack('Error al eliminar categoría: $e', success: false);
              }
            },
            child: const Text('Eliminar', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showSnack(String msg, {required bool success}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: success ? const Color(0xFF3D7B2C) : Colors.red,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final totalCategorias = _categorias.length;
    final conProductos = _categorias.where((c) => c.totalProductos > 0).length;
    final sinProductos = totalCategorias - conProductos;
    final porcentajeUso = totalCategorias == 0 ? 0 : ((conProductos / totalCategorias) * 100).round();

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      appBar: AppBar(
        backgroundColor: const Color(0xFF3D7B2C),
        foregroundColor: Colors.white,
        title: const Text('Gestión de Categorías', style: TextStyle(fontWeight: FontWeight.w700)),
        elevation: 0,
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF3D7B2C))))
            : _error != null
                ? _buildErrorView()
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Tarjetas de métricas
                        _buildMetricsSection(totalCategorias, conProductos, sinProductos, porcentajeUso),
                        const SizedBox(height: 20),

                        // Encabezado + Botón Agregar Categoría
                        Row(
                          children: [
                            const Expanded(
                              child: Text(
                                'Gestión de Categorías',
                                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Color(0xFF1F3D24)),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton.icon(
                              onPressed: () => _openCategoriaModal(),
                              icon: const Icon(Icons.add, size: 16),
                              label: const FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Text('Agregar Categoría', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF007AFF),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Buscador
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4)),
                            ],
                          ),
                          child: TextField(
                            controller: _searchController,
                            decoration: InputDecoration(
                              hintText: 'Buscar categoría por nombre o descripción...',
                              prefixIcon: const Icon(Icons.search, color: Color(0xFF3D7B2C)),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(vertical: 14),
                              suffixIcon: _searchController.text.isNotEmpty
                                  ? IconButton(icon: const Icon(Icons.clear), onPressed: () => _searchController.clear())
                                  : null,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Tabla de Categorías
                        _filtered.isEmpty ? _buildEmptyState() : _buildCategoriaTable(_filtered),
                      ],
                    ),
                  ),
      ),
      bottomNavigationBar: _buildBottomMenu(),
    );
  }

  Widget _buildMetricsSection(int total, int conProductos, int sinProductos, int porcentaje) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isWide = constraints.maxWidth > 500;
        return GridView.count(
          crossAxisCount: isWide ? 4 : 2,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
          childAspectRatio: isWide ? 1.8 : 1.7,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          children: [
            _buildMetricCard(total.toString(), 'TOTAL CATEGORÍAS'),
            _buildMetricCard(conProductos.toString(), 'CON PRODUCTOS'),
            _buildMetricCard(sinProductos.toString(), 'SIN PRODUCTOS'),
            _buildMetricCard('$porcentaje%', '% USO'),
          ],
        );
      },
    );
  }

  Widget _buildMetricCard(String value, String title) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            value,
            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: Color(0xFF3D7B2C)),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF6B7280)),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildCategoriaTable(List<CategoriaItem> items) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowColor: MaterialStateProperty.all(const Color(0xFFF9FAFB)),
          headingTextStyle: const TextStyle(color: Color(0xFF374151), fontWeight: FontWeight.bold, fontSize: 12),
          dataRowHeight: 64,
          columns: const [
            DataColumn(label: Text('ID')),
            DataColumn(label: Text('NOMBRE')),
            DataColumn(label: Text('DESCRIPCIÓN')),
            DataColumn(label: Text('PRODUCTOS')),
            DataColumn(label: Text('ESTADO')),
            DataColumn(label: Text('ACCIONES')),
          ],
          rows: items.map((c) {
            return DataRow(cells: [
              DataCell(Text('${c.id}', style: const TextStyle(fontWeight: FontWeight.bold))),
              DataCell(Text(c.nombre, style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1F3D24)))),
              DataCell(Container(
                constraints: const BoxConstraints(maxWidth: 220),
                child: Text(c.descripcion, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Color(0xFF4B5563))),
              )),
              DataCell(Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F7E4),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '${c.totalProductos}',
                  style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2D5A27)),
                ),
              )),
              DataCell(Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFE8F7E4),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'Activa',
                  style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2D5A27), fontSize: 12),
                ),
              )),
              DataCell(Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  OutlinedButton(
                    onPressed: () => _openCategoriaModal(c),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      minimumSize: const Size(60, 30),
                      side: const BorderSide(color: Color(0xFFD1D5DB)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Editar', style: TextStyle(fontSize: 11, color: Color(0xFF374151))),
                  ),
                  const SizedBox(width: 6),
                  ElevatedButton(
                    onPressed: () => _eliminarCategoria(c),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFFE5E5),
                      foregroundColor: Colors.red,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      minimumSize: const Size(60, 30),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Eliminar', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ],
              )),
            ]);
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Column(
          children: const [
            Icon(Icons.category_outlined, size: 48, color: Color(0xFF9CA3AF)),
            SizedBox(height: 12),
            Text('No hay categorías registradas', style: TextStyle(color: Color(0xFF6B7280))),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: 12),
          Text('Error: $_error'),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _loadCategorias,
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3D7B2C), foregroundColor: Colors.white),
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
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
              _buildNavItem(Icons.grid_view_rounded, 'Catálogo', false,
                  () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const CatalogScreen()))),
              _buildNavItem(Icons.people_alt_rounded, 'Usuarios', false,
                  () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const UsersScreen()))),
              _buildNavItem(Icons.business_rounded, 'Proveedores', false,
                  () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const ProveedoresScreen()))),
              _buildNavItem(Icons.inventory_2_rounded, 'Inventario', false,
                  () => Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => const InventoryScreen()))),
              _buildNavItem(Icons.bar_chart_rounded, 'Reportes', false, () {
                final authProvider = Provider.of<AuthProvider>(context, listen: false);
                final String? token = authProvider.usuario?.token;
                Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => ReportesScreen(token: token)));
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, bool active, VoidCallback onTap) {
    final color = active ? const Color(0xFF3D7B2C) : const Color(0xFF9CA3AF);
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 2),
          Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: active ? FontWeight.w700 : FontWeight.w500)),
        ],
      ),
    );
  }
}
