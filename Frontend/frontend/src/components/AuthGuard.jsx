// components/AuthGuard.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthGuard = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!loading && !isAuthenticated()) {
            navigate('/login', { replace: true, state: { from: location } });
        }
    }, [location.pathname, isAuthenticated, loading, navigate]);

    if (loading) return <div>Cargando...</div>;

    return isAuthenticated() ? children : null;
};