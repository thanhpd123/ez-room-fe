import { supabase } from '@/lib/supabase';
import { getApiUrl } from '@/lib/api-config';

export { getApiBaseUrl } from '@/lib/api-config';

const EZROOM_TOKEN_KEY = 'ezroom_token';

/**
 * Get current auth token for backend (Supabase OAuth or email/password JWT).
 * Prefer localStorage (backend JWT) first so email/password users are not blocked by Supabase.
 */
export async function getAccessToken(): Promise<string | null> {
    const stored = localStorage.getItem(EZROOM_TOKEN_KEY);
    if (stored) return stored;
    try {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) return session.access_token;
    } catch {
        // Supabase unreachable (e.g. timeout) – we already checked localStorage above
    }
    return null;
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
    localStorage.removeItem('ezroom_session_expires_at');
}

/**
 * POST /auth/login – email/password login. Returns token and user.
 */
export async function loginWithEmail(
    email: string,
    password: string
): Promise<{ token: string; user: { id: string; fullName: string; email: string; phone: string | null; role: string; status: string; avatarUrl: string | null; createdAt: string; gender?: string | null; isVip?: boolean } }> {
    const url = getApiUrl('/auth/login');
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
    const res = await fetch(getApiUrl('/auth/suggest-password'));
    const data = await res.json();
    if (!res.ok || !data.suggestedPassword) throw new Error('Không thể tạo mật khẩu gợi ý');
    return { suggestedPassword: data.suggestedPassword };
}

/**
 * POST /auth/forgot-password – request password reset email.
 */
export async function forgotPasswordRequest(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(getApiUrl('/auth/forgot-password'), {
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
    const res = await fetch(getApiUrl('/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Đặt lại mật khẩu thất bại');
    return { success: data.success, message: data.message };
}

/**
 * POST /auth/register – email/password registration. Returns the new user.
 */
export async function registerRequest(payload: {
    fullName: string;
    email: string;
    phone?: string;
    password: string;
    confirmPassword: string;
}): Promise<{ success: boolean; user: Record<string, unknown>; message: string }> {
    const res = await fetch(getApiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
        const err = new Error(data?.message || 'Đăng ký thất bại') as Error & { errors?: unknown[] };
        if (Array.isArray(data?.errors)) err.errors = data.errors;
        throw err;
    }
    return data;
}

/**
 * POST /auth/register-oauth – complete signup after Google OAuth
 */
export async function registerOAuthRequest(payload: {
    email: string;
    fullName: string;
    phone?: string;
}): Promise<{ success: boolean; user: Record<string, unknown> }> {
    const res = await fetch(getApiUrl('/auth/register-oauth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Đăng ký thất bại');
    return data;
}

export async function registerLandlordRequest(body: {
    citizenCardNumber?: string;
    citizenCardFrontImageUrl?: string;
    citizenCardBackImageUrl?: string;
}): Promise<{
    success: boolean;
    message: string;
    user?: { id: string; role: string };
    checks?: {
        profile: boolean;
        lifestyle: boolean;
        preference: boolean;
        citizenCardVerified: boolean;
        citizenCardStatus: string;
    };
}> {
    const res = await authFetch('/auth/register-landlord', {
        method: 'POST',
        body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const error = new Error(data?.message || 'Đăng ký chủ nhà thất bại') as Error & { checks?: unknown };
        if (data?.checks) error.checks = data.checks;
        throw error;
    }
    return data;
}

export interface CitizenCardVerificationResponse {
    id?: string;
    citizenCardNumber?: string;
    citizenCardFrontImageUrl?: string;
    citizenCardBackImageUrl?: string;
    status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
    reviewNote?: string | null;
    submittedAt?: string;
    reviewedAt?: string | null;
    reviewedBy?: string | null;
}

export async function getCitizenCardRequest(): Promise<{
    success: boolean;
    citizenCard: CitizenCardVerificationResponse | null;
}> {
    const res = await authFetch('/auth/citizen-card');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Tải CCCD thất bại');
    return data;
}

export async function upsertCitizenCardRequest(body: {
    citizenCardNumber: string;
    citizenCardFrontImageUrl: string;
    citizenCardBackImageUrl: string;
}): Promise<{
    success: boolean;
    message: string;
    citizenCard: CitizenCardVerificationResponse;
}> {
    const res = await authFetch('/auth/citizen-card', {
        method: 'PUT',
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Gửi CCCD thất bại');
    return data;
}

/**
 * PATCH /auth/change-password – change current user's password.
 */
export async function changePasswordRequest(body: {
    currentPassword: string;
    newPassword: string;
    confirmNewPassword: string;
}): Promise<{ success: boolean; message: string }> {
    const res = await authFetch('/auth/change-password', {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(data?.message || 'Đổi mật khẩu thất bại') as Error & { errors?: string[] };
        if (Array.isArray(data?.errors)) err.errors = data.errors;
        throw err;
    }
    return data;
}

/**
 * PATCH /auth/profile
 */
export async function updateProfileRequest(updates: { fullName?: string; phone?: string; avatarUrl?: string; gender?: string | null }) {
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

/** User preference – matches backend/DB (UserPreference). Roommate matching uses profile gender (same gender). */
export interface UserPreferenceResponse {
    id?: string;
    budget_min?: number | null;
    budget_max?: number | null;
    preferredLocation?: string | null;
    preferred_districts?: string[];
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

/** Options for authFetch; pass `token` to use a specific token (e.g. from auth state). */
export type AuthFetchOptions = RequestInit & { token?: string | null };

/**
 * Fetch from the backend with Authorization: Bearer <access_token>.
 * Use for any protected API route.
 * If no token is available (and none passed), returns a 401 Response without hitting the server.
 */
export async function authFetch(
    path: string,
    options: AuthFetchOptions = {}
): Promise<Response> {
    const { token: explicitToken, ...init } = options;
    const token = explicitToken !== undefined && explicitToken !== null
        ? explicitToken
        : await getAccessToken();
    if (!token) {
        return new Response(
            JSON.stringify({ success: false, message: 'Chưa đăng nhập' }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }
    const url = getApiUrl(path);
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...init.headers,
        Authorization: `Bearer ${token}`,
    };
    return fetch(url, { ...init, headers });
}

/**
 * GET /favorites – list current user's favorite rooms (auth required).
 * Pass token when available from auth context to avoid 401 from stale getAccessToken().
 */
export async function getMyFavoritesRequest(options?: { token?: string | null }): Promise<{
    success: boolean;
    data: Array<{
        id: string;
        title: string;
        roomName: string | null;
        price: number;
        area: number | null;
        address: string;
        images: string[];
        location: { district: string | null; city: string | null } | null;
        status: string;
        available: boolean;
    }>;
}> {
    const res = await authFetch('/favorites', { token: options?.token });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải danh sách yêu thích');
    return data;
}

/**
 * GET /favorites/ids – list favorite room IDs only (auth required).
 */
export async function getFavoriteIdsRequest(): Promise<{ success: boolean; data: string[] }> {
    const res = await authFetch('/favorites/ids');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải danh sách yêu thích');
    return data;
}

/**
 * POST /favorites/:roomId – add room to favorites (auth required).
 */
export async function addFavoriteRequest(roomId: string, options?: { token?: string | null }): Promise<{ success: boolean; data: { roomId: string } }> {
    const res = await authFetch(`/favorites/${encodeURIComponent(roomId)}`, { method: 'POST', token: options?.token });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Không thể thêm yêu thích');
    return data;
}

/**
 * DELETE /favorites/:roomId – remove room from favorites (auth required).
 */
export async function removeFavoriteRequest(roomId: string, options?: { token?: string | null }): Promise<{ success: boolean; data: { roomId: string } }> {
    const res = await authFetch(`/favorites/${encodeURIComponent(roomId)}`, { method: 'DELETE', token: options?.token });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Không thể bỏ yêu thích');
    return data;
}

/** Wallet (mock money flow, no real payment gateway) */
export interface WalletSummary {
    id: string;
    userId: string;
    balance: number;
    currency: string;
    createdAt: string;
}

export interface WalletTransactionItem {
    id: string;
    walletId: string;
    type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'PREORDER' | 'REFUND' | 'PAYMENT';
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    amount: number;
    description: string;
    createdAt: string;
}

export async function getMyWalletRequest(): Promise<{ success: boolean; data: WalletSummary }> {
    const res = await authFetch('/wallet');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải ví');
    return data;
}

export async function getMyWalletTransactionsRequest(params?: {
    page?: number;
    limit?: number;
    type?: WalletTransactionItem['type'];
}): Promise<{
    success: boolean;
    data: WalletTransactionItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.type) search.set('type', params.type);
    const qs = search.toString();
    const res = await authFetch(`/wallet/transactions${qs ? `?${qs}` : ''}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải lịch sử ví');
    return data;
}

export async function depositWalletRequest(body: {
    amount: number;
    description?: string;
}): Promise<{
    success: boolean;
    message: string;
    data: { wallet: WalletSummary; transaction: WalletTransactionItem };
}> {
    const res = await authFetch('/wallet/deposit', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Nạp tiền thất bại');
    return data;
}

export async function withdrawWalletRequest(body: {
    amount: number;
    description?: string;
}): Promise<{
    success: boolean;
    message: string;
    data: { wallet: WalletSummary; transaction: WalletTransactionItem };
}> {
    const res = await authFetch('/wallet/withdraw', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Rút tiền thất bại');
    return data;
}

/** Lịch sử thuê phòng (my-bookings) */
export interface MyBookingItem {
    id: string;
    rentalPeriodId: string;
    roomId: string;
    roomName: string;
    propertyName: string;
    propertyImage: string;
    address: string;
    landlordName: string | null;
    startDate: string;
    endDate: string | null;
    status: 'active' | 'completed' | 'cancelled';
    hasReview: boolean;
    userRating?: number;
    feedbackId?: string;
    feedbackStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
    moderatorNote?: string;
    canReview: boolean;
    canReviewDisabled: boolean;
}

export async function getMyBookingsRequest(): Promise<{
    success: boolean;
    data: MyBookingItem[];
}> {
    const res = await authFetch('/rooms/my-bookings');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải lịch sử thuê phòng');
    return data;
}

/** Gửi đánh giá phòng */
export async function createFeedbackRequest(body: {
    rentalPeriodId: string;
    roomId: string;
    rating: number;
    comment: string;
    cleanlinessRating?: number;
    locationRating?: number;
    valueRating?: number;
    landlordRating?: number;
}): Promise<{
    success: boolean;
    message: string;
    data: { id: string; status: string; rating: number };
}> {
    const res = await authFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Gửi đánh giá thất bại');
    return data;
}

/** Lấy feedback theo rental period */
export async function getFeedbackByRentalPeriodRequest(rentalPeriodId: string): Promise<{
    success: boolean;
    data: {
        id: string;
        rating: number;
        comment: string | null;
        cleanlinessRating: number | null;
        locationRating: number | null;
        valueRating: number | null;
        landlordRating: number | null;
        status: string;
        moderatorNote: string | null;
        createdAt: string;
    } | null;
}> {
    const res = await authFetch(`/feedback/by-rental-period/${encodeURIComponent(rentalPeriodId)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải đánh giá');
    return data;
}

/** Roommate matching – same gender + lifestyle score */

export interface RoommateSuggestionItem {
    user: { id: string; fullName: string; avatarUrl: string | null; gender: string | null };
    lifestyle: {
        smoking: boolean | null;
        drinking: boolean | null;
        pets_allowed: boolean | null;
        sleep_schedule: string | null;
        work_from_home: boolean | null;
        personalityType: string | null;
        social_level: string | null;
        interests: string[];
    } | null;
    preference: { preferred_districts: string[]; room_type: string | null } | null;
    matchScore: number;
}

export async function getRoommateSuggestionsRequest(limit?: number): Promise<{
    success: boolean;
    data: RoommateSuggestionItem[];
    message?: string;
}> {
    const qs = limit != null ? `?limit=${limit}` : '';
    const res = await authFetch(`/roommate/suggestions${qs}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải gợi ý roommate');
    return data;
}

export interface RoommateMatchItem {
    id: string;
    status: string;
    createdAt: string;
    isRequester: boolean;
    otherUser: { id: string; fullName: string; avatarUrl: string | null; gender: string | null } | null;
}

export async function getRoommateMatchesRequest(): Promise<{ success: boolean; data: RoommateMatchItem[] }> {
    const res = await authFetch('/roommate/matches');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải danh sách match');
    return data;
}

export async function sendRoommateRequestRequest(targetId: string): Promise<{
    success: boolean;
    message: string;
    data: { id: string; requesterId: string; targetId: string; status: string; createdAt: string };
}> {
    const res = await authFetch(`/roommate/request/${encodeURIComponent(targetId)}`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Gửi lời mời thất bại');
    return data;
}

export async function updateRoommateMatchStatusRequest(
    matchId: string,
    status: 'ACCEPTED' | 'REJECTED'
): Promise<{ success: boolean; message: string; data: { id: string; status: string } }> {
    const res = await authFetch(`/roommate/matches/${encodeURIComponent(matchId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Cập nhật thất bại');
    return data;
}

/** Chat / messages */

export interface ConversationItem {
    peer: { id: string; fullName: string; avatarUrl: string | null };
    lastMessage: { id: string; content: string; created_at: string; isFromMe: boolean };
    unreadCount: number;
}

export async function getConversationsRequest(): Promise<{ success: boolean; data: ConversationItem[] }> {
    const res = await authFetch('/messages/conversations');
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải hội thoại');
    return data;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    message_type: string;
    status: string;
    created_at: string;
    isFromMe: boolean;
    sender: { id: string; fullName: string; avatarUrl: string | null } | null;
}

export async function getThreadRequest(
    userId: string,
    options?: { limit?: number; before?: string }
): Promise<{
    success: boolean;
    data: {
        peer: { id: string; fullName: string; avatarUrl: string | null };
        messages: ChatMessage[];
        hasMore: boolean;
        nextCursor: string | null;
    };
}> {
    const params = new URLSearchParams();
    if (options?.limit) params.set('limit', String(options.limit));
    if (options?.before) params.set('before', options.before);
    const qs = params.toString();
    const res = await authFetch(`/messages/with/${encodeURIComponent(userId)}${qs ? `?${qs}` : ''}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải tin nhắn');
    return data;
}

export async function sendMessageRequest(
    receiverId: string,
    content: string
): Promise<{ success: boolean; data: ChatMessage }> {
    const res = await authFetch('/messages', {
        method: 'POST',
        body: JSON.stringify({ receiverId, content }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Gửi tin nhắn thất bại');
    return data;
}

/**
 * POST /upload/image – upload image file to Cloudinary via backend. Returns Cloudinary URL.
 */
export async function uploadImageRequest(file: File): Promise<{ url: string }> {
    const token = await getAccessToken();
    if (!token) throw new Error('Cần đăng nhập để tải ảnh lên');

    const form = new FormData();
    form.append('file', file);

    const res = await fetch(getApiUrl('/upload/image'), {
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
    const token = await getAccessToken();
    if (!token) throw new Error('Cần đăng nhập để tải ảnh lên');

    const form = new FormData();
    form.append('file', file);

    const res = await fetch(getApiUrl('/upload/rental-image'), {
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
        documents?: Array<{
            id: string;
            documentType: string;
            imageUrl: string;
            status: string;
            note?: string | null;
        }>;
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
 * PUT /rentals/:rentalId – landlord update their rental.
 */
export async function updateRentalRequest(
    rentalId: string,
    payload: {
        title?: string;
        description?: string;
        address?: string;
        district?: string;
        city?: string;
        images?: string[];
        status?: 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN';
    }
): Promise<{ success: boolean; message: string; data: Record<string, unknown> }> {
    const res = await authFetch(`/rentals/${rentalId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Cập nhật bài đăng thất bại');
    return data;
}

/**
 * DELETE /rentals/:rentalId – landlord delete their rental.
 */
export async function deleteRentalRequest(
    rentalId: string
): Promise<{ success: boolean; message: string; data: { id: string; title: string } }> {
    const res = await authFetch(`/rentals/${rentalId}`, {
        method: 'DELETE',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Xóa bài đăng thất bại');
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

/**
 * GET /public/room-types – distinct room types from available rentals. No auth.
 */
export async function getPublicRoomTypesRequest(): Promise<{
    success: boolean;
    data: Array<{ value: string; label: string }>;
}> {
    const res = await fetch(getApiUrl('/public/room-types'), { cache: 'default' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || json?.error || 'Lỗi tải loại phòng');
    return json;
}

/**
 * GET /rooms/amenities – list amenities (public). Used for advanced search.
 */
export async function getRoomsAmenitiesRequest(): Promise<{
    success: boolean;
    data: Array<{ id: string; name: string; icon?: string }>;
}> {
    const res = await fetch(getApiUrl('/rooms/amenities'), { cache: 'default' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || json?.error || 'Lỗi tải tiện nghi');
    return json;
}

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
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.district) search.set('district', params.district);
    if (params?.city) search.set('city', params.city);
    if (params?.sort) search.set('sort', params.sort);
    const qs = search.toString();
    const url = getApiUrl(`/public/rentals${qs ? `?${qs}` : ''}`);
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
    const url = getApiUrl(`/public/rentals/${encodeURIComponent(rentalId)}`);
    let res: Response;
    try {
        res = await fetch(url, { cache: 'default' });
    } catch (e) {
        console.error('[getPublicRentalById]', url, e);
        throw new Error('Không kết nối được máy chủ. Kiểm tra backend đã chạy.');
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
 * Tip: when showing this room to a logged-in user, call recordRoomView(roomId) to improve recommendations.
 */
export async function getRoomByIdRequest(roomId: string): Promise<{
    success: boolean;
    data: Record<string, unknown>;
}> {
    const res = await fetch(getApiUrl(`/rooms/${roomId}`));
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
        gender?: string | null;
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
    address?: string;
    minPrice?: number;
    maxPrice?: number;
    roomType?: string;
    minArea?: number;
    maxArea?: number;
    amenities?: string[];
    page?: number;
    limit?: number;
    lat?: number;
    lng?: number;
}

/** Room-level search result (recommendation system). */
export interface SmartSearchRoomItem {
    id: string;
    rentalId: string;
    roomName: string | null;
    title: string;
    price: number;
    area: number | null;
    roomType: string | null;
    amenities: string[];
    images: string[];
    location: { district: string | null; city: string | null; address?: string | null } | null;
    matchScore: number;
    rating: number | null;
    otherRoomsInRental: Array<{ id: string; roomName: string | null; price: number; area: number | null; roomType: string; image: string }>;
}

/**
 * GET /public/search – room-based recommendation search.
 * Pass token via options for user-preference scoring. Rooms sorted by match score.
 */
export async function smartSearchRequest(
    params?: SmartSearchParams,
    options?: { token?: string | null }
): Promise<{
    success: boolean;
    data: SmartSearchRoomItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
    const search = new URLSearchParams();
    if (params?.q) search.set('q', params.q);
    if (params?.city) search.set('city', params.city);
    if (params?.district) search.set('district', params.district);
    if (params?.address) search.set('address', params.address);
    if (params?.minPrice != null) search.set('minPrice', String(params.minPrice));
    if (params?.maxPrice != null) search.set('maxPrice', String(params.maxPrice));
    if (params?.roomType) search.set('roomType', params.roomType);
    if (params?.minArea != null) search.set('minArea', String(params.minArea));
    if (params?.maxArea != null) search.set('maxArea', String(params.maxArea));
    if (params?.amenities?.length) search.set('amenities', params.amenities.join(','));
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    const url = getApiUrl(`/public/search?${search.toString()}`);
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    const token = options?.token ?? (await getAccessToken());
    if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { cache: 'no-store', headers });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || json?.error || 'Lỗi tìm kiếm');
    return json;
}

/**
 * GET /search/advanced – AI-powered search for logged-in users.
 * Uses embeddings, preferences, lifestyle, and ratings for multi-factor scoring.
 */
export async function advancedSearchRequest(
    params?: SmartSearchParams,
    options?: { token?: string | null }
): Promise<{
    success: boolean;
    data: SmartSearchRoomItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    searchMode?: string;
}> {
    const search = new URLSearchParams();
    if (params?.q) search.set('q', params.q);
    if (params?.city) search.set('city', params.city);
    if (params?.district) search.set('district', params.district);
    if (params?.address) search.set('address', params.address);
    if (params?.minPrice != null) search.set('minPrice', String(params.minPrice));
    if (params?.maxPrice != null) search.set('maxPrice', String(params.maxPrice));
    if (params?.roomType) search.set('roomType', params.roomType);
    if (params?.minArea != null) search.set('minArea', String(params.minArea));
    if (params?.maxArea != null) search.set('maxArea', String(params.maxArea));
    if (params?.amenities?.length) search.set('amenities', params.amenities.join(','));
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.lat != null) search.set('lat', String(params.lat));
    if (params?.lng != null) search.set('lng', String(params.lng));
    const res = await authFetch(`/search/advanced?${search.toString()}`, { token: options?.token });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || json?.error || 'Lỗi tìm kiếm nâng cao');
    return json;
}

/**
 * GET /search/nearby – find rooms near user's location (auth required).
 */
export async function nearbySearchRequest(
    params: { lat: number; lng: number; radius?: number; page?: number; limit?: number },
    options?: { token?: string | null }
): Promise<{
    success: boolean;
    data: SmartSearchRoomItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
    searchMode?: string;
    radius?: number;
    googleMapsEnabled?: boolean;
}> {
    const search = new URLSearchParams();
    search.set('lat', String(params.lat));
    search.set('lng', String(params.lng));
    if (params.radius != null) search.set('radius', String(params.radius));
    if (params.page) search.set('page', String(params.page));
    if (params.limit) search.set('limit', String(params.limit));
    const res = await authFetch(`/search/nearby?${search.toString()}`, { token: options?.token });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || json?.error || 'Lỗi tìm kiếm gần bạn');
    return json;
}

/**
 * GET /search/recommend – recommend rentals by user profile (tenant/VIP, auth required).
 * Pass token when available from auth context.
 */
export async function getRecommendRequest(options?: { token?: string | null }): Promise<{
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
    const res = await authFetch('/search/recommend', { token: options?.token });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || 'Lỗi tải gợi ý');
    return json;
}

/**
 * POST /interactions – record user–room interaction for behavior learning (auth required).
 * Call when user views a room (view), favorites (favorite), contacts landlord (contact_landlord), or shares (share).
 */
export async function recordInteractionRequest(
    roomId: string,
    interactionType: 'view' | 'favorite' | 'contact_landlord' | 'share' = 'view'
): Promise<{ success: boolean; message?: string }> {
    const res = await authFetch('/interactions', {
        method: 'POST',
        body: JSON.stringify({ roomId, interactionType }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi ghi nhận');
    return data;
}

/**
 * Fire-and-forget: record a room view for ranking/popularity. Call when opening room detail.
 * Does not throw; safe to call without await.
 */
export function recordRoomView(roomId: string): void {
    if (!roomId) return;
    recordInteractionRequest(roomId, 'view').catch(() => {});
}

/**
 * GET /search/by-text – text-to-image search (auth required).
 * Describe the room in text (e.g. "phòng có cửa sổ lớn") and get visually similar rooms.
 */
export async function searchByTextRequest(
    q: string
): Promise<{
    success: boolean;
    data: Array<{
        id: string;
        title: string;
        location: { district: string | null; city: string | null } | null;
        images: string[];
        price: number;
        matchScore?: number;
    }>;
    message?: string;
    searchMode?: string;
}> {
    const res = await authFetch(`/search/by-text?${new URLSearchParams({ q: q.trim() }).toString()}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || 'Lỗi tìm kiếm bằng mô tả');
    return json;
}

/**
 * POST /search/by-image – image search (VIP only). Auth required.
 * Uses OpenAI Vision + CLIP embeddings for visual room similarity matching.
 */
export async function searchByImageRequest(
    imageFile: File,
    options?: {
        token?: string | null;
        q?: string;
        city?: string;
        district?: string;
        address?: string;
        minPrice?: number;
        maxPrice?: number;
        roomType?: string;
        minArea?: number;
        maxArea?: number;
        amenities?: string[];
        lat?: number;
        lng?: number;
    }
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
    searchMode?: string;
}> {
    const token = options?.token ?? (await getAccessToken());
    if (!token) throw new Error('Cần đăng nhập để tìm kiếm bằng ảnh');

    const form = new FormData();
    form.append('file', imageFile);
    if (options?.q) form.append('q', options.q);
    if (options?.city) form.append('city', options.city);
    if (options?.district) form.append('district', options.district);
    if (options?.address) form.append('address', options.address);
    if (options?.minPrice != null) form.append('minPrice', String(options.minPrice));
    if (options?.maxPrice != null) form.append('maxPrice', String(options.maxPrice));
    if (options?.roomType) form.append('roomType', options.roomType);
    if (options?.minArea != null) form.append('minArea', String(options.minArea));
    if (options?.maxArea != null) form.append('maxArea', String(options.maxArea));
    if (options?.amenities?.length) form.append('amenities', options.amenities.join(','));
    if (options?.lat != null) form.append('lat', String(options.lat));
    if (options?.lng != null) form.append('lng', String(options.lng));

    const res = await fetch(getApiUrl('/search/by-image'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || 'Lỗi tìm kiếm ảnh');
    return json;
}

/**
 * GET /public/landlord/:userId – public landlord profile.
 */
export interface LandlordProfileResponse {
    success: boolean;
    data: {
        user: {
            id: string;
            fullName: string;
            avatarUrl: string | null;
            phone: string | null;
            createdAt: string;
        };
        stats: {
            totalRentals: number;
            activeRentals: number;
            totalRooms: number;
            availableRooms: number;
            totalReviews: number;
            avgRating: number;
        };
        rentals: Array<{
            id: string;
            title: string;
            description: string | null;
            status: string;
            createdAt: string;
            location: { address: string; district: string | null; city: string | null } | null;
            images: string[];
            roomCount: number;
        }>;
        rooms: Array<{
            id: string;
            rentalId: string;
            rentalTitle: string;
            roomName: string | null;
            description: string | null;
            roomType: string | null;
            price: number;
            sizeM2: number | null;
            maxPeople: number | null;
            status: string;
            createdAt: string;
            location: { address: string; district: string | null; city: string | null } | null;
            images: string[];
            amenities: string[];
        }>;
        reviews: Array<{
            id: string;
            rating: number | null;
            comment: string | null;
            createdAt: string;
            reviewer: { id: string; fullName: string; avatarUrl: string | null } | null;
        }>;
    };
}

export async function getLandlordProfileRequest(userId: string): Promise<LandlordProfileResponse> {
    const url = getApiUrl(`/public/landlord/${encodeURIComponent(userId)}`);
    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || 'Không tìm thấy chủ nhà');
    return json;
}

// ============ REPORT / VIOLATION ============
// Align với report_status_enum và report_target_type_enum trong Prisma schema

export type ReportTargetTypeEnum = 'USER' | 'ROOM' | 'BOOKING' | 'REVIEW';
export type ReportStatusEnum = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISMISSED';

export interface ReportItem {
    id: string;
    reporterId: string;
    targetType: ReportTargetTypeEnum;
    targetId: string;
    reason: string;
    description: string | null;
    status: ReportStatusEnum;
    reviewedBy: string | null;
    moderatorNote: string | null;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
    reporter?: { id: string; fullName: string; email: string; phone: string | null; avatarUrl: string | null };
    targetUser?: { id: string; fullName: string; email: string; phone: string | null; avatarUrl: string | null } | null;
    moderator?: { id: string; fullName: string } | null;
}

/**
 * POST /reports – submit a violation report (any logged-in user).
 */
export async function createReportRequest(body: {
    targetType: 'USER' | 'ROOM' | 'BOOKING' | 'REVIEW';
    targetId: string;
    reason: string;
    description?: string;
}): Promise<{ success: boolean; message: string; data: ReportItem }> {
    const res = await authFetch('/reports', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Gửi báo cáo thất bại');
    return data;
}

/**
 * GET /reports – list reports (moderator/admin).
 */
export async function getReportsRequest(params?: {
    status?: string;
    page?: number;
    limit?: number;
}): Promise<{
    success: boolean;
    data: ReportItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
    const search = new URLSearchParams();
    if (params?.status) search.set('status', params.status);
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    const qs = search.toString();
    const res = await authFetch(`/reports${qs ? `?${qs}` : ''}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải danh sách báo cáo');
    return data;
}

/**
 * PATCH /reports/:id – handle/resolve a report (moderator/admin).
 */
export async function handleReportRequest(
    reportId: string,
    body: { status: Exclude<ReportStatusEnum, 'PENDING'>; moderatorNote?: string }
): Promise<{ success: boolean; message: string; data: ReportItem }> {
    const res = await authFetch(`/reports/${encodeURIComponent(reportId)}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Xử lý báo cáo thất bại');
    return data;
}
