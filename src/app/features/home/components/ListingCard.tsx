import { MapPin, Star, BadgeCheck, Heart } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/ImageWithFallback';
import { useFavorites } from '@/app/context/FavoritesContext';

interface Listing {
    id: string;
    image: string;
    title: string;
    price: string;
    area: string;
    location: string;
    rating: number;
    verified: boolean;
}

interface ListingCardProps {
    listing: Listing;
    onClick?: (id: string) => void;
}

export function ListingCard({ listing, onClick }: ListingCardProps) {
    const { isFavorite, addFavorite, removeFavorite } = useFavorites();
    const favorited = isFavorite(listing.id);

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (favorited) {
            removeFavorite(listing.id);
        } else {
            addFavorite({
                id: listing.id,
                name: listing.title,
                price: parseFloat(listing.price.replace(/[^0-9]/g, '')),
                area: parseFloat(listing.area),
                address: listing.location,
                image: listing.image,
                available: true,
            });
        }
    };

    return (
        <div
            onClick={() => onClick?.(listing.id)}
            className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
            <div className="relative h-48 overflow-hidden">
                <ImageWithFallback
                    src={listing.image}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                    <button
                        onClick={handleFavoriteClick}
                        className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all"
                        title={favorited ? 'Bỏ yêu thích' : 'Yêu thích'}
                    >
                        <Heart
                            className={`w-5 h-5 transition-colors ${
                                favorited ? 'fill-red-500 text-red-500' : 'text-foreground/60 hover:text-red-500'
                            }`}
                        />
                    </button>
                    {listing.verified && (
                        <div className="bg-card/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                            <BadgeCheck className="w-4 h-4 text-primary" />
                            <span className="text-xs font-medium">Xác thực</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-semibold mb-2 truncate">{listing.title}</h3>
                <div className="flex items-center gap-2 text-foreground/60 text-sm mb-3">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">{listing.location}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-primary font-bold">{listing.price}</span>
                        <span className="text-foreground/50 text-sm">/tháng</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span className="font-medium">{listing.rating}</span>
                    </div>
                </div>
                <div className="mt-2 text-foreground/60 text-sm">{listing.area}</div>
            </div>
        </div>
    );
}
