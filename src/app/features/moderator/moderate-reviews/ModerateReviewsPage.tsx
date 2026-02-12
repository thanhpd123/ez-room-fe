import { useEffect, useMemo, useState } from 'react';
import { listModeratedReviews, moderateReview } from '../shared/moderator-storage';
import type { ModeratedReview, ReviewModerationAction, ReviewModerationStatus } from '../shared/types';

const statusBadgeClass: Record<ReviewModerationStatus, string> = {
    flagged: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    hidden: 'bg-slate-200 text-slate-700',
    deleted: 'bg-rose-100 text-rose-700',
};

const statusLabel: Record<ReviewModerationStatus, string> = {
    flagged: 'Flagged',
    approved: 'Approved',
    hidden: 'Hidden',
    deleted: 'Deleted',
};

const actionLabel: Record<ReviewModerationAction, string> = {
    approve: 'Approve',
    hide: 'Hide review',
    delete: 'Delete review',
    warn_user: 'Warn user',
};

function formatDateTime(dateString?: string) {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function ModerateReviewsPage() {
    const [items, setItems] = useState<ModeratedReview[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | ReviewModerationStatus>('flagged');
    const [selectedId, setSelectedId] = useState('');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        const data = await listModeratedReviews();
        setItems(data);
        setSelectedId((current) => current || data[0]?.review_id || '');
        setIsLoading(false);
    };

    useEffect(() => {
        void loadData();
    }, []);

    const filteredItems = useMemo(() => {
        if (statusFilter === 'all') return items;
        return items.filter((item) => item.status === statusFilter);
    }, [items, statusFilter]);

    useEffect(() => {
        if (filteredItems.length === 0) {
            setSelectedId('');
            return;
        }
        const exists = filteredItems.some((item) => item.review_id === selectedId);
        if (!exists) {
            setSelectedId(filteredItems[0].review_id);
        }
    }, [filteredItems, selectedId]);

    const selectedItem = filteredItems.find((item) => item.review_id === selectedId) ?? null;

    const onAction = async (action: ReviewModerationAction) => {
        if (!selectedItem) return;
        setIsSubmitting(true);
        await moderateReview({
            review_id: selectedItem.review_id,
            action,
            moderator_id: 'moderator-demo',
            note,
        });
        setNote('');
        await loadData();
        setIsSubmitting(false);
    };

    return (
        <section className="mx-auto w-full max-w-7xl py-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">Moderate Reviews</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Inspect flagged or recent reviews and apply moderation decisions.
                </p>
            </header>

            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Filter by review status</label>
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as 'all' | ReviewModerationStatus)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400 md:w-72"
                >
                    <option value="all">All status</option>
                    <option value="flagged">Flagged</option>
                    <option value="approved">Approved</option>
                    <option value="hidden">Hidden</option>
                    <option value="deleted">Deleted</option>
                </select>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                    Loading reviews...
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-2">
                        {filteredItems.length === 0 ? (
                            <p className="p-4 text-sm text-slate-600">No review found for current filter.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {filteredItems.map((item) => (
                                    <li key={item.review_id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(item.review_id)}
                                            className={`w-full px-4 py-3 text-left transition ${
                                                selectedId === item.review_id ? 'bg-slate-50' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-medium text-slate-900">{item.rental_title}</p>
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass[item.status]}`}
                                                >
                                                    {statusLabel[item.status]}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-slate-600 line-clamp-2">
                                                {item.content}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Reviewer: {item.reviewer_id} | Created:{' '}
                                                {formatDateTime(item.created_at)}
                                            </p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        {!selectedItem ? (
                            <p className="text-sm text-slate-600">Select a review to inspect details.</p>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">{selectedItem.rental_title}</h2>
                                    <p className="mt-1 text-sm text-slate-600">{selectedItem.content}</p>
                                </div>

                                <dl className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Reviewer</dt>
                                        <dd className="font-medium">{selectedItem.reviewer_id}</dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Rating</dt>
                                        <dd className="font-medium">{selectedItem.rating}/5</dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Flag reason</dt>
                                        <dd className="font-medium">{selectedItem.flag_reason}</dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Warning count</dt>
                                        <dd className="font-medium">{selectedItem.warning_count}</dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Status</dt>
                                        <dd className="font-medium">{statusLabel[selectedItem.status]}</dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Moderated at</dt>
                                        <dd className="font-medium">{formatDateTime(selectedItem.moderated_at)}</dd>
                                    </div>
                                </dl>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Moderator note
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(event) => setNote(event.target.value)}
                                        rows={3}
                                        placeholder="Optional moderation note"
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => onAction('approve')}
                                        className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-70"
                                    >
                                        {actionLabel.approve}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => onAction('hide')}
                                        className="rounded-xl bg-slate-700 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70"
                                    >
                                        {actionLabel.hide}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => onAction('delete')}
                                        className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-70"
                                    >
                                        {actionLabel.delete}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => onAction('warn_user')}
                                        className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-70"
                                    >
                                        {actionLabel.warn_user}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </section>
    );
}
