import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';
import {
    assignQueueItem,
    listModerationQueue,
    listQueueActivity,
    releaseQueueItem,
    type ModerationQueueItem,
    type QueueActivityItem,
} from '../shared/moderator-storage';

const STATUS_OPTIONS = [
    { value: '', label: 'Tất cả' },
    { value: 'OPEN', label: 'Mở (chưa ai nhận)' },
    { value: 'IN_PROGRESS', label: 'Đang xử lý' },
    { value: 'RESOLVED', label: 'Đã xử lý' },
];

const PRIORITY_OPTIONS = [
    { value: '', label: 'Tất cả' },
    { value: 'URGENT', label: 'Khẩn cấp' },
    { value: 'HIGH', label: 'Cao' },
    { value: 'NORMAL', label: 'Bình thường' },
    { value: 'LOW', label: 'Thấp' },
];

const CATEGORY_OPTIONS = [
    { value: '', label: 'Tất cả' },
    { value: 'NEW_LISTING', label: 'Bài đăng mới' },
    { value: 'DOCUMENT_REVIEW', label: 'Xác minh tài liệu' },
    { value: 'REPORTED_CONTENT', label: 'Nội dung bị báo cáo' },
    { value: 'FEEDBACK_REVIEW', label: 'Đánh giá cần duyệt' },
    { value: 'USER_COMPLAINT', label: 'Khiếu nại người dùng' },
    { value: 'FRAUD_SUSPICION', label: 'Nghi ngờ gian lận' },
    { value: 'POLICY_VIOLATION', label: 'Vi phạm chính sách' },
];

const TARGET_TYPE_LABELS: Record<string, string> = {
    RENTAL: 'Nhà cho thuê',
    ROOM: 'Phòng trọ',
    REPORT: 'Báo cáo',
    FEEDBACK: 'Đánh giá',
    USER: 'Người dùng',
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

function getNavigatePath(item: ModerationQueueItem): string {
    switch (item.target_type) {
        case 'RENTAL':
            return '/moderator/rentals';
        case 'ROOM':
            return '/moderator/room-posts';
        case 'REPORT':
            return '/moderator/reports';
        case 'FEEDBACK':
            return '/moderator/reviews';
        case 'USER':
            return '/moderator/users';
        default:
            return '/moderator';
    }
}

export function ModerationQueuePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [items, setItems] = useState<ModerationQueueItem[]>([]);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState('OPEN');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [myTasksOnly, setMyTasksOnly] = useState(false);
    const [actingId, setActingId] = useState<string | null>(null);

    // Queue activity (lịch sử claim/release)
    const [activityItems, setActivityItems] = useState<QueueActivityItem[]>([]);
    const [activityPagination, setActivityPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityExpanded, setActivityExpanded] = useState(false);
    const [activityActionFilter, setActivityActionFilter] = useState<'CLAIM' | 'RELEASE' | ''>('');
    const [selectedActivity, setSelectedActivity] = useState<QueueActivityItem | null>(null);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await listModerationQueue({
                status: statusFilter || undefined,
                priority: priorityFilter || undefined,
                category: categoryFilter || undefined,
                assignedTo: myTasksOnly && user?.id ? user.id : undefined,
                page: 1,
                limit: 50,
            });
            setItems(result.data);
            setPagination(result.pagination);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Không thể tải danh sách');
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, priorityFilter, categoryFilter, myTasksOnly, user?.id]);

    useEffect(() => {
        void load();
    }, [load]);

    const handleClaim = async (e: React.MouseEvent, item: ModerationQueueItem) => {
        e.stopPropagation();
        if (actingId) return;
        setActingId(item.id);
        try {
            const updated = await assignQueueItem(item.id);
            setItems((prev) =>
                prev.map((i) => (i.id === item.id ? updated : i))
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Nhận task thất bại');
        } finally {
            setActingId(null);
            loadActivity();
        }
    };

    const loadActivity = useCallback(async () => {
        setActivityLoading(true);
        try {
            const result = await listQueueActivity({
                page: 1,
                limit: 15,
                action: activityActionFilter || undefined,
            });
            setActivityItems(result.data);
            setActivityPagination(result.pagination);
        } catch {
            setActivityItems([]);
        } finally {
            setActivityLoading(false);
        }
    }, [activityActionFilter]);

    const handleRelease = async (e: React.MouseEvent, item: ModerationQueueItem) => {
        e.stopPropagation();
        if (actingId) return;
        setActingId(item.id);
        try {
            await releaseQueueItem(item.id);
            setItems((prev) =>
                prev.map((i) =>
                    i.id === item.id
                        ? {
                            ...i,
                            status: 'OPEN',
                            assigned_to: null,
                            assigned_to_id: null,
                            assigned_at: null,
                        }
                        : i
                )
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Trả task thất bại');
        } finally {
            setActingId(null);
            loadActivity();
        }
    };

    useEffect(() => {
        if (activityExpanded) void loadActivity();
    }, [activityExpanded, loadActivity]);

    const handleRowClick = (item: ModerationQueueItem) => {
        const path = getNavigatePath(item);
        navigate(path);
    };

    const isMyTask = (item: ModerationQueueItem) =>
        user?.id && item.assigned_to_id === user.id;

    return (
        <section className="mx-auto w-full max-w-7xl py-6">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">
                    Moderation Queue
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Nội dung cần duyệt → vào Queue. Moderator nhận (claim) task → task bị
                    lock. Tránh trùng lặp khi nhiều người cùng duyệt.
                </p>
            </header>

            {error && (
                <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    {error}
                </div>
            )}

            <div className="mb-4 flex flex-wrap items-center gap-4">
                <div>
                    <label className="mr-2 text-sm text-slate-600">
                        Trạng thái:
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <option key={opt.value || 'all'} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mr-2 text-sm text-slate-600">
                        Độ ưu tiên:
                    </label>
                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                    >
                        {PRIORITY_OPTIONS.map((opt) => (
                            <option key={opt.value || 'all'} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="mr-2 text-sm text-slate-600">
                        Danh mục:
                    </label>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                    >
                        {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value || 'all'} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
                <label className="flex cursor-pointer items-center gap-2">
                    <input
                        type="checkbox"
                        checked={myTasksOnly}
                        onChange={(e) => setMyTasksOnly(e.target.checked)}
                        className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-600">Chỉ task của tôi</span>
                </label>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                {isLoading ? (
                    <div className="p-8 text-center text-slate-500">
                        Đang tải...
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        Không có mục nào trong queue.
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-slate-700">
                                    Loại
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-slate-700">
                                    ID
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-slate-700">
                                    Danh mục
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-slate-700">
                                    Ưu tiên
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-slate-700">
                                    Trạng thái
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-slate-700">
                                    Giao cho
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-slate-700">
                                    Ngày tạo
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-slate-700">
                                    Hạn
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-slate-700">
                                    Thao tác
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => handleRowClick(item)}
                                    className="cursor-pointer transition hover:bg-slate-50"
                                >
                                    <td className="px-4 py-3 text-slate-800">
                                        {TARGET_TYPE_LABELS[item.target_type] ??
                                            item.target_type}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                                        {item.target_id.slice(0, 8)}...
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {CATEGORY_OPTIONS.find((o) => o.value === item.category)
                                            ?.label ?? item.category}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded px-2 py-0.5 text-xs font-medium ${
                                                item.priority === 'URGENT'
                                                    ? 'bg-red-100 text-red-700'
                                                    : item.priority === 'HIGH'
                                                      ? 'bg-amber-100 text-amber-700'
                                                      : 'bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            {item.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`rounded px-2 py-0.5 text-xs font-medium ${
                                                item.status === 'OPEN'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : item.status === 'IN_PROGRESS'
                                                      ? 'bg-blue-100 text-blue-700'
                                                      : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {item.status === 'OPEN'
                                                ? 'Mở'
                                                : item.status === 'IN_PROGRESS'
                                                  ? 'Đang xử lý'
                                                  : item.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {item.assigned_to ? (
                                            <span
                                                className={
                                                    isMyTask(item)
                                                        ? 'font-medium text-blue-600'
                                                        : ''
                                                }
                                            >
                                                {item.assigned_to}
                                            </span>
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {formatDateTime(item.created_at)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {item.due_by
                                            ? formatDateTime(item.due_by)
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                                        {item.status === 'OPEN' && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleClaim(e, item)}
                                                disabled={!!actingId}
                                                className="rounded bg-emerald-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                                            >
                                                {actingId === item.id
                                                    ? 'Đang xử lý...'
                                                    : 'Nhận task'}
                                            </button>
                                        )}
                                        {item.status === 'IN_PROGRESS' && isMyTask(item) && (
                                            <button
                                                type="button"
                                                onClick={(e) => handleRelease(e, item)}
                                                disabled={!!actingId}
                                                className="rounded bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-300 disabled:opacity-50"
                                            >
                                                {actingId === item.id
                                                    ? 'Đang xử lý...'
                                                    : 'Trả lại'}
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {pagination.totalPages > 1 && (
                <p className="mt-4 text-sm text-slate-500">
                    Trang {pagination.page} / {pagination.totalPages} — Tổng{' '}
                    {pagination.total} mục
                </p>
            )}

            {/* Lịch sử thao tác Queue */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
                <button
                    type="button"
                    onClick={() => setActivityExpanded((v) => !v)}
                    className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                            <svg
                                className="h-5 w-5 text-slate-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Lịch sử thao tác Queue
                            </h2>
                            <p className="text-sm text-slate-500">
                                Theo dõi ai nhận task, ai trả task — minh bạch, tránh lạm dụng
                            </p>
                        </div>
                        {activityPagination.total > 0 && (
                            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                                {activityPagination.total} bản ghi
                            </span>
                        )}
                    </div>
                    <svg
                        className={`h-5 w-5 text-slate-400 transition ${activityExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                        />
                    </svg>
                </button>

                {activityExpanded && (
                    <div className="border-t border-slate-100 px-5 pb-5 pt-2">
                        <div className="mb-3 flex items-center gap-2">
                            <select
                                value={activityActionFilter}
                                onChange={(e) =>
                                    setActivityActionFilter(
                                        e.target.value as 'CLAIM' | 'RELEASE' | ''
                                    )
                                }
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                            >
                                <option value="">Tất cả hành động</option>
                                <option value="CLAIM">Nhận task</option>
                                <option value="RELEASE">Trả task</option>
                            </select>
                            <button
                                type="button"
                                onClick={() => void loadActivity()}
                                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
                            >
                                Làm mới
                            </button>
                        </div>
                        {activityLoading ? (
                            <p className="py-8 text-center text-sm text-slate-500">
                                Đang tải lịch sử...
                            </p>
                        ) : activityItems.length === 0 ? (
                            <p className="py-8 text-center text-sm text-slate-500">
                                Chưa có thao tác claim/release nào.
                            </p>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-slate-100">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-600">
                                                Thời gian
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-600">
                                                Người thao tác
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-600">
                                                Hành động
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-600">
                                                Nội dung
                                            </th>
                                            <th className="px-4 py-2.5 text-left text-xs font-medium text-slate-600">
                                                Chi tiết
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {activityItems.map((act) => (
                                            <tr
                                                key={act.id}
                                                className="cursor-pointer transition hover:bg-slate-50"
                                                onClick={() => setSelectedActivity(act)}
                                            >
                                                <td className="px-4 py-2.5 text-slate-600">
                                                    {formatDateTime(act.created_at)}
                                                </td>
                                                <td className="px-4 py-2.5 font-medium text-slate-800">
                                                    {act.moderator_name}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span
                                                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                                                            act.action === 'CLAIM'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}
                                                    >
                                                        {act.action === 'CLAIM'
                                                            ? 'Nhận task'
                                                            : 'Trả task'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-slate-600">
                                                    {TARGET_TYPE_LABELS[act.queue_target_type] ??
                                                        act.queue_target_type}{' '}
                                                    <span className="font-mono text-xs">
                                                        {act.queue_target_id?.slice(0, 8)}...
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="text-slate-400">
                                                        {act.previous_status} → {act.new_status}
                                                    </span>
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

            {/* Modal chi tiết thao tác */}
            {selectedActivity && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    onClick={() => setSelectedActivity(null)}
                    role="dialog"
                    aria-modal
                >
                    <div
                        className="max-h-[90vh] w-full max-w-md overflow-auto rounded-xl bg-white p-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-semibold text-slate-900">
                                Chi tiết thao tác
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSelectedActivity(null)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                            >
                                <svg
                                    className="h-5 w-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <dl className="space-y-3 text-sm">
                            <div>
                                <dt className="text-slate-500">Thời gian</dt>
                                <dd className="font-medium text-slate-900">
                                    {formatDateTime(selectedActivity.created_at)}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Người thao tác</dt>
                                <dd className="font-medium text-slate-900">
                                    {selectedActivity.moderator_name}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Hành động</dt>
                                <dd>
                                    <span
                                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                                            selectedActivity.action === 'CLAIM'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                    >
                                        {selectedActivity.action === 'CLAIM'
                                            ? 'Nhận task'
                                            : 'Trả task'}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Trạng thái</dt>
                                <dd className="text-slate-700">
                                    {selectedActivity.previous_status} →{' '}
                                    {selectedActivity.new_status}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Loại nội dung</dt>
                                <dd className="text-slate-700">
                                    {TARGET_TYPE_LABELS[selectedActivity.queue_target_type] ??
                                        selectedActivity.queue_target_type}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">ID nội dung</dt>
                                <dd className="font-mono text-xs text-slate-700">
                                    {selectedActivity.queue_target_id}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Danh mục</dt>
                                <dd className="text-slate-700">
                                    {CATEGORY_OPTIONS.find(
                                        (o) => o.value === selectedActivity.queue_category
                                    )?.label ?? selectedActivity.queue_category}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-slate-500">Queue item ID</dt>
                                <dd className="font-mono text-xs text-slate-500">
                                    {selectedActivity.queue_item_id}
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            )}
        </section>
    );
}
