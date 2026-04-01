import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Room, SearchCriteria } from '../types';
import { smartSearchRequest, advancedSearchRequest, searchByImageRequest, nearbySearchRequest } from '@/lib/api';
import type { SmartSearchRoomItem, ApiErrorWithCode } from '@/lib/api';
import { useAuth } from '@/app/context/useAuth';

function smartSearchItemToRoom(r: SmartSearchRoomItem): Room {
    const loc = r.location;
    const locationStr = [loc?.district, loc?.city].filter(Boolean).join(', ') || 'N/A';
    return {
        id: r.id,
        title: r.title || r.roomName || 'Phòng trọ',
        location: locationStr,
        price: r.price ?? 0,
        area: r.area ?? 0,
        roomType: (r.roomType as Room['roomType']) || 'apartment',
        amenities: r.amenities ?? [],
        image: r.images?.[0] || '',
        rating: r.rating ?? 0,
        available: true,
        rentalId: r.rentalId,
        matchScore: r.matchScore,
        otherRoomsInRental: r.otherRoomsInRental,
        distanceKm: (r as unknown as Record<string, unknown>).distanceKm as number | undefined,
        nearbyPOIs: (r as unknown as Record<string, unknown>).nearbyPOIs as Room['nearbyPOIs'],
    };
}

function isVipFilterError(err: unknown): err is ApiErrorWithCode {
    const e = err as ApiErrorWithCode;
    return e?.code === 'VIP_REQUIRED_FOR_ADVANCED_FILTERS';
}

interface UseSearchReturn {
    results: Room[];
    isSearching: boolean;
    hasSearched: boolean;
    searchByText: (criteria: SearchCriteria) => void;
    searchByImage: (imageFile: File, options?: { district?: string }) => void;
    searchNearby: (lat: number, lng: number, radius?: number) => void;
    resetSearch: () => void;
    imageSearchError: string | null;
    searchError: string | null;
    searchMode: string | null;
    textSearchError: string | null;
    vipUpgradePath: string | null;
}

export function useSearch(isLoggedIn = false): UseSearchReturn {
    const { accessToken } = useAuth();
    const [searchParams] = useSearchParams();
    const [results, setResults] = useState<Room[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [imageSearchError, setImageSearchError] = useState<string | null>(null);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchMode, setSearchMode] = useState<string | null>(null);
    const [textSearchError, setTextSearchError] = useState<string | null>(null);
    const [vipUpgradePath, setVipUpgradePath] = useState<string | null>(null);
    const [lastCriteria, setLastCriteria] = useState<SearchCriteria | null>(null);

    const searchByText = useCallback(
        async (criteria: SearchCriteria) => {
            setIsSearching(true);
            setHasSearched(false);
            setImageSearchError(null);
            setSearchError(null);
            setSearchMode(null);
            setTextSearchError(null);
            setVipUpgradePath(null);

            const params = {
                q: criteria.q || undefined,
                city: criteria.city?.trim() || undefined,
                district: criteria.district?.trim() || criteria.location?.trim() || undefined,
                address: criteria.address?.trim() || undefined,
                minPrice: criteria.minPrice,
                maxPrice: criteria.maxPrice,
                roomType: criteria.roomType || undefined,
                minArea: criteria.minArea,
                maxArea: criteria.maxArea,
                amenities: criteria.amenities?.length ? criteria.amenities : undefined,
                limit: 500,
                lat: criteria.lat,
                lng: criteria.lng,
            };

            try {
                let res;
                if (isLoggedIn) {
                    try {
                        res = await advancedSearchRequest(params, { token: accessToken });
                        setSearchMode((res as { searchMode?: string }).searchMode || 'advanced');
                    } catch {
                        try {
                            res = await smartSearchRequest(params);
                        } catch (err: unknown) {
                            if (isVipFilterError(err)) {
                                const e = err as ApiErrorWithCode;
                                setTextSearchError(e.message || 'Bộ lọc nâng cao yêu cầu tài khoản VIP');
                                setVipUpgradePath(e.upgradePath || '/vip-plans');
                                setResults([]);
                                return;
                            }
                            throw err;
                        }
                        setSearchMode('basic');
                        setSearchError('Tìm kiếm nâng cao tạm thời không khả dụng, đã chuyển sang tìm kiếm thường.');
                    }
                } else {
                    try {
                        res = await smartSearchRequest(params);
                    } catch (err: unknown) {
                        if (isVipFilterError(err)) {
                            const e = err as ApiErrorWithCode;
                            setTextSearchError(e.message || 'Bộ lọc nâng cao yêu cầu tài khoản VIP');
                            setVipUpgradePath(e.upgradePath || '/vip-plans');
                            setResults([]);
                            return;
                        }
                        throw err;
                    }
                    setSearchMode('basic');
                }
                setResults((res.data || []).map(smartSearchItemToRoom));
                setLastCriteria(criteria);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Lỗi tìm kiếm';
                setSearchError(message);
                setResults([]);
            } finally {
                setIsSearching(false);
                setHasSearched(true);
            }
        },
        [isLoggedIn, accessToken]
    );

    const searchNearby = useCallback(
        async (lat: number, lng: number, radius?: number) => {
            setIsSearching(true);
            setHasSearched(false);
            setImageSearchError(null);
            setSearchError(null);
            setSearchMode(null);
            setTextSearchError(null);
            setVipUpgradePath(null);

            try {
                const res = await nearbySearchRequest({ lat, lng, radius, limit: 100 }, { token: accessToken });
                setSearchMode('nearby');
                setResults((res.data || []).map(smartSearchItemToRoom));
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Lỗi tìm kiếm gần bạn';
                setSearchError(message);
                setResults([]);
            } finally {
                setIsSearching(false);
                setHasSearched(true);
            }
        },
        [accessToken]
    );

    const searchByImage = useCallback(
        (imageFile: File, options?: { district?: string }) => {
            setIsSearching(true);
            setHasSearched(false);
            setImageSearchError(null);
            setSearchError(null);
            setSearchMode(null);
            setTextSearchError(null);
            setVipUpgradePath(null);

            const base = lastCriteria || {};
            const paramsForImage = {
                q: base.q || undefined,
                city: base.city?.trim() || undefined,
                district: (options?.district || base.district || base.location)?.trim() || undefined,
                address: base.address?.trim() || undefined,
                minPrice: base.minPrice,
                maxPrice: base.maxPrice,
                roomType: base.roomType || undefined,
                minArea: base.minArea,
                maxArea: base.maxArea,
                amenities: base.amenities?.length ? base.amenities : undefined,
                lat: base.lat,
                lng: base.lng,
            };

            searchByImageRequest(imageFile, { ...paramsForImage, token: accessToken })
                .then((res) => {
                    const items = res.data || [];
                    setSearchMode(res.searchMode || 'image');
                    setResults(
                        items.map((r) => ({
                            id: r.id,
                            title: r.title,
                            location: r.location
                                ? [r.location.district, r.location.city].filter(Boolean).join(', ')
                                : 'N/A',
                            price: r.price ?? 0,
                            area: (r as { area?: number | null }).area ?? 0,
                            roomType: ((r as { roomType?: Room['roomType'] }).roomType || 'apartment') as Room['roomType'],
                            amenities: (r as { amenities?: string[] }).amenities || [],
                            image: r.images?.[0] || '',
                            rating: (r as { rating?: number | null }).rating ?? 0,
                            available: true,
                            rentalId: (r as { rentalId?: string }).rentalId || r.id,
                            matchScore: (r as { matchScore?: number }).matchScore,
                            otherRoomsInRental: (r as { otherRoomsInRental?: Room['otherRoomsInRental'] }).otherRoomsInRental,
                        }))
                    );
                })
                .catch((err) => {
                    const message = err instanceof Error ? err.message : 'Lỗi tìm kiếm ảnh';
                    setImageSearchError(message);
                    setSearchError(message);
                    setResults([]);
                })
                .finally(() => {
                    setIsSearching(false);
                    setHasSearched(true);
                });
        },
        [accessToken, lastCriteria]
    );

    const resetSearch = useCallback(() => {
        setResults([]);
        setHasSearched(false);
        setImageSearchError(null);
        setSearchError(null);
        setSearchMode(null);
        setTextSearchError(null);
        setVipUpgradePath(null);
    }, []);

    useEffect(() => {
        const district = searchParams.get('district');
        const city = searchParams.get('city');
        const address = searchParams.get('address');
        const q = searchParams.get('q');
        const location = searchParams.get('location');
        const price = searchParams.get('price');
        const roomType = searchParams.get('roomType');
        const amenitiesParam = searchParams.get('amenities');
        const minAreaParam = searchParams.get('minArea');
        const maxAreaParam = searchParams.get('maxArea');
        if (district || city || address || q || location || price || roomType || amenitiesParam || minAreaParam || maxAreaParam) {
            const criteria: SearchCriteria = {
                q: q || undefined,
                city: city || undefined,
                district: district || undefined,
                address: address || undefined,
                location: district || city || location || undefined,
                roomType: (roomType as SearchCriteria['roomType']) || undefined,
            };
            if (price) {
                const parts = price.split('-').map((s) => (s ? parseInt(s, 10) : undefined));
                if (parts[0] != null) criteria.minPrice = parts[0];
                if (parts[1] != null) criteria.maxPrice = parts[1];
            }
            if (amenitiesParam) {
                criteria.amenities = amenitiesParam.split(',').map((s) => s.trim()).filter(Boolean);
            }
            if (minAreaParam && !Number.isNaN(Number(minAreaParam))) criteria.minArea = Number(minAreaParam);
            if (maxAreaParam && !Number.isNaN(Number(maxAreaParam))) criteria.maxArea = Number(maxAreaParam);
            searchByText(criteria);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams.toString(), searchByText]);

    return {
        results,
        isSearching,
        hasSearched,
        searchByText,
        searchByImage,
        searchNearby,
        resetSearch,
        imageSearchError,
        searchError,
        searchMode,
        textSearchError,
        vipUpgradePath,
    };
}
