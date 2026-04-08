export interface RoomDetailData {
  id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  max_occupants: number;
  status: 'available' | 'occupied' | 'maintenance' | 'pending';
  address: string;
  images: string[];
  amenities: string[];
  rentalName: string;
  landlord: {
    id: string;
    name: string;
    phone: string;
    email: string;
    avatar: string;
  };
}