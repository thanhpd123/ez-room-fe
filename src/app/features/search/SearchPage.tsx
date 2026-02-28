import {
    SearchHeader,
    SearchTabs,
    SearchByText,
    SearchByImage,
    SearchResults,
    SearchRecommendBlock,
    NearbyPlaceholder,
} from './components';
import { useSearch, useAuthLevel } from './hooks';

export function SearchPage() {
    const { isGuest, isTenant, isVip } = useAuthLevel();
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
    const basicOnly = isGuest;

    return (
        <div className="min-h-screen bg-background">
            <SearchHeader />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SearchTabs showImageTab={showImageTab}>
                    {(activeTab) => (
                        <>
                            {activeTab === 'text' ? (
                                <SearchByText
                                    onSearch={searchByText}
                                    isSearching={isSearching}
                                    basicOnly={basicOnly}
                                    onVoiceResult={showImageTab ? (() => {}) : undefined}
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

                {/* Recommendation (tenant/VIP): profile + preferences */}
                {(isTenant || isVip) && <SearchRecommendBlock />}

                {/* Nearby placeholder (school, food street – Google Maps later) */}
                {(isTenant || isVip) && <NearbyPlaceholder />}

                {/* Search Results */}
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
