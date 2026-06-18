package com.example.gramas_y_suministros_movil

import android.os.Bundle
import android.view.WindowManager
import io.flutter.embedding.android.FlutterActivity

class MainActivity: FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Se eliminó FLAG_SECURE para permitir capturas de pantalla durante pruebas.
        // Si deseas volver a bloquearlas, agrega de nuevo:
        // window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }
}
