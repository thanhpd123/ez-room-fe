import type { RoomStatus } from '@/lib/models/room.model';

export type RoomPostGenderPreference = 'any' | 'male' | 'female';

export interface ManagedRoomPostItem {
    room_post_id: string;
    rental_id: string;
    title: string;
    description?: string;
    price: number;
    area: number;
    max_occupants: number;
    floor?: number;
    gender_preference: RoomPostGenderPreference;
    status: RoomStatus;
    thumbnail_url?: string;
    created_at: string;
}

export interface CreateManagedRoomPostInput {
    rental_id: string;
    title: string;
    description?: string;
    price: number;
    area: number;
    max_occupants: number;
    floor?: number;
    gender_preference: RoomPostGenderPreference;
    status: RoomStatus;
    thumbnail_url?: string;
}

export const ROOM_POST_STATUS_OPTIONS: Array<{ value: RoomStatus; label: string }> = [
    { value: 'available', label: 'Available' },
    { value: 'rented', label: 'Rented' },
    { value: 'maintenance', label: 'Maintenance' },
];

export const ROOM_POST_GENDER_OPTIONS: Array<{
    value: RoomPostGenderPreference;
    label: string;
}> = [
    { value: 'any', label: 'Any' },
    { value: 'male', label: 'Male only' },
    { value: 'female', label: 'Female only' },
];
