import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { RoomStatus } from '@/lib/models/room.model';
import { getManagedRentalById } from '@/app/features/rentalManagement/shared/rental-storage';
import { getRoomPostById, deleteRoomPost } from '../shared/room-post-storage';
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

export function ViewRoomPostDetailPage() {
    const navigate = useNavigate();
    const { rentalId = '', roomPostId = '' } = useParams();
    const [rentalTitle, setRentalTitle] = useState('');
    const [roomPost, setRoomPost] = useState<ManagedRoomPostItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            const [rental, post] = await Promise.all([
                getManagedRentalById(rentalId),
                getRoomPostById(rentalId, roomPostId),
            ]);
            if (!active) return;
            setRentalTitle(rental?.title ?? '');
            setRoomPost(post);
            setIsLoading(false);
        };

        if (!rentalId || !roomPostId) {
            setIsLoading(false);
            setRoomPost(null);
            return;
        }

        void load();
        return () => {
            active = false;
        };
    }, [rentalId, roomPostId]);

    const rentalLabel = useMemo(() => rentalTitle || rentalId, [rentalId, rentalTitle]);

    const getImageArray = () => {
        if (!roomPost) return [];
        const images = roomPost.images && roomPost.images.length > 0 ? roomPost.images : [];
        if (images.length === 0 && roomPost.thumbnail_url) {
            return [roomPost.thumbnail_url];
        }
        return images;
    };

    const imageArray = getImageArray();

    if (isLoading) {
        return (
            <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-600">Loading room post detail...</p>
            </section>
        );
    }

    if (!roomPost || !rentalId) {
        return (
            <section className="mx-auto w-full max-w-5xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <h2 className="text-xl font-semibold text-slate-900">Room post not found</h2>
                <p className="mt-2 text-sm text-slate-600">
                    The room post does not exist in this rental.
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
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => navigate(`/rental-management/rentals/${rentalId}/room-posts`)}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    ← Quay lại danh sách phòng
                </button>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => navigate(`/rental-management/rentals/${rentalId}/room-posts/${roomPostId}/edit`)}
                        className="rounded-xl border border-blue-500 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
                    >
                        ✏️ Sửa
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="rounded-xl border border-rose-500 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
                    >
                        🗑️ Xóa
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6">
                        <h3 className="text-lg font-semibold text-slate-900">Xác nhận xóa phòng</h3>
                        <p className="mt-2 text-sm text-slate-600">
                            Bạn có chắc muốn xóa phòng <strong>"{roomPost?.title}"</strong>? 
                            Hành động này không thể hoàn tác.
                        </p>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    setIsDeleting(true);
                                    const success = await deleteRoomPost(roomPostId);
                                    setIsDeleting(false);
                                    if (success) {
                                        navigate(`/rental-management/rentals/${rentalId}/room-posts`);
                                    } else {
                                        alert('Xóa phòng thất bại');
                                        setShowDeleteConfirm(false);
                                    }
                                }}
                                disabled={isDeleting}
                                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-50"
                            >
                                {isDeleting ? 'Đang xóa...' : 'Xóa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {/* Main Image */}
                <img
                    src={
                        imageArray[selectedImageIndex] ??
                        'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'
                    }
                    alt={roomPost.title}
                    className="h-64 w-full object-cover sm:h-80"
                />

                {/* Image Gallery Thumbnails */}
                {imageArray.length > 1 && (
                    <div className="border-t border-slate-200 bg-slate-50 p-4">
                        <div className="flex gap-2 overflow-x-auto">
                            {imageArray.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedImageIndex(index)}
                                    className={`flex-shrink-0 rounded-lg overflow-hidden w-20 h-20 border-2 transition-colors ${
                                        selectedImageIndex === index
                                            ? 'border-slate-900'
                                            : 'border-slate-300 hover:border-slate-400'
                                    }`}
                                >
                                    <img
                                        src={image}
                                        alt={`Thumbnail ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                        <p className="mt-2 text-xs text-slate-600">
                            {selectedImageIndex + 1} / {imageArray.length}
                        </p>
                    </div>
                )}

                <div className="space-y-5 p-5 sm:p-6">
                    <header className="space-y-2">
                        <p className="text-sm text-slate-500">Rental: {rentalLabel}</p>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-2xl font-semibold text-slate-900">{roomPost.title}</h2>
                            <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roomStatusClassName[roomPost.status]}`}
                            >
                                {getStatusLabel(roomPost.status)}
                            </span>
                        </div>
                    </header>

                    {roomPost.description ? (
                        <section>
                            <h3 className="mb-1 text-sm font-semibold text-slate-900">Description</h3>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                                {roomPost.description}
                            </p>
                        </section>
                    ) : null}

                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-slate-900">Room Post Information</h3>
                        <dl className="grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Room post ID</dt>
                                <dd className="font-medium text-slate-900">{roomPost.room_post_id}</dd>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Rental ID</dt>
                                <dd className="font-medium text-slate-900">{roomPost.rental_id}</dd>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Price</dt>
                                <dd className="font-medium text-slate-900">
                                    {formatCurrency(roomPost.price)}
                                </dd>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Area</dt>
                                <dd className="font-medium text-slate-900">{roomPost.area} m2</dd>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Max occupants</dt>
                                <dd className="font-medium text-slate-900">{roomPost.max_occupants}</dd>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Images</dt>
                                <dd className="font-medium text-slate-900">{imageArray.length} photo(s)</dd>
                            </div>
                            {roomPost.amenities && roomPost.amenities.length > 0 && (
                                <div className="md:col-span-2 rounded-xl bg-slate-50 px-4 py-3">
                                    <dt className="text-xs text-slate-500">Amenities</dt>
                                    <dd className="mt-2 flex flex-wrap gap-2">
                                        {roomPost.amenities.map((amenity) => (
                                            <span
                                                key={amenity.id}
                                                className="rounded-lg bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700"
                                            >
                                                {amenity.name}
                                            </span>
                                        ))}
                                    </dd>
                                </div>
                            )}
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Created at</dt>
                                <dd className="font-medium text-slate-900">
                                    {formatDateTime(roomPost.created_at)}
                                </dd>
                            </div>
                        </dl>
                    </section>
                </div>
            </article>
        </section>
    );
}
