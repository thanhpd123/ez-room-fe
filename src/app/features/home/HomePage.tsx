import { useNavigate } from 'react-router-dom';
import { Users, Shield, Wallet, ChevronRight } from 'lucide-react';
import { Header, Footer, SearchForm, ListingCard, LocationCard } from './components';
import type { SearchFilters } from './components';
import { FEATURED_LISTINGS, POPULAR_LOCATIONS } from './constants';

export function HomePage() {
    const navigate = useNavigate();

    const handleSearch = (query: string, filters: SearchFilters) => {
        console.log('Search:', { query, filters });
    };

    const handleAdvancedSearch = () => {
        navigate('/search');
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const handleRegister = () => {
        navigate('/login');
    };

    const handleListingClick = (id: string) => {
        console.log('Listing clicked:', id);
    };

    const handleLocationClick = (name: string) => {
        console.log('Location clicked:', name);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />

            {/* Hero Section */}
            <section className="relative bg-linear-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
                    <div className="text-center mb-12">
                        <h1 className="text-foreground mb-4">
                            Tìm phòng trọ ưng ý & <br className="hidden sm:block" />
                            Bạn ở ghép lý tưởng trong vài giây
                        </h1>
                        <p className="text-foreground/60 max-w-2xl mx-auto">
                            Tìm kiếm thông minh bằng AI, thanh toán an toàn, xác thực chủ nhà
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <SearchForm onSearch={handleSearch} onAdvancedSearch={handleAdvancedSearch} />
                    </div>
                </div>
            </section>

            {/* AI Feature Highlight */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-linear-to-r from-accent/10 via-primary/5 to-accent/10 rounded-2xl p-8 sm:p-12 border border-accent/20">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium mb-4">
                                <Users className="w-4 h-4" />
                                Tính năng AI mới
                            </div>
                            <h2 className="text-foreground mb-3">Tìm bạn ở ghép bằng AI</h2>
                            <p className="text-foreground/70 mb-6 max-w-lg">
                                Hệ thống AI phân tích tính cách, thói quen sinh hoạt để tìm roommate phù hợp nhất với bạn
                            </p>
                            <button className="px-6 py-3 bg-accent text-accent-foreground rounded-xl font-medium hover:bg-accent/90 transition-all shadow-sm hover:shadow-md flex items-center gap-2">
                                Thử ngay
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="w-full sm:w-64 h-48 bg-accent/10 rounded-xl flex items-center justify-center">
                            <Users className="w-24 h-24 text-accent/30" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Listings */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="mb-2">Phòng nổi bật</h2>
                        <p className="text-foreground/60">Các phòng được đánh giá cao nhất</p>
                    </div>
                    <button className="flex items-center gap-1 text-primary hover:gap-2 transition-all">
                        Xem tất cả
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FEATURED_LISTINGS.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} onClick={handleListingClick} />
                    ))}
                </div>
            </section>

            {/* Popular Locations */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-8">
                    <h2 className="mb-2">Khu vực phổ biến</h2>
                    <p className="text-foreground/60">Khám phá các khu vực có nhiều phòng trọ nhất</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {POPULAR_LOCATIONS.map((location, index) => (
                        <LocationCard key={index} location={location} onClick={handleLocationClick} />
                    ))}
                </div>
            </section>

            {/* Value Proposition */}
            <section className="bg-muted/30 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="mb-2">Tại sao chọn EzRoom?</h2>
                        <p className="text-foreground/60">Nền tảng cho thuê phòng an toàn và tiện lợi nhất</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="bg-card rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Wallet className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-3">Thanh toán an toàn</h3>
                            <p className="text-foreground/60">
                                Ví điện tử tích hợp, bảo vệ tiền cọc và thanh toán minh bạch
                            </p>
                        </div>

                        <div className="bg-card rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-3">Xác thực chủ nhà</h3>
                            <p className="text-foreground/60">
                                Tất cả chủ nhà đều được xác thực danh tính qua hệ thống KYC
                            </p>
                        </div>

                        <div className="bg-card rounded-xl p-8 text-center">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="font-semibold mb-3">AI hỗ trợ</h3>
                            <p className="text-foreground/60">
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
