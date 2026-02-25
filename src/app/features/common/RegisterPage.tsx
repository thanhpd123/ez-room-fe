import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, User, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function RegisterPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<string[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError(null);
        setFieldErrors([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setFieldErrors([]);
        setLoading(true);

        try {
            const res = await axios.post(`${API_URL}/auth/register`, form);
            if (res.data.success) {
                navigate('/login', { state: { registered: true } });
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err) && err.response?.data) {
                const data = err.response.data;
                setError(data.message || 'Đăng ký thất bại');
                if (data.errors) setFieldErrors(data.errors);
            } else {
                setError('Không thể kết nối đến server');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent/5 via-background to-primary/5 px-4 py-8">
            <div className="w-full max-w-md">
                {/* Card */}
                <div className="bg-card rounded-2xl shadow-xl border border-border/50 px-8 py-10">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center shadow-lg shadow-accent/20">
                            <Home className="w-7 h-7 text-white" />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-foreground font-heading">Đăng ký</h1>
                        <p className="text-foreground/60 mt-1 text-sm">Tạo tài khoản mới để bắt đầu</p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            <p className="font-medium">{error}</p>
                            {fieldErrors.length > 0 && (
                                <ul className="mt-1 list-disc list-inside text-xs">
                                    {fieldErrors.map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full Name */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Họ và tên</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    placeholder="Nguyễn Văn A"
                                    className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="your.email@example.com"
                                    className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Số điện thoại</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="0123456789"
                                    className="w-full pl-11 pr-4 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-11 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Xác nhận mật khẩu</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-11 py-3 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70 transition-colors"
                                >
                                    {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent/90 active:scale-[0.98] transition-all shadow-lg shadow-accent/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {loading ? 'Đang xử lý...' : 'Đăng ký'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-foreground/40">hoặc</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    {/* Google */}
                    <button className="w-full py-3 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted/50 transition-all flex items-center justify-center gap-3">
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Đăng ký với Google
                    </button>

                    {/* Link to login */}
                    <p className="text-center text-sm text-foreground/60 mt-6">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-accent font-semibold hover:underline">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
