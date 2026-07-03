// lib/Features/admin/ReportesScreen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/core/network/reportes_service.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-Sizedbox.dart';
import 'package:fl_chart/fl_chart.dart';

class ReportesScreen extends StatefulWidget {
  final String? token;
  const ReportesScreen({super.key, this.token});

  @override
  State<ReportesScreen> createState() => _ReportesScreenState();
}

class _ReportesScreenState extends State<ReportesScreen> with SingleTickerProviderStateMixin {
  final ReportesService _reportesService = ReportesService();
  Map<String, dynamic>? _dashboardData;
  bool _isLoading = true;
  String? _error;

  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _cargarDashboard();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _cargarDashboard() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      String? token = widget.token;

      if (token == null) {
        try {
          final authProvider = Provider.of<AuthProvider>(context, listen: false);
          token = authProvider.usuario?.token ?? await authProvider.getSavedToken();
        } catch (e) {
          throw Exception('No se pudo obtener el token de autenticación');
        }
      }

      if (token == null) {
        throw Exception('No hay sesión activa');
      }

      final data = await _reportesService.getDashboard(token);
      if (mounted) {
        setState(() {
          _dashboardData = data;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        title: const Text(
          '📊 Reportes',
          style: TextStyle(
            color: Color(0xFF1F3D24),
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
        bottom: _isLoading || _error != null
            ? null
            : TabBar(
                controller: _tabController,
                labelColor: const Color(0xFF2D5A27),
                unselectedLabelColor: Colors.grey[600],
                indicatorColor: const Color(0xFF2D5A27),
                tabs: const [
                  Tab(text: 'Dashboard'),
                  Tab(text: 'Stock'),
                  Tab(text: 'Usuarios'),
                ],
              ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF2D5A27)),
            ),
            SizedBox(height: 16),
            Text('Cargando reportes...'),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Error al cargar reportes',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1F3D24),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _cargarDashboard,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2D5A27),
                foregroundColor: Colors.white,
              ),
              child: const Text('Reintentar'),
            ),
          ],
        ),
      );
    }

    if (_dashboardData == null) {
      return const Center(child: Text('No hay datos disponibles'));
    }

    return TabBarView(
      controller: _tabController,
      children: [
        _buildDashboardTab(),
        _buildStockTab(),
        _buildUsuariosTab(),
      ],
    );
  }

  // ============ TAB DASHBOARD ============
  Widget _buildDashboardTab() {
    final data = _dashboardData!;
    final usuarios = data['usuarios'] ?? {};
    final productos = data['productos'] ?? {};
    final stock = data['stock'] ?? {};
    final cotizaciones = data['cotizaciones'] ?? {};
    final ventasMes = data['ventasMes'] ?? 0;

    final stockData = [
      {'label': 'Stock Normal', 'value': (stock['normal'] ?? 0).toDouble(), 'color': const Color(0xFF2E7D32)},
      {'label': 'Stock Bajo', 'value': (stock['stockBajo'] ?? 0).toDouble(), 'color': const Color(0xFFF57C00)},
      {'label': 'Sin Stock', 'value': (stock['sinStock'] ?? 0).toDouble(), 'color': const Color(0xFFD32F2F)},
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _buildStatCard('Usuarios', usuarios['total'] ?? 0, '${usuarios['activos'] ?? 0} activos', const Color(0xFF2E7D32)),
              const SizedBox(width: 12),
              _buildStatCard('Productos', productos['total'] ?? 0, '${productos['activos'] ?? 0} activos', const Color(0xFF1976D2)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildStatCard('Stock Total', stock['total'] ?? 0, '${stock['sinStock'] ?? 0} sin stock', const Color(0xFFF57C00)),
              const SizedBox(width: 12),
              _buildStatCard('Cotizaciones', cotizaciones['pendientes'] ?? 0, '\$${ventasMes.toStringAsFixed(0)} ventas mes', const Color(0xFFD32F2F)),
            ],
          ),
          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '📊 Estado del Stock',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1F3D24),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  height: 200,
                  child: PieChart(
                    PieChartData(
                      sections: stockData.map((item) {
                        return PieChartSectionData(
                          color: item['color'] as Color,
                          value: item['value'] as double,
                          title: '${(item['value'] as double).toInt()}',
                          radius: 60,
                          titleStyle: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        );
                      }).toList(),
                      sectionsSpace: 2,
                      centerSpaceRadius: 20,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 16,
                  children: stockData.map((item) {
                    return Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: item['color'] as Color,
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${item['label']} (${(item['value'] as double).toInt()})',
                          style: const TextStyle(fontSize: 12, color: Color(0xFF4B5563)),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '👥 Usuarios en Línea (hoy)',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1F3D24),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '🟢 ${data['usuariosEnLinea']?['total'] ?? 0} usuarios conectados hoy',
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF2D5A27),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                ...? (data['usuariosEnLinea']?['usuarios'] as List?)?.take(5).map((u) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          u['nombre'] ?? 'Usuario',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                        ),
                        Text(
                          u['rol'] ?? 'Sin rol',
                          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  );
                }).toList() ?? [],
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // ============ TAB STOCK ============
  Widget _buildStockTab() {
    final data = _dashboardData!;
    final stock = data['stock'] ?? {};
    
    final List<dynamic> detalleStock = data['stockDetalle'] ?? [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _buildStatCard('Total Productos', stock['total'] ?? 0, 'registrados', const Color(0xFF2E7D32)),
              const SizedBox(width: 12),
              _buildStatCard('Stock Normal', stock['normal'] ?? 0, 'con stock', const Color(0xFF1976D2)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildStatCard('Stock Bajo', stock['stockBajo'] ?? 0, 'alerta', const Color(0xFFF57C00)),
              const SizedBox(width: 12),
              _buildStatCard('Sin Stock', stock['sinStock'] ?? 0, 'crítico', const Color(0xFFD32F2F)),
            ],
          ),
          const SizedBox(height: 24),
          
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '📋 Detalle de Productos',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1F3D24),
                  ),
                ),
                const SizedBox(height: 12),
                if (detalleStock.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Text(
                        'No hay productos registrados',
                        style: TextStyle(color: Color(0xFF6B7280)),
                      ),
                    ),
                  )
                else
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: detalleStock.length > 10 ? 10 : detalleStock.length,
                    itemBuilder: (context, index) {
                      final item = detalleStock[index] as Map<String, dynamic>;
                      final String estado = item['estado']?.toString() ?? 'Normal';
                      final Color estadoColor = estado == 'Sin stock' 
                          ? Colors.red[300]! 
                          : estado == 'Stock bajo' 
                              ? Colors.orange[300]! 
                              : Colors.green[300]!;
                      final Color textColor = estado == 'Sin stock' 
                          ? Colors.red[800]! 
                          : estado == 'Stock bajo' 
                              ? Colors.orange[800]! 
                              : Colors.green[800]!;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: estadoColor.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: estadoColor.withOpacity(0.3)),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              flex: 2,
                              child: Text(
                                item['producto']?.toString() ?? 'Producto',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                  color: Color(0xFF1F3D24),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Expanded(
                              child: Text(
                                'Stock: ${item['stock'] ?? 0}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.w500,
                                  fontSize: 12,
                                  color: Color(0xFF4B5563),
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: estadoColor,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                estado,
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                  color: textColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                if (detalleStock.length > 10)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      'Mostrando 10 de ${detalleStock.length} productos',
                      style: const TextStyle(
                        fontSize: 12,
                        color: Color(0xFF6B7280),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ============ TAB USUARIOS ============
  Widget _buildUsuariosTab() {
    final data = _dashboardData!;
    final usuarios = data['usuarios'] ?? {};
    
    final Map<String, int> rolesMap = {};

    final usuariosList = usuarios['usuarios'] ?? [];
    if (usuariosList is List) {
      for (final u in usuariosList) {
        final rol = u['rol']?.toString() ?? 'Cliente';
        rolesMap[rol] = (rolesMap[rol] ?? 0) + 1;
      }
    }

    if (rolesMap.isEmpty) {
      rolesMap['Administrador'] = 1;
      rolesMap['Cliente'] = (usuarios['total'] ?? 0) - 1;
      if (rolesMap['Cliente']! < 0) rolesMap['Cliente'] = 0;
    }

    final List<BarChartGroupData> barGroups = [];
    final List<String> roleLabels = [];
    int colorIndex = 0;
    final colors = [const Color(0xFF2E7D32), const Color(0xFF1976D2), const Color(0xFFF57C00)];

    rolesMap.forEach((rol, count) {
      if (count > 0) {
        roleLabels.add(rol);
        barGroups.add(
          BarChartGroupData(
            x: colorIndex,
            barRods: [
              BarChartRodData(
                toY: count.toDouble(),
                color: colors[colorIndex % colors.length],
                width: 30,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(4),
                ),
              ),
            ],
          ),
        );
        colorIndex++;
      }
    });

    final totalUsuarios = usuarios['total'] ?? 0;
    final activos = usuarios['activos'] ?? 0;
    final inactivos = usuarios['inactivos'] ?? 0;
    final suspendidos = usuarios['suspendidos'] ?? 0;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Row(
            children: [
              _buildStatCard('Total', totalUsuarios, 'usuarios', const Color(0xFF2E7D32)),
              const SizedBox(width: 12),
              _buildStatCard('Activos', activos, 'en línea', const Color(0xFF1976D2)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildStatCard('Inactivos', inactivos, 'sin acceso', const Color(0xFF9E9E9E)),
              const SizedBox(width: 12),
              _buildStatCard('Suspendidos', suspendidos, 'bloqueados', const Color(0xFFD32F2F)),
            ],
          ),
          const SizedBox(height: 24),

          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.04),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '📊 Distribución por Rol',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1F3D24),
                  ),
                ),
                const SizedBox(height: 16),
                if (barGroups.isEmpty)
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(20),
                      child: Text(
                        'No hay datos de usuarios',
                        style: TextStyle(color: Color(0xFF6B7280)),
                      ),
                    ),
                  )
                else
                  SizedBox(
                    height: 220,
                    child: BarChart(
                      BarChartData(
                        alignment: BarChartAlignment.center,
                        maxY: (rolesMap.values.reduce((a, b) => a > b ? a : b) + 2).toDouble(),
                        barGroups: barGroups,
                        titlesData: FlTitlesData(
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                final index = value.toInt();
                                if (index < roleLabels.length) {
                                  return Padding(
                                    padding: const EdgeInsets.only(top: 8),
                                    child: Text(
                                      roleLabels[index],
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF4B5563),
                                      ),
                                    ),
                                  );
                                }
                                return const SizedBox.shrink();
                              },
                            ),
                          ),
                          leftTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              reservedSize: 30,
                            ),
                          ),
                          topTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          rightTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                        ),
                        gridData: const FlGridData(show: true),
                        borderData: FlBorderData(show: false),
                      ),
                    ),
                  ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 16,
                  children: rolesMap.keys.map((rol) {
                    final index = rolesMap.keys.toList().indexOf(rol);
                    return Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: colors[index % colors.length],
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '$rol (${rolesMap[rol]})',
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF4B5563),
                          ),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ============ WIDGETS REUTILIZABLES ============
  Widget _buildStatCard(String title, int value, String subtitle, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withOpacity(0.3)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value.toString(),
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.w800,
                color: color,
              ),
            ),
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF6B7280),
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              subtitle,
              style: const TextStyle(
                fontSize: 10,
                color: Color(0xFF9CA3AF),
              ),
            ),
          ],
        ),
      ),
    );
  }

  BarChartGroupData _buildBarGroup(String label, int value, Color color) {
    return BarChartGroupData(
      x: ['Admin', 'Cliente', 'Almacen'].indexOf(label),
      barRods: [
        BarChartRodData(
          toY: value.toDouble(),
          color: color,
          width: 24,
        ),
      ],
    );
  }
}