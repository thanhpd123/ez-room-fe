import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getRentalByIdRequest } from '@/lib/api';
import { RENTAL_STATUS_OPTIONS } from '../shared/types';

const statusClassName: Record<string, string> = {
    AVAILABLE: 'bg-emerald-100 text-emerald-700',
    UNAVAILABLE: 'bg-slate-200 text-slate-600',
    HIDDEN: 'bg-orange-100 text-orange-700',
    VIOLATE: 'bg-rose-100 text-rose-700',
    PENDING: 'bg-amber-100 text-amber-700',
    SUSPEND: 'bg-red-100 text-red-700',
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

function getStatusLabel(status: string) {
    return RENTAL_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;
}

const DEFAULT_THUMB =
    'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80';

interface RentalDetail {
    id: string;
    title: string;
    description: string | null;
    status: string;
    createdAt: string;
    owner: { id: string; fullName: string; avatarUrl: string | null; email: string; phone: string | null } | null;
    location: { id: string; address: string; district: string | null; city: string | null } | null;
    rooms: Array<Record<string, unknown>>;
    images: string[];
}

export function ViewRentalDetailPage() {
    const navigate = useNavigate();
    const { rentalId = '' } = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [rental, setRental] = useState<RentalDetail | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            setLoadError(null);
            try {
                const result = await getRentalByIdRequest(rentalId);
                if (!active) return;
                setRental(result.data);
            } catch (err) {
                if (!active) return;
                setLoadError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
            } finally {
                if (active) setIsLoading(false);
            }
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

    if (isLoading) {
        return (
            <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-600">Đang tải chi tiết bài đăng...</p>
            </section>
        );
    }

    if (loadError) {
        return (
            <section className="mx-auto w-full max-w-5xl rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center">
                <p className="text-rose-700 font-medium">Lỗi khi tải chi tiết</p>
                <p className="mt-1 text-sm text-rose-600">{loadError}</p>
                <button
                    type="button"
                    onClick={() => navigate('/rental-management/rentals')}
                    className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                    Quay lại danh sách
                </button>
            </section>
        );
    }

    if (!rental) {
        return (
            <section className="mx-auto w-full max-w-5xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <h2 className="text-xl font-semibold text-slate-900">Không tìm thấy bài đăng</h2>
                <p className="mt-2 text-sm text-slate-600">
                    Bài đăng này có thể đã bị xóa hoặc không tồn tại.
                </p>
                <button
                    type="button"
                    onClick={() => navigate('/rental-management/rentals')}
                    className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                    Quay lại danh sách
                </button>
            </section>
        );
    }

    const fullAddress = rental.location
        ? [rental.location.address, rental.location.district, rental.location.city].filter(Boolean).join(', ')
        : '';

    return (
        <section className="mx-auto w-full max-w-5xl">
            <div className="mb-4 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={() => navigate('/rental-management/rentals')}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    ← Quay lại
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/rental-management/rentals/create')}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                    Tạo bài đăng mới
                </button>
            </div>

            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {/* Hero image or gallery */}
                {rental.images && rental.images.length > 0 ? (
                    <div>
                        <img
                            src={rental.images[0]}
                            alt={rental.title}
                            className="h-64 w-full object-cover sm:h-80"
                        />
                        {rental.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto p-3 bg-slate-50">
                                {rental.images.map((url, i) => (
                                    <img
                                        key={url}
                                        src={url}
                                        alt={`Ảnh ${i + 1}`}
                                        className="h-20 w-20 flex-shrink-0 rounded-lg object-cover border border-slate-200"
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <img
                        src={DEFAULT_THUMB}
                        alt={rental.title}
                        className="h-64 w-full object-cover sm:h-80"
                    />
                )}

                <div className="space-y-5 p-5 sm:p-6">
                    <header className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-2xl font-semibold text-slate-900">{rental.title}</h2>
                            <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClassName[rental.status] ?? 'bg-slate-100 text-slate-600'}`}
                            >
                                {getStatusLabel(rental.status)}
                            </span>
                        </div>
                        {fullAddress && <p className="text-sm text-slate-600">{fullAddress}</p>}
                    </header>

                    {rental.description ? (
                        <section>
                            <h3 className="mb-1 text-sm font-semibold text-slate-900">Mô tả</h3>
                            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                                {rental.description}
                            </p>
                        </section>
                    ) : null}

                    <section>
                        <h3 className="mb-2 text-sm font-semibold text-slate-900">Thông tin bài đăng</h3>
                        <dl className="grid gap-2 text-sm sm:grid-cols-2">
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Mã bài đăng</dt>
                                <dd className="font-medium text-slate-900 break-all">{rental.id}</dd>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Trạng thái</dt>
                                <dd className="font-medium text-slate-900">{getStatusLabel(rental.status)}</dd>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Số ảnh</dt>
                                <dd className="font-medium text-slate-900">{rental.images?.length ?? 0}</dd>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-4 py-3">
                                <dt className="text-xs text-slate-500">Ngày tạo</dt>
                                <dd className="font-medium text-slate-900">
                                    {formatDateTime(rental.createdAt)}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    {rental.owner && (
                        <section>
                            <h3 className="mb-2 text-sm font-semibold text-slate-900">Thông tin chủ trọ</h3>
                            <dl className="grid gap-2 text-sm sm:grid-cols-2">
                                <div className="rounded-xl bg-slate-50 px-4 py-3">
                                    <dt className="text-xs text-slate-500">Họ tên</dt>
                                    <dd className="font-medium text-slate-900">{rental.owner.fullName}</dd>
                                </div>
                                <div className="rounded-xl bg-slate-50 px-4 py-3">
                                    <dt className="text-xs text-slate-500">Email</dt>
                                    <dd className="font-medium text-slate-900">{rental.owner.email}</dd>
                                </div>
                                {rental.owner.phone && (
                                    <div className="rounded-xl bg-slate-50 px-4 py-3">
                                        <dt className="text-xs text-slate-500">Số điện thoại</dt>
                                        <dd className="font-medium text-slate-900">{rental.owner.phone}</dd>
                                    </div>
                                )}
                            </dl>
                        </section>
                    )}
                </div>
            </article>
        </section>
    );
}
