import { useNavigate } from 'react-router-dom';
import {
    SearchTabs,
    SearchByText,
    SearchByImage,
    SearchResults,
    SearchRecommendBlock,
    NearbyPlaceholder,
} from './components';
import { useSearch, useAuthLevel } from './hooks';
import { Header } from '@/app/features/home/components';

export function SearchPage() {
    const navigate = useNavigate();
    const { isGuest, isTenant, isVip, loading: authLoading } = useAuthLevel();
    const isLoggedIn = !authLoading && !isGuest;

    const {
        results,
        isSearching,
        hasSearched,
        searchByText,
        searchByImage,
        searchNearby,
        resetSearch,
        imageSearchError,
        searchError,
        searchMode,
        textSearchError,
        vipUpgradePath,
    } = useSearch(isLoggedIn);

    const showImageTab = isTenant || isVip;
    const basicOnly = !authLoading && isGuest;

    return (
        <div className="min-h-screen bg-background">
            <Header onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />

            <section className="relative bg-linear-to-br from-primary/10 via-background to-accent/5 py-6 sm:py-10 lg:py-14">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-4 sm:mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-heading mb-2">
                        {isLoggedIn ? 'Tìm kiếm nâng cao' : 'Tìm kiếm phòng trọ'}
                    </h1>
                    <p className="text-muted-foreground text-base sm:text-lg">
                        {isLoggedIn
                            ? 'Tìm phòng phù hợp nhất với AI, sở thích và lối sống của bạn'
                            : 'Đăng nhập để sử dụng tìm kiếm thông minh với AI'}
                        {showImageTab && ' • Tìm bằng hình ảnh'}
                    </p>
                    {isLoggedIn && searchMode && (
                        <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {searchMode === 'ai_embedding' && '🤖 AI Embedding Search'}
                            {searchMode === 'smart_keyword' && '🔍 Smart Keyword Search'}
                            {searchMode === 'image' && '🖼️ Image Search'}
                            {searchMode === 'basic' && '📝 Basic Search'}
                            {searchMode === 'advanced' && '⚡ Advanced Search'}
                            {searchMode === 'nearby' && '📍 Nearby Search'}
                        </div>
                    )}
                </div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <SearchTabs showImageTab={showImageTab}>
                        {(activeTab) => (
                            <>
                                {activeTab === 'text' ? (
                                    <SearchByText
                                        onSearch={searchByText}
                                        isSearching={isSearching}
                                        basicOnly={basicOnly}
                                        onVoiceResult={showImageTab ? () => {} : undefined}
                                        backendError={textSearchError}
                                        vipUpgradePath={vipUpgradePath}
                                        onUpgradeVip={(path) => navigate(path || '/vip-plans')}
                                    />
                                ) : (
                                    <SearchByImage
                                        onSearch={searchByImage}
                                        isSearching={isSearching}
                                        imageSearchError={imageSearchError}
                                        isVip={isVip}
                                    />
                                )}
                            </>
                        )}
                    </SearchTabs>

                    {basicOnly && (
                        <div className="mt-4 text-center">
                            <p className="text-sm text-muted-foreground mb-2">
                                Đăng nhập để sử dụng tìm kiếm AI thông minh, gợi ý cá nhân và tìm kiếm bằng ảnh
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                            >
                                Đăng nhập ngay →
                            </button>
                        </div>
                    )}
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {(isTenant || isVip) && <SearchRecommendBlock />}
                {(isTenant || isVip) && (
                    <NearbyPlaceholder
                        onSearchNearby={searchNearby}
                        isSearching={isSearching}
                        isLoggedIn={isLoggedIn}
                    />
                )}

                <SearchResults
                    results={results}
                    isSearching={isSearching}
                    hasSearched={hasSearched}
                    searchError={searchError}
                    onReset={resetSearch}
                />
            </main>
        </div>
    );
}
