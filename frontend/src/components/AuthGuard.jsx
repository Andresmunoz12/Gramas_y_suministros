// components/AuthGuard.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthGuard = ({ children }) => {
    const { isAuthenticated, loading } = useAuth(); // isAuthenticated ya es booleano
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!loading && !isAuthenticated) { // 👈 Ya no es función
            navigate('/login', { replace: true, state: { from: location } });
        }
    }, [location.pathname, isAuthenticated, loading, navigate]);

    if (loading) return <div>Cargando...</div>;

    return isAuthenticated ? children : null; // 👈 Ya no es función
};