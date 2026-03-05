import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, User, Mail, Phone, Loader2 } from 'lucide-react';
import { registerOAuthRequest } from '@/lib/api';

const PENDING_KEY = 'pendingOAuth';

export function CompleteSignupPage() {
    const navigate = useNavigate();
    const [pending, setPending] = useState<{ email: string; full_name: string; avatar_url: string } | null>(null);
    const [form, setForm] = useState({ fullName: '', phone: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const raw = sessionStorage.getItem(PENDING_KEY);
            if (!raw) {
                navigate('/register', { replace: true });
                return;
            }
            const data = JSON.parse(raw);
            setPending({ email: data.email ?? '', full_name: data.full_name ?? '', avatar_url: data.avatar_url ?? '' });
            setForm((f) => ({ ...f, fullName: data.full_name || f.fullName }));
        } catch {
            navigate('/register', { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pending) return;
        setError(null);
        setLoading(true);
        try {
            await registerOAuthRequest({
                email: pending.email,
                fullName: form.fullName.trim(),
                phone: form.phone.trim() || undefined,
            });
            sessionStorage.removeItem(PENDING_KEY);
            window.location.href = '/home';
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng ký thất bại');
        } finally {
            setLoading(false);
        }
    };

    if (!pending) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-muted-foreground">Đang tải...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-card rounded-2xl shadow-sm border border-border px-8 py-10">
                    <div className="flex justify-center mb-6">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
                            <Home className="w-7 h-7 text-primary-foreground" strokeWidth={2} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-heading font-bold text-foreground text-center mb-2">Hoàn tất đăng ký</h1>
                    <p className="text-muted-foreground text-sm text-center mb-8">
                        Hoàn thiện thông tin để tạo tài khoản EzRoom (mặc định là Tenant)
                    </p>

                    {error && (
                        <div className="mb-5 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                            <div className="flex items-center gap-2 px-4 py-3 bg-muted rounded-xl text-foreground">
                                <Mail className="w-5 h-5 text-muted-foreground" strokeWidth={2} />
                                <span>{pending.email}</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Họ và tên</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" strokeWidth={2} />
                                <input
                                    type="text"
                                    value={form.fullName}
                                    onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full pl-11 pr-4 py-3.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                    minLength={2}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Số điện thoại</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" strokeWidth={2} />
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                                    placeholder="0123456789"
                                    className="w-full pl-11 pr-4 py-3.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                            {loading ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
