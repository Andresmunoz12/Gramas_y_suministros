import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;

import 'package:gramas_y_suministros_movil/core/network/api_config.dart';
import 'package:gramas_y_suministros_movil/Providers/auth_provider.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-TextField.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-button.dart';
import 'package:gramas_y_suministros_movil/Shared/Custom-Sizedbox.dart';

class AddProductScreen extends StatefulWidget {
  const AddProductScreen({super.key});

  @override
  State<AddProductScreen> createState() => _AddProductScreenState();
}

class _AddProductScreenState extends State<AddProductScreen> {
  final _nombreController = TextEditingController();
  final _marcaController = TextEditingController();
  final _materialController = TextEditingController();
  final _precioController = TextEditingController();
  final _pesoController = TextEditingController();
  final _alturaController = TextEditingController();
  final _descripcionController = TextEditingController();

  final ImagePicker _picker = ImagePicker();
  File? _imageFile;

  List<Map<String, dynamic>> _categories = [];
  int? _selectedCategoryId;
  bool _isLoadingCategories = true;
  bool _isLoadingSubmit = false;

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

          if (_categories.isNotEmpty) {
            _selectedCategoryId = _categories.first['id_categoria'] as int;
          }
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
      if (_categories.isNotEmpty) {
        _selectedCategoryId = _categories.first['id_categoria'] as int;
      }
      _isLoadingCategories = false;
    });
    
    // Notificación en consola pero sin asustar al usuario con un error fatal
    debugPrint('Uso de categorías locales de respaldo debido a: $reason');
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
                  title: const Text('Eliminar Imagen seleccionada', style: TextStyle(color: Colors.redAccent)),
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
    // Validaciones manuales de campos requeridos
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

    // Campos opcionales numéricos
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

      final uri = Uri.parse(ApiConfig.productos);
      final request = http.MultipartRequest('POST', uri);
      
      // Cabecera de autorización Bearer
      request.headers['Authorization'] = 'Bearer $token';

      // Parámetros JSON simulados por campos de texto
      request.fields['nombre'] = _nombreController.text.trim();
      request.fields['marca'] = _marcaController.text.trim();
      request.fields['material'] = _materialController.text.trim();
      request.fields['precio'] = precio.toString();
      request.fields['id_categoria'] = _selectedCategoryId.toString();
      request.fields['estado'] = '1'; // Por defecto activo

      if (peso != null) {
        request.fields['peso'] = peso.toString();
      }
      if (altura != null) {
        request.fields['altura'] = altura.toString();
      }
      if (descripcion.isNotEmpty) {
        request.fields['descripcion'] = descripcion;
      }

      // Adjuntar archivo de imagen si está seleccionado
      if (_imageFile != null) {
        final multipartFile = await http.MultipartFile.fromPath(
          'imagen',
          _imageFile!.path,
        );
        request.files.add(multipartFile);
      }

      debugPrint('Enviando request a: $uri');
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      debugPrint('Status response: ${response.statusCode}');
      debugPrint('Body response: ${response.body}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        _showSuccessSnackBar('¡Producto registrado correctamente!');
        if (mounted) {
          Navigator.of(context).pop(true); // Retorna true para refrescar listas anteriores
        }
      } else {
        String errorMsg = 'Error al crear producto (${response.statusCode})';
        try {
          final errorData = jsonDecode(response.body);
          if (errorData['message'] != null) {
            if (errorData['message'] is List) {
              errorMsg = (errorData['message'] as List).join('\n');
            } else {
              errorMsg = errorData['message'].toString();
            }
          }
        } catch (_) {}
        _showErrorSnackBar(errorMsg);
      }
    } catch (e) {
      debugPrint('Submit product error: $e');
      _showErrorSnackBar('Ocurrió un error al conectar con el servidor: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingSubmit = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F8F2),
      appBar: AppBar(
        title: const Text(
          'Insertar Producto',
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
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Información del Producto',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF1F3D24),
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Completa los campos obligatorios (*) para agregar un nuevo producto al inventario y catálogo.',
                    style: TextStyle(fontSize: 14, color: Color(0xFF6B7280)),
                  ),
                  const SizedBox(height: 24),
                  
                  // Tarjeta de Imagen del Producto
                  GestureDetector(
                    onTap: () => _showImageSourceActionSheet(context),
                    child: Container(
                      height: 180,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(28),
                        border: Border.all(
                          color: const Color(0xFFD1D5DB),
                          style: _imageFile == null ? BorderStyle.solid : BorderStyle.none,
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.03),
                            blurRadius: 15,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(28),
                        child: _imageFile != null
                            ? Stack(
                                fit: StackFit.expand,
                                children: [
                                  Image.file(_imageFile!, fit: BoxFit.cover),
                                  Container(
                                    color: Colors.black.withOpacity(0.35),
                                    child: const Center(
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.photo_camera, color: Colors.white, size: 36),
                                          SizedBox(height: 8),
                                          Text(
                                            'Cambiar Imagen',
                                            style: TextStyle(
                                              color: Colors.white,
                                              fontWeight: FontWeight.w700,
                                              fontSize: 14,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              )
                            : const Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.add_a_photo_outlined,
                                    size: 48,
                                    color: Color(0xFF4A7C3E),
                                  ),
                                  SizedBox(height: 12),
                                  Text(
                                    'Subir Imagen del Producto',
                                    style: TextStyle(
                                      color: Color(0xFF1F3D24),
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15,
                                    ),
                                  ),
                                  SizedBox(height: 4),
                                  Text(
                                    'Galería o Cámara (Opcional)',
                                    style: TextStyle(color: Color(0xFF6B7280), fontSize: 12),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Campos de Texto Formulario
                  CustomTextField(
                    label: 'Nombre del Producto *',
                    icon: Icons.label_outline_rounded,
                    controller: _nombreController,
                  ),
                  AppSpaces.verticalMedium,
                  CustomTextField(
                    label: 'Marca *',
                    icon: Icons.branding_watermark_outlined,
                    controller: _marcaController,
                  ),
                  AppSpaces.verticalMedium,
                  CustomTextField(
                    label: 'Material *',
                    icon: Icons.grass_rounded,
                    controller: _materialController,
                  ),
                  AppSpaces.verticalMedium,
                  CustomTextField(
                    label: 'Precio (\$) *',
                    icon: Icons.monetization_on_outlined,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    controller: _precioController,
                  ),
                  AppSpaces.verticalMedium,
                  Row(
                    children: [
                      Expanded(
                        child: CustomTextField(
                          label: 'Peso (kg)',
                          icon: Icons.scale_outlined,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          controller: _pesoController,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: CustomTextField(
                          label: 'Altura (cm)',
                          icon: Icons.height_rounded,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          controller: _alturaController,
                        ),
                      ),
                    ],
                  ),
                  AppSpaces.verticalMedium,

                  // Dropdown de Categoría
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F7F3),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButtonFormField<int>(
                        value: _selectedCategoryId,
                        decoration: const InputDecoration(
                          labelText: 'Categoría del Producto *',
                          labelStyle: TextStyle(color: Color(0xFF6B7280), fontSize: 13),
                          prefixIcon: Icon(Icons.category_outlined, color: Color(0xFF4A7C3E)),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                        ),
                        dropdownColor: Colors.white,
                        items: _isLoadingCategories
                            ? [
                                const DropdownMenuItem<int>(
                                  value: null,
                                  child: Text('Cargando categorías...'),
                                )
                              ]
                            : _categories.map((cat) {
                                return DropdownMenuItem<int>(
                                  value: cat['id_categoria'] as int,
                                  child: Text(
                                    cat['nombre']?.toString() ?? 'Sin categoría',
                                    style: const TextStyle(
                                      color: Colors.black87,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                );
                              }).toList(),
                        onChanged: _isLoadingCategories
                            ? null
                            : (int? newValue) {
                                setState(() {
                                  _selectedCategoryId = newValue;
                                });
                              },
                      ),
                    ),
                  ),
                  AppSpaces.verticalMedium,

                  // Descripción (Multiline personalizado para coincidir con el diseño)
                  TextField(
                    controller: _descripcionController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      labelText: 'Descripción del Producto',
                      labelStyle: const TextStyle(color: Color(0xFF6B7280)),
                      prefixIcon: const Icon(Icons.description_outlined, color: Color(0xFF4A7C3E)),
                      filled: true,
                      fillColor: const Color(0xFFF5F7F3),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide.none,
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: const BorderSide(color: Color(0xFF81D460), width: 1.5),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        vertical: 18,
                        horizontal: 16,
                      ),
                    ),
                    style: const TextStyle(color: Colors.black87),
                  ),
                  const SizedBox(height: 36),

                  // Botón de Enviar
                  CustomButton(
                    text: 'Guardar Producto',
                    onPressed: _isLoadingSubmit ? null : _submitProduct,
                  ),
                  const SizedBox(height: 32),
                ],
              ),
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
                          'Guardando producto...',
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
    );
  }
}
