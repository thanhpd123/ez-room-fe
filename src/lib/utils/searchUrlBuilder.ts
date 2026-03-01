/**
 * Builds search URL query string from filters.
 * Single responsibility: URL construction logic.
 */

export interface SearchFilters {
    city?: string;
    district?: string;
    address?: string;
    priceRange?: string;
    roomType?: string;
    amenities?: string[];
    minArea?: number;
    maxArea?: number;
}

/** Parses price range string (e.g. "3-5" or "8+") to min/max values in VND (millions × 1_000_000). */
function parsePriceRange(priceRange: string): { min: number; max?: number } | null {
    if (!priceRange?.trim()) return null;
    const [minStr, maxStr] = priceRange.split('-').map((s) => s?.trim());
    const minVal = minStr ? parseInt(minStr, 10) * 1_000_000 : 0;
    const maxVal = maxStr === '+' ? undefined : maxStr ? parseInt(maxStr, 10) * 1_000_000 : undefined;
    return { min: minVal, max: maxVal };
}

/**
 * Builds URLSearchParams from search query and filters.
 * @returns Search params string (without leading '?')
 */
export function buildSearchParams(query: string, filters: SearchFilters): string {
    const params = new URLSearchParams();

    if (query) params.set('q', query);
    if (filters.city) params.set('city', filters.city);
    if (filters.district) params.set('district', filters.district);
    if (filters.address?.trim()) params.set('address', filters.address.trim());

    if (filters.priceRange) {
        const parsed = parsePriceRange(filters.priceRange);
        if (parsed) {
            params.set('price', parsed.max != null ? `${parsed.min}-${parsed.max}` : String(parsed.min));
        }
    }

    if (filters.roomType) params.set('roomType', filters.roomType);
    if (filters.amenities?.length) params.set('amenities', filters.amenities.join(','));
    if (filters.minArea != null) params.set('minArea', String(filters.minArea));
    if (filters.maxArea != null) params.set('maxArea', String(filters.maxArea));

    return params.toString();
}

/** Builds full search URL path (e.g. /search?q=...&city=...) */
export function buildSearchUrl(query: string, filters: SearchFilters): string {
    const qs = buildSearchParams(query, filters);
    return `/search${qs ? `?${qs}` : ''}`;
}
