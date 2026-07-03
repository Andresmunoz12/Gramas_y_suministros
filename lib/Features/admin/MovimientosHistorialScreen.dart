import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';

class MovimientosHistorialScreen extends StatefulWidget {
  final int? initialProductId;
  final String? initialProductName;
  final String? initialTab; // 'entradas' or 'salidas'

  const MovimientosHistorialScreen({
    super.key,
    this.initialProductId,
    this.initialProductName,
    this.initialTab,
  });

  @override
  State<MovimientosHistorialScreen> createState() => _MovimientosHistorialScreenState();
}

class _MovimientosHistorialScreenState extends State<MovimientosHistorialScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = true;
  String? _error;

  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _providers = [];
  List<Map<String, dynamic>> _movements = [];
  Map<int, String> _providerMap = {};

  int? _selectedProductId;
  bool _isLoadingSubmit = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: 2,
      vsync: this,
      initialIndex: widget.initialTab == 'salidas' ? 1 : 0,
    );
    _selectedProductId = widget.initialProductId;
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.usuario?.token ?? await authProvider.getSavedToken();
      if (token == null) {
        throw Exception('Token de autenticación no encontrado');
      }

      // 1. Fetch Products
      final productsResponse = await http.get(
        Uri.parse('${ApiConfig.productos}/admin/all'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (productsResponse.statusCode == 200) {
        final List<dynamic> list = jsonDecode(productsResponse.body);
        _products = list.map((item) => item as Map<String, dynamic>).toList();
      } else {
        debugPrint('Error cargando productos: ${productsResponse.statusCode}');
      }

      // If initial product id is not in the list, set to null or first
      if (_selectedProductId != null && !_products.any((p) => p['id_producto'] == _selectedProductId)) {
        _selectedProductId = null;
      }

      // 2. Fetch Providers
      final providersResponse = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/proveedores'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (providersResponse.statusCode == 200) {
        final List<dynamic> list = jsonDecode(providersResponse.body);
        _providers = list.map((item) => item as Map<String, dynamic>).toList();
        _providerMap = {
          for (var p in _providers) p['id_proveedor'] as int: (p['nombre'] ?? 'Sin nombre').toString()
        };
      } else {
        debugPrint('Error cargando proveedores: ${providersResponse.statusCode}');
      }

      // 3. Fetch Movements
      await _loadMovements();

    } catch (e) {
      debugPrint('Error inicializando datos: $e');
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _loadMovements() async {
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.usuario?.token ?? await authProvider.getSavedToken();
      if (token == null) return;

      final movementsResponse = await http.get(
        Uri.parse(ApiConfig.movimientos),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (movementsResponse.statusCode == 200) {
        final List<dynamic> list = jsonDecode(movementsResponse.body);
        if (mounted) {
          setState(() {
            _movements = list.map((item) => item as Map<String, dynamic>).toList();
            _isLoading = false;
          });
        }
      } else {
        throw Exception('Error al cargar historial: Código ${movementsResponse.statusCode}');
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

  // Filter movements based on selected product and type ('entrada' or 'salida')
  List<Map<String, dynamic>> _getFilteredMovements(String type) {
    return _movements.where((mov) {
      final matchesType = mov['tipo'] == type;
      if (_selectedProductId == null) {
        return matchesType;
      }
      return matchesType && mov['id_producto'] == _selectedProductId;
    }).toList();
  }

  String _formatDate(dynamic dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      final date = DateTime.parse(dateStr.toString());
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    } catch (_) {
      return dateStr.toString();
    }
  }

  void _showAddMovementDialog(String type) {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final currentUserId = authProvider.usuario?.idUsuario ?? 1;

    int? dialogProductId = _selectedProductId;
    int? dialogProviderId = _providers.isNotEmpty ? _providers.first['id_proveedor'] : null;

    final cantidadController = TextEditingController();
    final observacionesController = TextEditingController();
    final loteController = TextEditingController();
    final precioUnitarioController = TextEditingController();

    // Salida fields
    final destinoController = TextEditingController();
    String selectedMotivo = 'Venta Directa';
    final List<String> motivos = [
      'Venta Directa',
      'Despacho o Envío',
      'Devolución a Proveedor',
      'Merma o Pérdida',
      'Donación',
      'Otros'
    ];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).viewInsets.bottom,
                top: 24,
                left: 24,
                right: 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          type == 'entrada' ? 'Registrar Entrada' : 'Registrar Salida',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: type == 'entrada' ? const Color(0xFF1E3A8A) : const Color(0xFF991B1B),
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.close_rounded),
                        ),
                      ],
                    ),
                    const Divider(height: 24),

                    // Dropdown Producto
                    const Text(
                      'Producto *',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButtonFormField<int>(
                          value: dialogProductId,
                          decoration: const InputDecoration(border: InputBorder.none),
                          hint: const Text('Seleccionar producto'),
                          dropdownColor: Colors.white,
                          items: _products.map((p) {
                            return DropdownMenuItem<int>(
                              value: p['id_producto'] as int,
                              child: Text(
                                p['nombre']?.toString() ?? 'Sin nombre',
                                style: const TextStyle(fontSize: 14, color: Colors.black87),
                              ),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setModalState(() {
                              dialogProductId = val;
                            });
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Cantidad
                    const Text(
                      'Cantidad *',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: cantidadController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        hintText: 'Ej. 50',
                        filled: true,
                        fillColor: const Color(0xFFF3F4F6),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                    ),
                    const SizedBox(height: 16),

                    if (type == 'entrada') ...[
                      // Proveedor
                      const Text(
                        'Proveedor *',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButtonFormField<int>(
                            value: dialogProviderId,
                            decoration: const InputDecoration(border: InputBorder.none),
                            hint: const Text('Seleccionar proveedor'),
                            dropdownColor: Colors.white,
                            items: _providers.map((p) {
                              return DropdownMenuItem<int>(
                                value: p['id_proveedor'] as int,
                                child: Text(
                                  p['nombre']?.toString() ?? 'Sin nombre',
                                  style: const TextStyle(fontSize: 14, color: Colors.black87),
                                ),
                              );
                            }).toList(),
                            onChanged: (val) {
                              setModalState(() {
                                dialogProviderId = val;
                              });
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Precio Unitario (Optional)
                      const Text(
                        'Precio Unitario (Opcional)',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: precioUnitarioController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: InputDecoration(
                          hintText: 'Ej. 12000',
                          filled: true,
                          fillColor: const Color(0xFFF3F4F6),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Lote (Optional)
                      const Text(
                        'Lote (Opcional)',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: loteController,
                        decoration: InputDecoration(
                          hintText: 'Ej. LOTE-2024-001',
                          filled: true,
                          fillColor: const Color(0xFFF3F4F6),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    if (type == 'salida') ...[
                      // Destino
                      const Text(
                        'Destino *',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: destinoController,
                        decoration: InputDecoration(
                          hintText: 'Ej. Sucursal Norte o Cliente',
                          filled: true,
                          fillColor: const Color(0xFFF3F4F6),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(16),
                            borderSide: BorderSide.none,
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Motivo
                      const Text(
                        'Motivo *',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
                      ),
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3F4F6),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: DropdownButtonHideUnderline(
                          child: DropdownButtonFormField<String>(
                            value: selectedMotivo,
                            decoration: const InputDecoration(border: InputBorder.none),
                            dropdownColor: Colors.white,
                            items: motivos.map((m) {
                              return DropdownMenuItem<String>(
                                value: m,
                                child: Text(
                                  m,
                                  style: const TextStyle(fontSize: 14, color: Colors.black87),
                                ),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setModalState(() {
                                  selectedMotivo = val;
                                });
                              }
                            },
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // Observaciones
                    const Text(
                      'Observaciones / Detalle',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF374151)),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: observacionesController,
                      maxLines: 3,
                      decoration: InputDecoration(
                        hintText: 'Detalles adicionales...',
                        filled: true,
                        fillColor: const Color(0xFFF3F4F6),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(16),
                          borderSide: BorderSide.none,
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Submit Button
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: type == 'entrada' ? const Color(0xFF1E3A8A) : const Color(0xFF991B1B),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                      ),
                      onPressed: _isLoadingSubmit
                          ? null
                          : () async {
                              final cant = int.tryParse(cantidadController.text.trim());
                              if (dialogProductId == null) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Seleccione un producto')),
                                );
                                return;
                              }
                              if (cant == null || cant <= 0) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Ingrese una cantidad válida mayor a 0')),
                                );
                                return;
                              }
                              if (type == 'entrada' && dialogProviderId == null) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Seleccione un proveedor')),
                                );
                                return;
                              }
                              if (type == 'salida' && destinoController.text.trim().isEmpty) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Ingrese el destino')),
                                );
                                return;
                              }

                              // Close Sheet and trigger submit
                              Navigator.pop(context);
                              
                              if (type == 'entrada') {
                                final cost = double.tryParse(precioUnitarioController.text.trim());
                                await _submitEntrada(
                                  productId: dialogProductId!,
                                  userId: currentUserId,
                                  cantidad: cant,
                                  providerId: dialogProviderId!,
                                  precioUnitario: cost,
                                  lote: loteController.text.trim().isEmpty ? null : loteController.text.trim(),
                                  observaciones: observacionesController.text.trim().isEmpty ? null : observacionesController.text.trim(),
                                );
                              } else {
                                await _submitSalida(
                                  productId: dialogProductId!,
                                  userId: currentUserId,
                                  cantidad: cant,
                                  destino: destinoController.text.trim(),
                                  motivo: selectedMotivo,
                                  observaciones: observacionesController.text.trim().isEmpty ? null : observacionesController.text.trim(),
                                );
                              }
                            },
                      child: const Text('Registrar Movimiento', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Future<void> _submitEntrada({
    required int productId,
    required int userId,
    required int cantidad,
    required int providerId,
    double? precioUnitario,
    String? lote,
    String? observaciones,
  }) async {
    setState(() => _isLoadingSubmit = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.usuario?.token ?? await authProvider.getSavedToken();
      if (token == null) throw Exception('No se encontró el token de sesión');

      final payload = {
        'id_producto': productId,
        'id_usuario': userId,
        'cantidad': cantidad,
        'id_proveedor': providerId,
        'observaciones': observaciones ?? 'Entrada registrada',
        'detalle': 'Entrada registrada móvil',
        if (precioUnitario != null) 'precio_unitario': precioUnitario,
        if (lote != null) 'lote': lote,
      };

      final response = await http.post(
        Uri.parse('${ApiConfig.movimientos}/entrada'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(payload),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Entrada registrada exitosamente'), backgroundColor: Colors.green),
        );
        _loadMovements();
      } else {
        final body = jsonDecode(response.body);
        throw Exception(body['message'] ?? 'Error del servidor (${response.statusCode})');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
      );
    } finally {
      setState(() => _isLoadingSubmit = false);
    }
  }

  Future<void> _submitSalida({
    required int productId,
    required int userId,
    required int cantidad,
    required String destino,
    required String motivo,
    String? observaciones,
  }) async {
    setState(() => _isLoadingSubmit = true);
    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final token = authProvider.usuario?.token ?? await authProvider.getSavedToken();
      if (token == null) throw Exception('No se encontró el token de sesión');

      final payload = {
        'id_producto': productId,
        'id_usuario': userId,
        'cantidad': cantidad,
        'destino': destino,
        'motivo': motivo,
        'observaciones': observaciones ?? 'Salida registrada',
        'detalle': 'Salida registrada móvil',
      };

      final response = await http.post(
        Uri.parse('${ApiConfig.movimientos}/salida'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode(payload),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Salida registrada exitosamente'), backgroundColor: Colors.green),
        );
        _loadMovements();
      } else {
        final body = jsonDecode(response.body);
        throw Exception(body['message'] ?? 'Error del servidor (${response.statusCode})');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
      );
    } finally {
      setState(() => _isLoadingSubmit = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      appBar: AppBar(
        title: const Text(
          'Historial de Movimientos',
          style: TextStyle(
            color: Color(0xFF1F3D24),
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        backgroundColor: const Color(0xFFF5F8F2),
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF1F3D24)),
      ),
      body: Stack(
        children: [
          SafeArea(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF3D7B2C)),
                    ),
                  )
                : _error != null
                    ? _buildErrorWidget()
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _buildProductSelector(),
                          const SizedBox(height: 8),
                          TabBar(
                            controller: _tabController,
                            indicatorColor: const Color(0xFF3D7B2C),
                            labelColor: const Color(0xFF3D7B2C),
                            unselectedLabelColor: Colors.grey[600],
                            labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            tabs: const [
                              Tab(text: 'Entradas'),
                              Tab(text: 'Salidas'),
                            ],
                          ),
                          Expanded(
                            child: TabBarView(
                              controller: _tabController,
                              children: [
                                _buildMovementsList('entrada'),
                                _buildMovementsList('salida'),
                              ],
                            ),
                          ),
                        ],
                      ),
          ),
          if (_isLoadingSubmit)
            Container(
              color: Colors.black.withOpacity(0.5),
              child: const Center(
                child: Card(
                  color: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.all(Radius.circular(20)),
                  ),
                  child: Padding(
                    padding: EdgeInsets.symmetric(horizontal: 32, vertical: 24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF3D7B2C)),
                        ),
                        SizedBox(height: 16),
                        Text(
                          'Registrando movimiento...',
                          style: TextStyle(
                            color: Color(0xFF1F3D24),
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      floatingActionButton: _isLoading
          ? null
          : FloatingActionButton.extended(
              onPressed: () {
                final currentTab = _tabController.index == 0 ? 'entrada' : 'salida';
                _showAddMovementDialog(currentTab);
              },
              backgroundColor: const Color(0xFF3D7B2C),
              icon: const Icon(Icons.add, color: Colors.white),
              label: Text(
                _tabController.index == 0 ? 'Nueva Entrada' : 'Nueva Salida',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
    );
  }

  Widget _buildProductSelector() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          const Icon(Icons.inventory_rounded, color: Color(0xFF3D7B2C)),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int?>(
                value: _selectedProductId,
                dropdownColor: Colors.white,
                hint: const Text('Todos los productos', style: TextStyle(color: Color(0xFF6B7280), fontWeight: FontWeight.w600)),
                icon: const Icon(Icons.keyboard_arrow_down_rounded, color: Color(0xFF4B5563)),
                items: [
                  const DropdownMenuItem<int?>(
                    value: null,
                    child: Text('Todos los productos', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.black87)),
                  ),
                  ..._products.map((p) {
                    return DropdownMenuItem<int?>(
                      value: p['id_producto'] as int,
                      child: Text(p['nombre']?.toString() ?? 'Sin nombre', style: const TextStyle(color: Colors.black87)),
                    );
                  })
                ],
                onChanged: (val) {
                  setState(() {
                    _selectedProductId = val;
                  });
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMovementsList(String type) {
    final filtered = _getFilteredMovements(type);

    if (filtered.isEmpty) {
      return RefreshIndicator(
        color: const Color(0xFF3D7B2C),
        onRefresh: _loadMovements,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(40),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(height: 60),
              Icon(
                type == 'entrada' ? Icons.login_rounded : Icons.logout_rounded,
                size: 64,
                color: Colors.grey[300],
              ),
              const SizedBox(height: 16),
              Text(
                type == 'entrada'
                    ? 'No hay registros de entrada para este producto'
                    : 'No hay registros de salida para este producto',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF6B7280), fontSize: 15),
              ),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: const Color(0xFF3D7B2C),
      onRefresh: _loadMovements,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 80),
        itemCount: filtered.length,
        itemBuilder: (context, index) {
          final item = filtered[index];
          final prodName = item['producto']?['nombre'] ?? 'Producto Desconocido';
          final dateStr = _formatDate(item['fecha']);
          final cantidad = item['cantidad'] ?? 0;
          final userName = '${item['usuario']?['nombre'] ?? ''} ${item['usuario']?['apellido'] ?? ''}'.trim();
          final userText = userName.isEmpty ? 'Usuario desconocido' : userName;

          if (type == 'entrada') {
            final entry = item['entrada'] ?? {};
            final provId = entry['id_proveedor'];
            final provName = provId != null ? (_providerMap[provId] ?? 'N/A') : 'N/A';
            final batch = entry['lote'] ?? 'N/A';
            final obs = entry['observaciones'] ?? item['detalle'] ?? '-';

            return _buildMovementCard(
              title: prodName,
              date: dateStr,
              amount: cantidad,
              user: userText,
              type: 'entrada',
              extraRow: _buildInfoRow(Icons.local_shipping_outlined, 'Proveedor: $provName'),
              secondExtraRow: _buildInfoRow(Icons.inventory_2_outlined, 'Lote: $batch'),
              notes: obs,
            );
          } else {
            final exit = item['salida'] ?? {};
            final dest = exit['destino'] ?? 'N/A';
            final reason = exit['motivo'] ?? 'N/A';
            final obs = exit['observaciones'] ?? item['detalle'] ?? '-';

            return _buildMovementCard(
              title: prodName,
              date: dateStr,
              amount: cantidad,
              user: userText,
              type: 'salida',
              extraRow: _buildInfoRow(Icons.location_on_outlined, 'Destino: $dest'),
              secondExtraRow: _buildInfoRow(Icons.help_outline_rounded, 'Motivo: $reason'),
              notes: obs,
            );
          }
        },
      ),
    );
  }

  Widget _buildMovementCard({
    required String title,
    required String date,
    required int amount,
    required String user,
    required String type,
    required Widget extraRow,
    required Widget secondExtraRow,
    required String notes,
  }) {
    final color = type == 'entrada' ? const Color(0xFF1E3A8A) : const Color(0xFF991B1B);
    final bgColor = type == 'entrada' ? const Color(0xFFEFF6FF) : const Color(0xFFFEF2F2);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1F3D24)),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  type == 'entrada' ? '+$amount' : '-$amount',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          _buildInfoRow(Icons.calendar_today_rounded, date),
          const SizedBox(height: 4),
          _buildInfoRow(Icons.person_outline_rounded, 'Registrado por: $user'),
          const SizedBox(height: 4),
          extraRow,
          const SizedBox(height: 4),
          secondExtraRow,
          if (notes.isNotEmpty && notes != '-') ...[
            const Divider(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.notes_rounded, size: 16, color: Colors.grey),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    notes,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF4B5563), fontStyle: FontStyle.italic),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: const Color(0xFF6B7280)),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 13, color: Color(0xFF4B5563)),
          ),
        ),
      ],
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 48, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'No se pudo cargar el historial de movimientos.\n$_error',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF4B5563)),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3D7B2C),
                foregroundColor: Colors.white,
              ),
              child: const Text('Reintentar'),
            ),
          ],
        ),
      ),
    );
  }
}
