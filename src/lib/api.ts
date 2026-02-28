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
 * GET /auth/suggest-password – get a suggested strong password.
 */
export async function suggestPasswordRequest(): Promise<{ suggestedPassword: string }> {
    const base = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';
    const res = await fetch(`${base.replace(/\/$/, '')}/auth/suggest-password`);
    const data = await res.json();
    if (!res.ok || !data.suggestedPassword) throw new Error('Không thể tạo mật khẩu gợi ý');
    return { suggestedPassword: data.suggestedPassword };
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

/** Lifestyle profile – matches backend/DB (LifestyleProfile) */
export interface LifestyleProfileResponse {
    id?: string;
    smoking?: boolean;
    drinking?: boolean;
    pets_allowed?: boolean;
    sleep_schedule?: string | null;
    personalityType?: string | null;
    cleanliness?: string | null;
    noise_tolerance?: string | null;
    guest_frequency?: string | null;
    cooking_frequency?: string | null;
    work_from_home?: boolean;
    wake_time?: string | null;
    bedtime?: string | null;
    social_level?: string | null;
    occupation_type?: string | null;
    interests?: string[];
    languages?: string[];
    preferred_lease_months?: number | null;
    move_in_date?: string | null;
    temperature_preference?: string | null;
    quiet_hours_preference?: string | null;
}

/** User preference – matches backend/DB (UserPreference) */
export interface UserPreferenceResponse {
    id?: string;
    budget_min?: number | null;
    budget_max?: number | null;
    preferredLocation?: string | null;
    preferred_districts?: string[];
    preferred_gender?: string | null;
    room_type?: string | null;
    preferred_amenities?: string[];
    must_have_amenities?: string[];
    preferred_lease_months?: number | null;
    move_in_date_min?: string | null;
    move_in_date_max?: string | null;
    max_distance_km?: number | null;
    transport_nearby?: boolean | null;
    pet_friendly?: boolean | null;
    preferred_roommate_age_min?: number | null;
    preferred_roommate_age_max?: number | null;
    lifestyle_match_weight?: number | null;
    safety_priority?: number | null;
}

export async function getLifestyleRequest(): Promise<{
    success: boolean;
    profile: LifestyleProfileResponse | null;
}> {
    const res = await authFetch('/auth/lifestyle');
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Tải thất bại');
    return data;
}

export async function upsertLifestyleRequest(body: {
    smoking?: boolean;
    drinking?: boolean;
    pets_allowed?: boolean;
    sleep_schedule?: string | null;
    personalityType?: string | null;
    cleanliness?: string | null;
    noise_tolerance?: string | null;
    guest_frequency?: string | null;
    cooking_frequency?: string | null;
    work_from_home?: boolean;
    wake_time?: string | null;
    bedtime?: string | null;
    social_level?: string | null;
    occupation_type?: string | null;
    interests?: string[];
    languages?: string[];
    preferred_lease_months?: number | null;
    move_in_date?: string | null;
    temperature_preference?: string | null;
    quiet_hours_preference?: string | null;
}) {
    const res = await authFetch('/auth/lifestyle', { method: 'PUT', body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Lưu thất bại');
    return data;
}

export async function getPreferenceRequest(): Promise<{
    success: boolean;
    preference: UserPreferenceResponse | null;
}> {
    const res = await authFetch('/auth/preference');
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Tải thất bại');
    return data;
}

export async function upsertPreferenceRequest(body: {
    budget_min?: number | null;
    budget_max?: number | null;
    preferredLocation?: string | null;
    preferred_districts?: string[];
    preferred_gender?: string | null;
    room_type?: string | null;
    preferred_amenities?: string[];
    must_have_amenities?: string[];
    preferred_lease_months?: number | null;
    move_in_date_min?: string | null;
    move_in_date_max?: string | null;
    max_distance_km?: number | null;
    transport_nearby?: boolean | null;
    pet_friendly?: boolean | null;
    preferred_roommate_age_min?: number | null;
    preferred_roommate_age_max?: number | null;
    lifestyle_match_weight?: number | null;
    safety_priority?: number | null;
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
 * POST /upload/rental-image – upload rental image to Supabase Storage via backend.
 */
export async function uploadRentalImage(file: File): Promise<{ url: string }> {
    const base = getBaseUrl().replace(/\/$/, '');
    const token = await getAccessToken();
    if (!token) throw new Error('Cần đăng nhập để tải ảnh lên');

    const form = new FormData();
    form.append('file', file);

    const res = await fetch(`${base}/upload/rental-image`, {
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
 * POST /rentals – create a new rental listing.
 */
export async function createRentalRequest(body: {
    title: string;
    description?: string;
    city: string;
    district: string;
    address: string;
    images?: string[];
}): Promise<{ success: boolean; data: Record<string, unknown>; message: string }> {
    const token = await getAccessToken();
    if (!token) throw new Error('Cần đăng nhập để tạo bài đăng');

    const res = await authFetch('/rentals', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Tạo bài đăng thất bại');
    return data;
}

/**
 * GET /rentals/my-rentals – fetch current landlord's rentals.
 */
export async function getMyRentalsRequest(query?: {
    page?: number;
    limit?: number;
    status?: string;
}): Promise<{
    success: boolean;
    data: Array<{
        id: string;
        title: string;
        description: string | null;
        status: string;
        createdAt: string;
        owner: { id: string; fullName: string; avatarUrl: string | null } | null;
        location: { id: string; address: string; district: string | null; city: string | null } | null;
        images: string[];
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.status) params.set('status', query.status);
    const qs = params.toString();

    const res = await authFetch(`/rentals/my-rentals${qs ? `?${qs}` : ''}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Lấy danh sách thất bại');
    return data;
}

/**
 * GET /rentals/:rentalId – fetch a single rental's details.
 */
export async function getRentalByIdRequest(rentalId: string): Promise<{
    success: boolean;
    data: {
        id: string;
        title: string;
        description: string | null;
        status: string;
        createdAt: string;
        owner: { id: string; fullName: string; avatarUrl: string | null; email: string; phone: string | null } | null;
        location: { id: string; address: string; district: string | null; city: string | null } | null;
        rooms: Array<Record<string, unknown>>;
        images: string[];
    };
}> {
    const res = await authFetch(`/rentals/${rentalId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Lấy chi tiết thất bại');
    return data;
}

/**
 * GET /rentals/moderation – moderator fetches all rentals for review.
 */
export async function getRentalsForModeration(query?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
}): Promise<{
    success: boolean;
    data: Array<{
        id: string;
        title: string;
        description: string | null;
        status: string;
        createdAt: string;
        owner: { id: string; fullName: string; avatarUrl: string | null } | null;
        location: { id: string; address: string; district: string | null; city: string | null } | null;
        images: string[];
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.status) params.set('status', query.status);
    if (query?.search) params.set('search', query.search);
    const qs = params.toString();

    const res = await authFetch(`/rentals/moderation${qs ? `?${qs}` : ''}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Lấy danh sách duyệt thất bại');
    return data;
}

/**
 * PATCH /rentals/:rentalId/status – moderator approve/reject rental.
 */
export async function updateRentalStatusRequest(
    rentalId: string,
    status: string
): Promise<{ success: boolean; message: string; data: Record<string, unknown> }> {
    const res = await authFetch(`/rentals/${rentalId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Cập nhật trạng thái thất bại');
    return data;
}

/**
 * GET /public/rentals – list AVAILABLE rentals (no auth). For home & browse.
 */
export interface PublicRental {
    id: string;
    title: string;
    description: string | null;
    status: string;
    createdAt: string;
    location: { id: string; address: string; district: string | null; city: string | null } | null;
    images: string[];
}

export type PublicRentalsSort = 'createdAt_desc' | 'createdAt_asc' | 'title_asc' | 'title_desc';

export async function getPublicRentalsRequest(params?: {
    page?: number;
    limit?: number;
    district?: string;
    city?: string;
    sort?: PublicRentalsSort;
}): Promise<{
    success: boolean;
    data: PublicRental[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
    const base = getBaseUrl().replace(/\/$/, '');
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.district) search.set('district', params.district);
    if (params?.city) search.set('city', params.city);
    if (params?.sort) search.set('sort', params.sort);
    const qs = search.toString();
    const url = `${base}/public/rentals${qs ? `?${qs}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = json?.message || json?.error || `HTTP ${res.status}`;
        console.error('[getPublicRentals]', url, res.status, msg);
        throw new Error(msg);
    }
    return json;
}

/**
 * GET /public/rentals/:id – rental detail (no auth).
 */
export async function getPublicRentalByIdRequest(rentalId: string): Promise<{
    success: boolean;
    data: {
        id: string;
        title: string;
        description: string | null;
        status: string;
        createdAt: string;
        owner: { id: string; fullName: string; avatarUrl: string | null; email: string; phone: string | null } | null;
        location: { id: string; address: string; district: string | null; city: string | null } | null;
        rooms: Array<{
            id: string;
            rental_id: string;
            room_name: string | null;
            room_type: string | null;
            price: number;
            size_m2: number | null;
            max_people: number | null;
            images?: string[];
            amenities?: string[];
        }>;
        amenities?: string[];
        images: string[];
    };
}> {
    const base = getBaseUrl().replace(/\/$/, '');
    const url = `${base}/public/rentals/${encodeURIComponent(rentalId)}`;
    let res: Response;
    try {
        res = await fetch(url, { cache: 'no-store' });
    } catch (e) {
        console.error('[getPublicRentalById]', url, e);
        throw new Error('Không kết nối được máy chủ. Kiểm tra backend đã chạy tại ' + base);
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        let msg = json?.message || json?.error || (res.status === 404 ? 'Không tìm thấy nhà trọ' : `Lỗi ${res.status}`);
        if (res.status === 404 && json?.rentalId) msg += ` (ID: ${json.rentalId})`;
        throw new Error(msg);
    }
    if (!json?.data && json?.success !== true) {
        throw new Error(json?.message || 'Dữ liệu không hợp lệ');
    }
    return json;
}

/**
 * GET /rooms/:roomId – room detail (public, no auth).
 */
export async function getRoomByIdRequest(roomId: string): Promise<{
    success: boolean;
    data: Record<string, unknown>;
}> {
    const base = getBaseUrl().replace(/\/$/, '');
    const res = await fetch(`${base}/rooms/${roomId}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || json?.error || 'Không tìm thấy phòng');
    return json;
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
        role?: string;
        phone?: string | null;
        isVip?: boolean;
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

/** Params for smart search (guest + tenant + VIP). */
export interface SmartSearchParams {
    q?: string;
    city?: string;
    district?: string;
    minPrice?: number;
    maxPrice?: number;
    roomType?: string;
    minArea?: number;
    maxArea?: number;
    amenities?: string[];
    page?: number;
    limit?: number;
}

/**
 * GET /public/search – smart search by name, description, location, price, type, area, amenities.
 */
export async function smartSearchRequest(params?: SmartSearchParams): Promise<{
    success: boolean;
    data: Array<{
        id: string;
        title: string;
        description: string | null;
        location: { district: string | null; city: string | null } | null;
        images: string[];
        price: number;
        area: number | null;
        roomType: string | null;
        amenities: string[];
    }>;
    pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
    const base = getBaseUrl().replace(/\/$/, '');
    const search = new URLSearchParams();
    if (params?.q) search.set('q', params.q);
    if (params?.city) search.set('city', params.city);
    if (params?.district) search.set('district', params.district);
    if (params?.minPrice != null) search.set('minPrice', String(params.minPrice));
    if (params?.maxPrice != null) search.set('maxPrice', String(params.maxPrice));
    if (params?.roomType) search.set('roomType', params.roomType);
    if (params?.minArea != null) search.set('minArea', String(params.minArea));
    if (params?.maxArea != null) search.set('maxArea', String(params.maxArea));
    if (params?.amenities?.length) search.set('amenities', params.amenities.join(','));
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    const url = `${base}/public/search?${search.toString()}`;
    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || json?.error || 'Lỗi tìm kiếm');
    return json;
}

/**
 * GET /search/recommend – recommend rentals by user profile (tenant/VIP, auth required).
 */
export async function getRecommendRequest(): Promise<{
    success: boolean;
    data: Array<{
        id: string;
        title: string;
        description: string | null;
        location: { district: string | null; city: string | null } | null;
        images: string[];
        price: number;
        area: number | null;
        amenities: string[];
    }>;
    hint?: string;
}> {
    const res = await authFetch('/search/recommend');
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || 'Lỗi tải gợi ý');
    return json;
}

/**
 * POST /search/by-image – image search (tenant: limited, VIP: unlimited). Auth required.
 */
export async function searchByImageRequest(
    imageFile: File,
    options?: { district?: string; area?: string }
): Promise<{
    success: boolean;
    data: Array<{
        id: string;
        title: string;
        location: { district: string | null; city: string | null } | null;
        images: string[];
        price: number;
    }>;
    message?: string;
}> {
    const token = await getAccessToken();
    if (!token) throw new Error('Cần đăng nhập để tìm kiếm bằng ảnh');
    const res = await authFetch('/search/by-image', {
        method: 'POST',
        body: JSON.stringify({
            district: options?.district,
            area: options?.area,
        }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || 'Lỗi tìm kiếm ảnh');
    return json;
}
