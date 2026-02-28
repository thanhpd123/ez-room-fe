import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/ImageWithFallback';
import type { PublicRental } from '@/lib/api';

const AUTO_ADVANCE_MS = 6000;

interface FeaturedSlideshowProps {
    /** Each slide is a location with its rentals */
    slides: { district: string; city: string; rentals: PublicRental[] }[];
    onSeeAll?: (district: string, city: string) => void;
}

export function FeaturedSlideshow({ slides, onSeeAll }: FeaturedSlideshowProps) {
    const navigate = useNavigate();
    const [current, setCurrent] = useState(0);

    const total = Math.max(1, slides.length);

    useEffect(() => {
        if (total <= 1) return;
        const id = setInterval(() => setCurrent((c) => (c + 1) % total), AUTO_ADVANCE_MS);
        return () => clearInterval(id);
    }, [total]);

    const go = (dir: number) => setCurrent((c) => (c + dir + total) % total);

    if (slides.length === 0) {
        return (
            <div className="py-12 text-center text-muted-foreground">
                Chưa có phòng nổi bật. Hãy quay lại sau.
            </div>
        );
    }

    const slide = slides[current];
    const s = slide || { district: '', city: '', rentals: [] as PublicRental[] };

    return (
        <div className="relative">
            <div className="flex overflow-hidden">
                <div key={`${s.district}-${s.city}-${current}`} className="w-full flex-shrink-0">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <h3 className="text-lg font-semibold text-foreground">
                                Phòng nổi bật ở {s.district || 'khu vực'}
                            </h3>
                            {onSeeAll && (s.district || s.city) && (
                                <button
                                    type="button"
                                    onClick={() => onSeeAll(s.district, s.city)}
                                    className="text-primary font-medium hover:underline"
                                >
                                    Xem tất cả
                                </button>
                            )}
                        </div>
                        {s.rentals.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground rounded-2xl border border-border bg-card/50">
                                Chưa có phòng trong khu vực này.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {s.rentals.slice(0, 4).map((r) => (
                                    <div
                                        key={r.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => navigate(`/rental/${r.id}`)}
                                        onKeyDown={(e) => e.key === 'Enter' && navigate(`/rental/${r.id}`)}
                                        className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <div className="relative h-40">
                                            <ImageWithFallback
                                                src={r.images?.[0] || ''}
                                                alt={r.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <h4 className="font-medium text-foreground truncate">{r.title}</h4>
                                            <p className="text-sm text-muted-foreground truncate">
                                                {r.location?.district}, {r.location?.city}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                </div>
            </div>

            {/* Arrows */}
            {total > 1 && (
                <>
                    <button
                        type="button"
                        onClick={() => go(-1)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:translate-x-0 p-2 rounded-full bg-card border border-border shadow-sm hover:bg-muted"
                        aria-label="Trước"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => go(1)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-0 p-2 rounded-full bg-card border border-border shadow-sm hover:bg-muted"
                        aria-label="Sau"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Pagination dots */}
            {total > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                    {Array.from({ length: total }).map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            aria-label={`Slide ${i + 1}`}
                            onClick={() => setCurrent(i)}
                            className={`w-2.5 h-2.5 rounded-full transition-all ${
                                i === current ? 'bg-primary scale-110' : 'bg-muted-foreground/40 hover:bg-muted-foreground/60'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
