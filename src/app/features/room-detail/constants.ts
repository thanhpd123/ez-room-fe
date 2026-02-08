import type { RoomDetailData } from './types';

export const MOCK_ROOM_DETAILS: Record<string, RoomDetailData> = {
  '1': {
    id: '1',
    title: 'Phòng trọ hiện đại gần Đại học Bách Khoa',
    description: `Phòng trọ hiện đại, đầy đủ nội thất nằm ngay trung tâm Hà Nội, rất thuận tiện cho sinh viên và người đi làm.

Phòng được thiết kế tối ưu với đầy đủ ánh sáng tự nhiên, thoáng mát. Nội thất bao gồm giường, tủ quần áo, bàn làm việc, ghế, kệ sách.

Khu vực xung quanh có đầy đủ tiện ích: siêu thị, quán ăn, quán cafe, trạm xe buýt. Đặc biệt gần các trường đại học lớn như Bách Khoa, Kinh Tế Quốc Dân.

An ninh 24/7, có camera giám sát. Chủ nhà thân thiện, hỗ trợ nhiệt tình.`,
    price: 3500000,
    area: 25,
    max_occupants: 2,
    status: 'available',
    address: 'Số 268 Tây Sơn, Phường Ngã Tư Sở, Quận Đống Đa, Hà Nội',
    images: [
      'https://images.unsplash.com/photo-1759691554836-81ba129a75b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
      'https://images.unsplash.com/photo-1635286771551-9d7241ce7811?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
      'https://images.unsplash.com/photo-1758523417133-41f21fb9f058?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
      'https://images.unsplash.com/photo-1768118422932-4cdcca2ced8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    ],
    amenities: ['Wifi', 'Điều hòa', 'Nóng lạnh', 'Điện riêng', 'An ninh 24/7'],
    rentalName: 'Nhà trọ Tây Sơn',
    landlord: {
      name: 'Nguyễn Văn An',
      phone: '0912 345 678',
      email: 'nguyenvanan@email.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    },
  },
};