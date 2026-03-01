import { MapPin, School, Utensils } from 'lucide-react';

interface NearbyPlaceholderProps {
    district?: string;
    city?: string;
}

/** Placeholder for "places around rental" (near school, food street). Can later integrate Google Maps Places API. */
export function NearbyPlaceholder({ district, city }: NearbyPlaceholderProps) {
    const location = [district, city].filter(Boolean).join(', ') || 'khu vực';

    return (
        <div className="mb-10 p-6 rounded-2xl border border-border bg-card">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-3">
                <MapPin className="w-5 h-5 text-primary" />
                Xung quanh {location}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
                Xem trường học, đại học, phố ăn uống gần nhà trọ (tích hợp Google Maps sẽ có trong phiên bản sau).
            </p>
            <div className="flex flex-wrap gap-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm">
                    <School className="w-4 h-4" /> Gần trường, đại học
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-sm">
                    <Utensils className="w-4 h-4" /> Gần phố ăn
                </span>
            </div>
        </div>
    );
}
