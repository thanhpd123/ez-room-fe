import type { CreateManagedRoomPostInput, ManagedRoomPostItem } from './types';
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

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export async function listRoomPostsByRentalId(rentalId: string): Promise<ManagedRoomPostItem[]> {
    const response = await apiRequest<ApiResponse<ManagedRoomPostItem[]>>(`/rooms?rental_id=${rentalId}`);
    return response.data || [];
}

export async function listManagedRoomPosts(): Promise<ManagedRoomPostItem[]> {
    const response = await apiRequest<ApiResponse<ManagedRoomPostItem[]>>('/rooms');
    return response.data || [];
}

export async function getRoomPostById(_rentalId: string, roomPostId: string): Promise<ManagedRoomPostItem | null> {
    try {
        const response = await apiRequest<ApiResponse<ManagedRoomPostItem>>(`/rooms/${roomPostId}`);
        return response.data || null;
    } catch {
        return null;
    }
}

export async function createRoomPost(payload: CreateManagedRoomPostInput): Promise<ManagedRoomPostItem> {
    const response = await apiRequest<ApiResponse<ManagedRoomPostItem>>('/rooms', {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    return response.data;
}

export async function updateRoomPost(
    roomPostId: string,
    payload: Partial<CreateManagedRoomPostInput>
): Promise<ManagedRoomPostItem | null> {
    try {
        const response = await apiRequest<ApiResponse<ManagedRoomPostItem>>(`/rooms/${roomPostId}`, {
            method: 'PUT',
            body: JSON.stringify(payload),
        });
        return response.data || null;
    } catch {
        return null;
    }
}

export async function deleteRoomPost(roomPostId: string): Promise<boolean> {
    try {
        await apiRequest<ApiResponse<{ id: string }>>(`/rooms/${roomPostId}`, {
            method: 'DELETE',
        });
        return true;
    } catch {
        return false;
    }
}

export async function updateRoomPostModerationStatus(
    roomPostId: string,
    moderationStatus: ManagedRoomPostItem['moderation_status']
): Promise<ManagedRoomPostItem | null> {
    try {
        const response = await apiRequest<ApiResponse<ManagedRoomPostItem>>(`/rooms/${roomPostId}`, {
            method: 'PUT',
            body: JSON.stringify({ moderation_status: moderationStatus }),
        });
        return response.data || null;
    } catch {
        return null;
    }
}

export async function fetchAmenities(): Promise<Array<{ id: string; name: string }>> {
    try {
        const response = await apiRequest<ApiResponse<Array<{ id: string; name: string }>>>('/rooms/amenities');
        return response.data || [];
    } catch {
        return [];
    }
}
