import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const { data } = await api.get('/auth/me');
                    setUser(data);
                } catch (error) {
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        checkLoggedIn();
    }, []);

    const login = async (username, password) => {
        const { data } = await api.post('/auth/login', { username, password });
        if (data.require2FA) return data;

        localStorage.setItem('token', data.token);
        setUser(data);
        return data;
    };

    const verify2FA = async (tempToken, token) => {
        const { data } = await api.post('/auth/login/verify-2fa', { tempToken, token });
        localStorage.setItem('token', data.token);
        setUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, verify2FA, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
