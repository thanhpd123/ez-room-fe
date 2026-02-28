import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Room, SearchCriteria } from '../types';
import { smartSearchRequest, searchByImageRequest } from '@/lib/api';

function smartSearchItemToRoom(r: {
    id: string;
    title: string;
    location: { district: string | null; city: string | null } | null;
    images: string[];
    price: number;
    area: number | null;
    roomType: string | null;
    amenities?: string[];
}): Room {
    const loc = r.location;
    const locationStr = [loc?.district, loc?.city].filter(Boolean).join(', ') || 'N/A';
    return {
        id: r.id,
        title: r.title,
        location: locationStr,
        price: r.price ?? 0,
        area: r.area ?? 0,
        roomType: (r.roomType as Room['roomType']) || 'apartment',
        amenities: r.amenities ?? [],
        image: r.images?.[0] || '',
        rating: 0,
        available: true,
        rentalId: r.id,
    };
}

interface UseSearchReturn {
    results: Room[];
    isSearching: boolean;
    hasSearched: boolean;
    searchByText: (criteria: SearchCriteria) => void;
    searchByImage: (imageFile: File, options?: { district?: string }) => void;
    resetSearch: () => void;
    imageSearchError: string | null;
}

export function useSearch(): UseSearchReturn {
    const [searchParams] = useSearchParams();
    const [results, setResults] = useState<Room[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [imageSearchError, setImageSearchError] = useState<string | null>(null);

    const searchByText = useCallback(async (criteria: SearchCriteria) => {
        setIsSearching(true);
        setHasSearched(false);
        setImageSearchError(null);
        const district = criteria.location?.trim();
        smartSearchRequest({
            q: criteria.q || undefined,
            district: district || undefined,
            minPrice: criteria.minPrice,
            maxPrice: criteria.maxPrice,
            roomType: criteria.roomType || undefined,
            minArea: criteria.minArea,
            maxArea: criteria.maxArea,
            amenities: criteria.amenities?.length ? criteria.amenities : undefined,
            limit: 100,
        })
            .then((res) => {
                setResults((res.data || []).map(smartSearchItemToRoom));
            })
            .catch(() => setResults([]))
            .finally(() => {
                setIsSearching(false);
                setHasSearched(true);
            });
    }, []);

    const searchByImage = useCallback((imageFile: File, options?: { district?: string }) => {
        setIsSearching(true);
        setHasSearched(false);
        setImageSearchError(null);
        searchByImageRequest(imageFile, { district: options?.district })
            .then((res) => {
                const items = res.data || [];
                setResults(
                    items.map((r) => ({
                        id: r.id,
                        title: r.title,
                        location: r.location ? [r.location.district, r.location.city].filter(Boolean).join(', ') : 'N/A',
                        price: r.price ?? 0,
                        area: 0,
                        roomType: 'apartment' as const,
                        amenities: [],
                        image: r.images?.[0] || '',
                        rating: 0,
                        available: true,
                        rentalId: r.id,
                    }))
                );
            })
            .catch((err) => {
                setImageSearchError(err?.message || 'Lỗi tìm kiếm ảnh');
                setResults([]);
            })
            .finally(() => {
                setIsSearching(false);
                setHasSearched(true);
            });
    }, []);

    const resetSearch = useCallback(() => {
        setResults([]);
        setHasSearched(false);
        setImageSearchError(null);
    }, []);

    // Auto-search from URL params on mount
    useEffect(() => {
        const district = searchParams.get('district');
        const city = searchParams.get('city');
        const q = searchParams.get('q');
        const location = searchParams.get('location');
        const price = searchParams.get('price');
        const roomType = searchParams.get('roomType');
        if (district || city || q || location || price || roomType) {
            const criteria: SearchCriteria = {
                q: q || undefined,
                location: district || city || location || undefined,
                roomType: (roomType as SearchCriteria['roomType']) || undefined,
            };
            if (price) {
                const parts = price.split('-').map((s) => (s ? parseInt(s, 10) : undefined));
                if (parts[0] != null) criteria.minPrice = parts[0];
                if (parts[1] != null) criteria.maxPrice = parts[1];
            }
            searchByText(criteria);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only run when URL params change
    }, [searchParams.toString()]);

    return {
        results,
        isSearching,
        hasSearched,
        searchByText,
        searchByImage,
        resetSearch,
        imageSearchError,
    };
}
