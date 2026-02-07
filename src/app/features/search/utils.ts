import type { Room, SortOption } from './types';

export function sortRooms(rooms: Room[], sortBy: SortOption): Room[] {
    const sorted = [...rooms];

    switch (sortBy) {
        case 'price-asc':
            sorted.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            sorted.sort((a, b) => b.price - a.price);
            break;
        case 'area-asc':
            sorted.sort((a, b) => a.area - b.area);
            break;
        case 'area-desc':
            sorted.sort((a, b) => b.area - a.area);
            break;
        case 'rating':
            sorted.sort((a, b) => b.rating - a.rating);
            break;
        default:
            // Keep original order (relevant)
            break;
    }

    return sorted;
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
}

export function getRoomTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        single: 'Phòng đơn',
        double: 'Phòng đôi',
        studio: 'Studio',
        apartment: 'Căn hộ',
    };
    return labels[type] || type;
}
