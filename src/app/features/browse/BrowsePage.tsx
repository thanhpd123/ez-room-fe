import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Filter, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/ImageWithFallback';
import { Header, Footer } from '@/app/features/home/components';
import { getPublicRentalsRequest, type PublicRental, type PublicRentalsSort } from '@/lib/api';

const PAGE_SIZE = 24;
const SORT_OPTIONS: { value: PublicRentalsSort; label: string }[] = [
    { value: 'createdAt_desc', label: 'Mới nhất' },
    { value: 'createdAt_asc', label: 'Cũ nhất' },
    { value: 'title_asc', label: 'Tên A → Z' },
    { value: 'title_desc', label: 'Tên Z → A' },
];

export function BrowsePage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [rentals, setRentals] = useState<PublicRental[]>([]);
    const [allForOptions, setAllForOptions] = useState<PublicRental[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });

    const districtFromUrl = searchParams.get('district') || '';
    const cityFromUrl = searchParams.get('city') || '';
    const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const sortFromUrl = (searchParams.get('sort') as PublicRentalsSort) || 'createdAt_desc';

    const [districtFilter, setDistrictFilter] = useState(districtFromUrl);
    const [cityFilter, setCityFilter] = useState(cityFromUrl);
    const [sort, setSort] = useState<PublicRentalsSort>(sortFromUrl);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        setDistrictFilter(districtFromUrl);
        setCityFilter(cityFromUrl);
        setSort(sortFromUrl);
    }, [districtFromUrl, cityFromUrl, sortFromUrl]);

    useEffect(() => {
        getPublicRentalsRequest({ limit: 1000 })
            .then((res) => setAllForOptions(res.data || []))
            .catch(() => setAllForOptions([]));
    }, []);

    useEffect(() => {
        setLoading(true);
        getPublicRentalsRequest({
            page: pageFromUrl,
            limit: PAGE_SIZE,
            district: districtFromUrl || undefined,
            city: cityFromUrl || undefined,
            sort: sortFromUrl,
        })
            .then((res) => {
                setRentals(res.data || []);
                setPagination(res.pagination || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
            })
            .catch(() => {
                setRentals([]);
                setPagination((p) => ({ ...p, total: 0, totalPages: 0 }));
            })
            .finally(() => setLoading(false));
    }, [pageFromUrl, districtFromUrl, cityFromUrl, sortFromUrl]);

    const cityOptions = useMemo(() => {
        const set = new Set<string>();
        allForOptions.forEach((r) => {
            const c = r.location?.city?.trim();
            if (c) set.add(c);
        });
        return Array.from(set).sort();
    }, [allForOptions]);

    /** Districts for the selected city only (so Hanoi city → only Hanoi districts, not HCM). */
    const districtOptions = useMemo(() => {
        const set = new Set<string>();
        allForOptions.forEach((r) => {
            const c = r.location?.city?.trim();
            const d = r.location?.district?.trim();
            if (!d) return;
            if (cityFilter) {
                if (c === cityFilter) set.add(d);
            } else {
                set.add(d);
            }
        });
        return Array.from(set).sort();
    }, [allForOptions, cityFilter]);

    const handleLogin = () => navigate('/login');
    const handleRegister = () => navigate('/register');
    const handleRentalClick = (id: string) => navigate(`/rental/${id}`);

    const updateParams = (updates: { district?: string; city?: string; page?: number; sort?: string }) => {
        const p = new URLSearchParams(searchParams);
        if (updates.district !== undefined) (updates.district ? p.set('district', updates.district) : p.delete('district'));
        if (updates.city !== undefined) (updates.city ? p.set('city', updates.city) : p.delete('city'));
        if (updates.page !== undefined) (updates.page > 1 ? p.set('page', String(updates.page)) : p.delete('page'));
        if (updates.sort !== undefined) (updates.sort ? p.set('sort', updates.sort) : p.delete('sort'));
        setSearchParams(p);
    };

    const applyFilters = (district: string, city: string) => {
        setCityFilter(city);
        setDistrictFilter(district);
        updateParams({ district, city, page: 1 });
    };

    const handleCityChange = (newCity: string) => {
        const districtsInNewCity = new Set(
            allForOptions
                .filter((r) => (r.location?.city?.trim() || '') === newCity)
                .map((r) => r.location?.district?.trim())
                .filter((d): d is string => !!d)
        );
        const validDistrict =
            newCity && districtFilter && districtsInNewCity.has(districtFilter) ? districtFilter : '';
        applyFilters(validDistrict, newCity);
    };

    const handleDistrictChange = (newDistrict: string) => {
        applyFilters(newDistrict, cityFilter);
    };

    const handleSortChange = (value: PublicRentalsSort) => {
        setSort(value);
        updateParams({ sort: value, page: 1 });
    };

    const goToPage = (newPage: number) => {
        if (newPage < 1 || newPage > pagination.totalPages) return;
        updateParams({ page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-background">
            <Header onLogin={handleLogin} onRegister={handleRegister} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Tất cả nhà trọ</h1>
                    <p className="text-muted-foreground">
                        Lọc và sắp xếp theo khu vực. Trang {pagination.page} / {pagination.totalPages || 1} — {pagination.total} kết quả.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 mb-8">
                    <button
                        type="button"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl font-medium hover:bg-muted transition-all"
                    >
                        <Filter className="w-4 h-4" />
                        Bộ lọc
                    </button>
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={sort}
                            onChange={(e) => handleSortChange(e.target.value as PublicRentalsSort)}
                            className="px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20"
                        >
                            {SORT_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {showFilters && (
                    <div className="bg-card rounded-2xl p-6 border border-border mb-8">
                        <h3 className="font-semibold text-foreground mb-4">Lọc theo</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Thành phố
                                </label>
                                <select
                                    value={cityFilter}
                                    onChange={(e) => handleCityChange(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Tất cả</option>
                                    {cityOptions.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">
                                    Quận / Huyện
                                </label>
                                <select
                                    value={
                                        districtFilter && districtOptions.includes(districtFilter)
                                            ? districtFilter
                                            : ''
                                    }
                                    onChange={(e) => handleDistrictChange(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Tất cả</option>
                                    {districtOptions.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => applyFilters('', '')}
                                className="text-primary font-medium hover:underline"
                            >
                                Xóa bộ lọc
                            </button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-16 text-muted-foreground">Đang tải...</div>
                ) : rentals.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        Không tìm thấy nhà trọ phù hợp. Hãy thử điều chỉnh bộ lọc.
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {rentals.map((rental) => (
                                <div
                                    key={rental.id}
                                    onClick={() => handleRentalClick(rental.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRentalClick(rental.id)}
                                    className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="relative h-48">
                                        <ImageWithFallback
                                            src={rental.images?.[0] || ''}
                                            alt={rental.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-heading font-semibold text-foreground truncate">
                                            {rental.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-muted-foreground text-sm mt-2">
                                            <MapPin className="w-4 h-4 shrink-0" />
                                            <span className="truncate">
                                                {rental.location?.district}, {rental.location?.city}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            className="mt-3 w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all"
                                        >
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {pagination.totalPages > 1 && (
                            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => goToPage(pagination.page - 1)}
                                    disabled={pagination.page <= 1}
                                    className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="px-4 py-2 text-sm text-muted-foreground">
                                    Trang {pagination.page} / {pagination.totalPages}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => goToPage(pagination.page + 1)}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>

            <Footer />
        </div>
    );
}
