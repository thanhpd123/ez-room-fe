import { useEffect, useMemo, useState } from 'react';
import { listRoomPostModerationItems, moderateRoomPost } from '../shared/moderator-storage';
import type { ModerationDecision, RoomPostModerationItem } from '../shared/types';

const moderationBadgeClass: Record<ModerationDecision, string> = {
    pending_review: 'bg-amber-100 text-amber-700',
    approved: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
};

const moderationLabel: Record<ModerationDecision, string> = {
    pending_review: 'Pending review',
    approved: 'Approved',
    rejected: 'Rejected',
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

function formatCurrency(amount: number) {
    return amount.toLocaleString('vi-VN');
}

export function ModerateRoomPostListPage() {
    const [items, setItems] = useState<RoomPostModerationItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | ModerationDecision>('all');
    const [selectedId, setSelectedId] = useState('');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        const data = await listRoomPostModerationItems();
        setItems(data);
        setSelectedId((current) => current || data[0]?.room_post_id || '');
        setIsLoading(false);
    };

    useEffect(() => {
        void loadData();
    }, []);

    const filteredItems = useMemo(() => {
        const normalized = keyword.trim().toLowerCase();
        return items.filter((item) => {
            const matchesKeyword =
                normalized.length === 0 ||
                item.title.toLowerCase().includes(normalized) ||
                item.rental_title.toLowerCase().includes(normalized);
            const matchesStatus = statusFilter === 'all' || item.moderation_status === statusFilter;
            return matchesKeyword && matchesStatus;
        });
    }, [items, keyword, statusFilter]);

    useEffect(() => {
        if (filteredItems.length === 0) {
            setSelectedId('');
            return;
        }
        const exists = filteredItems.some((item) => item.room_post_id === selectedId);
        if (!exists) {
            setSelectedId(filteredItems[0].room_post_id);
        }
    }, [filteredItems, selectedId]);

    const selectedItem = filteredItems.find((item) => item.room_post_id === selectedId) ?? null;

    const handleDecision = async (decision: 'approved' | 'rejected') => {
        if (!selectedItem) return;
        setIsSubmitting(true);
        await moderateRoomPost({
            room_post_id: selectedItem.room_post_id,
            decision,
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
                <h1 className="text-2xl font-semibold text-slate-900">Moderate Room Post List</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Verify room post information before making content visible to tenants.
                </p>
            </header>

            <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Search by room title or rental title..."
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as 'all' | ModerationDecision)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                    <option value="all">All moderation status</option>
                    <option value="pending_review">Pending review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                    Loading room post queue...
                </div>
            ) : (
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-2">
                        {filteredItems.length === 0 ? (
                            <p className="p-4 text-sm text-slate-600">No room post found for current filter.</p>
                        ) : (
                            <ul className="divide-y divide-slate-100">
                                {filteredItems.map((item) => (
                                    <li key={item.room_post_id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedId(item.room_post_id)}
                                            className={`w-full px-4 py-3 text-left transition ${
                                                selectedId === item.room_post_id ? 'bg-slate-50' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="font-medium text-slate-900">{item.title}</p>
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${moderationBadgeClass[item.moderation_status]}`}
                                                >
                                                    {moderationLabel[item.moderation_status]}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-slate-600">{item.rental_title}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Submitted: {formatDateTime(item.created_at)}
                                            </p>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                        {!selectedItem ? (
                            <p className="text-sm text-slate-600">Select a room post to review details.</p>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900">{selectedItem.title}</h2>
                                    <p className="mt-1 text-sm text-slate-600">{selectedItem.rental_title}</p>
                                </div>

                                <dl className="grid grid-cols-2 gap-2 text-sm text-slate-700">
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Price</dt>
                                        <dd className="font-medium">{formatCurrency(selectedItem.price)} VND</dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Area</dt>
                                        <dd className="font-medium">{selectedItem.area} m2</dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Max occupants</dt>
                                        <dd className="font-medium">{selectedItem.max_occupants}</dd>
                                    </div>
                                    <div className="rounded-lg bg-slate-50 px-3 py-2">
                                        <dt className="text-xs text-slate-500">Listing status</dt>
                                        <dd className="font-medium">{selectedItem.listing_status}</dd>
                                    </div>
                                </dl>

                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                    <p className="text-xs text-slate-500">Last moderated</p>
                                    <p className="mt-1 text-sm text-slate-700">
                                        {formatDateTime(selectedItem.last_moderated_at)}
                                    </p>
                                    {selectedItem.last_note ? (
                                        <p className="mt-2 text-sm text-slate-700">{selectedItem.last_note}</p>
                                    ) : null}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                        Moderator note
                                    </label>
                                    <textarea
                                        value={note}
                                        onChange={(event) => setNote(event.target.value)}
                                        rows={3}
                                        placeholder="Optional reason for this decision"
                                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => handleDecision('approved')}
                                        className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-70"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={() => handleDecision('rejected')}
                                        className="flex-1 rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-70"
                                    >
                                        Reject
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
