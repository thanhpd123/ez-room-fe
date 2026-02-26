import React, { createContext, useContext, useState, useEffect } from 'react';

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
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
    const [favorites, setFavorites] = useState<FavoriteRoom[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load từ localStorage khi mount
    useEffect(() => {
        const stored = localStorage.getItem('favoriteRooms');
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch (error) {
                console.error('Failed to load favorites:', error);
            }
        }
        setIsLoaded(true);
    }, []);

    // Lưu vào localStorage khi favorites thay đổi
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('favoriteRooms', JSON.stringify(favorites));
        }
    }, [favorites, isLoaded]);

    const addFavorite = (room: FavoriteRoom) => {
        setFavorites((prev) => {
            // Avoid duplicates
            if (prev.some((r) => r.id === room.id)) {
                return prev;
            }
            return [...prev, room];
        });
    };

    const removeFavorite = (roomId: string) => {
        setFavorites((prev) => prev.filter((room) => room.id !== roomId));
    };

    const isFavorite = (roomId: string): boolean => {
        return favorites.some((room) => room.id === roomId);
    };

    return (
        <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
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
