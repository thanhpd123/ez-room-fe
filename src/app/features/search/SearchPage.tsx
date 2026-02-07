import {
    SearchHeader,
    SearchTabs,
    SearchByText,
    SearchByImage,
    SearchResults,
} from './components';
import { useSearch } from './hooks';

export function SearchPage() {
    const { results, isSearching, hasSearched, searchByText, searchByImage, resetSearch } =
        useSearch();

    return (
        <div className="min-h-screen bg-background">
            <SearchHeader />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SearchTabs>
                    {(activeTab) => (
                        <>
                            {activeTab === 'text' ? (
                                <SearchByText onSearch={searchByText} isSearching={isSearching} />
                            ) : (
                                <SearchByImage onSearch={searchByImage} isSearching={isSearching} />
                            )}
                        </>
                    )}
                </SearchTabs>

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
