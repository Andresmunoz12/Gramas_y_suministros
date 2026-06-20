import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;

import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-TextField.dart';

class EditProductScreen extends StatefulWidget {
  final int productId;
  final Map<String, dynamic>? productData;

  const EditProductScreen({
    super.key,
    required this.productId,
    this.productData,
  });

  @override
  State<EditProductScreen> createState() => _EditProductScreenState();
}

class _EditProductScreenState extends State<EditProductScreen> {
  final _nombreController = TextEditingController();
  final _marcaController = TextEditingController();
  final _materialController = TextEditingController();
  final _precioController = TextEditingController();
  final _pesoController = TextEditingController();
  final _alturaController = TextEditingController();
  final _descripcionController = TextEditingController();

  final ImagePicker _picker = ImagePicker();
  File? _imageFile;
  String? _currentImageUrl;

  List<Map<String, dynamic>> _categories = [];
  int? _selectedCategoryId;
  bool _isLoadingCategories = true;
  bool _isLoadingSubmit = false;
  bool _isLoadingProduct = true;

  final List<Map<String, dynamic>> _fallbackCategories = [
    {'id_categoria': 1, 'nombre': 'Residencial'},
    {'id_categoria': 2, 'nombre': 'Deportiva'},
    {'id_categoria': 3, 'nombre': 'Comercial'},
    {'id_categoria': 4, 'nombre': 'Fertilizante'},
    {'id_categoria': 5, 'nombre': 'Herramientas'},
  ];

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadProductData();
  }

  @override
  void dispose() {
    _nombreController.dispose();
    _marcaController.dispose();
    _materialController.dispose();
    _precioController.dispose();
    _pesoController.dispose();
    _alturaController.dispose();
    _descripcionController.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    setState(() {
      _isLoadingCategories = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final String? token = authProvider.usuario?.token ?? await authProvider.getSavedToken();

      if (token == null) {
        throw Exception('Token no encontrado');
      }

      final response = await http.get(
        Uri.parse(ApiConfig.categorias),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final List<dynamic> jsonList = jsonDecode(response.body) as List<dynamic>;
        setState(() {
          _categories = jsonList.map((cat) {
            return {
              'id_categoria': cat['id_categoria'] as int,
              'nombre': cat['nombre']?.toString() ?? 'Sin nombre',
            };
          }).toList();
          _isLoadingCategories = false;
        });
      } else {
        debugPrint('Error status GET categorias: ${response.statusCode}');
        _useFallbackCategories('Error de servidor (${response.statusCode})');
      }
    } catch (e) {
      debugPrint('Error catching categories: $e');
      _useFallbackCategories('Error de conexión');
    }
  }

  void _useFallbackCategories(String reason) {
    setState(() {
      _categories = List.from(_fallbackCategories);
      _isLoadingCategories = false;
    });
    debugPrint('Uso de categorías locales de respaldo debido a: $reason');
  }

  Future<void> _loadProductData() async {
    setState(() {
      _isLoadingProduct = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final String? token = authProvider.usuario?.token ?? await authProvider.getSavedToken();

      if (token == null) {
        throw Exception('Token no encontrado');
      }

      final response = await http.get(
        Uri.parse('${ApiConfig.productos}/${widget.productId}'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final product = jsonDecode(response.body);
        setState(() {
          _nombreController.text = product['nombre']?.toString() ?? '';
          _marcaController.text = product['marca']?.toString() ?? '';
          _materialController.text = product['material']?.toString() ?? '';
          _precioController.text = product['precio']?.toString() ?? '';
          _pesoController.text = product['peso']?.toString() ?? '';
          _alturaController.text = product['altura']?.toString() ?? '';
          _descripcionController.text = product['descripcion']?.toString() ?? '';
          final String? rawImg = product['imagen']?.toString();
          if (rawImg != null && rawImg.isNotEmpty && !rawImg.startsWith('http')) {
            _currentImageUrl = '${ApiConfig.baseUrl}/uploads/img_products/$rawImg';
          } else {
            _currentImageUrl = rawImg;
          }
          _selectedCategoryId = product['categoria']?['id_categoria'] as int?;
          _isLoadingProduct = false;
        });
      } else {
        _showErrorSnackBar('Error al cargar producto: ${response.statusCode}');
        setState(() {
          _isLoadingProduct = false;
        });
      }
    } catch (e) {
      _showErrorSnackBar('Error de conexión: $e');
      setState(() {
        _isLoadingProduct = false;
      });
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1000,
        maxHeight: 1000,
        imageQuality: 85,
      );
      if (pickedFile != null) {
        setState(() {
          _imageFile = File(pickedFile.path);
        });
      }
    } catch (e) {
      _showErrorSnackBar('No se pudo seleccionar la imagen: $e');
    }
  }

  void _showImageSourceActionSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (BuildContext context) {
        return SafeArea(
          child: Wrap(
            children: <Widget>[
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: Color(0xFF3D7B2C)),
                title: const Text('Galería de Fotos'),
                onTap: () {
                  Navigator.of(context).pop();
                  _pickImage(ImageSource.gallery);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_camera_outlined, color: Color(0xFF3D7B2C)),
                title: const Text('Tomar Foto con Cámara'),
                onTap: () {
                  Navigator.of(context).pop();
                  _pickImage(ImageSource.camera);
                },
              ),
              if (_imageFile != null)
                ListTile(
                  leading: const Icon(Icons.delete_outline, color: Colors.redAccent),
                  title: const Text('Eliminar Nueva Imagen', style: TextStyle(color: Colors.redAccent)),
                  onTap: () {
                    Navigator.of(context).pop();
                    setState(() {
                      _imageFile = null;
                    });
                  },
                ),
            ],
          ),
        );
      },
    );
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.redAccent,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showSuccessSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFF3D7B2C),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _submitProduct() async {
    if (_nombreController.text.trim().isEmpty) {
      _showErrorSnackBar('El nombre del producto es obligatorio');
      return;
    }
    if (_marcaController.text.trim().isEmpty) {
      _showErrorSnackBar('La marca es obligatoria');
      return;
    }
    if (_materialController.text.trim().isEmpty) {
      _showErrorSnackBar('El material es obligatorio');
      return;
    }
    final double? precio = double.tryParse(_precioController.text.trim());
    if (precio == null || precio <= 0) {
      _showErrorSnackBar('Ingresa un precio numérico válido mayor a 0');
      return;
    }
    if (_selectedCategoryId == null) {
      _showErrorSnackBar('Selecciona una categoría');
      return;
    }

    final double? peso = double.tryParse(_pesoController.text.trim());
    final double? altura = double.tryParse(_alturaController.text.trim());
    final String descripcion = _descripcionController.text.trim();

    setState(() {
      _isLoadingSubmit = true;
    });

    try {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final String? token = authProvider.usuario?.token ?? await authProvider.getSavedToken();

      if (token == null) {
        _showErrorSnackBar('Error de sesión: No se encontró token de acceso');
        setState(() {
          _isLoadingSubmit = false;
        });
        return;
      }

      final uri = Uri.parse('${ApiConfig.productos}/${widget.productId}');
      final request = http.MultipartRequest('PUT', uri);

      request.headers['Authorization'] = 'Bearer $token';

      request.fields['nombre'] = _nombreController.text.trim();
      request.fields['marca'] = _marcaController.text.trim();
      request.fields['material'] = _materialController.text.trim();
      request.fields['precio'] = precio.toString();
      request.fields['id_categoria'] = _selectedCategoryId.toString();

      if (peso != null) {
        request.fields['peso'] = peso.toString();
      }
      if (altura != null) {
        request.fields['altura'] = altura.toString();
      }
      if (descripcion.isNotEmpty) {
        request.fields['descripcion'] = descripcion;
      }

      if (_imageFile != null) {
        final multipartFile = await http.MultipartFile.fromPath(
          'imagen',
          _imageFile!.path,
        );
        request.files.add(multipartFile);
      }

      debugPrint('Enviando request PUT a: $uri');
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      debugPrint('Status response: ${response.statusCode}');
      debugPrint('Body response: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        _showSuccessSnackBar('¡Producto actualizado correctamente!');
        if (mounted) {
          Navigator.of(context).pop(true);
        }
      } else {
        String errorMsg = 'Error al actualizar producto (${response.statusCode})';
        try {
          final errorData = jsonDecode(response.body);
          errorMsg = errorData['message']?.toString() ?? errorMsg;
        } catch (_) {}
        _showErrorSnackBar(errorMsg);
      }
    } catch (e) {
      _showErrorSnackBar('Error en la solicitud: $e');
    } finally {
      setState(() {
        _isLoadingSubmit = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      appBar: AppBar(
        backgroundColor: const Color(0xFF3D7B2C),
        title: const Text('Editar Producto'),
      ),
      body: _isLoadingProduct
          ? const Center(
              child: CircularProgressIndicator(valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF3D7B2C))),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 10),
                  _buildTitleAndSubtitle('Modificar Producto'),
                  const SizedBox(height: 10),
                  _buildImageUploadCard(),
                  const SizedBox(height: 20),
                  _buildFormCard(),
                  const SizedBox(height: 20),
                  _buildButton(),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }

  Widget _buildTitleAndSubtitle(String title) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w800,
            color: Color(0xFF1F3D24),
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Actualiza los datos del producto. Todos los cambios se guardarán automáticamente.',
          style: TextStyle(
            fontSize: 14,
            color: Color(0xFF6B7280),
          ),
        ),
      ],
    );
  }

  Widget _buildImageUploadCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (_imageFile != null)
            Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.file(_imageFile!, height: 200, fit: BoxFit.cover),
                ),
                const SizedBox(height: 12),
              ],
            )
          else if (_currentImageUrl != null)
            Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: Image.network(_currentImageUrl!, height: 200, fit: BoxFit.cover),
                ),
                const SizedBox(height: 12),
              ],
            )
          else
            const Column(
              children: [
                Icon(Icons.image_outlined, size: 60, color: Color(0xFFD1D5DB)),
                SizedBox(height: 8),
                Text(
                  'Subir Imagen del Producto',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF4B5563)),
                ),
              ],
            ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () => _showImageSourceActionSheet(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF3D7B2C),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            ),
            icon: const Icon(Icons.cloud_upload_outlined, color: Colors.white),
            label: const Text('Cambiar Imagen', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }

  Widget _buildFormCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Información del Producto',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFF1F3D24)),
          ),
          const SizedBox(height: 4),
          const Text(
            'Completa los campos para actualizar el producto.',
            style: TextStyle(fontSize: 12, color: Color(0xFF6B7280)),
          ),
          const SizedBox(height: 20),
          CustomTextField(
            label: 'Nombre del Producto *',
            icon: Icons.grass_rounded,
            controller: _nombreController,
          ),
          const SizedBox(height: 16),
          CustomTextField(
            label: 'Marca *',
            icon: Icons.local_offer_outlined,
            controller: _marcaController,
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<int>(
            value: _selectedCategoryId,
            isExpanded: true,
            decoration: InputDecoration(
              labelText: 'Categoría del Producto *',
              prefixIcon: const Icon(Icons.category_outlined, color: Color(0xFF3D7B2C)),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
            ),
            items: _categories
                .map((cat) => DropdownMenuItem<int>(
                      value: cat['id_categoria'] as int,
                      child: Text(cat['nombre'].toString()),
                    ))
                .toList(),
            onChanged: (value) {
              setState(() {
                _selectedCategoryId = value;
              });
            },
          ),
          const SizedBox(height: 16),
          CustomTextField(
            label: 'Material *',
            icon: Icons.texture_outlined,
            controller: _materialController,
          ),
          const SizedBox(height: 16),
          CustomTextField(
            label: 'Peso (kg)',
            icon: Icons.scale_outlined,
            keyboardType: TextInputType.number,
            controller: _pesoController,
          ),
          const SizedBox(height: 16),
          CustomTextField(
            label: 'Altura (m²)',
            icon: Icons.height_outlined,
            keyboardType: TextInputType.number,
            controller: _alturaController,
          ),
          const SizedBox(height: 16),
          CustomTextField(
            label: 'Precio *',
            icon: Icons.attach_money_outlined,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            controller: _precioController,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _descripcionController,
            decoration: InputDecoration(
              labelText: 'Descripción del Producto',
              hintText: 'Describe brevemente el producto',
              prefixIcon: const Icon(Icons.description_outlined, color: Color(0xFF3D7B2C)),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
            ),
            maxLines: 3,
          ),
        ],
      ),
    );
  }

  Widget _buildButton() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ElevatedButton(
          onPressed: _isLoadingSubmit ? null : _submitProduct,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF3D7B2C),
            disabledBackgroundColor: const Color(0xFFC8D5C2),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            padding: const EdgeInsets.symmetric(vertical: 16),
          ),
          child: _isLoadingSubmit
              ? const SizedBox(
                  height: 24,
                  width: 24,
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Text(
                  'Guardar Cambios',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white),
                ),
        ),
      ],
    );
  }
}
