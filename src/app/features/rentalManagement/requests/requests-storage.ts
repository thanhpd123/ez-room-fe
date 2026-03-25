import { getAccessToken } from '@/lib/api';
import { getApiUrl } from '@/lib/api-config';

async function apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = await getAccessToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const res = await fetch(getApiUrl(endpoint), {
        ...options,
        headers,
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data?.message || 'API request failed');
    }
    return data;
}

export interface RentalRequest {
    id: string;
    userId: string;
    roomId: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
    paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
    createdAt: string;
    user: {
        id: string;
        fullName: string;
        email: string;
        phone?: string;
        avatarUrl?: string;
    };
    room: {
        id: string;
        room_name?: string;
        price: number;
    };
    rental: {
        id: string;
        title: string;
    };
}

export async function getLandlordRentalRequests(
    status?: string,
    search?: string,
    page = 1,
    limit = 20
): Promise<RentalRequest[]> {
    try {
        const params = new URLSearchParams();
        if (status && status !== 'all') params.append('status', status);
        if (search) params.append('search', search);
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const response = await apiRequest<{ success: boolean; data: RentalRequest[] }>(
            `/preorders/landlord?${params.toString()}`
        );
        return response.data || [];
    } catch (error) {
        console.error('Failed to fetch rental requests:', error);
        return [];
    }
}

export async function confirmRentalRequest(preorderId: string): Promise<boolean> {
    try {
        await apiRequest<{ success: boolean }>(
            `/preorders/${preorderId}/confirm`,
            { method: 'PATCH' }
        );
        return true;
    } catch (error) {
        console.error('Failed to confirm rental request:', error);
        return false;
    }
}

export async function rejectRentalRequest(preorderId: string, reason?: string): Promise<boolean> {
    try {
        await apiRequest<{ success: boolean }>(
            `/preorders/${preorderId}/reject`,
            {
                method: 'PATCH',
                body: JSON.stringify({ reason }),
            }
        );
        return true;
    } catch (error) {
        console.error('Failed to reject rental request:', error);
        return false;
    }
}
