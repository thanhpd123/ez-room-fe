import { useState, useCallback } from 'react';
import type { Room, SearchCriteria } from '../types';

const getBaseUrl = () =>
    (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

interface ApiRoom {
    id: string;
    room_post_id?: string;
    title?: string;
    roomName?: string;
    price: number;
    area?: number;
    sizeM2?: number;
    roomType?: string;
    max_occupants?: number;
    maxPeople?: number;
    images?: string[];
    thumbnail_url?: string;
    amenities?: { id?: string; name?: string }[];
    rental_id?: string;
    rentalId?: string;
    rental?: {
        id: string;
        title: string;
        location?: {
            address?: string;
            district?: string;
            city?: string;
        };
    };
}

function mapApiRoomToRoom(apiRoom: ApiRoom): Room {
    const location = apiRoom.rental?.location;
    const locationStr = location 
        ? [location.district, location.city].filter(Boolean).join(', ')
        : '';
    
    return {
        id: apiRoom.id || apiRoom.room_post_id || '',
        title: apiRoom.title || apiRoom.roomName || 'Phòng trọ',
        location: locationStr,
        price: apiRoom.price || 0,
        area: apiRoom.area || apiRoom.sizeM2 || 0,
        roomType: (apiRoom.roomType as Room['roomType']) || 'single',
        amenities: (apiRoom.amenities || []).map(a => a.name || a.id || ''),
        image: apiRoom.thumbnail_url || apiRoom.images?.[0] || '',
        rating: 4.5, // Default rating - can be fetched from feedback later
        available: true,
        rentalId: apiRoom.rental_id || apiRoom.rentalId,
    };
}

interface UseSearchReturn {
    results: Room[];
    isSearching: boolean;
    hasSearched: boolean;
    searchByText: (criteria: SearchCriteria) => void;
    searchByImage: (imageFile: File) => void;
    resetSearch: () => void;
}

function filterRooms(rooms: Room[], criteria: SearchCriteria): Room[] {
    return rooms.filter((room) => {
        // Filter by location
        if (criteria.location && !room.location.toLowerCase().includes(criteria.location.toLowerCase())) {
            return false;
        }

        // Filter by price range
        if (criteria.minPrice && room.price < criteria.minPrice) {
            return false;
        }
        if (criteria.maxPrice && room.price > criteria.maxPrice) {
            return false;
        }

        // Filter by area range
        if (criteria.minArea && room.area < criteria.minArea) {
            return false;
        }
        if (criteria.maxArea && room.area > criteria.maxArea) {
            return false;
        }

        // Filter by room type
        if (criteria.roomType && room.roomType !== criteria.roomType) {
            return false;
        }

        // Filter by amenities
        if (criteria.amenities && criteria.amenities.length > 0) {
            const hasAllAmenities = criteria.amenities.every((amenity) =>
                room.amenities.includes(amenity)
            );
            if (!hasAllAmenities) {
                return false;
            }
        }

        return true;
    });
}

export function useSearch(): UseSearchReturn {
    const [results, setResults] = useState<Room[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const searchByText = useCallback(async (criteria: SearchCriteria) => {
        setIsSearching(true);
        setHasSearched(false);

        try {
            // Build query params
            const params = new URLSearchParams();
            if (criteria.minPrice) params.append('minPrice', criteria.minPrice.toString());
            if (criteria.maxPrice) params.append('maxPrice', criteria.maxPrice.toString());
            if (criteria.roomType) params.append('roomType', criteria.roomType);
            params.append('limit', '50');

            const res = await fetch(`${getBaseUrl()}/rooms?${params.toString()}`);
            const data = await res.json();

            if (data.success && Array.isArray(data.data)) {
                let rooms = data.data.map(mapApiRoomToRoom);
                
                // Client-side filtering for location, area, amenities (not supported by API yet)
                rooms = filterRooms(rooms, criteria);
                
                setResults(rooms);
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setIsSearching(false);
            setHasSearched(true);
        }
    }, []);

    const searchByImage = useCallback(async (imageFile: File) => {
        setIsSearching(true);
        setHasSearched(false);

        // TODO: In production, send image to backend for CLIP vector analysis
        console.log('Searching with image:', imageFile.name, imageFile.size, 'bytes');
        
        try {
            // For now, fetch all rooms and return random subset
            const res = await fetch(`${getBaseUrl()}/rooms?limit=20`);
            const data = await res.json();

            if (data.success && Array.isArray(data.data)) {
                const rooms = data.data.map(mapApiRoomToRoom);
                // Shuffle and take first 4 as "similar" rooms
                const shuffled = rooms.sort(() => 0.5 - Math.random());
                setResults(shuffled.slice(0, 4));
            } else {
                setResults([]);
            }
        } catch (error) {
            console.error('Image search error:', error);
            setResults([]);
        } finally {
            setIsSearching(false);
            setHasSearched(true);
        }
    }, []);

    const resetSearch = useCallback(() => {
        setResults([]);
        setHasSearched(false);
    }, []);

    return {
        results,
        isSearching,
        hasSearched,
        searchByText,
        searchByImage,
        resetSearch,
    };
}
