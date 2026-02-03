import { ImageWithFallback } from '@/app/components/ImageWithFallback';

interface Location {
    name: string;
    count: string;
    image: string;
}

interface LocationCardProps {
    location: Location;
    onClick?: (name: string) => void;
}

export function LocationCard({ location, onClick }: LocationCardProps) {
    return (
        <div
            onClick={() => onClick?.(location.name)}
            className="relative h-48 rounded-xl overflow-hidden group cursor-pointer"
        >
            <ImageWithFallback
                src={location.image}
                alt={location.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-semibold mb-1">{location.name}</h3>
                <p className="text-white/80 text-sm">{location.count}</p>
            </div>
        </div>
    );
}
