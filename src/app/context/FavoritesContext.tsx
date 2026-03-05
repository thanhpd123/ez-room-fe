import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
    getAccessToken,
    getMyFavoritesRequest,
    addFavoriteRequest,
    removeFavoriteRequest,
} from '@/lib/api';

export interface FavoriteRoom {
    id: string;
    name: string;
    price: number;
    area: number;
    address: string;
    image: string;
    available: boolean;
}

interface FavoritesContextType {
    favorites: FavoriteRoom[];
    addFavorite: (room: FavoriteRoom) => void;
    removeFavorite: (roomId: string) => void;
    isFavorite: (roomId: string) => boolean;
    isLoading: boolean;
    refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

function mapApiRoomToFavorite(api: {
    id: string;
    title?: string;
    roomName?: string | null;
    price: number;
    area?: number | null;
    address?: string;
    images?: string[];
    available?: boolean;
}): FavoriteRoom {
    return {
        id: api.id,
        name: api.title || api.roomName || 'Phòng trọ',
        price: api.price,
        area: api.area ?? 0,
        address: api.address ?? '',
        image: api.images?.[0] ?? '',
        available: api.available ?? true,
    };
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favorites, setFavorites] = useState<FavoriteRoom[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const refreshFavorites = useCallback(async () => {
        const token = await getAccessToken();
        if (!token) {
            const stored = localStorage.getItem('favoriteRooms');
            if (stored) {
                try {
                    setFavorites(JSON.parse(stored));
                } catch {
                    setFavorites([]);
                }
            } else {
                setFavorites([]);
            }
            setIsLoaded(true);
            return;
        }
        setIsLoading(true);
        try {
            const res = await getMyFavoritesRequest();
            const list = (res.data || []).map(mapApiRoomToFavorite);
            setFavorites(list);
        } catch {
            const stored = localStorage.getItem('favoriteRooms');
            if (stored) {
                try {
                    setFavorites(JSON.parse(stored));
                } catch {
                    setFavorites([]);
                }
            } else {
                setFavorites([]);
            }
        } finally {
            setIsLoading(false);
            setIsLoaded(true);
        }
    }, []);

    useEffect(() => {
        refreshFavorites();
    }, [refreshFavorites]);

    useEffect(() => {
        if (!isLoaded) return;
        const token = getAccessToken();
        token.then((t) => {
            if (!t) {
                localStorage.setItem('favoriteRooms', JSON.stringify(favorites));
            }
        });
    }, [favorites, isLoaded]);

    const addFavorite = useCallback(
        async (room: FavoriteRoom) => {
            setFavorites((prev) => {
                if (prev.some((r) => r.id === room.id)) return prev;
                return [...prev, room];
            });
            const token = await getAccessToken();
            if (token) {
                try {
                    await addFavoriteRequest(room.id);
                    await refreshFavorites();
                } catch {
                    setFavorites((prev) => prev.filter((r) => r.id !== room.id));
                }
            }
        },
        [refreshFavorites]
    );

    const removeFavorite = useCallback(
        async (roomId: string) => {
            setFavorites((prev) => prev.filter((room) => room.id !== roomId));
            const token = await getAccessToken();
            if (token) {
                try {
                    await removeFavoriteRequest(roomId);
                } catch {
                    await refreshFavorites();
                }
            }
        },
        [refreshFavorites]
    );

    const isFavorite = useCallback(
        (roomId: string): boolean => {
            return favorites.some((room) => room.id === roomId);
        },
        [favorites]
    );

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                addFavorite,
                removeFavorite,
                isFavorite,
                isLoading,
                refreshFavorites,
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const context = useContext(FavoritesContext);
    if (!context) {
        throw new Error('useFavorites must be used within FavoritesProvider');
    }
    return context;
}
