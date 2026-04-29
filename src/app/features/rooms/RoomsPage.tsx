import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Camera, Search, SlidersHorizontal } from 'lucide-react';
import { Header, Footer } from '@/app/features/home/components';
import { RoomFavoriteButton } from '@/app/components/RoomFavoriteButton';
import { getPublicRoomsRequest, type PublicRoomItem, type PublicRoomsSort } from '@/lib/api';
import { useRoomTypes } from '@/app/hooks/useRoomTypes';
import { mapPublicRoomToFavorite } from '@/lib/utils/mapPublicRoomToFavorite';
import './RoomsPage.css';

const PAGE_SIZE = 10;

const SORT_OPTIONS: { value: PublicRoomsSort; labelKey: string }[] = [
    { value: 'newest', labelKey: 'rooms.sortNewest' },
    { value: 'recommended', labelKey: 'rooms.sortRecommended' },
    { value: 'price_asc', labelKey: 'rooms.sortPriceAsc' },
    { value: 'price_desc', labelKey: 'rooms.sortPriceDesc' },
];

type PricePreset = { id: string; min?: number; max?: number; labelKey: string };

const PRICE_PRESETS: PricePreset[] = [
    { id: 'any', labelKey: 'rooms.priceAny' },
    { id: 'lt3m', max: 3_000_000, labelKey: 'rooms.priceUnder3m' },
    { id: '3_7m', min: 3_000_000, max: 7_000_000, labelKey: 'rooms.price3to7m' },
    { id: '7_15m', min: 7_000_000, max: 15_000_000, labelKey: 'rooms.price7to15m' },
    { id: 'gt15m', min: 15_000_000, labelKey: 'rooms.priceOver15m' },
];

function formatPrice(price: number, tPerMillion: string, tPerDong: string): string {
    if (price >= 1_000_000) {
        const millions = price / 1_000_000;
        return `${Number.isInteger(millions) ? millions : millions.toFixed(1)} ${tPerMillion}`;
    }
    return `${price.toLocaleString('vi-VN')} ${tPerDong}`;
}

function parseSortParam(raw: string | null): PublicRoomsSort {
    if (raw === 'recommended' || raw === 'price_asc' || raw === 'price_desc') return raw;
    return 'newest';
}

function parsePriceQuery(value: string | null): number | undefined {
    if (value == null || value === '') return undefined;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return undefined;
    return Math.round(n);
}

function presetForRange(min?: number, max?: number): PricePreset | null {
    for (const p of PRICE_PRESETS) {
        if (p.id === 'any') {
            if (min == null && max == null) return p;
            continue;
        }
        if (p.min === min && p.max === max) return p;
    }
    return null;
}

function timeAgoLabel(dateStr: string, t: (k: string, o?: Record<string, number>) => string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('rooms.timeJustNow');
    if (mins < 60) return t('rooms.timeMinutesAgo', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('rooms.timeHoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t('rooms.timeDaysAgo', { count: days });
    return new Date(dateStr).toLocaleDateString();
}

export function RoomsPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const { options: roomTypeOptions } = useRoomTypes();
    const [rooms, setRooms] = useState<PublicRoomItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });

    const roomTypeFromUrl = searchParams.get('roomType') || '';
    const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const sortFromUrl = parseSortParam(searchParams.get('sort'));
    const minPriceFromUrl = parsePriceQuery(searchParams.get('minPrice'));
    const maxPriceFromUrl = parsePriceQuery(searchParams.get('maxPrice'));

    const [draftMinPrice, setDraftMinPrice] = useState(minPriceFromUrl != null ? String(minPriceFromUrl) : '');
    const [draftMaxPrice, setDraftMaxPrice] = useState(maxPriceFromUrl != null ? String(maxPriceFromUrl) : '');
    const [priceApplyError, setPriceApplyError] = useState('');
    const [prevMinPrice, setPrevMinPrice] = useState(minPriceFromUrl);
    const [prevMaxPrice, setPrevMaxPrice] = useState(maxPriceFromUrl);

    if (minPriceFromUrl !== prevMinPrice || maxPriceFromUrl !== prevMaxPrice) {
        setPrevMinPrice(minPriceFromUrl);
        setPrevMaxPrice(maxPriceFromUrl);
        setDraftMinPrice(minPriceFromUrl != null ? String(minPriceFromUrl) : '');
        setDraftMaxPrice(maxPriceFromUrl != null ? String(maxPriceFromUrl) : '');
        setPriceApplyError('');
    }

    const typeTabs = useMemo(() => {
        const fallback = [
            { value: 'single', label: t('rooms.typeSingle') },
            { value: 'shared', label: t('rooms.typeShared') },
            { value: 'studio', label: t('rooms.typeStudio') },
            { value: 'apartment', label: t('rooms.typeApartment') },
        ];
        const fromApi = roomTypeOptions.length > 0 ? roomTypeOptions : fallback;
        return [{ value: '', label: t('rooms.typeAll') }, ...fromApi];
    }, [roomTypeOptions, t]);

    useEffect(() => {
        // Phải set loading để show UI skeleton mỗi khi URL params thay đổi
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        getPublicRoomsRequest({
            page: pageFromUrl,
            limit: PAGE_SIZE,
            roomType: roomTypeFromUrl || undefined,
            minPrice: minPriceFromUrl,
            maxPrice: maxPriceFromUrl,
            sort: sortFromUrl,
        })
            .then((res) => {
                setRooms(res.data || []);
                setPagination(res.pagination || { page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
            })
            .catch(() => {
                setRooms([]);
                setPagination({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
            })
            .finally(() => setLoading(false));
    }, [pageFromUrl, roomTypeFromUrl, minPriceFromUrl, maxPriceFromUrl, sortFromUrl]);

    const updateParams = useCallback(
        (updates: Record<string, string | undefined>) => {
            setSearchParams((prev) => {
                const p = new URLSearchParams(prev);
                for (const [key, val] of Object.entries(updates)) {
                    if (val) p.set(key, val);
                    else p.delete(key);
                }
                return p;
            });
        },
        [setSearchParams]
    );

    const handleTypeChange = (type: string) => {

        updateParams({ roomType: type || undefined, page: undefined });
    };

    const handleSortChange = (sort: PublicRoomsSort) => {

        updateParams({
            sort: sort === 'newest' ? undefined : sort,
            page: undefined,
        });
    };

    const handlePricePreset = (preset: PricePreset) => {
        setPriceApplyError('');
        if (preset.id === 'any') {
            updateParams({ minPrice: undefined, maxPrice: undefined, page: undefined });
            return;
        }
        updateParams({
            minPrice: preset.min != null ? String(preset.min) : undefined,
            maxPrice: preset.max != null ? String(preset.max) : undefined,
            page: undefined,
        });
    };

    const handleApplyCustomPrice = () => {
        setPriceApplyError('');
        const rawMin = draftMinPrice.replace(/\D/g, '');
        const rawMax = draftMaxPrice.replace(/\D/g, '');
        const min = rawMin ? Number(rawMin) : undefined;
        const max = rawMax ? Number(rawMax) : undefined;
        if (min != null && max != null && min > max) {
            setPriceApplyError('invalid');
            return;
        }
        updateParams({
            minPrice: min != null ? String(min) : undefined,
            maxPrice: max != null ? String(max) : undefined,
            page: undefined,
        });
    };

    const handleClearPrice = () => {
        setPriceApplyError('');
        updateParams({ minPrice: undefined, maxPrice: undefined, page: undefined });
    };

    const handleResetAllFilters = () => {
        setPriceApplyError('');
        const p = new URLSearchParams();
        setSearchParams(p);
    };

    const goToPage = (newPage: number) => {
        if (newPage < 1 || newPage > pagination.pages) return;
        updateParams({ page: newPage > 1 ? String(newPage) : undefined });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRoomClick = (id: string) => navigate(`/room/${id}`);

    const pageNumbers = useMemo(() => {
        const total = pagination.pages;
        const current = pagination.page;
        const range: number[] = [];
        const start = Math.max(1, current - 2);
        const end = Math.min(total, current + 2);
        for (let i = start; i <= end; i++) range.push(i);
        return range;
    }, [pagination]);

    const activePreset = presetForRange(minPriceFromUrl, maxPriceFromUrl);
    const hasCustomPrice =
        (minPriceFromUrl != null || maxPriceFromUrl != null) && activePreset == null;
    const activeTypeLabel =
        typeTabs.find((tab) => tab.value === roomTypeFromUrl)?.label || t('rooms.typeAll');
    const hasActiveFilters =
        !!roomTypeFromUrl ||
        sortFromUrl !== 'newest' ||
        minPriceFromUrl != null ||
        maxPriceFromUrl != null;

    return (
        <div className="rooms-page">
            <Header onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />

            <div className="rooms-hero">
                <h1>{t('rooms.title')}</h1>
                <p>{t('rooms.subtitle')}</p>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rooms-toolbar-top">
                    <div className="rooms-category-bar">
                        {typeTabs.map((tab) => (
                            <button
                                key={tab.value || 'all'}
                                type="button"
                                className={`rooms-cat-btn ${roomTypeFromUrl === tab.value ? 'active' : ''}`}
                                onClick={() => handleTypeChange(tab.value)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {hasActiveFilters && (
                        <button type="button" className="rooms-reset-filters" onClick={handleResetAllFilters}>
                            {t('rooms.resetAllFilters')}
                        </button>
                    )}
                </div>

                <div className="rooms-sort-row" role="group" aria-label={t('rooms.sortNewest')}>
                    {SORT_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`rooms-sort-tab ${sortFromUrl === opt.value ? 'active' : ''}`}
                            onClick={() => handleSortChange(opt.value)}
                        >
                            {t(opt.labelKey)}
                        </button>
                    ))}
                </div>

                <details className="rooms-price-panel">
                    <summary className="rooms-price-summary">
                        <span>{t('rooms.filtersToggle')}</span>
                        <span className="rooms-price-summary-hint">
                            {activePreset
                                ? t(activePreset.labelKey)
                                : hasCustomPrice
                                    ? t('rooms.customPrice')
                                    : t('rooms.priceAny')}
                        </span>
                    </summary>
                    <div className="rooms-price-chips">
                        {PRICE_PRESETS.map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                className={`rooms-price-chip ${preset.id === 'any'
                                    ? minPriceFromUrl == null && maxPriceFromUrl == null
                                        ? 'active'
                                        : ''
                                    : activePreset?.id === preset.id
                                        ? 'active'
                                        : ''
                                    }`}
                                onClick={() => handlePricePreset(preset)}
                            >
                                {t(preset.labelKey)}
                            </button>
                        ))}
                    </div>
                    <div className="rooms-custom-price">
                        <span className="rooms-custom-price-label">{t('rooms.customPrice')}</span>
                        <div className="rooms-custom-price-inputs">
                            <input
                                type="text"
                                inputMode="numeric"
                                className="rooms-price-input"
                                placeholder={t('rooms.minPriceShort')}
                                value={draftMinPrice}
                                onChange={(e) => setDraftMinPrice(e.target.value)}
                                aria-label={t('rooms.minPriceShort')}
                            />
                            <span className="rooms-price-input-sep">—</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                className="rooms-price-input"
                                placeholder={t('rooms.maxPriceShort')}
                                value={draftMaxPrice}
                                onChange={(e) => setDraftMaxPrice(e.target.value)}
                                aria-label={t('rooms.maxPriceShort')}
                            />
                        </div>
                        <div className="rooms-custom-price-actions">
                            <button type="button" className="rooms-price-action-primary" onClick={handleApplyCustomPrice}>
                                {t('rooms.applyPrice')}
                            </button>
                            <button type="button" className="rooms-price-action-secondary" onClick={handleClearPrice}>
                                {t('rooms.clearPrice')}
                            </button>
                        </div>
                        {priceApplyError ? (
                            <p className="rooms-price-error" role="alert">
                                {t('rooms.priceInvalidRange')}
                            </p>
                        ) : null}
                    </div>
                </details>

                <button
                    type="button"
                    className="rooms-advanced-link"
                    onClick={() => navigate('/search')}
                >
                    <SlidersHorizontal size={18} aria-hidden />
                    {t('rooms.advancedSearch')}
                </button>

                <div className="rooms-stats">
                    <span>
                        {loading
                            ? '...'
                            : roomTypeFromUrl
                                ? t('rooms.showingFiltered', {
                                    total: pagination.total,
                                    type: activeTypeLabel,
                                })
                                : t('rooms.showing', { total: pagination.total })}
                    </span>
                    <span>{t('rooms.page', { page: pagination.page, total: pagination.pages || 1 })}</span>
                </div>

                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="room-card-skeleton">
                            <div className="skel-img" />
                            <div className="skel-body">
                                <div className="skel-line w80" />
                                <div className="skel-line w60" />
                                <div className="skel-line w40" />
                                <div className="skel-line w80" />
                                <div className="skel-line w30" />
                            </div>
                        </div>
                    ))
                ) : rooms.length === 0 ? (
                    <div className="rooms-empty">
                        <div className="rooms-empty-icon">
                            <Search />
                        </div>
                        <p className="text-muted-foreground text-base">{t('rooms.empty')}</p>
                        <button
                            type="button"
                            className="mt-3 text-primary font-semibold hover:underline"
                            onClick={() => handleResetAllFilters()}
                        >
                            {t('rooms.viewAll')}
                        </button>
                    </div>
                ) : (
                    rooms.map((room) => {
                        const images = room.images || [];
                        const loc = room.rental?.location;
                        const address = loc ? [loc.district, loc.city].filter(Boolean).join(', ') : '';
                        const name = room.roomName || room.title || t('rooms.title');
                        const desc = room.description || '';
                        const amenities = room.amenities || [];
                        const created = room.createdAt;

                        return (
                            <div
                                key={room.id}
                                className="room-card"
                                onClick={() => handleRoomClick(room.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleRoomClick(room.id)}
                            >
                                <div className="room-card-images">
                                    <div className="img-main">
                                        <img
                                            src={
                                                images[0] ||
                                                'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
                                            }
                                            alt={name}
                                            crossOrigin="anonymous"
                                            loading="lazy"
                                        />
                                    </div>
                                    {images.length > 1 && (
                                        <div className="img-sub">
                                            <img src={images[1] || undefined} alt="" crossOrigin="anonymous" loading="lazy" />
                                        </div>
                                    )}
                                    {images.length > 2 && (
                                        <div className="img-sub">
                                            <img src={images[2] || undefined} alt="" crossOrigin="anonymous" loading="lazy" />
                                        </div>
                                    )}
                                    {images.length > 3 && (
                                        <div className="img-count">
                                            <Camera size={12} />
                                            {images.length}
                                        </div>
                                    )}
                                </div>

                                <div className="room-card-body">
                                    <h3 className="room-card-title">{name}</h3>

                                    <div className="room-card-meta">
                                        <span className="room-card-price">
                                            {formatPrice(room.price, t('listing.pricePerMillion'), t('listing.pricePerDong'))}
                                        </span>
                                        {room.sizeM2 && <span className="room-card-area">{room.sizeM2} m²</span>}
                                        {address && (
                                            <span className="room-card-location">
                                                <MapPin size={14} />
                                                {address}
                                            </span>
                                        )}
                                    </div>

                                    {amenities.length > 0 && (
                                        <div className="room-card-amenities">
                                            {amenities.slice(0, 5).map((a) => (
                                                <span key={a.id} className="room-card-amenity">
                                                    {a.name}
                                                </span>
                                            ))}
                                            {amenities.length > 5 && (
                                                <span className="room-card-amenity">+{amenities.length - 5}</span>
                                            )}
                                        </div>
                                    )}

                                    {desc && <p className="room-card-desc">{desc}</p>}

                                    <div className="room-card-owner">
                                        <div className="room-card-owner-info">
                                            <div
                                                className="room-card-owner-avatar"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: '#2FA4A9',
                                                    background: 'rgba(47,164,169,0.1)',
                                                }}
                                            >
                                                {(room.rental?.title || '?')[0]}
                                            </div>
                                            <div>
                                                <div className="room-card-owner-name">
                                                    {room.rental?.title || t('rooms.landlordFallback')}
                                                </div>
                                                <div className="room-card-owner-date">
                                                    {created ? timeAgoLabel(created, t) : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <RoomFavoriteButton
                                            favoritePayload={mapPublicRoomToFavorite(room, name, address)}
                                            className="room-card-fav-btn"
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {pagination.pages > 1 && (
                    <div className="rooms-pagination">
                        <button
                            type="button"
                            className="rooms-page-btn"
                            disabled={pagination.page <= 1}
                            onClick={() => goToPage(pagination.page - 1)}
                        >
                            ‹
                        </button>
                        {pageNumbers.map((num) => (
                            <button
                                key={num}
                                type="button"
                                className={`rooms-page-btn ${num === pagination.page ? 'active' : ''}`}
                                onClick={() => goToPage(num)}
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="rooms-page-btn"
                            disabled={pagination.page >= pagination.pages}
                            onClick={() => goToPage(pagination.page + 1)}
                        >
                            ›
                        </button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
