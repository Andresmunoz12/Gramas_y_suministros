import 'package:flutter/material.dart';
import 'package:gramas_y_suministros_movil/Features/admin/InventoryScreen.dart';
import 'package:gramas_y_suministros_movil/Features/catalog/CatalogScreen.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:provider/provider.dart';
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';

// ─────────────────────────────────────────────
// Modelo local de usuario para la pantalla
// ─────────────────────────────────────────────
class AdminUser {
  final int id;
  final String nombre;
  final String apellido;
  final String email;
  final int idRol;
  final bool activo;
  final Map<String, dynamic> rawData;

  const AdminUser({
    required this.id,
    required this.nombre,
    required this.apellido,
    required this.email,
    required this.idRol,
    required this.activo,
    required this.rawData,
  });

  String get nombreCompleto => '$nombre $apellido';

  String get rolLabel {
    switch (idRol) {
      case 1:
        return 'Admin';
      case 2:
        return 'Cliente';
      case 3:
        return 'Bodega';
      default:
        return 'Desconocido';
    }
  }

  factory AdminUser.fromJson(Map<String, dynamic> json) {
    final estado = json['estado']?.toString() ?? '';
    final bool active = estado == 'activo';
    return AdminUser(
      id: json['id_usuario'] ?? json['id'] ?? 0,
      nombre: json['nombre']?.toString() ?? '',
      apellido: json['apellido']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      idRol: json['id_rol'] ?? json['idRol'] ?? json['rol'] ?? 2,
      activo: active,
      rawData: json,
    );
  }
}

// ─────────────────────────────────────────────
// Pantalla principal
// ─────────────────────────────────────────────
class UsersScreen extends StatefulWidget {
  const UsersScreen({super.key});

  @override
  State<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends State<UsersScreen> {
  List<AdminUser> _users = [];
  List<AdminUser> _filtered = [];
  bool _isLoading = true;
  String? _error;
  int _currentPage = 1;
  final int _pageSize = 8;

  // Filtros
  final TextEditingController _searchController = TextEditingController();
  String _rolFilter = 'Todos';
  final List<String> _rolOptions = ['Todos', 'Admin', 'Cliente', 'Bodega'];

  @override
  void initState() {
    super.initState();
    _loadUsers();
    _searchController.addListener(_applyFilters);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // ── Carga ──────────────────────────────────
  Future<void> _loadUsers() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _currentPage = 1;
    });

    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final token = auth.usuario?.token ?? await auth.getSavedToken();

      if (token == null) throw Exception('Token no encontrado');

      final response = await http.get(
        Uri.parse(ApiConfig.users),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> jsonList =
            jsonDecode(response.body) as List<dynamic>;
        final users = jsonList
            .map((j) => AdminUser.fromJson(j as Map<String, dynamic>))
            .toList();
        setState(() {
          _users = users;
          _filtered = users;
          _isLoading = false;
        });
      } else {
        throw Exception('Error ${response.statusCode}');
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
      debugPrint('Error cargando usuarios: $e');
    }
  }

  // ── Filtros ────────────────────────────────
  void _applyFilters() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _currentPage = 1;
      _filtered = _users.where((u) {
        final matchSearch = u.nombreCompleto.toLowerCase().contains(query) ||
            u.email.toLowerCase().contains(query);
        final matchRol =
            _rolFilter == 'Todos' || u.rolLabel == _rolFilter;
        return matchSearch && matchRol;
      }).toList();
    });
  }

  void _onRolFilterChanged(String? value) {
    if (value == null) return;
    _rolFilter = value;
    _applyFilters();
  }

  // ── Acciones ───────────────────────────────
  Future<void> _toggleActivo(AdminUser user) async {
    final nuevoEstado = user.activo ? 'inactivo' : 'activo';
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final token = auth.usuario?.token ?? await auth.getSavedToken();
      if (token == null) throw Exception('Token no encontrado');

      final response = await http.patch(
        Uri.parse('${ApiConfig.users}/${user.id}/estado'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({'estado': nuevoEstado}),
      );

      if (response.statusCode == 200) {
        _showSnack(
          '${user.nombreCompleto} ${nuevoEstado == 'activo' ? 'activado' : 'desactivado'} correctamente',
          success: true,
        );
        _loadUsers();
      } else {
        throw Exception('Error ${response.statusCode}');
      }
    } catch (e) {
      _showSnack('Error: $e', success: false);
    }
  }

  Future<void> _eliminarUsuario(AdminUser user) async {
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final token = auth.usuario?.token ?? await auth.getSavedToken();
      if (token == null) throw Exception('Token no encontrado');

      final response = await http.delete(
        Uri.parse('${ApiConfig.users}/${user.id}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200 || response.statusCode == 204) {
        _showSnack('${user.nombreCompleto} eliminado correctamente',
            success: true);
        _loadUsers();
      } else {
        throw Exception('Error ${response.statusCode}');
      }
    } catch (e) {
      _showSnack('Error al eliminar: $e', success: false);
    }
  }

  void _confirmarEliminar(AdminUser user) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: Colors.white,
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(children: const [
          Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 28),
          SizedBox(width: 10),
          Text(
            'Confirmar eliminación',
            style: TextStyle(
                fontWeight: FontWeight.w800, color: Color(0xFF1F3D24)),
          ),
        ]),
        content: Text(
          '¿Eliminar permanentemente a "${user.nombreCompleto}"? Esta acción no se puede deshacer.',
          style: const TextStyle(color: Color(0xFF4B5563)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancelar',
                style: TextStyle(
                    color: Colors.grey, fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.of(context).pop();
              _eliminarUsuario(user);
            },
            child: const Text('Eliminar',
                style: TextStyle(fontWeight: FontWeight.w700)),
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

  // ── Build ──────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final total = _filtered.length;
    final start = total == 0 ? 0 : (_currentPage - 1) * _pageSize;
    final end = (start + _pageSize) > total ? total : start + _pageSize;
    final visible = total == 0 ? <AdminUser>[] : _filtered.sublist(start, end);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      appBar: AppBar(
        backgroundColor: const Color(0xFF3D7B2C),
        foregroundColor: Colors.white,
        title: const Text('Gestión de Usuarios',
            style: TextStyle(fontWeight: FontWeight.w700)),
        elevation: 0,
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(
                        Color(0xFF3D7B2C))),
              )
            : _error != null
                ? _buildError()
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildHeaderCard(),
                        const SizedBox(height: 20),
                        _buildSearchAndFilter(),
                        const SizedBox(height: 20),
                        _filtered.isEmpty
                            ? _buildEmptyState()
                            : _buildUserTable(visible),
                        const SizedBox(height: 16),
                        Center(
                          child: Column(
                            children: [
                              Text(
                                'Mostrando ${visible.length} de $total usuarios',
                                style: const TextStyle(
                                    fontSize: 14,
                                    color: Color(0xFF6B7280)),
                              ),
                              const SizedBox(height: 16),
                              _buildPagination(),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),
                      ],
                    ),
                  ),
      ),
      bottomNavigationBar: _buildBottomMenu(),
    );
  }

  // ── Widgets ────────────────────────────────

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: 16),
          Text('Error: $_error',
              style: const TextStyle(color: Color(0xFF4B5563))),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadUsers,
            style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3D7B2C),
                foregroundColor: Colors.white),
            child: const Text('Reintentar'),
          ),
        ],
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
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 18,
              offset: const Offset(0, 10)),
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
            child: const Icon(Icons.people_alt_rounded,
                color: Color(0xFF3D7B2C), size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Usuarios Registrados',
                  style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1F3D24)),
                ),
                const SizedBox(height: 4),
                Text(
                  '${_users.length} usuarios en el sistema',
                  style: const TextStyle(
                      fontSize: 13, color: Color(0xFF6B7280)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchAndFilter() {
    return Row(
      children: [
        // Campo de búsqueda
        Expanded(
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 12,
                    offset: const Offset(0, 4)),
              ],
            ),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Buscar por nombre o email…',
                hintStyle:
                    const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
                prefixIcon: const Icon(Icons.search,
                    color: Color(0xFF3D7B2C)),
                border: InputBorder.none,
                contentPadding:
                    const EdgeInsets.symmetric(vertical: 14),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear,
                            color: Color(0xFF9CA3AF)),
                        onPressed: () {
                          _searchController.clear();
                        },
                      )
                    : null,
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Filtro de rol
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 12,
                  offset: const Offset(0, 4)),
            ],
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: _rolFilter,
              icon: const Icon(Icons.filter_list_rounded,
                  color: Color(0xFF3D7B2C)),
              style: const TextStyle(
                  color: Color(0xFF1F3D24),
                  fontWeight: FontWeight.w600,
                  fontSize: 14),
              onChanged: _onRolFilterChanged,
              items: _rolOptions
                  .map((r) =>
                      DropdownMenuItem(value: r, child: Text(r)))
                  .toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Column(
          children: const [
            Icon(Icons.person_search, size: 54, color: Color(0xFFD1D5DB)),
            SizedBox(height: 16),
            Text('No se encontraron usuarios',
                style:
                    TextStyle(fontSize: 16, color: Color(0xFF6B7280))),
          ],
        ),
      ),
    );
  }

  Widget _buildUserTable(List<AdminUser> visible) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 18,
              offset: const Offset(0, 10)),
        ],
      ),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          headingRowColor:
              MaterialStateProperty.all(const Color(0xFF76C776)),
          headingTextStyle: const TextStyle(
              color: Colors.white, fontWeight: FontWeight.w700),
          dataRowHeight: 68,
          dividerThickness: 0,
          columns: const [
            DataColumn(label: Text('ID')),
            DataColumn(label: Text('NOMBRE')),
            DataColumn(label: Text('EMAIL')),
            DataColumn(label: Text('ROL')),
            DataColumn(label: Text('ESTADO')),
            DataColumn(label: Text('ACCIONES')),
          ],
          rows: visible.map((user) {
            return DataRow(cells: [
              DataCell(Text(
                user.id.toString(),
                style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1F3D24)),
              )),
              DataCell(Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    user.nombreCompleto,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF1F3D24),
                        fontSize: 14),
                  ),
                ],
              )),
              DataCell(Text(user.email,
                  style: const TextStyle(
                      color: Color(0xFF4B5563), fontSize: 13))),
              DataCell(_buildRolChip(user.rolLabel, user.idRol)),
              DataCell(_buildEstadoChip(user.activo)),
              DataCell(Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Activar / Desactivar
                  user.activo
                      ? _buildActionBtn(
                          'Desactivar',
                          const Color(0xFFD14343),
                          () => _toggleActivo(user),
                        )
                      : _buildActionBtn(
                          'Activar',
                          const Color(0xFF3D7B2C),
                          () => _toggleActivo(user),
                        ),
                  const SizedBox(width: 8),
                  _buildActionBtn(
                    'Eliminar',
                    const Color(0xFFC62828),
                    () => _confirmarEliminar(user),
                  ),
                ],
              )),
            ]);
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildRolChip(String label, int idRol) {
    Color bg;
    Color fg;
    IconData icon;

    switch (idRol) {
      case 1:
        bg = const Color(0xFFFFF3CD);
        fg = const Color(0xFF92600A);
        icon = Icons.admin_panel_settings_rounded;
        break;
      case 3:
        bg = const Color(0xFFE0F0FF);
        fg = const Color(0xFF1565C0);
        icon = Icons.warehouse_rounded;
        break;
      default:
        bg = const Color(0xFFE8F7E5);
        fg = const Color(0xFF3D7B2C);
        icon = Icons.person_rounded;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(14)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 13, color: fg),
          const SizedBox(width: 5),
          Text(label,
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: fg)),
        ],
      ),
    );
  }

  Widget _buildEstadoChip(bool activo) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: activo
            ? const Color(0xFFE7F3DE)
            : const Color(0xFFFCE8E6),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        activo ? 'ACTIVO' : 'INACTIVO',
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w700,
          color: activo
              ? const Color(0xFF3D7B2C)
              : const Color(0xFFA83232),
        ),
      ),
    );
  }

  Widget _buildActionBtn(
      String label, Color color, VoidCallback onTap) {
    return TextButton(
      style: TextButton.styleFrom(
        backgroundColor: color,
        minimumSize: const Size(88, 34),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14)),
      ),
      onPressed: onTap,
      child: Text(label,
          style: const TextStyle(
              fontSize: 12, fontWeight: FontWeight.w700)),
    );
  }

  // ── Paginación ─────────────────────────────
  Widget _buildPagination() {
    final totalPages = (_filtered.length / _pageSize).ceil();
    final maxPages = totalPages < 1 ? 1 : totalPages;

    return Container(
      padding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 14,
              offset: const Offset(0, 6)),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildPageBtn('<',
              _currentPage > 1
                  ? () => setState(() => _currentPage--)
                  : null),
          const SizedBox(width: 10),
          for (int i = 1; i <= maxPages; i++) ...[
            _buildPageNum(i, selected: _currentPage == i,
                onTap: () => setState(() => _currentPage = i)),
            if (i < maxPages) const SizedBox(width: 8),
          ],
          const SizedBox(width: 10),
          _buildPageBtn('>',
              _currentPage < maxPages
                  ? () => setState(() => _currentPage++)
                  : null),
        ],
      ),
    );
  }

  Widget _buildPageBtn(String label, VoidCallback? onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Opacity(
        opacity: onTap != null ? 1.0 : 0.4,
        child: Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFFE7F3DE),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Text(label,
              style: const TextStyle(
                  color: Color(0xFF3D7B2C),
                  fontWeight: FontWeight.w700)),
        ),
      ),
    );
  }

  Widget _buildPageNum(int page,
      {bool selected = false, required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 34,
        height: 34,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF3D7B2C)
              : const Color(0xFFF5F8F2),
          borderRadius: BorderRadius.circular(12),
          border:
              selected ? null : Border.all(color: const Color(0xFFD1D5DB)),
        ),
        child: Text(
          page.toString(),
          style: TextStyle(
              color: selected ? Colors.white : const Color(0xFF4B5563),
              fontWeight: FontWeight.w700),
        ),
      ),
    );
  }

  // ── Bottom Nav ─────────────────────────────
  Widget _buildBottomMenu() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 12,
              offset: const Offset(0, -3)),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(Icons.grid_view_rounded, 'Catálogo', false,
                  () => Navigator.pushReplacement(context,
                      MaterialPageRoute(
                          builder: (_) => const CatalogScreen()))),
              _buildNavItem(
                  Icons.people_alt_rounded, 'Usuarios', true, () {}),
              _buildNavItem(Icons.inventory_2_rounded, 'Inventario', false,
                  () => Navigator.pushReplacement(context,
                      MaterialPageRoute(
                          builder: (_) => const InventoryScreen()))),
              _buildNavItem(Icons.storage_rounded, 'Stock', false, () {
                ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Sección de Stock')));
              }),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(
      IconData icon, String label, bool selected, VoidCallback onTap) {
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
                color: selected
                    ? const Color(0xFF3D7B2C)
                    : const Color(0xFFF5F8F2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon,
                  color:
                      selected ? Colors.white : const Color(0xFF4B5563),
                  size: 22),
            ),
            const SizedBox(height: 6),
            Text(
              label,
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: selected
                      ? const Color(0xFF3D7B2C)
                      : const Color(0xFF6B7280)),
            ),
          ],
        ),
      ),
    );
  }
}
