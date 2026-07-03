import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:gramas_y_suministros_movil/core/network/cotizacion_service.dart';
import 'package:gramas_y_suministros_movil/models/cotizacion.model.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/Features/catalog/CatalogScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/UsersScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/InventoryScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/ReportesScreen.dart';

class GestionCotizacionesScreen extends StatefulWidget {
  const GestionCotizacionesScreen({super.key});

  @override
  State<GestionCotizacionesScreen> createState() => _GestionCotizacionesScreenState();
}

class _GestionCotizacionesScreenState extends State<GestionCotizacionesScreen> {
  final CotizacionService _cotizacionService = CotizacionService();
  List<Cotizacion> _cotizaciones = [];
  Map<String, dynamic>? _estadisticas;
  bool _isLoading = true;
  bool _isActionLoading = false;
  String? _error;
  int _currentPage = 1;
  final int _pageSize = 8;

  // Filtros
  String _filtroEstado = ''; // Vacío = Todos los estados
  DateTime? _fechaInicio;
  DateTime? _fechaFin;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadDatos();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // ── Carga de datos ─────────────────────────
  Future<void> _loadDatos() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final token = auth.usuario?.token ?? await auth.getSavedToken();
      if (token == null) throw Exception('No se encontró el token de autenticación');

      final stats = await _cotizacionService.obtenerEstadisticas(token);
      
      final list = await _cotizacionService.obtenerTodasCotizaciones(
        token: token,
        estado: _filtroEstado.isEmpty ? null : _filtroEstado,
        fechaInicio: _fechaInicio?.toIso8601String(),
        fechaFin: _fechaFin?.toIso8601String(),
        search: _searchController.text.trim().isEmpty ? null : _searchController.text.trim(),
      );

      if (mounted) {
        setState(() {
          _estadisticas = stats;
          _cotizaciones = list;
          _isLoading = false;
          _currentPage = 1; // Reiniciar página al filtrar
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
      debugPrint('Error cargando cotizaciones: $e');
    }
  }

  // ── Formateadores ──────────────────────────
  String formatFecha(DateTime date) {
    final day = date.day.toString().padLeft(2, '0');
    final month = date.month.toString().padLeft(2, '0');
    final year = date.year;
    final hour = date.hour.toString().padLeft(2, '0');
    final minute = date.minute.toString().padLeft(2, '0');
    return '$day/$month/$year $hour:$minute';
  }

  String formatMoneda(double value) {
    final numStr = value.toStringAsFixed(0);
    final buffer = StringBuffer();
    final len = numStr.length;
    for (int i = 0; i < len; i++) {
      buffer.write(numStr[i]);
      final remaining = len - 1 - i;
      if (remaining > 0 && remaining % 3 == 0) {
        buffer.write('.');
      }
    }
    return buffer.toString();
  }

  // ── Acciones ───────────────────────────────
  Future<void> _handlePdf(Cotizacion c) async {
    setState(() => _isActionLoading = true);
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final token = auth.usuario?.token ?? await auth.getSavedToken();
      if (token == null) throw Exception('Token no encontrado');

      final response = await _cotizacionService.descargarPDF(
        token: token,
        idCotizacion: c.idCotizacion,
      );

      final directory = await getApplicationDocumentsDirectory();
      final filePath = '${directory.path}/cotizacion_${c.idCotizacion}.pdf';
      final file = File(filePath);
      await file.writeAsBytes(response.bodyBytes);

      final xfile = XFile(filePath);
      await Share.shareXFiles(
        [xfile],
        text: 'Cotización #${c.idCotizacion} - Gramas y Suministros',
      );
      _showSnack('✅ PDF compartido correctamente', success: true);
    } catch (e) {
      _showSnack('Error al descargar/compartir PDF: $e', success: false);
    } finally {
      if (mounted) {
        setState(() => _isActionLoading = false);
      }
    }
  }

  void _confirmCambiarEstado(Cotizacion c, String nuevoEstado, String mensaje) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: const [
            Icon(Icons.warning_amber_rounded, color: Colors.orangeAccent, size: 28),
            SizedBox(width: 10),
            Text(
              'Confirmar cambio',
              style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF1F3D24)),
            ),
          ],
        ),
        content: Text(
          mensaje,
          style: const TextStyle(color: Color(0xFF4B5563)),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancelar', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.w600)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3D7B2C),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            onPressed: () {
              Navigator.of(ctx).pop();
              _ejecutarCambioEstado(c.idCotizacion, nuevoEstado);
            },
            child: const Text('Confirmar', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Future<void> _ejecutarCambioEstado(int id, String estado) async {
    setState(() => _isActionLoading = true);
    try {
      final auth = Provider.of<AuthProvider>(context, listen: false);
      final token = auth.usuario?.token ?? await auth.getSavedToken();
      if (token == null) throw Exception('Token no encontrado');

      await _cotizacionService.cambiarEstado(
        token: token,
        idCotizacion: id,
        estado: estado,
      );

      _showSnack('✅ Estado actualizado correctamente', success: true);
      await _loadDatos();
    } catch (e) {
      _showSnack('Error al cambiar estado: $e', success: false);
    } finally {
      if (mounted) {
        setState(() => _isActionLoading = false);
      }
    }
  }

  void _showSnack(String msg, {required bool success}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: success ? const Color(0xFF3D7B2C) : Colors.red,
    ));
  }

  // ── Build principal ────────────────────────
  @override
  Widget build(BuildContext context) {
    final total = _cotizaciones.length;
    final start = total == 0 ? 0 : (_currentPage - 1) * _pageSize;
    final end = (start + _pageSize) > total ? total : start + _pageSize;
    final visible = total == 0 ? <Cotizacion>[] : _cotizaciones.sublist(start, end);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      appBar: AppBar(
        backgroundColor: const Color(0xFF3D7B2C),
        foregroundColor: Colors.white,
        title: const Text('Gestión de Cotizaciones', style: TextStyle(fontWeight: FontWeight.w700)),
        elevation: 0,
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF3D7B2C)),
                ),
              )
            : _error != null
                ? _buildErrorWidget()
                : SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildStatsRow(),
                        const SizedBox(height: 20),
                        _buildFiltersCard(),
                        const SizedBox(height: 20),
                        _cotizaciones.isEmpty
                            ? _buildEmptyState()
                            : _buildTableCard(visible),
                        const SizedBox(height: 16),
                        Center(
                          child: Column(
                            children: [
                              Text(
                                'Mostrando ${visible.length} de $total cotizaciones',
                                style: const TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
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
  Widget _buildErrorWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: 16),
          Text('Error: $_error', style: const TextStyle(color: Color(0xFF4B5563)), textAlign: TextAlign.center),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadDatos,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3D7B2C),
              foregroundColor: Colors.white,
            ),
            child: const Text('Reintentar'),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsRow() {
    if (_estadisticas == null) return const SizedBox.shrink();
    final stats = [
      {'label': 'Total', 'value': _estadisticas!['total'] ?? 0, 'color': const Color(0xFF2E7D32)},
      {'label': 'Pendientes', 'value': _estadisticas!['pendiente'] ?? 0, 'color': const Color(0xFFF57C00)},
      {'label': 'Pagados', 'value': _estadisticas!['pagado'] ?? 0, 'color': const Color(0xFF1976D2)},
      {'label': 'Entregados', 'value': _estadisticas!['entregado'] ?? 0, 'color': const Color(0xFF2E7D32)},
      {'label': 'Cancelados', 'value': _estadisticas!['cancelado'] ?? 0, 'color': const Color(0xFFD32F2F)},
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: stats.map((stat) {
          return Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border(
                top: BorderSide(color: stat['color'] as Color, width: 4),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  stat['value'].toString(),
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: stat['color'] as Color,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  stat['label'] as String,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF6B7280),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildFiltersCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
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
        children: [
          const Text(
            'Filtros',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1F3D24),
            ),
          ),
          const SizedBox(height: 12),
          // Búsqueda de cliente
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Buscar cliente...',
              hintStyle: const TextStyle(color: Color(0xFF9CA3AF), fontSize: 14),
              prefixIcon: const Icon(Icons.search, color: Color(0xFF3D7B2C)),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: Color(0xFF3D7B2C)),
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 10),
            ),
          ),
          const SizedBox(height: 12),
          // Dropdown de Estado
          DropdownButtonFormField<String>(
            initialValue: _filtroEstado,
            decoration: InputDecoration(
              labelText: 'Estado',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            items: const [
              DropdownMenuItem(value: '', child: Text('Todos los estados')),
              DropdownMenuItem(value: 'pendiente', child: Text('Pendiente')),
              DropdownMenuItem(value: 'pagado', child: Text('Pagado')),
              DropdownMenuItem(value: 'entregado', child: Text('Entregado')),
              DropdownMenuItem(value: 'cancelado', child: Text('Cancelado')),
            ],
            onChanged: (val) {
              setState(() {
                _filtroEstado = val ?? '';
              });
            },
          ),
          const SizedBox(height: 12),
          // Rango de fechas
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: _fechaInicio ?? DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2100),
                    );
                    if (date != null) {
                      setState(() {
                        _fechaInicio = date;
                      });
                    }
                  },
                  icon: const Icon(Icons.calendar_today, size: 16, color: Color(0xFF3D7B2C)),
                  label: Text(
                    _fechaInicio == null
                        ? 'Fecha inicio'
                        : '${_fechaInicio!.day}/${_fechaInicio!.month}/${_fechaInicio!.year}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF4B5563)),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: _fechaFin ?? DateTime.now(),
                      firstDate: DateTime(2020),
                      lastDate: DateTime(2100),
                    );
                    if (date != null) {
                      setState(() {
                        _fechaFin = date;
                      });
                    }
                  },
                  icon: const Icon(Icons.calendar_today, size: 16, color: Color(0xFF3D7B2C)),
                  label: Text(
                    _fechaFin == null
                        ? 'Fecha fin'
                        : '${_fechaFin!.day}/${_fechaFin!.month}/${_fechaFin!.year}',
                    style: const TextStyle(fontSize: 12, color: Color(0xFF4B5563)),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
          if (_fechaInicio != null || _fechaFin != null) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: () {
                  setState(() {
                    _fechaInicio = null;
                    _fechaFin = null;
                  });
                },
                child: const Text('Limpiar fechas', style: TextStyle(color: Colors.red)),
              ),
            ),
          ],
          const SizedBox(height: 12),
          // Botón de aplicar filtros
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _loadDatos,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3D7B2C),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: const Text(
                'Filtrar',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 48),
        child: Column(
          children: const [
            Icon(Icons.receipt_long_rounded, size: 54, color: Color(0xFFD1D5DB)),
            SizedBox(height: 16),
            Text('No se encontraron cotizaciones', style: TextStyle(fontSize: 16, color: Color(0xFF6B7280))),
          ],
        ),
      ),
    );
  }

  Widget _buildTableCard(List<Cotizacion> visible) {
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Text(
              'Cotizaciones (${_cotizaciones.length})',
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: Color(0xFF1F3D24),
              ),
            ),
          ),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              headingRowColor: WidgetStateProperty.all(const Color(0xFF76C776)),
              headingTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
              dataRowMinHeight: 75,
              dataRowMaxHeight: 75,
              dividerThickness: 0,
              columns: const [
                DataColumn(label: Text('ID')),
                DataColumn(label: Text('CLIENTE')),
                DataColumn(label: Text('FECHA')),
                DataColumn(label: Text('TOTAL')),
                DataColumn(label: Text('MÉTODO')),
                DataColumn(label: Text('ESTADO')),
                DataColumn(label: Text('ACCIONES')),
              ],
              rows: visible.map((c) {
                final String cliente = c.usuario != null
                    ? '${c.usuario!.nombre} ${c.usuario!.apellido}'
                    : (c.clienteNombre ?? 'Desconocido');
                final String email = c.usuario?.email ?? '';
                final String fecha = formatFecha(c.fechaCreacion);
                final String totalStr = '\$${formatMoneda(c.total)}';
                final String metodoVenta = c.metodoVenta == 'fisico' ? '📍 Físico' : '🚚 Envío';
                final String metodoPago = c.metodoPago == 'efectivo' ? 'Efectivo' :
                                          c.metodoPago == 'tarjeta_debito' ? 'Tarjeta débito' :
                                          'Tarjeta crédito';

                return DataRow(cells: [
                  DataCell(Text(
                    '#${c.idCotizacion}',
                    style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF1F3D24)),
                  )),
                  DataCell(Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(cliente, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                      if (email.isNotEmpty)
                        Text(email, style: const TextStyle(color: Color(0xFF6B7280), fontSize: 11)),
                    ],
                  )),
                  DataCell(Text(fecha, style: const TextStyle(fontSize: 12))),
                  DataCell(Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(totalStr, style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF3D7B2C))),
                      Text('${c.detalles?.length ?? 0} items', style: const TextStyle(color: Color(0xFF6B7280), fontSize: 11)),
                    ],
                  )),
                  DataCell(Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(metodoVenta, style: const TextStyle(fontSize: 12)),
                      Text(metodoPago, style: const TextStyle(color: Color(0xFF6B7280), fontSize: 11)),
                    ],
                  )),
                  DataCell(_buildStatusChip(c)),
                  DataCell(_buildActionsRow(c)),
                ]);
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(Cotizacion c) {
    Color bg;
    Color fg;

    switch (c.estado) {
      case 'pagado':
        bg = const Color(0xFFE7F3DE);
        fg = const Color(0xFF2E7D32);
        break;
      case 'pendiente':
        bg = const Color(0xFFFFF3CD);
        fg = const Color(0xFFF57C00);
        break;
      case 'entregado':
        bg = const Color(0xFFE0F0FF);
        fg = const Color(0xFF1976D2);
        break;
      case 'cancelado':
        bg = const Color(0xFFFCE8E6);
        fg = const Color(0xFFD32F2F);
        break;
      default:
        bg = Colors.grey[200]!;
        fg = Colors.grey[800]!;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(
        c.estado.toUpperCase(),
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w700,
          color: fg,
        ),
      ),
    );
  }

  Widget _buildActionsRow(Cotizacion c) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        _buildActionBtn(
          label: '📄 PDF',
          color: const Color(0xFF76C776),
          onTap: () => _handlePdf(c),
        ),
        if (c.estado == 'pendiente') ...[
          const SizedBox(width: 6),
          _buildActionBtn(
            label: 'Pagar',
            color: const Color(0xFF2E7D32),
            onTap: () => _confirmCambiarEstado(c, 'pagado', '¿Estás seguro de cambiar el estado a "pagado"?'),
          ),
          const SizedBox(width: 6),
          _buildActionBtn(
            label: 'Cancelar',
            color: const Color(0xFFD32F2F),
            onTap: () => _confirmCambiarEstado(c, 'cancelado', '¿Estás seguro de cambiar el estado a "cancelado"?'),
          ),
        ],
        if (c.estado == 'pagado') ...[
          const SizedBox(width: 6),
          _buildActionBtn(
            label: 'Entregar',
            color: const Color(0xFF1976D2),
            onTap: () => _confirmCambiarEstado(
              c,
              'entregado',
              '¿Estás seguro de marcar esta cotización como ENTREGADA?\n\nEsta acción RESTARÁ los productos del inventario.',
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildActionBtn({
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return TextButton(
      style: TextButton.styleFrom(
        backgroundColor: color,
        minimumSize: const Size(60, 30),
        padding: const EdgeInsets.symmetric(horizontal: 10),
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
      onPressed: _isActionLoading ? null : onTap,
      child: Text(
        label,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
      ),
    );
  }

  Widget _buildPagination() {
    final int totalPages = (_cotizaciones.length / _pageSize).ceil();
    final int maxPages = totalPages < 1 ? 1 : totalPages;

    List<Widget> children = [];

    // Botón anterior
    children.add(
      _buildPageButton(
        '<',
        _currentPage > 1 ? () => setState(() => _currentPage--) : null,
      ),
    );
    children.add(const SizedBox(width: 10));

    // Números de página
    for (int i = 1; i <= maxPages; i++) {
      children.add(
        _buildPageNumber(
          i.toString(),
          selected: _currentPage == i,
          onTap: () => setState(() => _currentPage = i),
        ),
      );
      if (i < maxPages) {
        children.add(const SizedBox(width: 8));
      }
    }

    children.add(const SizedBox(width: 10));

    // Botón siguiente
    children.add(
      _buildPageButton(
        '>',
        _currentPage < maxPages ? () => setState(() => _currentPage++) : null,
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
