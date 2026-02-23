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
import { authFetch } from '@/lib/api';

export interface AuthUser {
    id: string;
    email: string | undefined;
    fullName: string | undefined;
    avatarUrl: string | undefined;
}

interface AuthContextValue {
    user: AuthUser | null;
    session: unknown;
    /** Supabase access_token – use for backend Authorization: Bearer */
    accessToken: string | null;
    isLoading: boolean;
    signInWithGoogle: () => Promise<void>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [session, setSession] = useState<unknown>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const updateAuth = useCallback((session: unknown) => {
        const supaSession = session as { user?: User; access_token?: string } | null;
        setSession(session);
        setUser(mapSupabaseUser(supaSession?.user ?? null));
        setAccessToken(supaSession?.access_token ?? null);
    }, []);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session: s } }) => {
            updateAuth(s);
            setIsLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            updateAuth(session);
        });

        return () => subscription.unsubscribe();
    }, [updateAuth]);

    // Verify token with backend when user is set. Only sign out on 401 (invalid/expired token).
    const verifiedRef = useRef(false);
    useEffect(() => {
        if (!user || !accessToken || verifiedRef.current) return;
        verifiedRef.current = true;
        authFetch('/auth/me')
            .then((res) => {
                if (res.status === 401) {
                    supabase.auth.signOut();
                    setUser(null);
                    setSession(null);
                    setAccessToken(null);
                    verifiedRef.current = false;
                }
            })
            .catch(() => {
                verifiedRef.current = false;
            });
    }, [user, accessToken]);

    const signInWithGoogle = useCallback(async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
    }, []);

    const signOut = useCallback(async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setAccessToken(null);
    }, []);

    const value: AuthContextValue = {
        user,
        session,
        accessToken,
        isLoading,
        signInWithGoogle,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
}
