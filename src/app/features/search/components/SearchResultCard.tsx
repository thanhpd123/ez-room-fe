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
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-md transition-shadow duration-300 group">
            <div className="relative h-48 overflow-hidden bg-muted">
                <ImageWithFallback
                    src={room.image}
                    alt={room.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {onToggleFavorite && (
                    <button
                        type="button"
                        onClick={() => onToggleFavorite(room.id)}
                        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-card/95 border border-border flex items-center justify-center transition-colors shadow-sm hover:shadow-md"
                    >
                        <Heart
                            className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-accent text-accent' : 'text-muted-foreground'}`}
                            strokeWidth={2}
                        />
                    </button>
                )}

                {/* Available Badge */}
                <span
                    className={`absolute top-3 left-3 px-2.5 py-1.5 rounded-xl text-xs font-medium ${room.available
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
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
                <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4 shrink-0" strokeWidth={2} />
                    <span className="text-sm truncate">{room.location}</span>
                </div>

                {/* Details */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                <span className="inline-block px-2.5 py-1 rounded-xl border border-border text-xs font-medium text-muted-foreground">
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
                            <p className="text-xs text-muted-foreground">/ tháng</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onViewDetails?.(room.id)}
                            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                        >
                            Xem chi tiết
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
