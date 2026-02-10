import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { RoomStatus } from '@/lib/models/room.model';
import { getManagedRentalById } from '@/app/features/rentalManagement/shared/rental-storage';
import { listRoomPostsByRentalId } from '../shared/room-post-storage';
import {
    ROOM_POST_GENDER_OPTIONS,
    ROOM_POST_STATUS_OPTIONS,
    type ManagedRoomPostItem,
} from '../shared/types';

const roomStatusClassName: Record<RoomStatus, string> = {
    available: 'bg-emerald-100 text-emerald-700',
    rented: 'bg-slate-200 text-slate-700',
    maintenance: 'bg-amber-100 text-amber-700',
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function getStatusLabel(status: RoomStatus) {
    return ROOM_POST_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

function getGenderLabel(value: string) {
    return ROOM_POST_GENDER_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function ViewListRoomPostPage() {
    const navigate = useNavigate();
    const { rentalId = '' } = useParams();
    const [rentalTitle, setRentalTitle] = useState('');
    const [roomPosts, setRoomPosts] = useState<ManagedRoomPostItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | RoomStatus>('all');

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);

            const [rental, posts] = await Promise.all([
                getManagedRentalById(rentalId),
                listRoomPostsByRentalId(rentalId),
            ]);

            if (!active) return;
            setRentalTitle(rental?.title ?? '');
            setRoomPosts(posts);
            setIsLoading(false);
        };

        if (!rentalId) {
            setIsLoading(false);
            setRoomPosts([]);
            setRentalTitle('');
            return;
        }

        void load();
        return () => {
            active = false;
        };
    }, [rentalId]);

    const filteredPosts = useMemo(() => {
        const normalized = keyword.trim().toLowerCase();
        return roomPosts.filter((item) => {
            const matchesKeyword =
                normalized.length === 0 ||
                item.title.toLowerCase().includes(normalized) ||
                item.description?.toLowerCase().includes(normalized);
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            return matchesKeyword && matchesStatus;
        });
    }, [keyword, roomPosts, statusFilter]);

    if (!rentalId) {
        return (
            <section className="mx-auto w-full max-w-5xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-slate-700">Missing rental id.</p>
                <button
                    type="button"
                    onClick={() => navigate('/rental-management/rentals')}
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                    Back to rental list
                </button>
            </section>
        );
    }

    return (
        <section className="mx-auto w-full max-w-7xl">
            <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-2xl font-semibold text-slate-900">ViewListRoomPost</h2>
                    <p className="text-sm text-slate-500">
                        Rental: {rentalTitle || rentalId}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(`/rental-management/rentals/${rentalId}`)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                        Rental detail
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(`/rental-management/rentals/${rentalId}/room-posts/create`)}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                    >
                        CreateRoomPost
                    </button>
                </div>
            </header>

            <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_240px]">
                <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Search room post by title or description..."
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />

                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as 'all' | RoomStatus)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                    <option value="all">All status</option>
                    {ROOM_POST_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {isLoading ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                    Loading room posts...
                </div>
            ) : filteredPosts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="text-slate-700">No room post found for this rental.</p>
                    <button
                        type="button"
                        onClick={() => navigate(`/rental-management/rentals/${rentalId}/room-posts/create`)}
                        className="mt-4 rounded-xl border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
                    >
                        Create the first room post
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredPosts.map((post) => (
                        <article
                            key={post.room_post_id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                        >
                            <div className="grid gap-4 p-4 md:grid-cols-[220px_1fr]">
                                <img
                                    src={
                                        post.thumbnail_url ??
                                        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=900&q=80'
                                    }
                                    alt={post.title}
                                    className="h-40 w-full rounded-xl object-cover"
                                />

                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-semibold text-slate-900">{post.title}</h3>
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roomStatusClassName[post.status]}`}
                                        >
                                            {getStatusLabel(post.status)}
                                        </span>
                                    </div>

                                    {post.description ? (
                                        <p className="line-clamp-2 text-sm text-slate-600">{post.description}</p>
                                    ) : null}

                                    <dl className="grid grid-cols-2 gap-2 text-sm text-slate-700 sm:grid-cols-4">
                                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                                            <dt className="text-xs text-slate-500">Price</dt>
                                            <dd className="font-medium">{formatCurrency(post.price)}</dd>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                                            <dt className="text-xs text-slate-500">Area</dt>
                                            <dd className="font-medium">{post.area} m2</dd>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                                            <dt className="text-xs text-slate-500">Max occupants</dt>
                                            <dd className="font-medium">{post.max_occupants}</dd>
                                        </div>
                                        <div className="rounded-lg bg-slate-50 px-3 py-2">
                                            <dt className="text-xs text-slate-500">Gender preference</dt>
                                            <dd className="font-medium">{getGenderLabel(post.gender_preference)}</dd>
                                        </div>
                                    </dl>

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs text-slate-500">
                                            Created: {formatDateTime(post.created_at)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/rental-management/rentals/${rentalId}/room-posts/${post.room_post_id}`
                                                )
                                            }
                                            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                        >
                                            ViewRoomPostDetail
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
