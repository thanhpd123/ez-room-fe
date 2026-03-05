import { useState, useEffect } from 'react';
import { getAccessToken } from '@/lib/api';
import { getRecommendRequest } from '@/lib/api';

export interface RecommendedRoom {
    id: string;
    rentalId: string;
    title: string;
    price: number;
    area: number | null;
    roomType: string | null;
    amenities: string[];
    images: string[];
    location: { district: string | null; city: string | null } | null;
    matchScore: number;
}

export function useRecommendedRooms() {
    const [rooms, setRooms] = useState<RecommendedRoom[]>([]);
    const [hint, setHint] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        let cancelled = false;
        getAccessToken().then((token) => {
            if (!token) {
                setIsLoggedIn(false);
                setLoading(false);
                return;
            }
            setIsLoggedIn(true);
            getRecommendRequest()
                .then((res) => {
                    if (!cancelled && res.data) {
                        setRooms(res.data as RecommendedRoom[]);
                        setHint(res.hint ?? '');
                    }
                })
                .catch(() => {
                    if (!cancelled) setRooms([]);
                })
                .finally(() => {
                    if (!cancelled) setLoading(false);
                });
        });
        return () => {
            cancelled = true;
        };
    }, []);

    return { rooms, hint, loading, isLoggedIn };
}
