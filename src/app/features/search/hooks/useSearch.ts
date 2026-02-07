import { useState, useCallback } from 'react';
import type { Room, SearchCriteria } from '../types';
import { MOCK_ROOMS } from '../constants';

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

    const searchByText = useCallback((criteria: SearchCriteria) => {
        setIsSearching(true);
        setHasSearched(false);

        // Simulate API call
        setTimeout(() => {
            const filteredResults = filterRooms(MOCK_ROOMS, criteria);
            setResults(filteredResults);
            setIsSearching(false);
            setHasSearched(true);
        }, 800);
    }, []);

    const searchByImage = useCallback((imageFile: File) => {
        setIsSearching(true);
        setHasSearched(false);

        // Simulate AI image analysis and search
        // In production, this would send the image to the backend for CLIP vector analysis
        console.log('Searching with image:', imageFile.name, imageFile.size, 'bytes');
        setTimeout(() => {
            // Return random subset of rooms sorted by "similarity"
            const shuffled = [...MOCK_ROOMS].sort(() => 0.5 - Math.random());
            const similarRooms = shuffled.slice(0, 4);

            setResults(similarRooms);
            setIsSearching(false);
            setHasSearched(true);
        }, 1500);
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
