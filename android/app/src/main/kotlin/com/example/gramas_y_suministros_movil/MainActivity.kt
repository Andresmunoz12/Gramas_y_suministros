package com.example.gramas_y_suministros_movil

import android.os.Bundle
import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity

class MainActivity: FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Evita capturas de pantalla, grabaciones e impide visualización en multitarea
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }
}
