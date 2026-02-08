export interface RentalRoom {
  id: string;
  title: string;
  price: number;
  area: number;
  status: 'available' | 'occupied';
}

export interface RentalLandlord {
  name: string;
  phone: string;
  email: string;
  avatar: string;
}

export interface RentalDetailData {
  id: string;
  title: string;
  description: string;
  summary: string;
  availableRoom: number;
  status: 'active' | 'inactive' | 'full';
  address: string;
  images: string[];
  totalRooms: number;
  amenities: string[];
  landlord: RentalLandlord;
  rooms: RentalRoom[];
}
