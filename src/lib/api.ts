import { supabase } from '@/lib/supabase';

const getBaseUrl = () =>
    (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

const EZROOM_TOKEN_KEY = 'ezroom_token';

/**
 * Get current auth token for backend (Supabase OAuth or email/password JWT).
 */
export async function getAccessToken(): Promise<string | null> {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) return session.access_token;
    return localStorage.getItem(EZROOM_TOKEN_KEY);
}

export function getStoredToken(): string | null {
    return localStorage.getItem(EZROOM_TOKEN_KEY);
}

export function setStoredAuth(token: string, user: Record<string, unknown>): void {
    localStorage.setItem(EZROOM_TOKEN_KEY, token);
    localStorage.setItem('ezroom_user', JSON.stringify(user));
}

export function clearStoredAuth(): void {
    localStorage.removeItem(EZROOM_TOKEN_KEY);
    localStorage.removeItem('ezroom_user');
}

/**
 * POST /auth/login – email/password login. Returns token and user.
 */
export async function loginWithEmail(
    email: string,
    password: string
): Promise<{ token: string; user: { id: string; fullName: string; email: string; phone: string | null; role: string; status: string; avatarUrl: string | null; createdAt: string } }> {
    const base = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';
    const url = `${base.replace(/\/$/, '')}/auth/login`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Đăng nhập thất bại');
    if (!data.success || !data.token || !data.user) throw new Error('Phản hồi không hợp lệ');
    return { token: data.token, user: data.user };
}

/**
 * POST /auth/forgot-password – request password reset email.
 */
export async function forgotPasswordRequest(email: string): Promise<{ success: boolean; message: string }> {
    const base = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';
    const res = await fetch(`${base.replace(/\/$/, '')}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Yêu cầu thất bại');
    return { success: data.success, message: data.message };
}

/**
 * POST /auth/reset-password – set new password with token.
 */
export async function resetPasswordRequest(
    token: string,
    newPassword: string,
    confirmPassword: string
): Promise<{ success: boolean; message: string }> {
    const base = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';
    const res = await fetch(`${base.replace(/\/$/, '')}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Đặt lại mật khẩu thất bại');
    return { success: data.success, message: data.message };
}

/**
 * POST /auth/register-oauth – complete signup after Google/Facebook
 */
export async function registerOAuthRequest(payload: {
    email: string;
    fullName: string;
    phone?: string;
    role: 'TENANT' | 'LANDLORD';
}): Promise<{ success: boolean; user: Record<string, unknown> }> {
    const base = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';
    const res = await fetch(`${base.replace(/\/$/, '')}/auth/register-oauth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Đăng ký thất bại');
    return data;
}

/**
 * PATCH /auth/profile
 */
export async function updateProfileRequest(updates: { fullName?: string; phone?: string; avatarUrl?: string }) {
    const res = await authFetch('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Cập nhật thất bại');
    return data;
}

export async function getLifestyleRequest() {
    const res = await authFetch('/auth/lifestyle');
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Tải thất bại');
    return data;
}

export async function upsertLifestyleRequest(body: {
    smoking?: boolean;
    drinking?: boolean;
    pets_allowed?: boolean;
    sleep_schedule?: string;
    personalityType?: string;
}) {
    const res = await authFetch('/auth/lifestyle', { method: 'PUT', body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Lưu thất bại');
    return data;
}

export async function getPreferenceRequest() {
    const res = await authFetch('/auth/preference');
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Tải thất bại');
    return data;
}

export async function upsertPreferenceRequest(body: {
    budget_min?: number | null;
    budget_max?: number | null;
    preferredLocation?: string | null;
    preferred_gender?: string | null;
}) {
    const res = await authFetch('/auth/preference', { method: 'PUT', body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Lưu thất bại');
    return data;
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
 * POST /upload/image – upload image file to Cloudinary via backend. Returns Cloudinary URL.
 */
export async function uploadImageRequest(file: File): Promise<{ url: string }> {
    const base = getBaseUrl().replace(/\/$/, '');
    const token = await getAccessToken();
    if (!token) throw new Error('Cần đăng nhập để tải ảnh lên');

    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${base}/upload/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Tải ảnh lên thất bại');
    if (!data.url) throw new Error('Không nhận được URL ảnh');
    return { url: data.url };
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
