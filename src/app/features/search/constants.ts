import type { Room, AmenityItem } from './types';

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

export const MOCK_ROOMS: Room[] = [
    {
        id: '1',
        title: 'Phòng đơn hiện đại gần trung tâm',
        location: 'Quận 1, TP.HCM',
        price: 3500000,
        area: 25,
        roomType: 'single',
        amenities: ['wifi', 'điều hòa', 'máy giặt', 'bếp'],
        image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
        rating: 4.5,
        available: true,
        rentalId: 'rental-1',
    },
    {
        id: '2',
        title: 'Phòng đôi thoáng mát, view đẹp',
        location: 'Quận 3, TP.HCM',
        price: 5000000,
        area: 35,
        roomType: 'double',
        amenities: ['wifi', 'điều hòa', 'ban công', 'thang máy'],
        image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
        rating: 4.8,
        available: true,
        rentalId: 'rental-1',
    },
    {
        id: '3',
        title: 'Studio cao cấp đầy đủ nội thất',
        location: 'Quận 2, TP.HCM',
        price: 7500000,
        area: 40,
        roomType: 'studio',
        amenities: ['wifi', 'điều hòa', 'máy giặt', 'bếp', 'bảo vệ 24/7'],
        image: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800',
        rating: 4.9,
        available: true,
        rentalId: 'rental-1',
    },
    {
        id: '4',
        title: 'Căn hộ 1 phòng ngủ view sông',
        location: 'Quận 7, TP.HCM',
        price: 9000000,
        area: 50,
        roomType: 'apartment',
        amenities: ['wifi', 'điều hòa', 'máy giặt', 'bếp', 'bảo vệ 24/7', 'hồ bơi'],
        image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
        rating: 5.0,
        available: true,
        rentalId: 'rental-1',
    },
    {
        id: '5',
        title: 'Phòng đơn giá rẻ gần Đại học',
        location: 'Quận Bình Thạnh, TP.HCM',
        price: 2500000,
        area: 20,
        roomType: 'single',
        amenities: ['wifi', 'điều hòa'],
        image: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800',
        rating: 4.2,
        available: true,
        rentalId: 'rental-1',
    },
    {
        id: '6',
        title: 'Phòng đôi sang trọng khu an ninh',
        location: 'Quận 10, TP.HCM',
        price: 5500000,
        area: 38,
        roomType: 'double',
        amenities: ['wifi', 'điều hòa', 'máy giặt', 'bảo vệ 24/7'],
        image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800',
        rating: 4.6,
        available: false,
        rentalId: 'rental-1',
    },
];

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];