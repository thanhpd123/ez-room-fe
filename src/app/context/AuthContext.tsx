import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { authFetch, clearStoredAuth, loginWithEmail, setStoredAuth } from '@/lib/api';

export interface AuthUser {
    id: string;
    email: string | undefined;
    fullName: string | undefined;
    avatarUrl: string | undefined;
    phone?: string | null;
    role?: string;
    isVip?: boolean;
    gender?: string | null;
}

interface AuthContextValue {
    user: AuthUser | null;
    session: unknown;
    /** Supabase or backend JWT – use for backend Authorization: Bearer */
    accessToken: string | null;
    isLoading: boolean;
    /** Reload user from backend (e.g. after profile update). */
    refreshUser: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapSupabaseUser(user: User | null): AuthUser | null {
    if (!user) return null;
    return {
        id: user.id,
        email: user.email ?? undefined,
        fullName: (user.user_metadata?.full_name ?? user.user_metadata?.name) as string | undefined,
        avatarUrl: user.user_metadata?.avatar_url as string | undefined,
    };
}

function readInitialStoredAuth(): {
    user: AuthUser | null;
    accessToken: string | null;
    isLoading: boolean;
} {
    if (typeof window === 'undefined') {
        return { user: null, accessToken: null, isLoading: true };
    }
    try {
        const token = localStorage.getItem('ezroom_token');
        const stored = localStorage.getItem('ezroom_user');
        if (!token || !stored) {
            return { user: null, accessToken: null, isLoading: true };
        }
        const u = JSON.parse(stored);
        return {
            user: {
                id: u.id,
                email: u.email,
                fullName: u.fullName ?? undefined,
                avatarUrl: u.avatarUrl ?? undefined,
                phone: u.phone,
                role: u.role,
                isVip: u.isVip === true,
                gender: u.gender ?? undefined,
            },
            accessToken: token,
            isLoading: false,
        };
    } catch {
        localStorage.removeItem('ezroom_token');
        localStorage.removeItem('ezroom_user');
        return { user: null, accessToken: null, isLoading: true };
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const initialStoredAuth = readInitialStoredAuth();
    const [user, setUser] = useState<AuthUser | null>(initialStoredAuth.user);
    const [session, setSession] = useState<unknown>(null);
    const [accessToken, setAccessToken] = useState<string | null>(initialStoredAuth.accessToken);
    const [isLoading, setIsLoading] = useState(initialStoredAuth.isLoading);

    const setUserFromBackend = useCallback((data: { user: { id: string; email: string | null; full_name: string | null; avatar_url: string | null; role?: string; phone?: string | null; isVip?: boolean; gender?: string | null } }) => {
        const u = data.user;
        setUser({
            id: u.id,
            email: u.email ?? undefined,
            fullName: u.full_name ?? undefined,
            avatarUrl: u.avatar_url ?? undefined,
            role: u.role,
            phone: u.phone ?? undefined,
            isVip: u.isVip === true,
            gender: u.gender ?? undefined,
        });
    }, []);

    const updateAuth = useCallback((session: unknown) => {
        const supaSession = session as { user?: User; access_token?: string } | null;
        setSession(session);
        setUser(mapSupabaseUser(supaSession?.user ?? null));
        setAccessToken(supaSession?.access_token ?? null);
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) {
                updateAuth(s);
            }
            setIsLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            updateAuth(session);
        });

        return () => subscription.unsubscribe();
    }, [updateAuth]);

    // Verify token with backend; sync user (role) from /auth/me; handle NEED_REGISTER for OAuth.
    const verifiedRef = useRef(false);
    useEffect(() => {
        if (!user || !accessToken || verifiedRef.current) return;
        verifiedRef.current = true;
        authFetch('/auth/me')
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (res.status === 404 && data.code === 'NEED_REGISTER') {
                    sessionStorage.setItem(
                        'pendingOAuth',
                        JSON.stringify({
                            email: data.email ?? '',
                            full_name: data.full_name ?? '',
                            avatar_url: data.avatar_url ?? '',
                        })
                    );
                    window.location.href = '/complete-signup';
                    return;
                }
                if (res.status === 401) {
                    supabase.auth.signOut();
                    clearStoredAuth();
                    setUser(null);
                    setSession(null);
                    setAccessToken(null);
                    verifiedRef.current = false;
                    return;
                }
                if (res.ok && data.user) {
                    setUserFromBackend(data);
                }
            })
            .catch(() => {
                verifiedRef.current = false;
            });
    }, [user, accessToken, setUserFromBackend]);

    const signInWithGoogle = useCallback(async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
    }, []);

    const signInWithEmail = useCallback(async (email: string, password: string) => {
        const { token, user: u } = await loginWithEmail(email, password);
        setStoredAuth(token, u);
        setUser({
            id: u.id,
            email: u.email,
            fullName: u.fullName ?? undefined,
            avatarUrl: u.avatarUrl ?? undefined,
            phone: u.phone,
            role: u.role,
            isVip: u.isVip === true,
            gender: u.gender ?? undefined,
        });
        setAccessToken(token);
        setSession(null);
    }, []);

    const refreshUser = useCallback(async () => {
        const res = await authFetch('/auth/me');
        const data = await res.json().catch(() => ({}));
        if (res.ok && data?.user) {
            const u = data.user;
            setUserFromBackend(data);
            const stored = {
                id: u.id,
                email: u.email,
                fullName: u.full_name,
                avatarUrl: u.avatar_url,
                phone: u.phone ?? null,
                role: u.role,
                isVip: u.isVip === true,
                gender: u.gender ?? null,
            };
            localStorage.setItem('ezroom_user', JSON.stringify(stored));
        }
    }, [setUserFromBackend]);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        clearStoredAuth();
        setUser(null);
        setSession(null);
        setAccessToken(null);
    }, []);

    const value: AuthContextValue = {
        user,
        session,
        accessToken,
        isLoading,
        refreshUser,
        signInWithGoogle,
        signInWithEmail,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}
