import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'organization_admin' | 'organization_staff' | 'user';
    orgId?: string;
}

interface Organization {
    id: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    orgs: Organization[];
    login: (token: string, user: User, orgs?: Organization[]) => void;
    logout: () => void;
    setToken: (token: string) => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setTokenState] = useState<string | null>(localStorage.getItem('token'));
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            if (token) {
                try {
                    const res = await fetch('/api/auth/session', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setUser(data.user);
                        setOrgs(data.orgs || []);
                    } else {
                        logout();
                    }
                } catch (error) {
                    console.error('Session validation failed', error);
                    logout();
                }
            }
            setLoading(false);
        };
        initAuth();
    }, [token]);

    const login = (newToken: string, newUser: User, newOrgs: Organization[] = []) => {
        localStorage.setItem('token', newToken);
        setTokenState(newToken);
        setUser(newUser);
        setOrgs(newOrgs);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setTokenState(null);
        setUser(null);
        setOrgs([]);
    };

    const setToken = (newToken: string) => {
        localStorage.setItem('token', newToken);
        setTokenState(newToken);
    };

    return (
        <AuthContext.Provider value={{ user, token, orgs, login, logout, setToken, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
