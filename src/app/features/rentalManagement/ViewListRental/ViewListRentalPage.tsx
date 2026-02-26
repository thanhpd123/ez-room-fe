import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, LayoutGrid, FileText } from 'lucide-react';
import type { RentalStatus } from '@/lib/models/rental.model';
import { listManagedRentals } from '../shared/rental-storage';
import { PROPERTY_TYPE_OPTIONS, RENTAL_STATUS_OPTIONS, type ManagedRentalItem } from '../shared/types';

const statusClassName: Record<RentalStatus, string> = {
    active: 'bg-primary/15 text-primary',
    inactive: 'bg-muted text-muted-foreground',
    pending: 'bg-accent/15 text-accent',
    expired: 'bg-destructive/10 text-destructive',
};

function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getPropertyTypeLabel(value: string) {
    return PROPERTY_TYPE_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function getStatusLabel(status: RentalStatus) {
    return RENTAL_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

const DEFAULT_THUMB =
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80';

export function ViewListRentalPage() {
    const navigate = useNavigate();
    const [rentals, setRentals] = useState<ManagedRentalItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | RentalStatus>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | ManagedRentalItem['property_type']>('all');

    useEffect(() => {
        let active = true;
        const load = async () => {
            setIsLoading(true);
            const data = await listManagedRentals();
            if (!active) return;
            setRentals(data);
            setIsLoading(false);
        };
        void load();
        return () => {
            active = false;
        };
    }, []);

    const filteredRentals = useMemo(() => {
        const normalizedKeyword = keyword.trim().toLowerCase();
        return rentals.filter((item) => {
            const matchesKeyword =
                normalizedKeyword.length === 0 ||
                item.title.toLowerCase().includes(normalizedKeyword) ||
                (item.address && item.address.toLowerCase().includes(normalizedKeyword)) ||
                (item.city && item.city.toLowerCase().includes(normalizedKeyword)) ||
                (item.district && item.district.toLowerCase().includes(normalizedKeyword));
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesType = typeFilter === 'all' || item.property_type === typeFilter;
            return matchesKeyword && matchesStatus && matchesType;
        });
    }, [keyword, rentals, statusFilter, typeFilter]);

    return (
        <section className="mx-auto w-full max-w-6xl">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-heading text-2xl font-bold text-foreground">Danh sách nhà cho thuê</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Quản lý các bất động sản cho thuê của bạn
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/rental-management/rentals/create')}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Thêm nhà cho thuê
                </button>
            </header>

            <div className="mb-6 grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm md:grid-cols-3">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        placeholder="Tìm theo tên, địa chỉ, quận, thành phố..."
                        className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | RentalStatus)}
                    className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                    <option value="all">Tất cả trạng thái</option>
                    {RENTAL_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <select
                    value={typeFilter}
                    onChange={(e) =>
                        setTypeFilter(e.target.value as 'all' | ManagedRentalItem['property_type'])
                    }
                    className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                    <option value="all">Tất cả loại hình</option>
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center shadow-sm">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-muted-foreground">Đang tải danh sách...</p>
                </div>
            ) : filteredRentals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                        <Building2 className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">Chưa có nhà cho thuê nào</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Thêm bất động sản đầu tiên để bắt đầu quản lý
                    </p>
                    <button
                        type="button"
                        onClick={() => navigate('/rental-management/rentals/create')}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Thêm nhà cho thuê
                    </button>
                </div>
            ) : (
                <div className="grid gap-5">
                    {filteredRentals.map((item) => (
                        <article
                            key={item.rental_id}
                            className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div className="grid gap-5 p-5 md:grid-cols-[220px_1fr]">
                                <img
                                    src={item.thumbnail_url ?? DEFAULT_THUMB}
                                    alt={item.title}
                                    className="h-44 w-full rounded-xl object-cover border border-border"
                                />
                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-heading text-lg font-semibold text-foreground">
                                            {item.title}
                                        </h3>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName[item.status]}`}
                                        >
                                            {getStatusLabel(item.status)}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {[item.address, item.district, item.city].filter(Boolean).join(', ')}
                                    </p>
                                    {item.summary ? (
                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                            {item.summary}
                                        </p>
                                    ) : null}
                                    <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                                        <div className="rounded-xl bg-muted/50 px-3 py-2">
                                            <dt className="text-xs text-muted-foreground">Loại hình</dt>
                                            <dd className="font-medium text-foreground">
                                                {getPropertyTypeLabel(item.property_type)}
                                            </dd>
                                        </div>
                                        <div className="rounded-xl bg-muted/50 px-3 py-2">
                                            <dt className="text-xs text-muted-foreground">Số phòng trống</dt>
                                            <dd className="font-medium text-foreground">{item.available_room}</dd>
                                        </div>
                                        <div className="rounded-xl bg-muted/50 px-3 py-2">
                                            <dt className="text-xs text-muted-foreground">Ngày tạo</dt>
                                            <dd className="font-medium text-foreground">
                                                {formatDateTime(item.created_at)}
                                            </dd>
                                        </div>
                                    </dl>
                                    <div className="flex flex-wrap items-center gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(`/rental-management/rentals/${item.rental_id}`)
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Chi tiết
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/rental-management/rentals/${item.rental_id}/room-posts`
                                                )
                                            }
                                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                                        >
                                            <LayoutGrid className="h-4 w-4" />
                                            Danh sách phòng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
