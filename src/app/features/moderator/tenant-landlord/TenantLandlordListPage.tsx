import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/api';

interface UserItem {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    role: string;
    status: string;
    createdAt: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const roleBadge: Record<string, string> = {
    TENANT: 'bg-sky-100 text-sky-700',
    LANDLORD: 'bg-violet-100 text-violet-700',
    MODERATOR: 'bg-amber-100 text-amber-700',
    ADMIN: 'bg-rose-100 text-rose-700',
    GUEST: 'bg-slate-100 text-slate-600',
};

const roleLabel: Record<string, string> = {
    TENANT: 'Người thuê',
    LANDLORD: 'Chủ trọ',
    MODERATOR: 'Moderator',
    ADMIN: 'Admin',
    GUEST: 'Khách',
};

const statusBadge: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700',
    INACTIVE: 'bg-slate-200 text-slate-600',
    SUSPENDED: 'bg-orange-100 text-orange-700',
    BANNED: 'bg-rose-100 text-rose-700',
};

const statusLabel: Record<string, string> = {
    ACTIVE: 'Hoạt động',
    INACTIVE: 'Ngừng hoạt động',
    SUSPENDED: 'Tạm khóa',
    BANNED: 'Bị cấm',
};

function formatDate(dateString?: string) {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

const DEFAULT_AVATAR =
    'https://ui-avatars.com/api/?background=e2e8f0&color=475569&bold=true&size=40';

export function TenantLandlordListPage() {
    const [users, setUsers] = useState<UserItem[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<'all' | 'TENANT' | 'LANDLORD'>('all');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 350);
        return () => clearTimeout(timer);
    }, [search]);

    const loadUsers = async (page = 1) => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', '10');
            if (roleFilter !== 'all') params.set('role', roleFilter);
            if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());

            const res = await authFetch(`/moderator/users?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setUsers(data.data);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error('Failed to load users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadUsers(1);
    }, [roleFilter, debouncedSearch]);

    const goToPage = (page: number) => {
        if (page < 1 || page > pagination.totalPages) return;
        void loadUsers(page);
    };

    return (
        <section className="mx-auto w-full max-w-7xl py-6 px-4">
            <header className="mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">Người thuê / Chủ trọ</h1>
                <p className="mt-1 text-sm text-slate-500">
                    Xem danh sách người thuê và chủ trọ trên hệ thống.
                </p>
            </header>

            {/* ── Filters ── */}
            <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2">
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo tên, email, số điện thoại..."
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as 'all' | 'TENANT' | 'LANDLORD')}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                    <option value="all">Tất cả vai trò</option>
                    <option value="TENANT">Người thuê</option>
                    <option value="LANDLORD">Chủ trọ</option>
                </select>
            </div>

            {/* ── Table ── */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {isLoading ? (
                    <div className="p-6 text-sm text-slate-600">Đang tải danh sách...</div>
                ) : users.length === 0 ? (
                    <div className="p-6 text-sm text-slate-600">Không tìm thấy người dùng nào.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-left">
                                    <th className="px-4 py-3 font-semibold text-slate-700">Người dùng</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Email</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Số điện thoại</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Vai trò</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Trạng thái</th>
                                    <th className="px-4 py-3 font-semibold text-slate-700">Ngày tham gia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="transition hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={user.avatarUrl || `${DEFAULT_AVATAR}&name=${encodeURIComponent(user.fullName)}`}
                                                    alt={user.fullName}
                                                    className="h-9 w-9 rounded-full object-cover bg-slate-100"
                                                />
                                                <span className="font-medium text-slate-900">{user.fullName}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{user.email}</td>
                                        <td className="px-4 py-3 text-slate-600">{user.phone || '--'}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleBadge[user.role] ?? 'bg-slate-100 text-slate-600'}`}
                                            >
                                                {roleLabel[user.role] ?? user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge[user.status] ?? 'bg-slate-100 text-slate-600'}`}
                                            >
                                                {statusLabel[user.status] ?? user.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">{formatDate(user.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* ── Pagination ── */}
                {!isLoading && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                        <p className="text-sm text-slate-600">
                            Hiển thị {(pagination.page - 1) * pagination.limit + 1}–
                            {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} người dùng
                        </p>
                        <div className="flex gap-1">
                            <button
                                type="button"
                                onClick={() => goToPage(pagination.page - 1)}
                                disabled={pagination.page <= 1}
                                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                ← Trước
                            </button>
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                .filter((p) => {
                                    // Show at most 5 surrounding pages
                                    const dist = Math.abs(p - pagination.page);
                                    return dist <= 2 || p === 1 || p === pagination.totalPages;
                                })
                                .map((p, idx, arr) => {
                                    const showEllipsis = idx > 0 && p - arr[idx - 1] > 1;
                                    return (
                                        <span key={p} className="flex items-center">
                                            {showEllipsis && <span className="px-1 text-slate-400">…</span>}
                                            <button
                                                type="button"
                                                onClick={() => goToPage(p)}
                                                className={`min-w-[32px] rounded-lg px-2 py-1.5 text-sm font-medium transition ${p === pagination.page
                                                    ? 'bg-slate-900 text-white'
                                                    : 'text-slate-700 hover:bg-slate-100'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        </span>
                                    );
                                })}
                            <button
                                type="button"
                                onClick={() => goToPage(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages}
                                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                Sau →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
