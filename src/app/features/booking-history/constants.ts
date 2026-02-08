import type { Booking, ReportReason } from './types';

export const REPORT_REASONS: ReportReason[] = [
    {
        value: 'fraud',
        label: 'Lừa đảo / Gian lận',
        description: 'Thông tin sai lệch, giá không đúng',
    },
    {
        value: 'spam',
        label: 'Spam / Quảng cáo',
        description: 'Tin spam, quảng cáo không liên quan',
    },
    {
        value: 'fake-images',
        label: 'Hình ảnh giả mạo',
        description: 'Ảnh không khớp thực tế',
    },
    {
        value: 'unavailable',
        label: 'Phòng không còn trống',
        description: 'Tin cũ, đã cho thuê',
    },
    {
        value: 'inappropriate',
        label: 'Nội dung không phù hợp',
        description: 'Vi phạm quy định cộng đồng',
    },
    {
        value: 'other',
        label: 'Lý do khác',
        description: 'Vấn đề khác',
    },
];

export const RATING_LABELS = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'];

export const PROFANITY_WORDS = ['scam', 'lừa đảo', 'tệ hại', 'khốn nạn'];

export const MOCK_BOOKINGS: Booking[] = [
    {
        id: 'BK001',
        propertyId: 'P001',
        propertyName: 'Căn hộ Studio hiện đại tại Quận 1',
        propertyImage:
            'https://images.unsplash.com/photo-1737442724990-af0fa0885312?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
        address: '123 Đường Lê Lợi, Quận 1, TP. HCM',
        landlordName: 'Trần Hoàng',
        startDate: '2025-09-01',
        endDate: '2025-12-31',
        status: 'completed',
        hasReview: true,
        userRating: 5,
    },
    {
        id: 'BK002',
        propertyId: 'P002',
        propertyName: 'Phòng trọ gần ĐH Bách Khoa',
        propertyImage:
            'https://images.unsplash.com/photo-1633505765486-e404bbbec654?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
        address: '456 Đường Lý Thường Kiệt, Quận 10, TP. HCM',
        landlordName: 'Nguyễn Văn A',
        startDate: '2025-06-01',
        endDate: '2025-08-31',
        status: 'completed',
        hasReview: false,
    },
    {
        id: 'BK003',
        propertyId: 'P003',
        propertyName: 'Căn hộ 2 phòng ngủ Quận 7',
        propertyImage:
            'https://images.unsplash.com/photo-1579632151052-92f741fb9b79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800',
        address: '789 Đường Nguyễn Hữu Thọ, Quận 7, TP. HCM',
        landlordName: 'Lê Thị B',
        startDate: '2026-01-15',
        endDate: '2026-07-15',
        status: 'active',
        hasReview: false,
    },
];

export const BOOKING_TABS = [
    { value: 'all', label: 'Tất cả' },
    { value: 'active', label: 'Đang thuê' },
    { value: 'completed', label: 'Đã hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' },
] as const;

export type BookingTabValue = (typeof BOOKING_TABS)[number]['value'];
