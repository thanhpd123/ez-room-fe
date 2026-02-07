export type RoomType = 'single' | 'double' | 'studio' | 'apartment';

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
}

export interface SearchCriteria {
    location?: string;
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
