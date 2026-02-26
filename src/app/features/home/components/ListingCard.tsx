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
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onClick?.(listing.id)}
            className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-border transition-all cursor-pointer group"
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
                        className="p-2.5 bg-card rounded-full shadow-sm hover:shadow-md transition-all border border-border"
                        title={favorited ? 'Bỏ yêu thích' : 'Yêu thích'}
                    >
                        <Heart
                            className={`w-5 h-5 transition-colors ${
                                favorited ? 'fill-accent text-accent' : 'text-muted-foreground group-hover:text-accent'
                            }`}
                            strokeWidth={2}
                        />
                    </button>
                    {listing.verified && (
                        <div className="bg-card/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 border border-border">
                            <BadgeCheck className="w-4 h-4 text-primary" strokeWidth={2} />
                            <span className="text-xs font-medium text-foreground">Xác thực</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="p-5">
                <h3 className="font-heading font-semibold text-foreground mb-2 truncate">{listing.title}</h3>
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                    <MapPin className="w-4 h-4 shrink-0" strokeWidth={2} />
                    <span className="truncate">{listing.location}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <span className="text-primary font-bold text-lg">{listing.price}</span>
                        <span className="text-muted-foreground text-sm">/tháng</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-foreground">
                        <Star className="w-4 h-4 fill-accent text-accent" strokeWidth={2} />
                        <span className="font-medium">{listing.rating}</span>
                    </div>
                </div>
                <div className="mt-2 text-muted-foreground text-sm">{listing.area}</div>
            </div>
        </div>
    );
}
