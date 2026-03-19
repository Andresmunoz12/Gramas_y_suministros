// pages/Logout.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // 👈 Importar useAuth

export default function Logout() {
  const navigate = useNavigate();
  const { logout } = useAuth(); // 👈 Obtener logout del contexto

  useEffect(() => {
    // Ejecutar logout
    logout();

    // Pequeño delay para asegurar que se limpió todo
    setTimeout(() => {
      // Redirigir al inicio
      navigate("/");
    }, 100);
  }, [logout, navigate]);

  // Mostrar un mensaje mientras se cierra sesión
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh'
    }}>
      <p>Cerrando sesión...</p>
    </div>
  );
}