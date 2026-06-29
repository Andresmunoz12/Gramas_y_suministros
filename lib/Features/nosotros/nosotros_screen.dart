import 'package:flutter/material.dart';

class NosotrosScreen extends StatelessWidget {
  const NosotrosScreen({super.key});

  // ── Paleta corporativa ──────────────────────────────────────────────────────
  static const Color _medGreen = Color(0xFF2D5A27);
  static const Color _bgGrey  = Color(0xFFF5F8F2);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgGrey,
      // ── AppBar ──────────────────────────────────────────────────────────────
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: Builder(
          builder: (ctx) => IconButton(
            icon: const Icon(Icons.menu, color: _medGreen),
            onPressed: () => Scaffold.of(ctx).openDrawer(),
          ),
        ),
        title: const Text(
          'Nosotros',
          style: TextStyle(
            color: Colors.black87,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 12),
            child: Icon(Icons.notifications_none_outlined, color: Colors.black87),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _HeroSection(),
            const SizedBox(height: 20),
            _HistoriaSection(),
            const SizedBox(height: 16),
            _StatsSection(),
            const SizedBox(height: 16),
            _MisionVisionSection(),
            const SizedBox(height: 16),
            _ValoresSection(),
            const SizedBox(height: 16),
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
    return Container(
      width: double.infinity,
      height: 200,
      decoration: const BoxDecoration(
        image: DecorationImage(
          image: AssetImage('assets/icons/icono_apk.png'),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(Color(0xAA0A2E0A), BlendMode.multiply),
          onError: _heroFallback,
        ),
        color: Color(0xFF1B3C1B),
      ),
      child: const Padding(
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            Text(
              'Gramas y Suministros',
              style: TextStyle(
                color: Colors.white,
                fontSize: 26,
                fontWeight: FontWeight.w900,
                height: 1.2,
              ),
            ),
            SizedBox(height: 6),
            Text(
              'Transformamos Espacios, Creamos Experiencias',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  static void _heroFallback(Object e, StackTrace? s) {}
}

// ── 2. NUESTRA HISTORIA ───────────────────────────────────────────────────────
class _HistoriaSection extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 8, offset: Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Nuestra Historia',
            style: TextStyle(
              color: Color(0xFF2D5A27),
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const Divider(color: Color(0xFF81D460), thickness: 2, height: 16, endIndent: 200),
          const SizedBox(height: 12),
          // Imagen placeholder (cielo azul)
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Container(
              height: 180,
              width: double.infinity,
              color: const Color(0xFF87CEEB),
              child: Stack(
                children: [
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Color(0xFF5AB4E8), Color(0xFF87CEEB)],
                      ),
                    ),
                  ),
                  const Center(
                    child: Icon(Icons.landscape_outlined, size: 60, color: Colors.white54),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          _richText(
            'En ',
            'Gramas y Suministros',
            ' comenzamos como un pequeño emprendimiento familiar con una visión clara: elevar la '
            'calidad de los espacios verdes en Colombia. Hoy somos referentes nacionales en '
            'soluciones deportivas, residenciales y comerciales.',
          ),
          const SizedBox(height: 12),
          const Text(
            'Más de 10 años liderando proyectos de grama sintética, superficies deportivas y '
            'soluciones paisajísticas integrales.',
            style: TextStyle(fontSize: 14, color: Color(0xFF444444), height: 1.6),
          ),
        ],
      ),
    );
  }

  Widget _richText(String before, String bold, String after) {
    return RichText(
      text: TextSpan(
        style: const TextStyle(fontSize: 14, color: Color(0xFF444444), height: 1.6),
        children: [
          TextSpan(text: before),
          TextSpan(
            text: bold,
            style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1F4020)),
          ),
          TextSpan(text: after),
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
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          // +500 Proyectos
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 20),
            decoration: BoxDecoration(
              color: const Color(0xFF81D460),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Column(
              children: [
                Text(
                  '+500',
                  style: TextStyle(fontSize: 36, fontWeight: FontWeight.w900, color: Colors.white),
                ),
                Text(
                  'PROYECTOS COMPLETADOS',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 1),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          // +10 Años | 98% Éxito
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2D5A27),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Column(
                    children: [
                      Text(
                        '+10',
                        style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900, color: Colors.white),
                      ),
                      Text(
                        'AÑOS',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white70, letterSpacing: 1),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEEEEEE),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: const Column(
                    children: [
                      Text(
                        '98%',
                        style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900, color: Color(0xFF2D5A27)),
                      ),
                      Text(
                        'ÉXITO',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF666666), letterSpacing: 1),
                      ),
                    ],
                  ),
                ),
              ),
            ],
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
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          _MisionVisionCard(
            icon: Icons.gps_fixed_outlined,
            title: 'Misión',
            description:
                'Ofrecer soluciones integrales en superficies sintéticas, garantizando '
                'innovación, sostenibilidad y excelencia en cada proyecto.',
          ),
          const SizedBox(height: 12),
          _MisionVisionCard(
            icon: Icons.remove_red_eye_outlined,
            title: 'Visión',
            description:
                'Ser la empresa líder en Colombia para 2030 en soluciones de grama sintética '
                'y paisajismo sostenible.',
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
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: const Border(left: BorderSide(color: Color(0xFF81D460), width: 4)),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
      ),
      padding: const EdgeInsets.all(18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: const Color(0xFF2D5A27), size: 28),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF1F4020),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  description,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF555555), height: 1.5),
                ),
              ],
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
      icon: Icons.settings_outlined,
      title: 'Calidad',
      description: 'No negociamos la excelencia de nuestros productos y procesos.',
      bgColor: Color(0xFFECF9E3),
      iconColor: Color(0xFF2D5A27),
    ),
    _Valor(
      icon: Icons.diamond_outlined,
      title: 'Integridad',
      description: 'Actuamos con honestidad y transparencia en cada relación comercial.',
      bgColor: Color(0xFFECF9E3),
      iconColor: Color(0xFF2D5A27),
    ),
    _Valor(
      icon: Icons.lightbulb_outline,
      title: 'Innovación',
      description: 'Buscamos constantemente nuevas tecnologías y métodos eficientes.',
      bgColor: Color(0xFFFFF5EC),
      iconColor: Color(0xFFB87333),
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const Text(
            'Nuestros Valores',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Color(0xFF1F4020),
            ),
          ),
          const SizedBox(height: 14),
          ..._valores.map((v) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
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
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 6, offset: Offset(0, 2))],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: valor.bgColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(valor.icon, color: valor.iconColor, size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  valor.title,
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1F4020),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  valor.description,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF555555), height: 1.45),
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
      icon: Icons.verified_outlined,
      title: 'Materiales Premium',
      description: 'Proveedores certificados y tecnología avanzada.',
    ),
    _Razon(
      icon: Icons.engineering_outlined,
      title: 'Instalación Profesional',
      description: 'Equipo técnico altamente capacitado y detallista.',
    ),
    _Razon(
      icon: Icons.shield_outlined,
      title: 'Garantía Real',
      description: 'Respaldamos cada proyecto con soporte post-venta.',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 0),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 28),
      decoration: const BoxDecoration(
        color: Color(0xFF2D5A27),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const Text(
            '¿Por qué elegirnos?',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 16),
          ..._razones.map((r) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
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
        color: Colors.white.withValues(alpha: 0.12),
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
      color: const Color(0xFFE8EDE5),
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      child: const Text(
        '© 2024 Gramas y Suministros — Todos los derechos reservados.',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 12, color: Color(0xFF666666)),
      ),
    );
  }
}
