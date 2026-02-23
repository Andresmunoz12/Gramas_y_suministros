import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    // Eliminar datos de sesión
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    localStorage.removeItem("id_rol");

    // Redirigir al inicio
    navigate("/");
  }, [navigate]);

  return null;
}
