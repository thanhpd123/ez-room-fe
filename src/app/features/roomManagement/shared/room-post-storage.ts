import type { CreateManagedRoomPostInput, ManagedRoomPostItem } from './types';

const STORAGE_KEY = 'ezroom:room-management:room-posts';

const DEFAULT_ROOM_POSTS: ManagedRoomPostItem[] = [
    {
        room_post_id: 'room-post-seed-1',
        rental_id: 'rental-seed-1',
        title: 'Room 201 - Fully furnished',
        description:
            'Private bathroom, balcony, wardrobe, and desk. Electricity and water billed monthly.',
        price: 3400000,
        area: 24,
        max_occupants: 2,
        floor: 2,
        gender_preference: 'any',
        status: 'available',
        moderation_status: 'approved',
        created_at: '2026-02-06T06:00:00.000Z',
        thumbnail_url:
            'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=900&q=80',
    },
    {
        room_post_id: 'room-post-seed-2',
        rental_id: 'rental-seed-1',
        title: 'Room 302 - Quiet corner room',
        description: 'Suitable for student. Window view, parking included.',
        price: 2900000,
        area: 19,
        max_occupants: 1,
        floor: 3,
        gender_preference: 'female',
        status: 'rented',
        moderation_status: 'approved',
        created_at: '2026-02-07T08:00:00.000Z',
        thumbnail_url:
            'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    },
    {
        room_post_id: 'room-post-seed-3',
        rental_id: 'rental-seed-2',
        title: 'Studio A1 - Mini apartment',
        description: 'Private kitchen and smart lock. Good for office worker.',
        price: 5600000,
        area: 33,
        max_occupants: 2,
        floor: 1,
        gender_preference: 'any',
        status: 'available',
        moderation_status: 'pending_review',
        created_at: '2026-02-08T09:10:00.000Z',
        thumbnail_url:
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80',
    },
];

function wait(ms = 120) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function createRoomPostId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `room-post-${crypto.randomUUID()}`;
    }
    return `room-post-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function readStorage(): ManagedRoomPostItem[] {
    if (typeof window === 'undefined') {
        return [...DEFAULT_ROOM_POSTS];
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ROOM_POSTS));
        return [...DEFAULT_ROOM_POSTS];
    }

    try {
        const parsed = JSON.parse(raw) as ManagedRoomPostItem[];
        if (!Array.isArray(parsed)) return [...DEFAULT_ROOM_POSTS];

        const normalized = parsed.map((item) => ({
            ...item,
            moderation_status: item.moderation_status ?? 'pending_review',
        }));

        return normalized.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    } catch {
        return [...DEFAULT_ROOM_POSTS];
    }
}

function writeStorage(posts: ManagedRoomPostItem[]) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export async function listRoomPostsByRentalId(rentalId: string) {
    await wait();
    return readStorage().filter((item) => item.rental_id === rentalId);
}

export async function listManagedRoomPosts() {
    await wait();
    return readStorage();
}

export async function getRoomPostById(rentalId: string, roomPostId: string) {
    await wait();
    return (
        readStorage().find(
            (item) => item.room_post_id === roomPostId && item.rental_id === rentalId
        ) ?? null
    );
}

export async function createRoomPost(payload: CreateManagedRoomPostInput) {
    await wait();
    const post: ManagedRoomPostItem = {
        room_post_id: createRoomPostId(),
        rental_id: payload.rental_id,
        title: payload.title.trim(),
        description: payload.description?.trim(),
        price: payload.price,
        area: payload.area,
        max_occupants: payload.max_occupants,
        floor: payload.floor,
        gender_preference: payload.gender_preference,
        status: payload.status,
        moderation_status: payload.moderation_status ?? 'pending_review',
        thumbnail_url: payload.thumbnail_url?.trim() || undefined,
        created_at: new Date().toISOString(),
    };

    const current = readStorage();
    const next = [post, ...current];
    writeStorage(next);
    return post;
}

export async function updateRoomPostModerationStatus(
    roomPostId: string,
    moderationStatus: ManagedRoomPostItem['moderation_status']
) {
    await wait();
    const current = readStorage();
    const next = current.map((post) =>
        post.room_post_id === roomPostId
            ? {
                  ...post,
                  moderation_status: moderationStatus,
              }
            : post
    );
    writeStorage(next);
    return next.find((post) => post.room_post_id === roomPostId) ?? null;
}
