import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getAvatarUrl } from '../utils/defaultAvatar.js';

const AuthContext = createContext(null);

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
    const auth0 = useAuth0();

    const [nativeToken, setNativeToken] = useState(() => {
        try {
            return localStorage.getItem('devsup_token') || null;
        } catch {
            return null;
        }
    });

    const [nativeUser, setNativeUser] = useState(() => {
        try {
            const saved = localStorage.getItem('devsup_user');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });

    const isAuthenticated = Boolean(nativeToken) || auth0.isAuthenticated;
    const isLoading = !nativeToken && auth0.isLoading;

    const user = nativeUser ? {
        sub: nativeUser.auth0Id || `devsup|${nativeUser._id}`,
        name: nativeUser.displayName,
        displayName: nativeUser.displayName,
        email: nativeUser.email,
        picture: getAvatarUrl(nativeUser.avatarUrl),
        avatarUrl: getAvatarUrl(nativeUser.avatarUrl),
        username: nativeUser.username
    } : (auth0.user ? {
        ...auth0.user,
        picture: getAvatarUrl(auth0.user.picture),
        avatarUrl: getAvatarUrl(auth0.user.picture)
    } : null);

    const getAccessTokenSilently = useCallback(async () => {
        if (nativeToken) {
            return nativeToken;
        }
        if (auth0.getAccessTokenSilently) {
            return await auth0.getAccessTokenSilently();
        }
        throw new Error('Not authenticated');
    }, [nativeToken, auth0]);

    const loginNative = async (identifier, password) => {
        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.message || 'Login failed. Please check your credentials.');
        }

        if (data.token) {
            localStorage.setItem('devsup_token', data.token);
            setNativeToken(data.token);
        }
        if (data.user) {
            localStorage.setItem('devsup_user', JSON.stringify(data.user));
            setNativeUser(data.user);
        }
        return data.user;
    };

    const signupNative = async (email, password, displayName) => {
        const res = await fetch(`${BACKEND_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, displayName })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.message || 'Signup failed. Please try again.');
        }

        if (data.token) {
            localStorage.setItem('devsup_token', data.token);
            setNativeToken(data.token);
        }
        if (data.user) {
            localStorage.setItem('devsup_user', JSON.stringify(data.user));
            setNativeUser(data.user);
        }
        return data.user;
    };

    const logout = useCallback(async (options) => {
        localStorage.removeItem('devsup_token');
        localStorage.removeItem('devsup_user');
        setNativeToken(null);
        setNativeUser(null);

        if (auth0.isAuthenticated && auth0.logout) {
            auth0.logout(options || { logoutParams: { returnTo: window.location.origin } });
        }
    }, [auth0]);

    const value = {
        isAuthenticated,
        isLoading,
        error: auth0.error,
        user,
        nativeUser,
        nativeToken,
        getAccessTokenSilently,
        loginNative,
        signupNative,
        logout,
        loginWithRedirect: auth0.loginWithRedirect
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

