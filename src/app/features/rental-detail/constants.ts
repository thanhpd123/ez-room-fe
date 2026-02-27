
import type { RentalDetailData } from './types';

export const MOCK_RENTAL_DETAILS: Record<string, RentalDetailData> = {
  'rental-1': {
    id: 'rental-1',
    title: 'Nhà trọ Tây Sơn - Gần Đại học Bách Khoa',
    summary: 'Nhà trọ cao cấp, hiện đại với 20 phòng đầy đủ tiện nghi. Vị trí đắc địa gần các trường đại học, thuận tiện đi lại. An ninh 24/7, môi trường sống văn minh.',
    description: `Nhà trọ Tây Sơn là lựa chọn lý tưởng cho sinh viên và người đi làm tại Hà Nội.

VỊ TRÍ ĐẮC ĐỊA:
- Cách Đại học Bách Khoa 500m
- Cách Đại học Kinh Tế Quốc Dân 1km
- Gần các trạm xe buýt, siêu thị, chợ

TIỆN ÍCH CHUNG:
- Wifi tốc độ cao miễn phí
- Bãi đậu xe rộng rãi
- Khu vực giặt sấy chung
- Camera an ninh 24/7
- Thang máy hiện đại

MÔI TRƯỜNG:
- Khuôn viên sạch sẽ, thoáng mát
- Quản lý chặt chẽ, thân thiện
- Cộng đồng cư dân văn minh
- Điện nước giá dân sự`,
    availableRoom: 5,
    status: 'AVAILABLE',
    address: 'Số 268 Tây Sơn, Phường Ngã Tư Sở, Quận Đống Đa, Hà Nội',
    totalRooms: 20,
    images: [
      'https://images.unsplash.com/photo-1600827439990-5e9b633f696d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
      'https://images.unsplash.com/photo-1759691554836-81ba129a75b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
      'https://images.unsplash.com/photo-1758523417133-41f21fb9f058?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
      'https://images.unsplash.com/photo-1635286771551-9d7241ce7811?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
    ],
    amenities: ['Wifi miễn phí', 'Điều hòa', 'Nóng lạnh', 'Bãi xe', 'An ninh 24/7'],
    landlord: {
      name: 'Nguyễn Văn An',
      phone: '0912 345 678',
      email: 'nguyenvanan@email.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    },
    rooms: [
      {
        id: '1',
        title: 'Phòng 201 - 25m²',
        price: 3500000,
        area: 25,
        status: 'available',
      },
      {
        id: '2',
        title: 'Phòng 202 - 30m²',
        price: 4200000,
        area: 30,
        status: 'available',
      },
      {
        id: '3',
        title: 'Phòng 203 - 22m²',
        price: 3000000,
        area: 22,
        status: 'occupied',
      },
      {
        id: '4',
        title: 'Phòng 204 - 28m²',
        price: 3800000,
        area: 28,
        status: 'available',
      },
      {
        id: '5',
        title: 'Phòng 301 - 35m²',
        price: 4500000,
        area: 35,
        status: 'available',
      },
    ],
  },
};
