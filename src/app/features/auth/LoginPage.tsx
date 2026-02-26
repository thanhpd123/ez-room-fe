import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/context/AuthContext';

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, signInWithGoogle, isLoading } = useAuth();
    const [error, setError] = useState<string | null>(null);

    // Redirect when already logged in; after login go back to the page they tried to open
    useEffect(() => {
        if (!isLoading && user) {
            const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
            navigate(from || '/', { replace: true });
        }
    }, [user, isLoading, navigate, location.state]);

    const handleGoogleLogin = async () => {
        setError(null);
        try {
            await signInWithGoogle();
            // Supabase redirects to Google; after success user is redirected back
        } catch (err) {
            console.error('Google sign-in error:', err);
            setError('Đăng nhập thất bại. Vui lòng thử lại.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="text-center mb-8">
                    <h1 className="font-heading font-bold text-2xl text-foreground">Đăng nhập EzRoom</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        Đăng nhập để lưu yêu thích, đặt phòng và tìm bạn ở ghép
                    </p>
                </div>

                {error && (
                    <p className="text-destructive text-sm text-center mb-4" role="alert">
                        {error}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50 disabled:pointer-events-none font-medium text-foreground"
                >
                    <GoogleIcon className="w-5 h-5" />
                    {isLoading ? 'Đang xử lý...' : 'Đăng nhập với Google'}
                </button>

                <p className="text-center text-muted-foreground text-xs mt-6">
                    Bằng việc đăng nhập, bạn đồng ý với điều khoản sử dụng của EzRoom.
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
