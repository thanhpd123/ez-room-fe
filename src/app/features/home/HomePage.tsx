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
        navigate('/register');
    };
    const handleListingClick = (id: string) => {
        console.log('Listing clicked:', id);
    };

    const handleLocationClick = (name: string) => {
        console.log('Location clicked:', name);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header onLogin={handleLogin} onRegister={handleRegister} />

            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-20 sm:pb-28">
                    <div className="text-center mb-14">
                        <h1 className="text-foreground mb-5 max-w-3xl mx-auto">
                            Tìm phòng trọ ưng ý & <br className="hidden sm:block" />
                            Bạn ở ghép lý tưởng trong vài giây
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
                            Tìm kiếm thông minh bằng AI, thanh toán an toàn, xác thực chủ nhà
                        </p>
                    </div>
                    <div className="max-w-4xl mx-auto">
                        <SearchForm onSearch={handleSearch} onAdvancedSearch={handleAdvancedSearch} />
                    </div>
                </div>
            </section>

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

            {/* Featured Listings */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h2 className="text-foreground mb-2">Phòng nổi bật</h2>
                        <p className="text-muted-foreground">Các phòng được đánh giá cao nhất</p>
                    </div>
                    <button type="button" className="flex items-center gap-1 text-primary font-medium hover:gap-2 transition-all">
                        Xem tất cả
                        <ChevronRight className="w-4 h-4" strokeWidth={2} />
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {FEATURED_LISTINGS.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} onClick={handleListingClick} />
                    ))}
                </div>
            </section>

            {/* Popular Locations */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-10">
                    <h2 className="text-foreground mb-2">Khu vực phổ biến</h2>
                    <p className="text-muted-foreground">Khám phá các khu vực có nhiều phòng trọ nhất</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {POPULAR_LOCATIONS.map((location, index) => (
                        <LocationCard key={index} location={location} onClick={handleLocationClick} />
                    ))}
                </div>
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
