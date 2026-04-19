import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TeamOutlined, SafetyOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Card, Typography } from 'antd';
import {
    Header,
    Footer,
    SearchForm,
    HeroSlideshow,
    PopularAreasCard,
} from './components';
import type { SearchFilters } from './components';
import { usePublicRentals } from './hooks/usePublicRentals';
import { usePopularAreas } from './hooks/usePopularAreas';
import { useRecommendedRooms, type RecommendedRoom } from './hooks/useRecommendedRooms';
import { ImageWithFallback } from '@/app/components/ImageWithFallback';
import { RoomFavoriteButton } from '@/app/components/RoomFavoriteButton';
import { T } from '@/app/components/T';
import type { FavoriteRoom } from '@/app/context/favorites-context';
import { MapPin } from 'lucide-react';
import { buildSearchUrl } from '@/lib/utils/searchUrlBuilder';
import { getPublicRoomsRequest, getPublicSiteConfigRequest, type PublicRoomItem, type PublicSiteConfig } from '@/lib/api';
import { mapPublicRoomToFavorite } from '@/lib/utils/mapPublicRoomToFavorite';

const { Title, Paragraph } = Typography;

const HOME_PAGE_RENTALS_LIMIT = 20;
const HERO_SLIDES_COUNT = 10;
const FEATURED_COUNT = 8;
const HOME_DEFAULT_SECTIONS = ['hero', 'aiFeature', 'featuredRooms', 'recommendedRooms', 'popularAreas', 'whyEzRoom'];

function favoriteFromRecommended(room: RecommendedRoom): FavoriteRoom {
    const loc = room.location;
    const locationStr = loc ? [loc.district, loc.city].filter(Boolean).join(', ') : '';
    return {
        id: room.id,
        name: room.title,
        price: room.price,
        area: room.area ?? 0,
        address: locationStr,
        image: room.images?.[0] || '',
        available: true,
    };
}

export function HomePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { rentals } = usePublicRentals({ limit: HOME_PAGE_RENTALS_LIMIT });

    const heroRentals = useMemo(() => rentals.slice(0, HERO_SLIDES_COUNT), [rentals]);
    const popularAreas = usePopularAreas(rentals, 4);
    const { rooms: recommendedRooms, hint: recommendHint, loading: recommendLoading, isLoggedIn } = useRecommendedRooms();

    const [featuredRooms, setFeaturedRooms] = useState<PublicRoomItem[]>([]);
    const [featuredRoomsLoading, setFeaturedRoomsLoading] = useState(true);
    const [siteConfig, setSiteConfig] = useState<PublicSiteConfig | null>(null);

    useEffect(() => {
        getPublicSiteConfigRequest()
            .then((res) => setSiteConfig(res.data || null))
            .catch(() => setSiteConfig(null));

        getPublicRoomsRequest({ limit: FEATURED_COUNT })
            .then((res) => setFeaturedRooms(res.data || []))
            .catch(() => setFeaturedRooms([]))
            .finally(() => setFeaturedRoomsLoading(false));
    }, []);

    const isSectionEnabled = (key: string) => {
        const configured = siteConfig?.homeLayout?.sections;
        if (!configured || configured.length === 0) {
            return HOME_DEFAULT_SECTIONS.includes(key);
        }
        const item = configured.find((section) => section.key === key);
        return item ? item.enabled !== false : true;
    };

    const banner = siteConfig?.homeBanner;
    const bannerEnabled = banner?.enabled !== false;
    const heroTitle = bannerEnabled && banner?.title?.trim() ? banner.title.trim() : t('home.heroTitle');
    const heroSubtitle = bannerEnabled && banner?.subtitle?.trim() ? banner.subtitle.trim() : t('home.heroSubtitle');

    const handleSearch = (query: string, filters: SearchFilters) => {
        navigate(buildSearchUrl(query, filters));
    };

    const handleLogin = () => navigate('/login');
    const handleRegister = () => navigate('/register');
    const handleRoomClick = (id: string) => navigate(`/room/${id}`);

    return (
        <div className="min-h-screen bg-background">
            <Header onLogin={handleLogin} onRegister={handleRegister} />

            {isSectionEnabled('hero') && (
                <HeroSlideshow
                    rentals={heroRentals}
                    customImageUrl={bannerEnabled ? banner?.imageUrl : ''}
                    ctaText={bannerEnabled ? banner?.ctaText : ''}
                    ctaLink={bannerEnabled ? banner?.ctaLink : ''}
                >
                    <div className="text-center my-3 mb-6 sm:mb-8">
                        <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold mb-3 drop-shadow-lg tracking-tight max-w-3xl mx-auto">
                            {heroTitle}
                        </h1>
                        <p className="text-white/95 text-base sm:text-lg drop-shadow-md max-w-xl mx-auto">
                            {heroSubtitle}
                        </p>
                    </div>
                    <div className="w-full max-w-2xl px-2 sm:px-4">
                        <SearchForm onSearch={handleSearch} onLogin={handleLogin} />
                    </div>
                </HeroSlideshow>
            )}

            {isSectionEnabled('aiFeature') && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
                    <Card className="rounded-2xl sm:rounded-3xl shadow-lg overflow-hidden relative border-border [&_.ant-card-body]:p-5! sm:[&_.ant-card-body]:p-8! lg:[&_.ant-card-body]:px-12!" styles={{ body: { padding: 0 } }}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" aria-hidden />
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-10 relative">
                            <div className="flex-1 w-full text-center sm:text-left">
                                <span className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-accent/15 text-accent rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6">
                                    <TeamOutlined className="text-base" />
                                    {t('home.aiBadge')}
                                </span>
                                <Title level={2} className="text-foreground! mb-3! sm:mb-4! font-heading! text-xl! sm:text-2xl!">{t('home.aiTitle')}</Title>
                                <Paragraph className="text-muted-foreground mb-6 sm:mb-8 max-w-lg leading-relaxed text-sm sm:text-base mx-auto sm:mx-0">
                                    {t('home.aiDesc')}
                                </Paragraph>
                                <Button
                                    type="primary"
                                    size="large"
                                    className="rounded-xl font-semibold shadow-md hover:shadow-lg min-h-11 touch-manipulation active:scale-[0.98] transition-transform"
                                    style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                                    onClick={() => navigate('/roommate')}
                                >
                                    {t('home.aiCta')}
                                </Button>
                            </div>
                            <div className="w-full sm:w-72 lg:w-80 h-40 sm:h-56 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/10 shrink-0">
                                <TeamOutlined className="text-8xl text-primary/25" />
                            </div>
                        </div>
                    </Card>
                </section>
            )}

            {isSectionEnabled('featuredRooms') && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                        <div>
                            <Title level={2} className="text-foreground! mb-2! font-heading!">{t('home.featuredTitle')}</Title>
                            <Paragraph type="secondary" className="mb-0!">{t('home.featuredSubtitleExplore')}</Paragraph>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate('/rooms')}
                            className="p-0 font-semibold flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors group"
                        >
                            {t('home.viewAll')}
                            <span className="group-hover:translate-x-0.5 transition-transform" aria-hidden>→</span>
                        </button>
                    </div>
                    {featuredRoomsLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                                    <div className="h-48 bg-muted" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-5 bg-muted rounded w-3/4" />
                                        <div className="h-4 bg-muted rounded w-1/2" />
                                        <div className="h-10 bg-muted rounded-xl w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : featuredRooms.length === 0 ? (
                        <div className="py-16 text-center rounded-2xl border-2 border-dashed border-border bg-muted/20">
                            <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                                <MapPin className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <Paragraph type="secondary" className="mb-0! text-base">{t('home.noFeatured')}</Paragraph>
                            <button
                                type="button"
                                onClick={() => navigate('/rooms')}
                                className="mt-4 text-primary font-semibold hover:underline"
                            >
                                {t('home.viewAll')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {featuredRooms.map((room) => {
                                const loc = room.rental?.location;
                                const locationStr = loc ? [loc.district, loc.city].filter(Boolean).join(', ') : '—';
                                const name = room.roomName || room.title || t('home.suggestions');
                                const priceStr = room.price >= 1_000_000
                                    ? `${(room.price / 1_000_000).toFixed(room.price % 1_000_000 === 0 ? 0 : 1)} ${t('listing.pricePerMillion')}`
                                    : `${room.price.toLocaleString('vi-VN')} ${t('listing.pricePerDong')}`;
                                return (
                                    <div
                                        key={room.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleRoomClick(room.id)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRoomClick(room.id)}
                                        className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20 transition-all duration-200 cursor-pointer group/card"
                                    >
                                        <div className="relative h-48 overflow-hidden">
                                            <ImageWithFallback
                                                src={room.images?.[0] || ''}
                                                alt={name}
                                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200" />
                                            <div className="absolute top-3 right-3 z-10">
                                                <RoomFavoriteButton favoritePayload={mapPublicRoomToFavorite(room, name, locationStr)} />
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <Title level={5} className="font-heading! mb-1! truncate group-hover/card:text-primary transition-colors"><T>{name}</T></Title>
                                            <p className="text-sm font-semibold text-accent mb-2">{priceStr}</p>
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                <MapPin className="w-4 h-4 shrink-0" />
                                                <span className="truncate"><T>{locationStr}</T></span>
                                            </div>
                                            <button
                                                type="button"
                                                className="mt-3 w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 active:scale-[0.98] transition-all"
                                            >
                                                {t('home.viewDetail')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {isSectionEnabled('recommendedRooms') && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                        <div>
                            <Title level={2} className="text-foreground! mb-2! font-heading!">
                                {isLoggedIn ? t('home.recommendedTitle') : t('home.recommendedLoginTitle')}
                            </Title>
                            <Paragraph type="secondary" className="mb-0!">
                                {isLoggedIn ? (recommendHint || t('home.recommendedSubtitle')) : t('home.recommendedLoginSubtitle')}
                            </Paragraph>
                        </div>
                        {isLoggedIn && recommendedRooms.length > 0 && (
                            <button
                                type="button"
                                onClick={() => navigate('/search')}
                                className="p-0 font-semibold flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors group"
                            >
                                {t('home.viewAll')}
                                <span className="group-hover:translate-x-0.5 transition-transform" aria-hidden>→</span>
                            </button>
                        )}
                    </div>
                    {!isLoggedIn ? (
                        <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-8 sm:p-12 text-center">
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{t('home.recommendedLoginDesc')}</p>
                            <Button type="primary" size="large" className="rounded-xl font-semibold" onClick={handleLogin}>
                                {t('home.loginToSeeRecommend')}
                            </Button>
                        </div>
                    ) : recommendLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse">
                                    <div className="h-48 bg-muted" />
                                    <div className="p-4 space-y-3">
                                        <div className="h-5 bg-muted rounded w-3/4" />
                                        <div className="h-4 bg-muted rounded w-1/2" />
                                        <div className="h-10 bg-muted rounded-xl w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : recommendedRooms.length === 0 ? (
                        <div className="py-12 text-center rounded-2xl border-2 border-dashed border-border bg-muted/20">
                            <Paragraph type="secondary" className="mb-0! text-base">{t('home.noRecommended')}</Paragraph>
                            <button type="button" onClick={() => navigate('/search')} className="mt-4 text-primary font-semibold hover:underline">
                                {t('home.viewAll')}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {recommendedRooms.slice(0, 8).map((room) => {
                                const priceStr = room.price >= 1_000_000
                                    ? `${(room.price / 1_000_000).toFixed(room.price % 1_000_000 === 0 ? 0 : 1)} ${t('listing.pricePerMillion')}`
                                    : `${room.price.toLocaleString('vi-VN')} ${t('listing.pricePerDong')}`;
                                return (
                                    <div
                                        key={room.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleRoomClick(room.id)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleRoomClick(room.id)}
                                        className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20 transition-all duration-200 cursor-pointer group/card"
                                    >
                                        <div className="relative h-48 overflow-hidden">
                                            <ImageWithFallback
                                                src={room.images?.[0] || ''}
                                                alt={room.title}
                                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-200" />
                                            <div className="absolute top-3 right-3 z-10">
                                                <RoomFavoriteButton favoritePayload={favoriteFromRecommended(room)} />
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <Title level={5} className="font-heading! mb-1! truncate group-hover/card:text-primary transition-colors"><T>{room.title}</T></Title>
                                            <p className="text-sm font-semibold text-accent mb-2">{priceStr}</p>
                                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                                <MapPin className="w-4 h-4 shrink-0" />
                                                <span className="truncate">
                                                    <T>{room.location ? [room.location.district, room.location.city].filter(Boolean).join(', ') : '—'}</T>
                                                </span>
                                            </div>
                                            <button type="button" className="mt-3 w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 active:scale-[0.98] transition-all">
                                                {t('home.viewDetail')}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            )}

            {isSectionEnabled('popularAreas') && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                    <div className="text-center mb-10">
                        <Title level={2} className="text-foreground! mb-3! font-heading!">{t('home.popularAreasTitle')}</Title>
                        <Paragraph type="secondary" className="max-w-xl mx-auto mb-0!">{t('home.popularAreasSubtitle')}</Paragraph>
                    </div>
                    {popularAreas.length === 0 ? (
                        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-border bg-muted/20">
                            <div className="w-14 h-14 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
                                <MapPin className="w-7 h-7 text-muted-foreground" />
                            </div>
                            <Paragraph type="secondary" className="mb-0! text-base">{t('home.noAreaData')}</Paragraph>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
                            {popularAreas.map((area) => (
                                <PopularAreasCard
                                    key={`${area.district}-${area.city}`}
                                    area={area}
                                />
                            ))}
                        </div>
                    )}
                </section>
            )}

            {isSectionEnabled('whyEzRoom') && (
                <section className="bg-card border-t border-border py-16 sm:py-24">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12 sm:mb-16">
                            <Title level={2} className="text-foreground! mb-3! font-heading!">{t('home.whyEzRoomTitle')}</Title>
                            <Paragraph type="secondary" className="max-w-xl mx-auto mb-0!">{t('home.whyEzRoomSubtitle')}</Paragraph>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                            <Card className="rounded-2xl text-center shadow-sm border-border hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 transition-all duration-200 [&_.ant-card-body]:p-6! sm:[&_.ant-card-body]:p-8!" styles={{ body: { padding: 0 } }}>
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <WalletOutlined className="text-3xl text-primary" />
                                </div>
                                <Title level={4} className="font-heading! mb-3!">{t('home.whyPayment')}</Title>
                                <Paragraph type="secondary" className="mb-0! text-sm leading-relaxed">
                                    {t('home.whyPaymentDesc')}
                                </Paragraph>
                            </Card>
                            <Card className="rounded-2xl text-center shadow-sm border-border hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 transition-all duration-200 [&_.ant-card-body]:p-6! sm:[&_.ant-card-body]:p-8!" styles={{ body: { padding: 0 } }}>
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <SafetyOutlined className="text-3xl text-primary" />
                                </div>
                                <Title level={4} className="font-heading! mb-3!">{t('home.whyVerified')}</Title>
                                <Paragraph type="secondary" className="mb-0! text-sm leading-relaxed">
                                    {t('home.whyVerifiedDesc')}
                                </Paragraph>
                            </Card>
                            <Card className="rounded-2xl text-center shadow-sm border-border hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 transition-all duration-200 [&_.ant-card-body]:p-6! sm:[&_.ant-card-body]:p-8!" styles={{ body: { padding: 0 } }}>
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                    <TeamOutlined className="text-3xl text-primary" />
                                </div>
                                <Title level={4} className="font-heading! mb-3!">{t('home.whyAI')}</Title>
                                <Paragraph type="secondary" className="mb-0! text-sm leading-relaxed">
                                    {t('home.whyAIDesc')}
                                </Paragraph>
                            </Card>
                        </div>
                    </div>
                </section>
            )}

            <Footer />
        </div>
    );
}
