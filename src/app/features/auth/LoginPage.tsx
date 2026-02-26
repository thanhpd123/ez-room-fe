import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, Home } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, signInWithGoogle, signInWithFacebook, signInWithEmail, isLoading } = useAuth();
    const justRegistered = (location.state as { registered?: boolean })?.registered === true;

    const [form, setForm] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success] = useState<string | null>(
        justRegistered ? 'Đăng ký thành công! Bạn có thể đăng nhập ngay.' : null,
    );

    useEffect(() => {
        if (!isLoading && user) {
            const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
            navigate(from || '/home', { replace: true });
        }
    }, [user, isLoading, navigate, location.state]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitLoading(true);
        try {
            await signInWithEmail(form.email.trim(), form.password);
            const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
            navigate(from || '/home', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError(null);
        try {
            await signInWithGoogle();
        } catch (err) {
            console.error('Google sign-in error:', err);
            setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
        }
    };

    const handleFacebookLogin = async () => {
        setError(null);
        try {
            await signInWithFacebook();
        } catch (err) {
            console.error('Facebook sign-in error:', err);
            setError('Đăng nhập Facebook thất bại. Vui lòng thử lại.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
            <div className="w-full max-w-md">
                <div className="bg-card rounded-2xl shadow-sm border border-border px-8 py-10">
                    <div className="flex justify-center mb-8">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-sm">
                            <Home className="w-7 h-7 text-primary-foreground" strokeWidth={2} />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-heading font-bold text-foreground">Đăng nhập</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Chào mừng bạn đến với EzRoom</p>
                    </div>

                    {success && (
                        <div className="mb-5 p-4 bg-primary/5 border border-primary/20 rounded-xl text-primary text-sm font-medium">
                            {success}
                        </div>
                    )}

                    {error && (
                        <div className="mb-5 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm font-medium" role="alert">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" strokeWidth={2} />
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="your.email@example.com"
                                    className="w-full pl-11 pr-4 py-3.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" strokeWidth={2} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-11 py-3.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    required
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
                                </button>
                            </div>
                            <div className="text-right mt-1.5">
                                <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline">
                                    Quên mật khẩu?
                                </Link>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitLoading || isLoading}
                            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {submitLoading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                            {submitLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-8">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">hoặc</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none font-medium text-foreground"
                    >
                        <GoogleIcon className="w-5 h-5" />
                        Đăng nhập với Google
                    </button>

                    <button
                        type="button"
                        onClick={handleFacebookLogin}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none font-medium text-foreground mt-3"
                    >
                        <FacebookIcon className="w-5 h-5" />
                        Đăng nhập với Facebook
                    </button>

                    <p className="text-center text-sm text-muted-foreground mt-8">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="text-primary font-semibold hover:underline">
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-10">
                    © 2026 EzRoom - Smart Renting Room System
                </p>
            </div>
        </div>
    );
}

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
            />
            <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
            />
            <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
            />
            <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
            />
        </svg>
    );
}

function FacebookIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    );
}
