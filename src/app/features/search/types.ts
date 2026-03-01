export type RoomType = 'single' | 'double' | 'studio' | 'apartment';

export interface OtherRoomInRental {
    id: string;
    roomName: string | null;
    price: number;
    area: number | null;
    roomType: string;
    image: string;
}

export interface Room {
    id: string;
    title: string;
    location: string;
    price: number;
    area: number;
    roomType: RoomType;
    amenities: string[];
    image: string;
    rating: number;
    available: boolean;
    rentalId?: string;
    /** Match score 0–100 from recommendation system. Higher = better fit. */
    matchScore?: number;
    /** Other rooms in the same rental (for "also in this rental"). */
    otherRoomsInRental?: OtherRoomInRental[];
}

export interface SearchCriteria {
    q?: string;
    /** @deprecated Prefer city + district + address */
    location?: string;
    city?: string;
    district?: string;
    address?: string;
    minPrice?: number;
    maxPrice?: number;
    minArea?: number;
    maxArea?: number;
    roomType?: RoomType | '';
    amenities?: string[];
}

export interface AmenityItem {
    id: string;
    label: string;
}

export type SortOption =
    | 'relevant'
    | 'price-asc'
    | 'price-desc'
    | 'area-asc'
    | 'area-desc'
    | 'rating';