import type { CreateManagedRentalInput, ManagedRentalItem } from './types';

const STORAGE_KEY = 'ezroom:rental-management:rentals';

const DEFAULT_RENTALS: ManagedRentalItem[] = [
    {
        rental_id: 'rental-seed-1',
        user_id: 'owner-001',
        title: 'Maple Residence',
        summary: 'Near university area, suitable for students and office workers.',
        description:
            'Building with security cameras, parking, elevator, and shared laundry service.',
        city: 'Ha Noi',
        district: 'Dong Da',
        address: '268 Tay Son',
        property_type: 'boarding_house',
        available_room: 5,
        status: 'active',
        created_at: '2026-02-05T09:00:00.000Z',
        thumbnail_url:
            'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
    },
    {
        rental_id: 'rental-seed-2',
        user_id: 'owner-002',
        title: 'Sunrise Mini Apartment',
        summary: 'Compact serviced apartments with private kitchen.',
        description: 'Access control at main gate, dedicated management team.',
        city: 'Ho Chi Minh',
        district: 'Binh Thanh',
        address: '102 Dien Bien Phu',
        property_type: 'apartment',
        available_room: 2,
        status: 'pending',
        created_at: '2026-02-07T03:30:00.000Z',
        thumbnail_url:
            'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=800&q=80',
    },
];

function wait(ms = 150) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function createRentalId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return `rental-${crypto.randomUUID()}`;
    }

    return `rental-${Date.now()}-${Math.round(Math.random() * 10000)}`;
}

function readStorage(): ManagedRentalItem[] {
    if (typeof window === 'undefined') {
        return [...DEFAULT_RENTALS];
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RENTALS));
        return [...DEFAULT_RENTALS];
    }

    try {
        const parsed = JSON.parse(raw) as ManagedRentalItem[];
        if (!Array.isArray(parsed)) return [...DEFAULT_RENTALS];

        return parsed.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
    } catch {
        return [...DEFAULT_RENTALS];
    }
}

function writeStorage(rentals: ManagedRentalItem[]) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rentals));
}

export async function listManagedRentals() {
    await wait();
    return readStorage();
}

export async function getManagedRentalById(rentalId: string) {
    await wait();
    const rentals = readStorage();
    return rentals.find((item) => item.rental_id === rentalId) ?? null;
}

export async function createManagedRental(payload: CreateManagedRentalInput) {
    await wait();

    const rental: ManagedRentalItem = {
        rental_id: createRentalId(),
        user_id: payload.user_id,
        title: payload.title.trim(),
        summary: payload.summary?.trim(),
        description: payload.description?.trim(),
        city: payload.city.trim(),
        district: payload.district.trim(),
        address: payload.address.trim(),
        property_type: payload.property_type,
        available_room: payload.available_room,
        status: payload.status,
        created_at: new Date().toISOString(),
        thumbnail_url: payload.thumbnail_url?.trim() || undefined,
    };

    const current = readStorage();
    const next = [rental, ...current];
    writeStorage(next);
    return rental;
}
