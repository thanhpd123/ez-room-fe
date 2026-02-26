import { supabase } from '@/lib/supabase';

const getBaseUrl = () =>
    (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

/**
 * Get current Supabase access token for backend auth.
 */
export async function getAccessToken(): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

/**
 * Fetch from the backend with Authorization: Bearer <access_token>.
 * Use for any protected API route.
 */
export async function authFetch(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = await getAccessToken();
    const url = `${getBaseUrl().replace(/\/$/, '')}/${path.replace(/^\//, '')}`;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, {
        ...options,
        headers,
    });
}

/**
 * GET /auth/me – current user from backend (verifies token end-to-end).
 */
export async function fetchAuthMe(): Promise<{
    success: boolean;
    user?: {
        id: string;
        email: string | null;
        full_name: string | null;
        avatar_url: string | null;
        created_at: string;
    };
    message?: string;
}> {
    const res = await authFetch('/auth/me');
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data?.message || 'Auth check failed');
    }
    return data;
}
