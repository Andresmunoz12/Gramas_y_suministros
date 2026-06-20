// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import AuthService from '../api/services/auth.service';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            const data = await AuthService.login(credentials);
            // Recargar el usuario después del login
            const currentUser = AuthService.getCurrentUser();
            setUser(currentUser);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        AuthService.logout();
        setUser(null); // 👈 Esto actualiza el estado
    };

    // 👈 IMPORTANTE: isAuthenticated debe basarse en el estado, no en localStorage
    const isAuthenticated = !!user;

    const value = {
        user,
        login,
        logout,
        isAuthenticated, // 👈 Ahora es un booleano, no una función
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};