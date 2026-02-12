import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getModeratorOverview, listModerationHistory } from './shared/moderator-storage';
import type { ModerationHistoryRecord } from './shared/types';

interface OverviewState {
    pendingRentalCount: number;
    pendingRoomPostCount: number;
    openReportCount: number;
    flaggedReviewCount: number;
}

const initialOverview: OverviewState = {
    pendingRentalCount: 0,
    pendingRoomPostCount: 0,
    openReportCount: 0,
    flaggedReviewCount: 0,
};

const quickLinks = [
    {
        title: 'Moderate Rental List',
        path: '/moderator/rentals',
        key: 'pendingRentalCount',
    },
    {
        title: 'Moderate Room Post List',
        path: '/moderator/room-posts',
        key: 'pendingRoomPostCount',
    },
    {
        title: 'Handle Reports',
        path: '/moderator/reports',
        key: 'openReportCount',
    },
    {
        title: 'Moderate Reviews',
        path: '/moderator/reviews',
        key: 'flaggedReviewCount',
    },
] as const;

function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function ModeratorDashboardPage() {
    const [overview, setOverview] = useState<OverviewState>(initialOverview);
    const [history, setHistory] = useState<ModerationHistoryRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            const [overviewData, historyData] = await Promise.all([
                getModeratorOverview(),
                listModerationHistory(),
            ]);
            if (!active) return;
            setOverview(overviewData);
            setHistory(historyData.slice(0, 8));
            setIsLoading(false);
        };

        void load();
        return () => {
            active = false;
        };
    }, []);

    return (
        <section className="mx-auto w-full max-w-7xl py-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">Moderator Dashboard</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Review listing queues, reports, and reviews submitted by users.
                </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {quickLinks.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow"
                    >
                        <p className="text-sm text-slate-500">{item.title}</p>
                        <p className="mt-2 text-3xl font-semibold text-slate-900">
                            {isLoading ? '--' : overview[item.key]}
                        </p>
                        <p className="mt-3 text-sm font-medium text-slate-700">Open page</p>
                    </Link>
                ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-lg font-semibold text-slate-900">Recent Moderation History</h2>

                {isLoading ? (
                    <p className="mt-4 text-sm text-slate-500">Loading moderation history...</p>
                ) : history.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">No moderation actions yet.</p>
                ) : (
                    <ul className="mt-4 divide-y divide-slate-100">
                        {history.map((item) => (
                            <li key={item.history_id} className="py-3">
                                <p className="text-sm font-medium text-slate-800">
                                    {item.action} on {item.target_type} ({item.target_id})
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    By {item.moderator_id} at {formatDateTime(item.created_at)}
                                </p>
                                {item.note ? <p className="mt-1 text-sm text-slate-600">{item.note}</p> : null}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}
