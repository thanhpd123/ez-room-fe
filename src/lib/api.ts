import { supabase } from '@/lib/supabase';
import { getApiUrl } from '@/lib/api-config';

export { getApiBaseUrl } from '@/lib/api-config';

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
    localStorage.removeItem('ezroom_refresh_token');
}

/**
 * POST /auth/login – email/password login. Returns token and user.
 */
export async function loginWithEmail(
    email: string,
    password: string
): Promise<{ accessToken: string; user: { id: string; fullName: string; email: string; phone: string | null; role: string; status: string; avatarUrl: string | null; createdAt: string; isVip?: boolean; gender?: string | null } }> {
    const url = getApiUrl('/auth/login');
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Đăng nhập thất bại');
    const accessToken = data?.accessToken || data?.token;
    if (!data.success || !accessToken || !data.user) throw new Error('Phản hồi không hợp lệ');
    return { accessToken, user: data.user };
}

export async function refreshAccessTokenRequest(): Promise<{ accessToken: string; user?: Record<string, unknown> }> {
    const res = await fetch(getApiUrl('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data?.message || 'Không thể làm mới phiên đăng nhập');
    }
    const accessToken = data?.accessToken || data?.token;
    if (!accessToken) {
        throw new Error('Phản hồi làm mới phiên không hợp lệ');
    }
    return { accessToken, user: data?.user };
}

export async function logoutCurrentSessionRequest(): Promise<void> {
    await fetch(getApiUrl('/auth/logout'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
}

export async function logoutAllSessionsRequest(): Promise<void> {
    await authFetch('/auth/logout-all', {
        method: 'POST',
    });
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
 * POST /auth/register-oauth – complete signup after Google OAuth
 */
export async function registerOAuthRequest(payload: {
    email: string;
    fullName: string;
    phone?: string;
    role: 'TENANT' | 'LANDLORD';
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

/**
 * Fetch from the backend with Authorization: Bearer <access_token>.
 * Use for any protected API route.
 */
export async function authFetch(
    path: string,
    options: RequestInit = {}
): Promise<Response> {
    const fetchWithToken = async (token: string | null): Promise<Response> => {
        const url = getApiUrl(path);
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
            credentials: 'include',
        });
    };

    const token = await getAccessToken();
    let response = await fetchWithToken(token);

    const shouldTryRefresh =
        response.status === 401 &&
        !!localStorage.getItem(EZROOM_TOKEN_KEY) &&
        path !== '/auth/login' &&
        path !== '/auth/refresh' &&
        path !== '/auth/logout';

    if (!shouldTryRefresh) {
        return response;
    }

    try {
        const { accessToken } = await refreshAccessTokenRequest();
        localStorage.setItem(EZROOM_TOKEN_KEY, accessToken);
        response = await fetchWithToken(accessToken);
    } catch {
        return response;
    }

    return response;
}

/**
 * GET /favorites – list current user's favorite rooms (auth required).
 */
export async function getMyFavoritesRequest(): Promise<{
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
    const res = await authFetch('/favorites');
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
export async function addFavoriteRequest(roomId: string): Promise<{ success: boolean; data: { roomId: string } }> {
    const res = await authFetch(`/favorites/${encodeURIComponent(roomId)}`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Không thể thêm yêu thích');
    return data;
}

/**
 * DELETE /favorites/:roomId – remove room from favorites (auth required).
 */
export async function removeFavoriteRequest(roomId: string): Promise<{ success: boolean; data: { roomId: string } }> {
    const res = await authFetch(`/favorites/${encodeURIComponent(roomId)}`, { method: 'DELETE' });
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
    data: {
        wallet: WalletSummary;
        transaction: WalletTransactionItem;
        payment?: {
            provider: 'PAYOS';
            orderCode: string;
            checkoutUrl: string | null;
            qrCode: string | null;
            paymentLinkId: string | null;
            status: string;
        };
    };
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

export async function verifyWalletDepositRequest(orderCode: string): Promise<{
    success: boolean;
    message: string;
    data: { confirmed?: boolean; alreadyConfirmed?: boolean; wallet: WalletSummary | null; payosStatus?: string };
}> {
    const res = await authFetch(`/wallet/verify-deposit?orderCode=${encodeURIComponent(orderCode)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Xác minh thất bại');
    return data;
}

/** Preorder / đặt cọc phòng (PayOS) */
export interface MyPreorderItem {
    id: string;
    userId: string;
    roomId: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
    paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
    depositAmount: number;
    refundStatus: 'NOT_APPLICABLE' | 'ELIGIBLE' | 'REFUNDED' | 'NOT_REFUNDABLE';
    createdAt: string;
    cancelReason: string | null;
    room: {
        id: string;
        room_name: string | null;
        price: number;
    } | null;
    rental: {
        id: string;
        title: string;
    } | null;
}

export interface CreatePreorderDepositPaymentRequest {
    roomId: string;
    depositMonths?: number;
    depositPercent?: number;
    depositAmount?: number;
    buyerName?: string;
    buyerEmail?: string;
    buyerPhone?: string;
}

export interface CreatePreorderDepositPaymentResponse {
    success: boolean;
    message: string;
    data: {
        preorderId: string;
        roomId: string;
        depositAmount: number;
        depositPercent?: number;
        depositMonths?: number;
        payment: {
            provider: 'PAYOS';
            orderCode: string;
            checkoutUrl: string | null;
            qrCode: string | null;
            paymentLinkId: string | null;
            status: string;
        };
    };
}

export async function createPreorderDepositPaymentRequest(
    body: CreatePreorderDepositPaymentRequest
): Promise<CreatePreorderDepositPaymentResponse> {
    const res = await authFetch('/preorders/deposit/pay', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Không thể tạo thanh toán đặt cọc');
    return data;
}

export async function getMyPreordersRequest(params?: {
    page?: number;
    limit?: number;
    status?: MyPreorderItem['status'] | 'ALL';
    paymentStatus?: MyPreorderItem['paymentStatus'] | 'ALL';
}): Promise<{
    success: boolean;
    data: MyPreorderItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
    const search = new URLSearchParams();
    if (params?.page) search.set('page', String(params.page));
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.status) search.set('status', params.status);
    if (params?.paymentStatus) search.set('paymentStatus', params.paymentStatus);

    const qs = search.toString();
    const res = await authFetch(`/preorders/mine${qs ? `?${qs}` : ''}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải danh sách đặt cọc');
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
    preference: { preferred_districts: string[]; room_type: string | null; budget_min: number | null; budget_max: number | null; preferredLocation: string | null } | null;
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

export interface RoommatePublicProfile {
    user: {
        id: string;
        fullName: string;
        avatarUrl: string | null;
        gender: string | null;
        memberSince: string | null;
    };
    lifestyle: {
        smoking: boolean | null;
        drinking: boolean | null;
        pets_allowed: boolean | null;
        sleep_schedule: string | null;
        work_from_home: boolean | null;
        personalityType: string | null;
        social_level: string | null;
        cleanliness: string | null;
        noise_tolerance: string | null;
        guest_frequency: string | null;
        cooking_frequency: string | null;
        wake_time: string | null;
        bedtime: string | null;
        occupation_type: string | null;
        temperature_preference: string | null;
        quiet_hours_preference: string | null;
        interests: string[];
        languages: string[];
        preferred_lease_months: number | null;
    } | null;
    preference: {
        preferred_districts: string[];
        room_type: string | null;
        budget_min: number | null;
        budget_max: number | null;
        preferred_amenities: string[];
        must_have_amenities: string[];
        preferred_lease_months: number | null;
        pet_friendly: boolean | null;
        transport_nearby: boolean | null;
    } | null;
}

export async function getRoommateProfileRequest(userId: string): Promise<{
    success: boolean;
    data: RoommatePublicProfile;
}> {
    const res = await authFetch(`/roommate/profile/${encodeURIComponent(userId)}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải hồ sơ');
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
 * GET /rentals/rejection-info – landlord fetches rejection info for a target.
 */
export async function getRejectionInfoRequest(
    targetType: 'RENTAL' | 'ROOM',
    targetId: string
): Promise<{
    success: boolean;
    data: {
        hasRejection: boolean;
        reason?: string | null;
        moderatorName?: string | null;
        rejectedAt?: string;
        previousStatus?: string;
        newStatus?: string;
    };
}> {
    const params = new URLSearchParams({ targetType, targetId });
    const res = await authFetch(`/rentals/rejection-info?${params}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Lỗi lấy thông tin từ chối');
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
        resubmit?: boolean;
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
 * GET /feedback/room/:roomId – get reviews for a room (public, no auth).
 */
export async function getRoomReviewsRequest(
    roomId: string,
    options: { page?: number; limit?: number } = {}
): Promise<{
    success: boolean;
    reviews: Array<{
        id: string;
        rating: number;
        cleanlinessRating?: number;
        locationRating?: number;
        valueRating?: number;
        landlordRating?: number;
        comment: string;
        createdAt: string;
        author: {
            id: string;
            name: string;
            avatar?: string;
        };
        landlordReply?: string;
        repliedAt?: string;
    }>;
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}> {
    const params = new URLSearchParams();
    if (options.page) params.append('page', String(options.page));
    if (options.limit) params.append('limit', String(options.limit));

    const res = await fetch(getApiUrl(`/feedback/room/${roomId}?${params}`));
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json?.message || json?.error || 'Không thể tải đánh giá');
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

export interface ApiErrorWithCode extends Error {
    code?: string;
    upgradePath?: string;
    featureName?: string;
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
    if (!res.ok) {
        const err = new Error(json?.message || json?.error || 'Lỗi tìm kiếm') as ApiErrorWithCode;
        err.code = json?.code;
        err.upgradePath = json?.upgradePath;
        err.featureName = json?.featureName;
        throw err;
    }
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
 * TODO: Send imageFile via FormData for actual image-based search.
 */
export async function searchByImageRequest(
    _imageFile: File,
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

export interface VipPackageItem {
    id: string;
    name: string;
    description: string | null;
    durationDays: number;
    price: number;
    targetRole: 'TENANT' | 'LANDLORD' | string;
    isActive: boolean;
    createdAt: string | null;
}

export async function getVipPackagesRequest(targetRole?: 'TENANT' | 'LANDLORD'): Promise<{
    success: boolean;
    data: VipPackageItem[];
}> {
    const search = new URLSearchParams();
    if (targetRole) search.set('targetRole', targetRole);
    const qs = search.toString();
    const res = await fetch(getApiUrl(`/vip/packages${qs ? `?${qs}` : ''}`), {
        cache: 'no-store',
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json?.message || 'Không thể tải gói VIP');
    }
    return json;
}

export async function createVipPurchaseRequest(packageId: string): Promise<{
    success: boolean;
    message?: string;
    data?: {
        payment?: {
            checkoutUrl?: string | null;
            orderCode?: string;
        };
    };
}> {
    const res = await authFetch('/vip/purchase', {
        method: 'POST',
        body: JSON.stringify({ packageId }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json?.message || 'Không thể tạo thanh toán VIP');
    }
    return json;
}

export async function verifyVipPurchaseRequest(orderCode: string): Promise<{
    success: boolean;
    message?: string;
    data?: {
        confirmed?: boolean;
        activated?: boolean;
        vipExpiresAt?: string;
        payosStatus?: string;
    };
}> {
    const res = await authFetch(`/vip/verify?orderCode=${encodeURIComponent(orderCode)}`);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(json?.message || 'Không thể xác minh thanh toán VIP');
    }
    return json;
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

/** Landlord Dashboard */

export interface LandlordDashboardStats {
    rentals: {
        total: number;
        byStatus: {
            AVAILABLE: number;
            UNAVAILABLE: number;
            HIDDEN: number;
            PENDING: number;
            SUSPEND: number;
            VIOLATE: number;
        };
    };
    rooms: {
        total: number;
    };
    wallet: {
        balance: number;
    };
    feedback: {
        total: number;
        averageRating: number;
    };
    preorders: {
        total: number;
        byStatus: {
            PENDING: number;
            CONFIRMED: number;
            CANCELLED: number;
            EXPIRED: number;
        };
    };
}

export async function getLandlordDashboardStatsRequest(): Promise<{
    success: boolean;
    data: LandlordDashboardStats;
}> {
    const res = await authFetch('/rentals/dashboard');
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Lỗi tải dashboard');
    return data;
}
