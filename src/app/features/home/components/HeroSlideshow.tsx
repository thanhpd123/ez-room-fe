import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from '@/app/components/ImageWithFallback';
import type { PublicRental } from '@/lib/api';

const SLIDE_INTERVAL_MS = 5000;

interface HeroSlideshowProps {
    /** Rental images for background slides (from API). If empty, one placeholder slide. */
    rentals: PublicRental[];
    /** Search form or any content to overlay in the center */
    children: React.ReactNode;
}

export function HeroSlideshow({ rentals, children }: HeroSlideshowProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    const rawSlides = rentals.flatMap((r) =>
        (r.images?.length ? r.images : ['']).map((img) => ({ imageUrl: img, rentalId: r.id, rentalTitle: r.title }))
    ).filter((s) => s.imageUrl || s.rentalId);
    const slides =
        rawSlides.length > 0
            ? rawSlides
            : [{ imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200', rentalId: '', rentalTitle: '' }];

    useEffect(() => {
        const id = setInterval(() => {
            setCurrentIndex((i) => (i + 1) % slides.length);
        }, SLIDE_INTERVAL_MS);
        return () => clearInterval(id);
    }, [slides.length]);

    const current = slides[currentIndex];

    return (
        <section className="relative min-h-[420px] sm:min-h-[480px] flex items-center justify-center overflow-hidden">
            {/* Background slides */}
            <div className="absolute inset-0">
                {slides.map((slide, i) => (
                    <div
                        key={`${slide.rentalId}-${i}`}
                        className={`absolute inset-0 transition-opacity duration-700 ${
                            i === currentIndex ? 'opacity-100 z-0' : 'opacity-0 z-0'
                        }`}
                    >
                        {slide.imageUrl ? (
                            <ImageWithFallback
                                src={slide.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-muted/80" />
                        )}
                        <div className="absolute inset-0 bg-black/40" />
                    </div>
                ))}
            </div>

            {/* Overlay content: search + optional detail link */}
            <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center gap-6">
                {children}
                {current?.rentalId && (
                    <Link
                        to={`/rental/${current.rentalId}`}
                        className="text-white/95 hover:text-white text-sm font-medium underline underline-offset-2"
                    >
                        Xem chi tiết ảnh này
                    </Link>
                )}
            </div>

            {/* Pagination dots */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            aria-label={`Slide ${i + 1}`}
                            onClick={() => setCurrentIndex(i)}
                            className={`w-2 h-2 rounded-full transition-all ${
                                i === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                            }`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
