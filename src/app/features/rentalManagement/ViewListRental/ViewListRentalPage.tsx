import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RentalStatus } from '@/lib/models/rental.model';
import {
    listManagedRentals,
} from '../shared/rental-storage';
import { PROPERTY_TYPE_OPTIONS, RENTAL_STATUS_OPTIONS, type ManagedRentalItem } from '../shared/types';

const statusClassName: Record<RentalStatus, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    inactive: 'bg-slate-200 text-slate-700',
    pending: 'bg-amber-100 text-amber-700',
    expired: 'bg-rose-100 text-rose-700',
};

function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('en-GB', {
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
                item.address.toLowerCase().includes(normalizedKeyword) ||
                item.city.toLowerCase().includes(normalizedKeyword) ||
                item.district.toLowerCase().includes(normalizedKeyword);

            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesType = typeFilter === 'all' || item.property_type === typeFilter;

            return matchesKeyword && matchesStatus && matchesType;
        });
    }, [keyword, rentals, statusFilter, typeFilter]);

    return (
        <section className="mx-auto w-full max-w-7xl">
            <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900">View List Rental</h2>
                    <p className="text-sm text-slate-500">
                        Rental in this project means a rental property listing.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => navigate('/rental-management/rentals/create')}
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                    Create rental
                </button>
            </header>

            <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3">
                <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Search by title, city, district, address..."
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />

                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as 'all' | RentalStatus)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                    <option value="all">All status</option>
                    {RENTAL_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>

                <select
                    value={typeFilter}
                    onChange={(event) =>
                        setTypeFilter(event.target.value as 'all' | ManagedRentalItem['property_type'])
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                    <option value="all">All property type</option>
                    {PROPERTY_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                    Loading rentals...
                </div>
            ) : filteredRentals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="text-slate-700">No rental found with current filter.</p>
                    <button
                        type="button"
                        onClick={() => navigate('/rental-management/rentals/create')}
                        className="mt-4 rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
                    >
                        Create the first rental
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredRentals.map((item) => (
                        <article
                            key={item.rental_id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                        >
                            <div className="grid gap-4 p-4 md:grid-cols-[220px_1fr]">
                                <img
                                    src={
                                        item.thumbnail_url ??
                                        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=800&q=80'
                                    }
                                    alt={item.title}
                                    className="h-44 w-full rounded-xl object-cover"
                                />

                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName[item.status]}`}
                                        >
                                            {getStatusLabel(item.status)}
                                        </span>
                                    </div>

                                    <p className="text-sm text-slate-600">
                                        {item.address}, {item.district}, {item.city}
                                    </p>

                                    {item.summary ? (
                                        <p className="line-clamp-2 text-sm text-slate-600">{item.summary}</p>
                                    ) : null}

                                    <dl className="grid grid-cols-2 gap-2 text-sm text-slate-700 sm:grid-cols-4">
                                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                                            <dt className="text-xs text-slate-500">Type</dt>
                                            <dd className="font-medium">{getPropertyTypeLabel(item.property_type)}</dd>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                                            <dt className="text-xs text-slate-500">Available rooms</dt>
                                            <dd className="font-medium">{item.available_room}</dd>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                                            <dt className="text-xs text-slate-500">Owner</dt>
                                            <dd className="font-medium">{item.user_id}</dd>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                                            <dt className="text-xs text-slate-500">Created</dt>
                                            <dd className="font-medium">{formatDateTime(item.created_at)}</dd>
                                        </div>
                                    </dl>

                                    <div className="pt-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(`/rental-management/rentals/${item.rental_id}`)
                                            }
                                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            View detail
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
