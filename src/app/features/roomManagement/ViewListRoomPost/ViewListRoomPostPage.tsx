import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { RoomStatus } from '@/lib/models/room.model';
import { getManagedRentalById } from '@/app/features/rentalManagement/shared/rental-storage';
import { getRoomWishers, listRoomPostsByRentalId, type RoomWisher } from '../shared/room-post-storage';
import {
    ROOM_POST_STATUS_OPTIONS,
    type ManagedRoomPostItem,
} from '../shared/types';

const roomStatusClassName: Record<RoomStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    AVAILABLE: 'bg-emerald-100 text-emerald-700',
    RENTED: 'bg-slate-200 text-slate-700',
    MAINTENANCE: 'bg-orange-100 text-orange-700',
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

export function ViewListRoomPostPage() {
    const navigate = useNavigate();
    const { rentalId = '' } = useParams();
    const [rentalTitle, setRentalTitle] = useState('');
    const [roomPosts, setRoomPosts] = useState<ManagedRoomPostItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | RoomStatus>('all');
    const [openedWishersRoomId, setOpenedWishersRoomId] = useState<string | null>(null);
    const [wishersByRoom, setWishersByRoom] = useState<Record<string, RoomWisher[]>>({});
    const [loadingWishersRoomId, setLoadingWishersRoomId] = useState<string | null>(null);

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

    const toggleWishers = async (roomId: string) => {
        if (openedWishersRoomId === roomId) {
            setOpenedWishersRoomId(null);
            return;
        }
        setOpenedWishersRoomId(roomId);

        if (wishersByRoom[roomId]) return;

        setLoadingWishersRoomId(roomId);
        const rows = await getRoomWishers(roomId);
        setWishersByRoom((prev) => ({ ...prev, [roomId]: rows }));
        setLoadingWishersRoomId(null);
    };

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
                                        {post.amenities && post.amenities.length > 0 && (
                                            <div className="col-span-2 sm:col-span-4 rounded-lg bg-slate-50 px-3 py-2">
                                                <dt className="text-xs text-slate-500">Amenities</dt>
                                                <dd className="mt-1 flex flex-wrap gap-1">
                                                    {post.amenities.slice(0, 3).map((amenity) => (
                                                        <span
                                                            key={amenity.id}
                                                            className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                                                        >
                                                            {amenity.name}
                                                        </span>
                                                    ))}
                                                    {post.amenities.length > 3 && (
                                                        <span className="text-xs text-slate-500">
                                                            +{post.amenities.length - 3} more
                                                        </span>
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                    </dl>

                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-xs text-slate-500">
                                            Created: {formatDateTime(post.created_at)}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => toggleWishers(post.room_post_id)}
                                                className="rounded-xl border border-purple-300 px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50"
                                            >
                                                Wishlist queue
                                            </button>
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

                                    {openedWishersRoomId === post.room_post_id && (
                                        <div className="rounded-xl border border-purple-200 bg-purple-50/40 p-3">
                                            <p className="mb-2 text-sm font-semibold text-purple-900">
                                                Priority: paid deposit before unpaid, then higher deposit, then earlier preorder, then earlier favorite
                                            </p>
                                            {loadingWishersRoomId === post.room_post_id ? (
                                                <p className="text-sm text-slate-600">Loading wishlist...</p>
                                            ) : (wishersByRoom[post.room_post_id] || []).length === 0 ? (
                                                <p className="text-sm text-slate-600">No users in wishlist yet.</p>
                                            ) : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left text-sm">
                                                        <thead>
                                                            <tr className="border-b border-purple-200 text-xs uppercase text-slate-600">
                                                                <th className="py-2 pr-3">#</th>
                                                                <th className="py-2 pr-3">User</th>
                                                                <th className="py-2 pr-3">Contact</th>
                                                                <th className="py-2 pr-3">Priority</th>
                                                                <th className="py-2 pr-3">Deposit</th>
                                                                <th className="py-2 pr-3">Favorited At</th>
                                                                <th className="py-2 pr-3">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {(wishersByRoom[post.room_post_id] || []).map((w, idx) => (
                                                                <tr key={w.userId} className="border-b border-purple-100 last:border-0">
                                                                    <td className="py-2 pr-3 font-medium text-slate-800">{idx + 1}</td>
                                                                    <td className="py-2 pr-3">
                                                                        <div className="font-medium text-slate-900">{w.user.fullName}</div>
                                                                        {w.preorder?.paymentStatus === 'PAID' && (
                                                                            <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                                                                Paid deposit
                                                                            </span>
                                                                        )}
                                                                        {w.preorder?.paymentStatus === 'UNPAID' && (
                                                                            <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                                                                Preorder unpaid
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2 pr-3 text-slate-700">
                                                                        <div>{w.user.email}</div>
                                                                        {w.user.phone ? <div>{w.user.phone}</div> : null}
                                                                    </td>
                                                                    <td className="py-2 pr-3">
                                                                        {w.hasPriorityPreorder ? (
                                                                            <span className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
                                                                                Preorder priority
                                                                            </span>
                                                                        ) : (
                                                                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                                                Normal queue
                                                                            </span>
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2 pr-3 text-slate-700">
                                                                        {w.preorder && w.preorder.depositAmount > 0 ? (
                                                                            <span className="font-medium tabular-nums">
                                                                                {formatCurrency(w.preorder.depositAmount)}
                                                                            </span>
                                                                        ) : (
                                                                            '—'
                                                                        )}
                                                                    </td>
                                                                    <td className="py-2 pr-3 text-slate-700">
                                                                        {w.favoritedAt ? formatDateTime(w.favoritedAt) : '-'}
                                                                    </td>
                                                                    <td className="py-2 pr-3">
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => navigate(`/chat/${w.userId}`)}
                                                                                className="rounded-lg border border-blue-300 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                                                                            >
                                                                                Message user
                                                                            </button>
                                                                            {w.preorder?.id ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        navigate('/rental-management/requests', {
                                                                                            state: { preorderId: w.preorder?.id },
                                                                                        })
                                                                                    }
                                                                                    className="rounded-lg border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                                                                                >
                                                                                    View preorder
                                                                                </button>
                                                                            ) : null}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
