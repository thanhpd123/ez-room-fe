import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Home, Loader2, ArrowLeft } from 'lucide-react';
import { forgotPasswordRequest } from '@/lib/api';

export function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);
        try {
            const { message } = await forgotPasswordRequest(email);
            setSuccess(message);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-card rounded-2xl shadow-sm border border-border px-8 py-10">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary text-sm font-medium mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
                        Quay lại đăng nhập
                    </Link>

                    <div className="flex justify-center mb-6">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
                            <Home className="w-7 h-7 text-primary-foreground" strokeWidth={2} />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-heading font-bold text-foreground">Quên mật khẩu</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Nhập email đăng ký, chúng tôi sẽ gửi link đặt lại mật khẩu
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium" role="alert">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-5 p-4 bg-primary/5 border border-primary/20 rounded-xl text-primary text-sm font-medium">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" strokeWidth={2} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your.email@example.com"
                                    className="w-full pl-11 pr-4 py-3.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                            {loading ? 'Đang xử lý...' : 'Gửi link đặt lại mật khẩu'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground mt-8">
                        Nhớ mật khẩu?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
