import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
    const { t } = useTranslation();
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
        <section className="relative min-h-[400px] sm:min-h-[480px] md:min-h-[520px] lg:min-h-[560px] flex items-center justify-center overflow-hidden">
            {/* Background slides – contain repaints so overlay stays stable */}
            <div className="absolute inset-0 [contain:paint]">
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
                                loading={i === 0 ? 'eager' : 'lazy'}
                            />
                        ) : (
                            <div className="w-full h-full bg-muted/80" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-black/60" />
                    </div>
                ))}
            </div>

            {/* Overlay content: isolate from carousel repaints to prevent text glitch */}
            <div className="relative z-10 w-full max-w-4xl px-3 sm:px-4 flex flex-col items-center gap-4 sm:gap-6 pb-4 isolate [transform:translateZ(0)] [backface-visibility:hidden]">
                {children}
                {current?.rentalId && (
                    <Link
                        to={`/rental/${current.rentalId}`}
                        className="inline-flex items-center gap-1.5 text-white/95 hover:text-white text-sm font-medium underline underline-offset-2 decoration-white/50 hover:decoration-white transition-all"
                    >
                        {t('home.heroViewListing')}
                        <span aria-hidden>→</span>
                    </Link>
                )}
            </div>

            {/* Pagination dots */}
            {slides.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2.5">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            aria-label={`Slide ${i + 1}`}
                            onClick={() => setCurrentIndex(i)}
                            className={`rounded-full transition-all duration-300 touch-manipulation ${
                                i === currentIndex
                                    ? 'w-6 h-2.5 bg-white shadow-md'
                                    : 'w-2.5 h-2.5 bg-white/60 hover:bg-white/90 hover:scale-110'
                            }`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
