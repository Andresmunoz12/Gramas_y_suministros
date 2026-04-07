// components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
    const { isAuthenticated, user, loading } = useAuth(); // isAuthenticated es booleano ahora
    const location = useLocation();

    if (loading) {
        return <div className="loading">Cargando...</div>;
    }

    // 👇 Verificar autenticación - YA NO es función
    if (!isAuthenticated) { // 👈 Quitamos los paréntesis ()
        console.log('🔒 No autenticado, redirigiendo a login');
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Verificar rol si es necesario
    if (requiredRole !== null && user?.id_rol !== requiredRole) {
        console.log(`🔒 Rol requerido: ${requiredRole}, rol actual: ${user?.id_rol}`);
        if (user?.id_rol === 1) {
            return <Navigate to="/panel" replace />;
        }
        return <Navigate to="/perfil" replace />;
    }

    console.log('✅ Acceso permitido a ruta protegida');
    return children;
};

export default ProtectedRoute;