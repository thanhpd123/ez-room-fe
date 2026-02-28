import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Wallet, ChevronRight } from 'lucide-react';
import {
    Header,
    Footer,
    SearchForm,
    HeroSlideshow,
    FeaturedSlideshow,
    PopularAreasCard,
} from './components';
import type { SearchFilters } from './components';
import { usePublicRentals, useUserInHanoi, getDistinctLocations, pickThreeLocations } from './hooks/usePublicRentals';

const HERO_CAROUSEL_LIMIT = 10;

export function HomePage() {
    const navigate = useNavigate();
    const { rentals: heroRentals } = usePublicRentals({ limit: HERO_CAROUSEL_LIMIT });
    const { rentals, loading: rentalsLoading } = usePublicRentals({ limit: 500 });
    const { inHanoi, loading: locationLoading } = useUserInHanoi();

    const locations = useMemo(() => getDistinctLocations(rentals), [rentals]);
    const threeLocations = useMemo(
        () => pickThreeLocations(locations, inHanoi),
        [locations, inHanoi]
    );

    const featuredSlides = useMemo(() => {
        const byLocation = threeLocations.map((loc) => ({
            district: loc.district,
            city: loc.city,
            rentals: rentals.filter(
                (r) =>
                    (r.location?.district?.trim() || '') === loc.district &&
                    (r.location?.city?.trim() || '') === loc.city
            ),
        }));
        if (byLocation.length === 0 && rentals.length > 0) {
            return [{ district: 'Gợi ý', city: '', rentals }];
        }
        return byLocation;
    }, [threeLocations, rentals]);

    const popularAreas = useMemo(() => {
        const count: Record<string, { district: string; city: string; count: number; image: string }> = {};
        rentals.forEach((r) => {
            const d = r.location?.district?.trim() || 'N/A';
            const c = r.location?.city?.trim() || 'N/A';
            const key = `${d}|${c}`;
            if (!count[key]) count[key] = { district: d, city: c, count: 0, image: r.images?.[0] || '' };
            count[key].count += 1;
        });
        return Object.values(count)
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [rentals]);

    const handleSearch = (query: string, filters: SearchFilters) => {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (filters.location) params.set('location', filters.location);
        if (filters.priceRange) {
            const [min, max] = filters.priceRange.split('-');
            const minVal = min ? parseInt(min, 10) * 1_000_000 : 0;
            const maxVal = max === '+' ? undefined : max ? parseInt(max, 10) * 1_000_000 : undefined;
            params.set('price', maxVal ? `${minVal}-${maxVal}` : `${minVal}`);
        }
        if (filters.roomType) params.set('roomType', filters.roomType);
        navigate(`/search?${params.toString()}`);
    };

    const handleAdvancedSearch = () => navigate('/search');
    const handleLogin = () => navigate('/login');
    const handleRegister = () => navigate('/register');
    const handleViewAll = () => navigate('/browse');

    const handleSeeAllFeatured = (district: string, city: string) => {
        const p = new URLSearchParams();
        if (district) p.set('district', district);
        if (city) p.set('city', city);
        navigate(`/browse?${p.toString()}`);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header onLogin={handleLogin} onRegister={handleRegister} />

            {/* Hero: background carousel uses top 10 rentals only. */}
            <HeroSlideshow rentals={heroRentals}>
                <div className="text-center mb-4">
                    <h1 className="text-white text-2xl sm:text-3xl font-bold mb-2 drop-shadow-md">
                        Tìm phòng trọ ưng ý & bạn ở ghép lý tưởng
                    </h1>
                    <p className="text-white/90 text-sm sm:text-base drop-shadow">
                        Tìm kiếm thông minh bằng AI, thanh toán an toàn
                    </p>
                </div>
                <div className="w-full max-w-2xl">
                    <SearchForm onSearch={handleSearch} onAdvancedSearch={handleAdvancedSearch} />
                </div>
            </HeroSlideshow>

            {/* AI Feature */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="bg-card rounded-2xl p-8 sm:p-12 shadow-sm border border-border">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-10">
                        <div className="flex-1">
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-xl text-sm font-medium mb-5">
                                <Users className="w-4 h-4" strokeWidth={2} />
                                Tính năng AI mới
                            </span>
                            <h2 className="text-foreground mb-4">Tìm bạn ở ghép bằng AI</h2>
                            <p className="text-muted-foreground mb-8 max-w-lg leading-relaxed">
                                Hệ thống AI phân tích tính cách, thói quen sinh hoạt để tìm roommate phù hợp nhất với bạn
                            </p>
                            <button type="button" className="px-6 py-3 bg-accent text-accent-foreground rounded-xl font-semibold hover:bg-accent/90 transition-all shadow-sm flex items-center gap-2">
                                Thử ngay
                                <ChevronRight className="w-4 h-4" strokeWidth={2} />
                            </button>
                        </div>
                        <div className="w-full sm:w-72 h-52 bg-primary/5 rounded-2xl flex items-center justify-center">
                            <Users className="w-28 h-28 text-primary/20" strokeWidth={1.5} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Phòng nổi bật: slideshow with pagination, 3 nearest (or random) locations, real data. See all → browse with filter. */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-foreground text-xl font-semibold mb-2">Phòng nổi bật</h2>
                        <p className="text-muted-foreground">
                            {!locationLoading && inHanoi ? 'Gợi ý theo khu vực gần bạn' : 'Khám phá theo khu vực'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={handleViewAll}
                        className="flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all"
                    >
                        Xem tất cả
                        <ChevronRight className="w-4 h-4" strokeWidth={2} />
                    </button>
                </div>
                {rentalsLoading ? (
                    <div className="py-12 text-center text-muted-foreground">Đang tải...</div>
                ) : (
                    <FeaturedSlideshow slides={featuredSlides} onSeeAll={handleSeeAllFeatured} />
                )}
            </section>

            {/* Khu vực phổ biến - from API */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-10">
                    <h2 className="text-foreground text-xl font-semibold mb-2">Khu vực phổ biến</h2>
                    <p className="text-muted-foreground">Khám phá các khu vực có nhiều phòng trọ nhất</p>
                </div>
                {popularAreas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">Chưa có dữ liệu khu vực.</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-5">
                        {popularAreas.map((area) => (
                            <PopularAreasCard
                                key={`${area.district}-${area.city}`}
                                area={{ ...area, count: area.count, image: area.image }}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Why EzRoom */}
            <section className="bg-card border-t border-border py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <h2 className="text-foreground mb-2">Tại sao chọn EzRoom?</h2>
                        <p className="text-muted-foreground">Nền tảng cho thuê phòng an toàn và tiện lợi nhất</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="bg-background rounded-2xl p-10 text-center shadow-sm border border-border">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <Wallet className="w-8 h-8 text-primary" strokeWidth={2} />
                            </div>
                            <h3 className="font-heading font-semibold text-foreground mb-3">Thanh toán an toàn</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Ví điện tử tích hợp, bảo vệ tiền cọc và thanh toán minh bạch
                            </p>
                        </div>
                        <div className="bg-background rounded-2xl p-10 text-center shadow-sm border border-border">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <Shield className="w-8 h-8 text-primary" strokeWidth={2} />
                            </div>
                            <h3 className="font-heading font-semibold text-foreground mb-3">Xác thực chủ nhà</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Tất cả chủ nhà đều được xác thực danh tính qua hệ thống KYC
                            </p>
                        </div>
                        <div className="bg-background rounded-2xl p-10 text-center shadow-sm border border-border">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <Users className="w-8 h-8 text-primary" strokeWidth={2} />
                            </div>
                            <h3 className="font-heading font-semibold text-foreground mb-3">AI hỗ trợ</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Tìm kiếm thông minh và ghép bạn ở dựa trên AI
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
