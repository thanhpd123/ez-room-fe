import type { AmenityItem } from './types';

export const AMENITIES_LIST: AmenityItem[] = [
    { id: 'wifi', label: 'WiFi' },
    { id: 'điều hòa', label: 'Điều hòa' },
    { id: 'máy giặt', label: 'Máy giặt' },
    { id: 'bếp', label: 'Bếp' },
    { id: 'ban công', label: 'Ban công' },
    { id: 'bảo vệ 24/7', label: 'Bảo vệ 24/7' },
    { id: 'thang máy', label: 'Thang máy' },
    { id: 'hồ bơi', label: 'Hồ bơi' },
];

export const ROOM_TYPE_OPTIONS = [
    { value: 'single', label: 'Phòng đơn' },
    { value: 'double', label: 'Phòng đôi' },
    { value: 'studio', label: 'Studio' },
    { value: 'apartment', label: 'Căn hộ' },
];

export const SORT_OPTIONS = [
    { value: 'relevant', label: 'Liên quan nhất' },
    { value: 'price-asc', label: 'Giá: Thấp đến cao' },
    { value: 'price-desc', label: 'Giá: Cao đến thấp' },
    { value: 'area-asc', label: 'Diện tích: Nhỏ đến lớn' },
    { value: 'area-desc', label: 'Diện tích: Lớn đến nhỏ' },
    { value: 'rating', label: 'Đánh giá cao nhất' },
];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];