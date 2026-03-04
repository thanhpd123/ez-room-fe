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
    const {
        results,
        isSearching,
        hasSearched,
        searchByText,
        searchByImage,
        resetSearch,
        imageSearchError,
    } = useSearch();

    const showImageTab = isTenant || isVip;
    const basicOnly = !authLoading && isGuest;

    return (
        <div className="min-h-screen bg-background">
            <Header onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />

            {/* Hero section with search */}
            <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-6 sm:py-10 lg:py-14">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mb-4 sm:mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground font-heading mb-2">
                        Tìm kiếm phòng trọ
                    </h1>
                    <p className="text-muted-foreground text-base sm:text-lg">
                        Tìm ngôi nhà lý tưởng với bộ lọc thông minh
                        {showImageTab && ' • Tìm bằng hình ảnh'}
                    </p>
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
                </div>
            </section>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                {(isTenant || isVip) && <SearchRecommendBlock />}
                {(isTenant || isVip) && <NearbyPlaceholder />}

                <SearchResults
                    results={results}
                    isSearching={isSearching}
                    hasSearched={hasSearched}
                    onReset={resetSearch}
                />
            </main>
        </div>
    );
}
