import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HomeOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Divider, Form, Input, Typography } from 'antd';
import { useAuth } from '@/app/context/useAuth';
import { getRedirectByRole } from '@/lib/auth/roleRedirect';

const { Title, Paragraph } = Typography;

export function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const { user, signInWithGoogle, signInWithEmail, isLoading } = useAuth();
    const loginState = location.state as { registered?: boolean; postLoginRedirect?: string; from?: { pathname: string } } | null;
    const justRegistered = loginState?.registered === true;

    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form] = Form.useForm();
    const success = justRegistered ? t('auth.registerSuccess') : null;

    useEffect(() => {
        if (!isLoading && user) {
            const from = loginState?.from?.pathname;
            const postLoginRedirect = loginState?.postLoginRedirect;
            const roleDestination = getRedirectByRole(user.role);
            const destination =
                user.role === 'ADMIN'
                    ? roleDestination
                    : from || postLoginRedirect || roleDestination;
            navigate(destination, { replace: true });
        }
    }, [user, isLoading, navigate, loginState]);

    const handleSubmit = async (values: { email: string; password: string }) => {
        setError(null);
        setSubmitLoading(true);
        try {
            await signInWithEmail(values.email.trim(), values.password);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('auth.loginError'));
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
            setError(t('auth.googleError'));
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8 sm:py-12">
            <div className="w-full max-w-md">
                <Card className="rounded-2xl shadow-lg border-border [&_.ant-card-body]:!p-5 sm:[&_.ant-card-body]:!p-8 hover:shadow-xl transition-shadow" styles={{ body: { padding: 0 } }}>
                    <div className="flex justify-center mb-8">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-md ring-4 ring-primary/10">
                            <HomeOutlined className="text-white text-2xl" />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <Title level={3} className="!font-heading !mb-1">{t('auth.login')}</Title>
                        <Paragraph type="secondary" className="!mb-0 text-sm">{t('auth.loginWelcome')}</Paragraph>
                    </div>

                    {success && (
                        <Alert title={success} type="success" showIcon className="mb-5 rounded-xl" />
                    )}

                    {error && (
                        <Alert title={error} type="error" showIcon className="mb-5 rounded-xl" role="alert" />
                    )}

                    <Form
                        form={form}
                        layout="vertical"
                        requiredMark={false}
                        onFinish={handleSubmit}
                        className="space-y-0"
                    >
                        <Form.Item
                            name="email"
                            label={t('auth.email')}
                            rules={[{ required: true, message: t('auth.emailRequired') }, { type: 'email', message: t('auth.emailInvalid') }]}
                        >
                            <Input size="large" placeholder="your.email@example.com" autoComplete="email" className="rounded-xl" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={t('auth.password')}
                            rules={[{ required: true, message: t('auth.passwordRequired') }]}
                            extra={
                                <div className="text-right mt-1.5">
                                    <Link to="/forgot-password" className="text-xs text-primary font-medium hover:underline">
                                        {t('auth.forgotPassword')}
                                    </Link>
                                </div>
                            }
                        >
                            <Input.Password size="large" placeholder="••••••••" autoComplete="current-password" className="rounded-xl" />
                        </Form.Item>

                        <Form.Item className="!mb-0 mt-2">
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                loading={submitLoading || isLoading}
                                block
                                className="rounded-xl font-semibold h-11 sm:h-12 min-h-[44px] touch-manipulation"
                            >
                                {t('auth.submitLogin')}
                            </Button>
                        </Form.Item>
                    </Form>

                    <Divider plain className="my-8">{t('auth.or')}</Divider>

                    <Button
                        size="large"
                        block
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="rounded-xl h-11 sm:h-12 min-h-[44px] flex items-center justify-center gap-3 font-medium touch-manipulation"
                    >
                        <GoogleIcon className="w-5 h-5" />
                        {t('auth.loginWithGoogle')}
                    </Button>

                    <Paragraph className="text-center text-sm text-muted-foreground mt-8 !mb-0">
                        {t('auth.noAccount')}{' '}
                        <Link to="/register" className="text-primary font-semibold hover:underline">
                            {t('auth.registerNow')}
                        </Link>
                    </Paragraph>
                </Card>

                <Paragraph className="text-center text-xs text-muted-foreground mt-10 !mb-0">
                    © 2026 EzRoom - Smart Renting Room System
                </Paragraph>
            </div>
        </div>
    );
}

function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

