import 'package:flutter/material.dart';
import 'package:gramas_y_suministros_movil/Features/catalog/CatalogScreen.dart';
import 'package:gramas_y_suministros_movil/Features/admin/AddProductScreen.dart';

class AdminDashboard extends StatelessWidget {
  const AdminDashboard({super.key});

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
              _buildStockCard(context),
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
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _buildMetricCard('Productos Totales', '1,284', Icons.inventory_2_rounded, const Color(0xFFF9FBEF))),
            const SizedBox(width: 12),
            Expanded(child: _buildMetricCard('Usuarios Activos', '856', Icons.people_alt_rounded, const Color(0xFFE8F7E5))),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _buildMetricCard('Stock Total', '3,240', Icons.storage_rounded, const Color(0xFFF4F1EB))),
            const SizedBox(width: 12),
            Expanded(child: _buildMetricCard('Agotados', '24', Icons.cancel_outlined, const Color(0xFFFFF1F0))),
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

  Widget _buildStockCard(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Gestión de Stock',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF1F3D24)),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1F0),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Text(
                    '4 ALERTAS',
                    style: TextStyle(fontSize: 12, color: Color(0xFFD14343), fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ),
          _buildStockItem(
            context,
            title: 'Grama Bermuda Premium',
            subtitle: 'Quedan 5 rollos',
            imageAsset: null,
          ),
          const Divider(height: 1),
          _buildStockItem(
            context,
            title: 'Semillas de Trébol Enano',
            subtitle: 'Quedan 2 bultos',
            imageAsset: null,
          ),
          const Divider(height: 1),
          _buildStockItem(
            context,
            title: 'Kit de Herramientas Master',
            subtitle: 'En stock: 45 unidades',
            imageAsset: null,
          ),
          const SizedBox(height: 14),
          Center(
            child: TextButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Ver todo el inventario aún no está implementado.')),
                );
              },
              child: const Text('Ver todo el inventario >'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStockItem(BuildContext context, {required String title, required String subtitle, String? imageAsset}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: const Color(0xFFE7F3DE),
              borderRadius: BorderRadius.circular(18),
            ),
            child: const Icon(Icons.inventory_2_outlined, color: Color(0xFF3D7B2C)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF1F3D24))),
                const SizedBox(height: 4),
                Text(subtitle, style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280))),
              ],
            ),
          ),
          IconButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Editar inventario: $title')),
              );
            },
            icon: const Icon(Icons.edit, color: Color(0xFF4A7C3E)),
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
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _buildActionButton(context, Icons.person, 'Usuarios', () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Ir a Usuarios')),
              );
            }),
            _buildActionButton(context, Icons.bar_chart, 'Reportes', () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Ir a Reportes')),
              );
            }),
            _buildActionButton(context, Icons.inventory, 'Productos', () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const AddProductScreen()),
              );
            }),
            _buildActionButton(context, Icons.notifications, 'Alertas', () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Ir a Alertas')),
              );
            }),
          ],
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
