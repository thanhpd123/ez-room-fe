import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, User, Mail, Phone, Lock, Eye, EyeOff, Loader2, Sparkles, Check, Circle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@/app/context/AuthContext';
import { suggestPasswordRequest } from '@/lib/api';

const getApiUrl = () => (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');

function passwordRequirements(pwd: string) {
    return {
        length: pwd.length >= 8,
        upper: /[A-Z]/.test(pwd),
        number: /[0-9]/.test(pwd),
        special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
    };
}

export function RegisterPage() {
    const navigate = useNavigate();
    const { user, signInWithGoogle, signInWithFacebook, isLoading } = useAuth();
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'TENANT' as 'TENANT' | 'LANDLORD',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [suggestLoading, setSuggestLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<string[]>([]);
    const pwdReqs = passwordRequirements(form.password);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const name = e.target.name;
        const value = e.target.type === 'select-one' ? (e.target as HTMLSelectElement).value : e.target.value;
        setForm((f) => ({ ...f, [name]: name === 'role' ? value : value }));
        setError(null);
        setFieldErrors([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setFieldErrors([]);
        setLoading(true);

        try {
            const payload = {
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || undefined,
                password: form.password,
                confirmPassword: form.confirmPassword,
                role: form.role,
            };
            const res = await axios.post(`${getApiUrl()}/auth/register`, payload, {
                timeout: 15000,
                headers: { 'Content-Type': 'application/json' },
                validateStatus: () => true,
            });
            if (res.status >= 200 && res.status < 300 && res.data?.success) {
                navigate('/login', { state: { registered: true } });
                return;
            }
            const data = res.data || {};
            const errMsg = data.error || data.message || 'Đăng ký thất bại';
            setError(errMsg);
            if (Array.isArray(data.errors)) setFieldErrors(data.errors);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                if (err.response?.data) {
                    const data = err.response.data;
                    setError(data.message || 'Đăng ký thất bại');
                    if (Array.isArray(data.errors)) setFieldErrors(data.errors);
                } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
                    setError('Không thể kết nối đến server. Kiểm tra backend đang chạy và CORS.');
                } else {
                    setError(err.message || 'Đăng ký thất bại');
                }
            } else {
                setError('Đã xảy ra lỗi. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Redirect to home when signed in via OAuth (Google/Facebook)
    useEffect(() => {
        if (!isLoading && user) {
            navigate('/home', { replace: true });
        }
    }, [user, isLoading, navigate]);

    const handleGoogleRegister = () => {
        setError(null);
        setFieldErrors([]);
        signInWithGoogle().catch((err) => {
            console.error('Google sign-up error:', err);
            setError('Đăng ký với Google thất bại. Vui lòng thử lại.');
        });
    };

    const handleFacebookRegister = () => {
        setError(null);
        setFieldErrors([]);
        signInWithFacebook().catch((err) => {
            console.error('Facebook sign-up error:', err);
            setError('Đăng ký với Facebook thất bại. Vui lòng thử lại.');
        });
    };

    const handleSuggestPassword = async () => {
        setSuggestLoading(true);
        setError(null);
        try {
            const { suggestedPassword } = await suggestPasswordRequest();
            setForm((f) => ({ ...f, password: suggestedPassword, confirmPassword: suggestedPassword }));
        } catch {
            setError('Không thể tạo mật khẩu gợi ý. Thử lại sau.');
        } finally {
            setSuggestLoading(false);
        }
    };

    const inputClass =
        'w-full pl-11 pr-4 py-3.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
    const inputClassWithRight = 'w-full pl-11 pr-11 py-3.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
    const iconClass = 'absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground';
    const toggleClass = 'absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors';

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
                        <h1 className="text-2xl font-heading font-bold text-foreground">Đăng ký</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Tạo tài khoản mới để bắt đầu</p>
                    </div>

                    {error && (
                        <div className="mb-5 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                            <p className="font-medium">{error}</p>
                            {fieldErrors.length > 0 && (
                                <ul className="mt-2 list-disc list-inside text-xs">
                                    {fieldErrors.map((e, i) => <li key={i}>{e}</li>)}
                                </ul>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Họ và tên</label>
                            <div className="relative">
                                <User className={iconClass} strokeWidth={2} />
                                <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="Nguyễn Văn A" className={inputClass} required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className={iconClass} strokeWidth={2} />
                                <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="your.email@example.com" className={inputClass} required />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Vai trò</label>
                            <select
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                className="w-full px-4 py-3.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option value="TENANT">Người thuê phòng (Tenant)</option>
                                <option value="LANDLORD">Chủ nhà / Cho thuê (Landlord)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Số điện thoại</label>
                            <div className="relative">
                                <Phone className={iconClass} strokeWidth={2} />
                                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="0123456789" className={inputClass} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                <label className="block text-sm font-medium text-foreground">Mật khẩu</label>
                                <button
                                    type="button"
                                    onClick={handleSuggestPassword}
                                    disabled={suggestLoading}
                                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:opacity-50"
                                >
                                    {suggestLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    Gợi ý mật khẩu mạnh
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className={iconClass} strokeWidth={2} />
                                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} placeholder="••••••••" className={inputClassWithRight} required minLength={8} />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className={toggleClass} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                                    {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
                                </button>
                            </div>
                            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                <li className={pwdReqs.length ? 'text-primary' : ''}>
                                    {pwdReqs.length ? <Check className="w-3.5 h-3.5 inline mr-1.5 text-primary" /> : <Circle className="w-3.5 h-3.5 inline mr-1.5 opacity-50" />}
                                    Ít nhất 8 ký tự
                                </li>
                                <li className={pwdReqs.upper ? 'text-primary' : ''}>
                                    {pwdReqs.upper ? <Check className="w-3.5 h-3.5 inline mr-1.5 text-primary" /> : <Circle className="w-3.5 h-3.5 inline mr-1.5 opacity-50" />}
                                    Ít nhất 1 chữ in hoa
                                </li>
                                <li className={pwdReqs.number ? 'text-primary' : ''}>
                                    {pwdReqs.number ? <Check className="w-3.5 h-3.5 inline mr-1.5 text-primary" /> : <Circle className="w-3.5 h-3.5 inline mr-1.5 opacity-50" />}
                                    Ít nhất 1 chữ số
                                </li>
                                <li className={pwdReqs.special ? 'text-primary' : ''}>
                                    {pwdReqs.special ? <Check className="w-3.5 h-3.5 inline mr-1.5 text-primary" /> : <Circle className="w-3.5 h-3.5 inline mr-1.5 opacity-50" />}
                                    Ít nhất 1 ký tự đặc biệt (!@#$%^&*...)
                                </li>
                            </ul>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Xác nhận mật khẩu</label>
                            <div className="relative">
                                <Lock className={iconClass} strokeWidth={2} />
                                <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="••••••••" className={inputClassWithRight} required />
                                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className={toggleClass} aria-label={showConfirm ? 'Ẩn' : 'Hiện'}>
                                    {showConfirm ? <EyeOff className="w-5 h-5" strokeWidth={2} /> : <Eye className="w-5 h-5" strokeWidth={2} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                            {loading ? 'Đang xử lý...' : 'Đăng ký'}
                        </button>
                    </form>

                    <div className="flex items-center gap-3 my-8">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground">hoặc</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleRegister}
                        disabled={isLoading}
                        className="w-full py-3.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Đăng ký với Google
                    </button>

                    <button
                        type="button"
                        onClick={handleFacebookRegister}
                        disabled={isLoading}
                        className="w-full py-3.5 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 mt-3"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Đăng ký với Facebook
                    </button>

                    <p className="text-center text-sm text-muted-foreground mt-8">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-primary font-semibold hover:underline">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
