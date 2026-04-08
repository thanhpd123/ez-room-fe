import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getLandlordRentalRequests, confirmRentalRequest, rejectRentalRequest, type RentalRequest } from './requests-storage';

function formatCurrency(value: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PENDING_PAID: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-slate-100 text-slate-700',
};

const statusLabels: Record<string, string> = {
    PENDING: 'Chờ xác nhận',
    PENDING_PAID: 'Đã thanh toán, chờ xác nhận',
    CONFIRMED: 'Đã duyệt',
    CANCELLED: 'Đã từ chối',
    EXPIRED: 'Hết hạn',
};

const paymentStatusLabels: Record<RentalRequest['paymentStatus'], string> = {
    UNPAID: 'Chưa thanh toán',
    PAID: 'Đã thanh toán',
    REFUNDED: 'Đã hoàn tiền',
};

const sourceTypeLabels: Record<'PREORDER' | 'FAVORITE', string> = {
    PREORDER: 'Yêu cầu đặt cọc',
    FAVORITE: 'Từ wishlist',
};

function getDisplayStatus(request: RentalRequest) {
    if (request.status === 'PENDING' && request.paymentStatus === 'PAID') {
        return 'PENDING_PAID';
    }
    return request.status;
}

export function RequestsPage() {
    const location = useLocation();
    const [requests, setRequests] = useState<RentalRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | RentalRequest['status']>('all');
    const [actioningId, setActioningId] = useState<string | null>(null);
    const preorderIdFromNav = (location.state as { preorderId?: string } | null)?.preorderId || null;

    // Load requests on component mount and when filters change
    useEffect(() => {
        const loadRequests = async () => {
            setIsLoading(true);
            const data = await getLandlordRentalRequests(
                statusFilter === 'all' ? undefined : statusFilter,
                keyword || undefined
                ,
                1,
                100
            );
            setRequests(data);
            setIsLoading(false);
        };

        const debounceTimer = setTimeout(loadRequests, 300);
        return () => clearTimeout(debounceTimer);
    }, [statusFilter, keyword]);

    useEffect(() => {
        if (!preorderIdFromNav || requests.length === 0) return;
        const target = document.getElementById(`preorder-${preorderIdFromNav}`);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [preorderIdFromNav, requests]);

    // Calculate statistics
    const stats = useMemo(() => {
        return {
            total: requests.length,
            pending: requests.filter(r => r.status === 'PENDING').length,
            confirmed: requests.filter(r => r.status === 'CONFIRMED').length,
        };
    }, [requests]);

    const handleConfirm = async (preorderId: string) => {
        setActioningId(preorderId);
        const success = await confirmRentalRequest(preorderId);
        if (success) {
            setRequests(requests.map(r => r.id === preorderId ? { ...r, status: 'CONFIRMED' } : r));
        }
        setActioningId(null);
    };

    const handleReject = async (preorderId: string) => {
        setActioningId(preorderId);
        const success = await rejectRentalRequest(preorderId);
        if (success) {
            setRequests(requests.map(r => r.id === preorderId ? { ...r, status: 'CANCELLED' } : r));
        }
        setActioningId(null);
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-white p-4 shadow-sm border border-border">
                    <div className="text-sm text-muted-foreground">Tổng yêu cầu</div>
                    <div className="text-3xl font-bold">{stats.total}</div>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm border border-border">
                    <div className="text-sm text-muted-foreground">Chờ xác nhận</div>
                    <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm border border-border">
                    <div className="text-sm text-muted-foreground">Đã duyệt</div>
                    <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-col sm:flex-row">
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, email, phòng..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="PENDING">Chờ xác nhận</option>
                    <option value="CONFIRMED">Đã duyệt</option>
                    <option value="CANCELLED">Đã từ chối</option>
                </select>
            </div>

            {/* Requests List */}
            {isLoading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin">⏳</div>
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                    Không có yêu cầu nào
                </div>
            ) : (
                <div className="space-y-3">
                    {requests.map((request) => {
                        // Show combined state so landlords can quickly spot deposits already paid by tenant.
                        const displayStatus = getDisplayStatus(request);
                        const isPending = request.status === 'PENDING';
                        const canConfirm = isPending;
                        const sourceType = request.sourceType || 'PREORDER';
                        const isFavoriteOnly = sourceType === 'FAVORITE' && request.paymentStatus === 'UNPAID';
                        const canReject = isPending;

                        return (
                            <div
                                key={request.id}
                                id={`preorder-${request.id}`}
                                className="rounded-lg bg-white p-4 shadow-sm border border-border hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col gap-4">
                                    {/* Header: User Info & Status */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-foreground">{request.user.fullName}</h3>
                                            <p className="text-sm text-muted-foreground">{request.user.email}</p>
                                            {request.user.phone && (
                                                <p className="text-sm text-muted-foreground">{request.user.phone}</p>
                                            )}
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[displayStatus]}`}>
                                            {statusLabels[displayStatus]}
                                        </span>
                                    </div>

                                    {/* Room & Rental Info */}
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground">Phòng</p>
                                            <p className="font-medium">{request.room.room_name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Giá phòng</p>
                                            <p className="font-medium">{formatCurrency(request.room.price)}/tháng</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Thanh toán cọc</p>
                                            <p className="font-medium">{paymentStatusLabels[request.paymentStatus]}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground">Nguồn yêu cầu</p>
                                            <p className="font-medium">{sourceTypeLabels[sourceType]}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-muted-foreground">Nhà cho thuê</p>
                                            <p className="font-medium">{request.rental.title}</p>
                                        </div>
                                    </div>

                                    {/* Request Date */}
                                    <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                                        Yêu cầu ngày: {formatDateTime(request.createdAt)}
                                    </div>

                                    {/* Actions */}
                                    {isPending && (
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => handleConfirm(request.id)}
                                                disabled={actioningId === request.id || !canConfirm}
                                                className="flex-1 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-white transition-colors"
                                            >
                                                {actioningId === request.id
                                                    ? 'Đang xử lý...'
                                                    : canConfirm
                                                        ? 'Approve rental request'
                                                        : 'Không thể duyệt'}
                                            </button>
                                            <button
                                                onClick={() => handleReject(request.id)}
                                                disabled={actioningId === request.id || !canReject}
                                                className="flex-1 rounded-lg border border-red-200 bg-white hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 text-sm font-medium text-red-600 transition-colors"
                                            >
                                                {actioningId === request.id
                                                    ? 'Đang xử lý...'
                                                    : canReject
                                                        ? '✕ Từ chối'
                                                        : 'Chưa thể từ chối'}
                                            </button>
                                        </div>
                                    )}
                                    {isPending && isFavoriteOnly && (
                                        <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                                            Tenant chưa đặt cọc, nhưng bạn vẫn có thể duyệt cho thuê trực tiếp.
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
