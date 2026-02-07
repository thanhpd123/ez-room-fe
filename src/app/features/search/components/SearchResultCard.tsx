import { MapPin, Maximize, Star, Heart, CheckCircle } from 'lucide-react';
import type { Room } from '../types';
import { formatPrice, getRoomTypeLabel } from '../utils';
import { ImageWithFallback } from '@/app/components/ImageWithFallback';

interface SearchResultCardProps {
    room: Room;
    isFavorite?: boolean;
    onToggleFavorite?: (roomId: string) => void;
    onViewDetails?: (roomId: string) => void;
}

export function SearchResultCard({
    room,
    isFavorite = false,
    onToggleFavorite,
    onViewDetails,
}: SearchResultCardProps) {
    return (
        <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 group">
            {/* Image */}
            <div className="relative h-48 overflow-hidden bg-muted">
                <ImageWithFallback
                    src={room.image}
                    alt={room.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Favorite Button */}
                {onToggleFavorite && (
                    <button
                        onClick={() => onToggleFavorite(room.id)}
                        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-background/90 hover:bg-background flex items-center justify-center transition-colors shadow-md"
                    >
                        <Heart
                            className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-accent text-accent' : 'text-foreground/50'
                                }`}
                        />
                    </button>
                )}

                {/* Available Badge */}
                <span
                    className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-medium ${room.available
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground/60'
                        }`}
                >
                    {room.available ? 'Còn trống' : 'Đã cho thuê'}
                </span>
            </div>

            {/* Content */}
            <div className="p-5 space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-foreground line-clamp-2 min-h-12">
                    {room.title}
                </h3>

                {/* Location */}
                <div className="flex items-center gap-2 text-foreground/60">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="text-sm truncate">{room.location}</span>
                </div>

                {/* Details */}
                <div className="flex items-center gap-4 text-sm text-foreground/60">
                    <div className="flex items-center gap-1">
                        <Maximize className="w-4 h-4" />
                        <span>{room.area}m²</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-accent text-accent" />
                        <span>{room.rating}</span>
                    </div>
                </div>

                {/* Room Type Badge */}
                <span className="inline-block px-2 py-1 rounded-lg border border-border text-xs font-medium text-foreground/70">
                    {getRoomTypeLabel(room.roomType)}
                </span>

                {/* Amenities */}
                <div className="flex flex-wrap gap-1.5">
                    {room.amenities.slice(0, 3).map((amenity) => (
                        <div
                            key={amenity}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs"
                        >
                            <CheckCircle className="w-3 h-3 text-primary" />
                            {amenity}
                        </div>
                    ))}
                    {room.amenities.length > 3 && (
                        <div className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-xs text-foreground/60">
                            +{room.amenities.length - 3} tiện nghi
                        </div>
                    )}
                </div>

                {/* Price */}
                <div className="pt-3 border-t border-border">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-2xl font-bold text-primary">{formatPrice(room.price)}</p>
                            <p className="text-xs text-foreground/50">/ tháng</p>
                        </div>
                        <button
                            onClick={() => onViewDetails?.(room.id)}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"
                        >
                            Xem chi tiết
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
