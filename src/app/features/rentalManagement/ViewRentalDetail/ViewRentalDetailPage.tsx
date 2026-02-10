import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { RentalStatus } from '@/lib/models/rental.model';
import { getManagedRentalById } from '../shared/rental-storage';
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

export function ViewRentalDetailPage() {
    const navigate = useNavigate();
    const { rentalId = '' } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [rental, setRental] = useState<ManagedRentalItem | null>(null);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            const data = await getManagedRentalById(rentalId);
            if (!active) return;
            setRental(data);
            setIsLoading(false);
        };

        if (!rentalId) {
            setRental(null);
            setIsLoading(false);
            return;
        }

        void load();
        return () => {
            active = false;
        };
    }, [rentalId]);

    const fullAddress = useMemo(() => {
        if (!rental) return '';
        return `${rental.address}, ${rental.district}, ${rental.city}`;
    }, [rental]);

    if (isLoading) {
        return (
            <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-600">Loading rental detail...</p>
            </section>
        );
    }

    if (!rental) {
        return (
            <section className="mx-auto w-full max-w-5xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <h2 className="text-xl font-semibold text-slate-900">Rental not found</h2>
                <p className="mt-2 text-sm text-slate-600">
                    This rental may have been removed or does not exist.
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/rental-management/rentals')}
                    className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                    Back to rental list
                </button>
            </section>
        );
    }

    return (
        <section className="mx-auto w-full max-w-5xl">
            <div className="mb-4 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => navigate('/rental-management/rentals')}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/rental-management/rentals/create')}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                    Create new rental
                </button>
            </div>

            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <img
                    src={
                        rental.thumbnail_url ??
                        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80'
                    }
                    alt={rental.title}
                    className="h-64 w-full object-cover sm:h-80"
                />

                <div className="space-y-5 p-5 sm:p-6">
                    <header className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-2xl font-semibold text-slate-900">{rental.title}</h2>
                            <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName[rental.status]}`}
                            >
                                {getStatusLabel(rental.status)}
                            </span>
                        </div>
                        <p className="text-sm text-slate-600">{fullAddress}</p>
                    </header>

                    {rental.summary ? (
                        <section>
                            <h3 className="mb-1 text-sm font-semibold text-slate-900">Summary</h3>
                            <p className="text-sm leading-relaxed text-slate-700">{rental.summary}</p>
                        </section>
                    ) : null}

                    {rental.description ? (
                        <section>
                            <h3 className="mb-1 text-sm font-semibold text-slate-900">Description</h3>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                                {rental.description}
                            </p>
                        </section>
                    ) : null}

                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-slate-900">Property Information</h3>
                        <dl className="grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Rental ID</dt>
                                <dd className="font-medium text-slate-900">{rental.rental_id}</dd>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Owner ID</dt>
                                <dd className="font-medium text-slate-900">{rental.user_id}</dd>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Property type</dt>
                                <dd className="font-medium text-slate-900">
                                    {getPropertyTypeLabel(rental.property_type)}
                                </dd>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Available rooms</dt>
                                <dd className="font-medium text-slate-900">{rental.available_room}</dd>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3 sm:col-span-2">
                                <dt className="text-xs text-slate-500">Created at</dt>
                                <dd className="font-medium text-slate-900">
                                    {formatDateTime(rental.created_at)}
                                </dd>
                            </div>
                        </dl>
                    </section>
                </div>
            </article>
        </section>
    );
}
