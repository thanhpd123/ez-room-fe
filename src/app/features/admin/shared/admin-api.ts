import axios from 'axios';
import { getApiUrl } from '@/lib/api-config';

// Get token from localStorage (same key as AuthContext)
function getAuthHeader() {
    const token = localStorage.getItem('ezroom_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// ==================== Types ====================

export interface User {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    role: 'ADMIN' | 'MODERATOR' | 'LANDLORD' | 'TENANT' | 'GUEST';
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BANNED';
    createdAt: string;
}

export interface UserDetail extends User {
    isVip: boolean | null;
    updated_at: string | null;
    wallet: {
        id: string;
        balance: string;
        createdAt: string;
    } | null;
    rentals: Array<{
        id: string;
        title: string;
        status: string;
        createdAt: string;
        rooms: Array<{ id: string }>;
    }>;
    lifestyleProfile: {
        id: string;
        occupation_type: string | null;
        personalityType: string | null;
        created_at: string;
    } | null;
    preference: {
        id: string;
        budget_min: string | null;
        budget_max: string | null;
        preferredLocation: string | null;
        room_type: string | null;
    } | null;
    preorders: Array<{
        id: string;
        status: string;
        payment_status: string;
        deposit_amount: string | null;
        createdAt: string;
    }>;
    stats: {
        totalRentals: number;
        totalFavorites: number;
        totalPreorders: number;
    };
}

export interface AdminStats {
    users: {
        total: number;
        byRole: {
            admins: number;
            landlords: number;
            tenants: number;
            moderators: number;
        };
        byStatus: {
            active: number;
            banned: number;
        };
    };
    rentals?: {
        total: number;
    };
    rooms?: {
        total: number;
    };
    wallets?: {
        total: number;
        totalBalance: number;
    };
    feedback?: {
        total: number;
    };
    preorders?: {
        total: number;
    };
}

export interface RentalStats {
    total: number;
    byStatus: {
        available: number;
        unavailable: number;
        hidden: number;
        violate: number;
        pending: number;
        suspend: number;
    };
    thisMonth: number;
}

export interface Rental {
    id: string;
    title: string;
    description: string | null;
    status: 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN' | 'VIOLATE' | 'PENDING' | 'SUSPEND';
    createdAt: string;
    owner: {
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
    };
    location: {
        id: string;
        address: string;
        district: string | null;
        city: string | null;
    } | null;
    rooms: Array<{
        id: string;
        room_name: string;
        price: number;
        room_type: string | null;
    }>;
    roomCount: number;
}

export interface Amenity {
    id: string;
    name: string;
}

export interface Location {
    id: string;
    address: string;
    district: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
}

export interface WalletInfo {
    id: string;
    userId: string;
    balance: string;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
        email: string;
        phone: string | null;
        avatarUrl: string | null;
        role: string;
        status: string;
    };
}

export interface WalletTransaction {
    id: string;
    walletId: string;
    transaction_type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'PREORDER' | 'REFUND' | 'PAYMENT';
    status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
    amount: string;
    description: string | null;
    createdAt: string;
    payosOrderCode: string | null;
    paidAt: string | null;
}

export interface WalletStats {
    totalWallets: number;
    totalBalance: number;
    avgBalance: number;
    maxBalance: number;
    transactionsByType: Array<{
        type: string;
        count: number;
        totalAmount: number;
    }>;
    transactionsByStatus: Array<{
        status: string;
        count: number;
    }>;
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ==================== Admin Stats ====================

export async function getAdminStats(): Promise<AdminStats> {
    try {
        const res = await axios.get(getApiUrl('/admin/stats'), {
            headers: getAuthHeader(),
        });
        return res.data.data;
    } catch (error) {
        console.error('getAdminStats error:', error);
        return {
            users: {
                total: 0,
                byRole: { admins: 0, landlords: 0, tenants: 0, moderators: 0 },
                byStatus: { active: 0, banned: 0 },
            },
        };
    }
}

export async function getRentalStats(): Promise<RentalStats> {
    try {
        const res = await axios.get(getApiUrl('/rentals/stats'), {
            headers: getAuthHeader(),
        });
        return res.data.data;
    } catch (error) {
        console.error('getRentalStats error:', error);
        return {
            total: 0,
            byStatus: { available: 0, unavailable: 0, hidden: 0, violate: 0, pending: 0, suspend: 0 },
            thisMonth: 0,
        };
    }
}

// ==================== Users API ====================

export interface GetUsersParams {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
}

export async function getUsers(params: GetUsersParams = {}): Promise<{
    data: User[];
    pagination: PaginationInfo;
}> {
    try {
        const res = await axios.get(getApiUrl('/admin/users'), {
            headers: getAuthHeader(),
            params,
        });
        return {
            data: res.data.data,
            pagination: res.data.pagination,
        };
    } catch (error) {
        console.error('getUsers error:', error);
        return {
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        };
    }
}

export async function updateUserRole(userId: string, role: string): Promise<{ success: boolean; message: string }> {
    try {
        const res = await axios.patch(
            getApiUrl(`/admin/users/${userId}/role`),
            { role },
            { headers: getAuthHeader() }
        );
        return { success: true, message: res.data.message };
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return {
            success: false,
            message: err.response?.data?.message || 'Lỗi khi cập nhật role',
        };
    }
}

export async function updateUserStatus(userId: string, status: string): Promise<{ success: boolean; message: string }> {
    try {
        const res = await axios.patch(
            getApiUrl(`/admin/users/${userId}/status`),
            { status },
            { headers: getAuthHeader() }
        );
        return { success: true, message: res.data.message || 'Cập nhật thành công' };
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return {
            success: false,
            message: err.response?.data?.message || 'Lỗi khi cập nhật status',
        };
    }
}

// ==================== Rentals API ====================

export interface GetRentalsParams {
    page?: number;
    limit?: number;
    status?: string;
    ownerId?: string;
    search?: string;
    city?: string;
}

export async function getRentals(params: GetRentalsParams = {}): Promise<{
    data: Rental[];
    pagination: PaginationInfo;
}> {
    try {
        const res = await axios.get(getApiUrl('/rentals'), {
            headers: getAuthHeader(),
            params,
        });
        return {
            data: res.data.data,
            pagination: res.data.pagination,
        };
    } catch (error) {
        console.error('getRentals error:', error);
        return {
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        };
    }
}

export async function getRentalById(rentalId: string): Promise<Rental | null> {
    try {
        const res = await axios.get(getApiUrl(`/rentals/${rentalId}`), {
            headers: getAuthHeader(),
        });
        return res.data.data;
    } catch (error) {
        console.error('getRentalById error:', error);
        return null;
    }
}

export async function updateRentalStatus(
    rentalId: string,
    status: string,
    reason?: string
): Promise<{ success: boolean; message: string }> {
    try {
        const res = await axios.patch(
            getApiUrl(`/rentals/${rentalId}/status`),
            { status, reason },
            { headers: getAuthHeader() }
        );
        return { success: true, message: res.data.message };
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return {
            success: false,
            message: err.response?.data?.message || 'Lỗi khi cập nhật status',
        };
    }
}

export async function deleteRental(rentalId: string): Promise<{ success: boolean; message: string }> {
    try {
        const res = await axios.delete(getApiUrl(`/rentals/${rentalId}`), {
            headers: getAuthHeader(),
        });
        return { success: true, message: res.data.message };
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return {
            success: false,
            message: err.response?.data?.message || 'Lỗi khi xóa bài đăng',
        };
    }
}

// ==================== Amenities API ====================

export async function getAmenities(): Promise<Amenity[]> {
    try {
        const res = await axios.get(getApiUrl('/amenities'));
        return res.data.data;
    } catch (error) {
        console.error('getAmenities error:', error);
        return [];
    }
}

export async function createAmenity(data: { name: string }): Promise<{ success: boolean; message: string; data?: Amenity }> {
    try {
        const res = await axios.post(
            getApiUrl('/amenities'),
            data,
            { headers: getAuthHeader() }
        );
        return { success: true, message: res.data.message, data: res.data.data };
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return {
            success: false,
            message: err.response?.data?.message || 'Lỗi khi tạo tiện ích',
        };
    }
}

export async function updateAmenity(id: string, data: { name: string }): Promise<{ success: boolean; message: string }> {
    try {
        const res = await axios.patch(
            getApiUrl(`/amenities/${id}`),
            data,
            { headers: getAuthHeader() }
        );
        return { success: true, message: res.data.message };
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return {
            success: false,
            message: err.response?.data?.message || 'Lỗi khi cập nhật tiện ích',
        };
    }
}

export async function deleteAmenity(id: string): Promise<{ success: boolean; message: string }> {
    try {
        const res = await axios.delete(getApiUrl(`/amenities/${id}`), {
            headers: getAuthHeader(),
        });
        return { success: true, message: res.data.message };
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return {
            success: false,
            message: err.response?.data?.message || 'Lỗi khi xóa tiện ích',
        };
    }
}

// ==================== Locations API ====================

export async function getLocations(city?: string): Promise<Location[]> {
    try {
        const res = await axios.get(getApiUrl('/locations'), { params: city ? { city } : {} });
        return res.data.data;
    } catch (error) {
        console.error('getLocations error:', error);
        return [];
    }
}

export async function getCities(): Promise<string[]> {
    try {
        const res = await axios.get(getApiUrl('/locations/cities'));
        return res.data.data;
    } catch (error) {
        console.error('getCities error:', error);
        return [];
    }
}

export interface CreateLocationInput {
    address: string;
    city?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
}

export async function createLocation(data: CreateLocationInput): Promise<{ success: boolean; message: string; data?: Location }> {
    try {
        const res = await axios.post(getApiUrl('/locations'), data, {
            headers: getAuthHeader(),
        });
        return { success: true, message: res.data.message, data: res.data.data };
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return {
            success: false,
            message: err.response?.data?.message || 'Lỗi khi tạo địa điểm',
        };
    }
}

export async function updateLocation(id: string, data: Partial<CreateLocationInput>): Promise<{ success: boolean; message: string }> {
    try {
        const res = await axios.patch(getApiUrl(`/locations/${id}`), data, {
            headers: getAuthHeader(),
        });
        return { success: true, message: res.data.message };
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return {
            success: false,
            message: err.response?.data?.message || 'Lỗi khi cập nhật địa điểm',
        };
    }
}

export async function deleteLocation(id: string): Promise<{ success: boolean; message: string }> {
    try {
        const res = await axios.delete(getApiUrl(`/locations/${id}`), {
            headers: getAuthHeader(),
        });
        return { success: true, message: res.data.message };
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } } };
        return {
            success: false,
            message: err.response?.data?.message || 'Lỗi khi xóa địa điểm',
        };
    }
}

// ==================== User Detail API ====================

export async function getUserDetail(userId: string): Promise<UserDetail | null> {
    try {
        const res = await axios.get(getApiUrl(`/admin/users/${userId}`), {
            headers: getAuthHeader(),
        });
        return res.data.data;
    } catch (error) {
        console.error('getUserDetail error:', error);
        return null;
    }
}

// ==================== Wallets API (READ-ONLY) ====================

export interface GetWalletsParams {
    page?: number;
    limit?: number;
    search?: string;
    minBalance?: number;
    maxBalance?: number;
}

export async function getWallets(params: GetWalletsParams = {}): Promise<{
    data: WalletInfo[];
    pagination: PaginationInfo;
}> {
    try {
        const res = await axios.get(getApiUrl('/admin/wallets'), {
            headers: getAuthHeader(),
            params,
        });
        return {
            data: res.data.data,
            pagination: res.data.pagination,
        };
    } catch (error) {
        console.error('getWallets error:', error);
        return {
            data: [],
            pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        };
    }
}

export async function getWalletTransactions(
    walletId: string,
    params: { page?: number; limit?: number; type?: string; status?: string } = {}
): Promise<{
    wallet: { id: string; balance: string; user: { id: string; fullName: string; email: string; role: string } };
    transactions: WalletTransaction[];
    pagination: PaginationInfo;
}> {
    try {
        const res = await axios.get(getApiUrl(`/admin/wallets/${walletId}/transactions`), {
            headers: getAuthHeader(),
            params,
        });
        return {
            wallet: res.data.data.wallet,
            transactions: res.data.data.transactions,
            pagination: res.data.pagination,
        };
    } catch (error) {
        console.error('getWalletTransactions error:', error);
        return {
            wallet: { id: '', balance: '0', user: { id: '', fullName: '', email: '', role: '' } },
            transactions: [],
            pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
        };
    }
}

export async function getWalletStats(): Promise<WalletStats> {
    try {
        const res = await axios.get(getApiUrl('/admin/wallets/stats'), {
            headers: getAuthHeader(),
        });
        return res.data.data;
    } catch (error) {
        console.error('getWalletStats error:', error);
        return {
            totalWallets: 0,
            totalBalance: 0,
            avgBalance: 0,
            maxBalance: 0,
            transactionsByType: [],
            transactionsByStatus: [],
        };
    }
}
