import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { LOCATION_OPTIONS, PRICE_OPTIONS, ROOM_TYPE_OPTIONS } from '../constants';

interface SearchFormProps {
    onSearch: (query: string, filters: SearchFilters) => void;
    onAdvancedSearch: () => void;
}

export interface SearchFilters {
    location: string;
    priceRange: string;
    roomType: string;
}

export function SearchForm({ onSearch, onAdvancedSearch }: SearchFormProps) {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [filters, setFilters] = React.useState<SearchFilters>({
        location: '',
        priceRange: '',
        roomType: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(searchQuery, filters);
    };

    const handleFilterChange = (key: keyof SearchFilters, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    return (
        <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-sm border border-border p-6 sm:p-8 space-y-5">
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search className="w-5 h-5" strokeWidth={2} />
                </div>
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập địa điểm, tiện nghi hoặc mô tả phòng (vd: Phòng có ban công quận 10)"
                    className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <select
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    className="px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                    {LOCATION_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <select
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    className="px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                    {PRICE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <select
                    value={filters.roomType}
                    onChange={(e) => handleFilterChange('roomType', e.target.value)}
                    className="px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                    {ROOM_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                    type="submit"
                    className="flex-1 px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-sm"
                >
                    Tìm kiếm
                </button>
                <button
                    type="button"
                    onClick={onAdvancedSearch}
                    className="px-6 py-3.5 border border-border rounded-xl font-medium text-foreground hover:bg-muted transition-all flex items-center justify-center gap-2"
                >
                    <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
                    Tìm kiếm nâng cao
                </button>
            </div>
        </form>
    );
}
