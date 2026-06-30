import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class NosotrosScreen extends StatelessWidget {
  const NosotrosScreen({super.key});

  static const Color _bgGrey = Color(0xFFF3F6F1);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgGrey,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, color: Color(0xFF2D5A27)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Nosotros',
          style: TextStyle(
            color: Color(0xFF1F3D24),
            fontWeight: FontWeight.w800,
            fontSize: 20,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _HeroSection(),
            const SizedBox(height: 24),
            _HistoriaSection(),
            const SizedBox(height: 20),
            _StatsSection(),
            const SizedBox(height: 20),
            _MisionVisionSection(),
            const SizedBox(height: 24),
            _ValoresSection(),
            const SizedBox(height: 24),
            _PorQueElegirnosSection(),
            _Footer(),
          ],
        ),
      ),
    );
  }
}

// ── 1. HERO ──────────────────────────────────────────────────────────────────
class _HeroSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 220,
      child: Stack(
        children: [
          // Background Image
          Positioned.fill(
            child: CachedNetworkImage(
              imageUrl: 'https://images.unsplash.com/photo-1533460004989-cef01064af7e?q=80&w=1000',
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(
                color: const Color(0xFF1B3C1B),
              ),
              errorWidget: (context, url, error) => Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF1B3C1B), Color(0xFF2D5A27)],
                  ),
                ),
              ),
            ),
          ),
          // Dark Overlay
          Positioned.fill(
            child: Container(
              color: Colors.black.withOpacity(0.45),
            ),
          ),
          // Content
          Positioned(
            left: 24,
            right: 24,
            bottom: 28,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Gramas y Suministros',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Transformamos Espacios, Creamos Experiencias',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.8),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── 2. NUESTRA HISTORIA ───────────────────────────────────────────────────────
class _HistoriaSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Nuestra Historia',
            style: TextStyle(
              color: Color(0xFF1F3D24),
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            width: 60,
            height: 3,
            decoration: BoxDecoration(
              color: const Color(0xFF2D5A27),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: CachedNetworkImage(
              imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000',
              height: 160,
              width: double.infinity,
              fit: BoxFit.cover,
              placeholder: (context, url) => Container(color: const Color(0xFFE5E7EB)),
              errorWidget: (context, url, error) => Container(
                height: 160,
                color: const Color(0xFFE8F7E4),
                child: const Icon(Icons.history_edu, color: Color(0xFF2D5A27), size: 40),
              ),
            ),
          ),
          const SizedBox(height: 16),
          RichText(
            text: const TextSpan(
              style: TextStyle(fontSize: 14, color: Color(0xFF4B5563), height: 1.6),
              children: [
                TextSpan(text: 'En '),
                TextSpan(
                  text: 'Gramas y Suministros',
                  style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1F3D24)),
                ),
                TextSpan(
                  text: ' comenzamos como un pequeño emprendimiento familiar con una visión clara: elevar la '
                      'calidad de los espacios verdes en Colombia. Hoy somos referentes nacionales en '
                      'soluciones deportivas, residenciales y comerciales.',
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Más de 10 años liderando proyectos de grama sintética, superficies deportivas y '
            'soluciones paisajísticas integrales con la máxima garantía y calidad del mercado.',
            style: TextStyle(fontSize: 14, color: Color(0xFF6B7280), height: 1.6),
          ),
        ],
      ),
    );
  }
}

// ── 3. ESTADÍSTICAS ──────────────────────────────────────────────────────────
class _StatsSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: _StatCard(
              number: '+500',
              label: 'PROYECTOS',
              icon: Icons.assignment_turned_in_outlined,
              color: const Color(0xFF2D5A27),
              bgColor: const Color(0xFFE8F7E4),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _StatCard(
              number: '+10',
              label: 'AÑOS',
              icon: Icons.workspace_premium_outlined,
              color: const Color(0xFF1F3D24),
              bgColor: const Color(0xFFF3F4F6),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _StatCard(
              number: '98%',
              label: 'ÉXITO',
              icon: Icons.sentiment_very_satisfied_outlined,
              color: const Color(0xFF3D7B2C),
              bgColor: const Color(0xFFE5F2E1),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String number;
  final String label;
  final IconData icon;
  final Color color;
  final Color bgColor;

  const _StatCard({
    required this.number,
    required this.label,
    required this.icon,
    required this.color,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: bgColor,
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 10),
          Text(
            number,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: Color(0xFF6B7280),
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ── 4. MISIÓN Y VISIÓN ───────────────────────────────────────────────────────
class _MisionVisionSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Expanded(
            child: _MisionVisionCard(
              icon: Icons.gps_fixed,
              title: 'Misión',
              description: 'Ofrecer soluciones integrales en superficies sintéticas, garantizando innovación y sostenibilidad.',
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _MisionVisionCard(
              icon: Icons.remove_red_eye,
              title: 'Visión',
              description: 'Ser la empresa líder en Colombia para 2030 en soluciones de grama sintética y paisajismo.',
            ),
          ),
        ],
      ),
    );
  }
}

class _MisionVisionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;

  const _MisionVisionCard({
    required this.icon,
    required this.title,
    required this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 170,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: const BoxDecoration(
              color: Color(0xFFE8F7E4),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: const Color(0xFF2D5A27), size: 20),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1F3D24),
            ),
          ),
          const SizedBox(height: 6),
          Expanded(
            child: Text(
              description,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF6B7280),
                height: 1.4,
              ),
              overflow: TextOverflow.fade,
            ),
          ),
        ],
      ),
    );
  }
}

// ── 5. VALORES ───────────────────────────────────────────────────────────────
class _ValoresSection extends StatelessWidget {
  static const _valores = [
    _Valor(
      icon: Icons.military_tech_outlined,
      title: 'Calidad Superior',
      description: 'Garantizamos la excelencia de cada uno de nuestros productos y procesos de instalación.',
      bgColor: Color(0xFFE8F7E4),
      iconColor: Color(0xFF2D5A27),
    ),
    _Valor(
      icon: Icons.handshake_outlined,
      title: 'Integridad y Confianza',
      description: 'Actuamos con total transparencia y honestidad en cada acuerdo comercial.',
      bgColor: Color(0xFFE5F2E1),
      iconColor: Color(0xFF3D7B2C),
    ),
    _Valor(
      icon: Icons.tips_and_updates_outlined,
      title: 'Innovación Constante',
      description: 'Buscamos nuevas tecnologías en gramas para ofrecer soluciones eficientes y sostenibles.',
      bgColor: Color(0xFFFFF7ED),
      iconColor: Color(0xFFEA580C),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Nuestros Valores',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1F3D24),
            ),
          ),
          const SizedBox(height: 6),
          Container(
            width: 40,
            height: 3,
            decoration: BoxDecoration(
              color: const Color(0xFF2D5A27),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          ..._valores.map((v) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _ValorCard(valor: v),
              )),
        ],
      ),
    );
  }
}

class _Valor {
  final IconData icon;
  final String title;
  final String description;
  final Color bgColor;
  final Color iconColor;

  const _Valor({
    required this.icon,
    required this.title,
    required this.description,
    required this.bgColor,
    required this.iconColor,
  });
}

class _ValorCard extends StatelessWidget {
  final _Valor valor;
  const _ValorCard({required this.valor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 18,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: valor.bgColor,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(valor.icon, color: valor.iconColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  valor.title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1F3D24),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  valor.description,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF6B7280), height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── 6. POR QUÉ ELEGIRNOS ─────────────────────────────────────────────────────
class _PorQueElegirnosSection extends StatelessWidget {
  static const _razones = [
    _Razon(
      icon: Icons.verified_user_outlined,
      title: 'Materiales Premium',
      description: 'Trabajamos con proveedores internacionales certificados.',
    ),
    _Razon(
      icon: Icons.engineering_outlined,
      title: 'Instalación Profesional',
      description: 'Personal técnico con amplia experiencia y precisión.',
    ),
    _Razon(
      icon: Icons.verified_outlined,
      title: 'Garantía Extendida',
      description: 'Ofrecemos soporte completo y respaldo post-venta.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF2D5A27), Color(0xFF1F3D24)],
        ),
        borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
      ),
      child: Column(
        children: [
          const Text(
            '¿Por qué elegirnos?',
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 6),
          Container(
            width: 50,
            height: 3,
            decoration: BoxDecoration(
              color: const Color(0xFF81D460),
              borderRadius: BorderRadius.circular(1.5),
            ),
          ),
          const SizedBox(height: 24),
          ..._razones.map((r) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _RazonCard(razon: r),
              )),
        ],
      ),
    );
  }
}

class _Razon {
  final IconData icon;
  final String title;
  final String description;
  const _Razon({required this.icon, required this.title, required this.description});
}

class _RazonCard extends StatelessWidget {
  final _Razon razon;
  const _RazonCard({required this.razon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.12),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white24),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(razon.icon, color: const Color(0xFF81D460), size: 26),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  razon.title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  razon.description,
                  style: const TextStyle(fontSize: 13, color: Colors.white70, height: 1.4),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── 7. FOOTER ────────────────────────────────────────────────────────────────
class _Footer extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFF1F3D24),
      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
      child: const Text(
        '© 2026 Gramas y Suministros. Todos los derechos reservados.',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 12, color: Colors.white54, height: 1.4),
      ),
    );
  }
}
