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
            const currentUser = AuthService.getCurrentUser();
            setUser(currentUser);
            return data;
        } catch (error) {
            throw error;
        }
    };

    const logout = () => {
        AuthService.logout();
        setUser(null);
    };

    // ✅ NUEVO: Función para actualizar el usuario en el contexto
    const updateUser = (updatedData) => {
        if (user) {
            const updatedUser = { ...user, ...updatedData };
            setUser(updatedUser);
            // También actualizar localStorage
            import('../utils/secureStorage').then(({ secureStorage }) => {
                secureStorage.setItem('user', JSON.stringify(updatedUser));
            });
        }
    };

    // ✅ NUEVO: Función para recargar el usuario desde el backend
    const refreshUser = async () => {
        if (user?.id_usuario) {
            try {
                const UsuariosService = (await import('../api/services/usuarios.service')).default;
                const freshUser = await UsuariosService.getById(user.id_usuario);
                if (freshUser) {
                    const updatedUser = {
                        id_usuario: freshUser.id_usuario,
                        nombre: freshUser.nombre,
                        apellido: freshUser.apellido || '',
                        email: freshUser.email,
                        id_rol: freshUser.id_rol,
                    };
                    setUser(updatedUser);
                    import('../utils/secureStorage').then(({ secureStorage }) => {
                        secureStorage.setItem('user', JSON.stringify(updatedUser));
                    });
                    return updatedUser;
                }
            } catch (error) {
                console.error('Error refrescando usuario:', error);
            }
        }
        return null;
    };

    const isAuthenticated = !!user;

    const value = {
        user,
        login,
        logout,
        updateUser,
        refreshUser,
        isAuthenticated,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};