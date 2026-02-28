import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '@/app/components/ImageWithFallback';

interface PopularArea {
    district: string;
    city: string;
    count: number;
    image: string;
}

interface PopularAreasCardProps {
    area: PopularArea;
}

export function PopularAreasCard({ area }: PopularAreasCardProps) {
    const navigate = useNavigate();

    const handleClick = () => {
        const p = new URLSearchParams();
        if (area.district) p.set('district', area.district);
        if (area.city) p.set('city', area.city);
        navigate(`/browse?${p.toString()}`);
    };

    return (
        <div
            onClick={handleClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleClick()}
            className="relative h-48 rounded-2xl overflow-hidden group cursor-pointer shadow-sm border border-border hover:shadow-md transition-all"
        >
            <ImageWithFallback
                src={area.image}
                alt={area.district}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-heading font-semibold mb-1 text-orange-400">{area.district}</h3>
                <p className="text-white/90 text-sm">{area.count} phòng trọ</p>
            </div>
        </div>
    );
}
