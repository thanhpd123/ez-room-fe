import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ==================== Admin Stats ====================

export async function getAdminStats(): Promise<AdminStats> {
    try {
        const res = await axios.get(`${API_BASE}/admin/stats`, {
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
        const res = await axios.get(`${API_BASE}/rentals/stats`, {
            headers: getAuthHeader(),
        });
        return res.data.data;
    } catch (error) {
        console.error('getRentalStats error:', error);
        return {
            total: 0,
            byStatus: { available: 0, rented: 0, hidden: 0, archived: 0 },
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
        const res = await axios.get(`${API_BASE}/admin/users`, {
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
            `${API_BASE}/admin/users/${userId}/role`,
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
            `${API_BASE}/admin/users/${userId}/status`,
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
        const res = await axios.get(`${API_BASE}/rentals`, {
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
        const res = await axios.get(`${API_BASE}/rentals/${rentalId}`, {
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
            `${API_BASE}/rentals/${rentalId}/status`,
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
        const res = await axios.delete(`${API_BASE}/rentals/${rentalId}`, {
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
        const res = await axios.get(`${API_BASE}/amenities`);
        return res.data.data;
    } catch (error) {
        console.error('getAmenities error:', error);
        return [];
    }
}

export async function createAmenity(data: { name: string }): Promise<{ success: boolean; message: string; data?: Amenity }> {
    try {
        const res = await axios.post(
            `${API_BASE}/amenities`,
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
            `${API_BASE}/amenities/${id}`,
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
        const res = await axios.delete(`${API_BASE}/amenities/${id}`, {
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
        const res = await axios.get(`${API_BASE}/locations`, { params: city ? { city } : {} });
        return res.data.data;
    } catch (error) {
        console.error('getLocations error:', error);
        return [];
    }
}

export async function getCities(): Promise<string[]> {
    try {
        const res = await axios.get(`${API_BASE}/locations/cities`);
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
        const res = await axios.post(`${API_BASE}/locations`, data, {
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
        const res = await axios.patch(`${API_BASE}/locations/${id}`, data, {
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
        const res = await axios.delete(`${API_BASE}/locations/${id}`, {
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
