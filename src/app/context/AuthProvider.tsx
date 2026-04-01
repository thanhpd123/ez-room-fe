import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import {
    authFetch,
    clearStoredAuth,
    loginWithEmail,
    logoutCurrentSessionRequest,
    setStoredAuth,
} from '@/lib/api';
import { AuthContext } from './auth-context';
import type { AuthUser } from './auth-context';

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
                gender: u.gender ?? undefined,
                isVip: u.isVip === true,
                vipExpiresAt: u.vipExpiresAt ?? null,
            },
            accessToken: token,
            isLoading: false,
        };
    } catch {
        clearStoredAuth();
        return { user: null, accessToken: null, isLoading: true };
    }
}

function readStoredUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
        const stored = localStorage.getItem('ezroom_user');
        if (!stored) return null;
        const u = JSON.parse(stored);
        return {
            id: u.id,
            email: u.email,
            fullName: u.fullName ?? undefined,
            avatarUrl: u.avatarUrl ?? undefined,
            phone: u.phone,
            role: u.role,
            gender: u.gender ?? undefined,
            isVip: u.isVip === true,
            vipExpiresAt: u.vipExpiresAt ?? null,
        };
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const initialStoredAuth = readInitialStoredAuth();
    const [user, setUser] = useState<AuthUser | null>(initialStoredAuth.user);
    const [session, setSession] = useState<unknown>(null);
    const [accessToken, setAccessToken] = useState<string | null>(initialStoredAuth.accessToken);
    const [isLoading, setIsLoading] = useState(initialStoredAuth.isLoading);
    // Only true when we have no token (guest) or after /auth/me has responded; prevents parallel 401s from /favorites and /search/recommend.
    const [authVerified, setAuthVerified] = useState<boolean>(() => !initialStoredAuth.accessToken);

    const setUserFromBackend = useCallback((data: { user: { id: string; email: string | null; full_name: string | null; avatar_url: string | null; role?: string; phone?: string | null; gender?: string | null; isVip?: boolean; vip_expires_at?: string | null } }) => {
        const u = data.user;
        setUser({
            id: u.id,
            email: u.email ?? undefined,
            fullName: u.full_name ?? undefined,
            avatarUrl: u.avatar_url ?? undefined,
            role: u.role,
            phone: u.phone ?? undefined,
            gender: u.gender ?? undefined,
            isVip: u.isVip === true,
            vipExpiresAt: u.vip_expires_at ?? null,
        });
    }, []);

    const updateAuth = useCallback((session: unknown) => {
        const supaSession = session as { user?: User; access_token?: string } | null;

        // For email/password login we store our own backend JWT in localStorage.
        // A null Supabase session should not wipe that auth state.
        if (!supaSession?.user || !supaSession?.access_token) {
            const storedToken = localStorage.getItem('ezroom_token');
            const storedUser = readStoredUser();
            setSession(null);

            if (storedToken && storedUser) {
                setUser(storedUser);
                setAccessToken(storedToken);
                return;
            }

            setUser(null);
            setAccessToken(null);
            setAuthVerified(true);
            return;
        }

        setSession(session);
        const supaUser = mapSupabaseUser(supaSession.user);
        // Preserve extended profile fields (gender, phone, role, isVip) from localStorage
        // until /auth/me responds with the authoritative data. Without this, a brief
        // window exists where supaUser (which lacks these fields) overwrites the stored user,
        // causing gender/role to flicker on every page load.
        const storedUser = readStoredUser();
        if (storedUser && supaUser && storedUser.id === supaUser.id) {
            setUser({ ...storedUser, ...supaUser });
        } else {
            setUser(supaUser);
        }
        setAccessToken(supaSession.access_token);
        setAuthVerified(false);
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

    const verifiedRef = useRef(false);
    useEffect(() => {
        if (!user || !accessToken || verifiedRef.current) return;
        verifiedRef.current = true;
        authFetch('/auth/me', { token: accessToken })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                setAuthVerified(true);
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
                    // If we have our own backend JWT in localStorage, this is an
                    // email/password session and 401 means the token is really invalid/expired.
                    // In that case, log the user out.
                    const hasBackendToken = !!localStorage.getItem('ezroom_token');
                    if (hasBackendToken) {
                        supabase.auth.signOut();
                        clearStoredAuth();
                        setUser(null);
                        setSession(null);
                        setAccessToken(null);
                    }
                    // For pure Supabase (Google) sessions with no backend JWT,
                    // a 401 can be due to temporary Supabase issues. Do NOT
                    // force logout; just mark auth as verified and let the UI
                    // handle missing data gracefully.
                    verifiedRef.current = false;
                    return;
                }
                if (res.ok && data.user) {
                    setUserFromBackend(data);
                    const u = data.user;
                    localStorage.setItem(
                        'ezroom_user',
                        JSON.stringify({
                            id: u.id,
                            email: u.email,
                            fullName: u.full_name,
                            avatarUrl: u.avatar_url,
                            phone: u.phone ?? null,
                            role: u.role,
                            gender: u.gender ?? null,
                            isVip: u.isVip === true,
                            vipExpiresAt: u.vip_expires_at ?? null,
                        })
                    );
                }
            })
            .catch(() => {
                setAuthVerified(true);
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
        const { accessToken, user: u } = await loginWithEmail(email, password);
        setStoredAuth(accessToken, {
            id: u.id,
            email: u.email,
            fullName: u.fullName,
            avatarUrl: u.avatarUrl ?? null,
            phone: u.phone,
            role: u.role,
            gender: u.gender ?? null,
            isVip: u.isVip === true,
        });
        setUser({
            id: u.id,
            email: u.email,
            fullName: u.fullName ?? undefined,
            avatarUrl: u.avatarUrl ?? undefined,
            phone: u.phone,
            role: u.role,
            gender: u.gender ?? undefined,
            isVip: u.isVip === true,
        });
        setAccessToken(accessToken);
        setSession(null);
        setAuthVerified(false);
        verifiedRef.current = false;
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
                gender: u.gender ?? null,
                isVip: u.isVip === true,
                vipExpiresAt: u.vip_expires_at ?? null,
            };
            localStorage.setItem('ezroom_user', JSON.stringify(stored));
        }
    }, [setUserFromBackend]);

    const signOut = useCallback(async () => {
        try {
            await logoutCurrentSessionRequest();
        } catch {
            /* ignore */
        }
        await supabase.auth.signOut();
        clearStoredAuth();
        setUser(null);
        setSession(null);
        setAccessToken(null);
        setAuthVerified(true);
    }, []);

    const value = {
        user,
        session,
        accessToken,
        authVerified,
        isLoading,
        refreshUser,
        signInWithGoogle,
        signInWithEmail,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
