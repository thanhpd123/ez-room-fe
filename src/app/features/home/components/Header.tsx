import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HomeOutlined, BookOutlined, LoginOutlined, HeartOutlined, LogoutOutlined, UserOutlined, GlobalOutlined, MenuOutlined, MessageOutlined, WalletOutlined } from '@ant-design/icons';
import { Button, Avatar, Badge, Dropdown, Drawer } from 'antd';
import type { MenuProps } from 'antd';
import { useFavorites } from '@/app/context/FavoritesContext';
import { useAuth } from '@/app/context/AuthContext';
import { useChatBox } from '@/app/context/ChatBoxContext';
import { supportedLngs, type SupportedLang } from '@/i18n';
import { trackEvent } from '@/lib/analytics';

interface HeaderProps {
    onLogin?: () => void;
    onRegister?: () => void;
}

const langLabels: Record<SupportedLang, string> = { en: 'English', vi: 'Tiếng Việt' };

export function Header({ onLogin, onRegister }: HeaderProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { favorites } = useFavorites();
    const { user, signOut } = useAuth();
    const chatBox = useChatBox();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const showVipCta =
        user != null &&
        (user.role === 'TENANT' || user.role === 'LANDLORD') &&
        user.isVip !== true;

    const navLink = (to: string, label: string, icon?: React.ReactNode) => {
        const isActive = location.pathname === to || (to === '/home' && location.pathname === '/') || (to !== '/home' && location.pathname.startsWith(to));
        return (
            <Link
                to={to}
                className={`relative py-2 transition-colors font-medium no-underline after:absolute after:bottom-0 after:left-0 after:h-0.5 after:rounded-full after:bg-primary after:transition-all after:duration-200 ${isActive ? 'text-primary after:w-full' : 'text-muted-foreground hover:text-primary after:w-0 hover:after:w-full'
                    } flex items-center gap-1.5`}
            >
                {icon}
                {label}
            </Link>
        );
    };

    const langMenuItems: MenuProps['items'] = supportedLngs.map((lng) => ({
        key: lng,
        label: langLabels[lng],
        onClick: () => i18n.changeLanguage(lng),
    }));

    const handleLogin = () => {
        setMobileMenuOpen(false);
        if (onLogin) onLogin();
        else navigate('/login');
    };

    const handleRegister = () => {
        setMobileMenuOpen(false);
        if (onRegister) onRegister();
        else navigate('/register');
    };

    const navLinkClass = "block py-3 text-foreground hover:text-primary transition-colors font-medium no-underline border-b border-border hover:bg-muted/50 -mx-4 px-4 rounded-lg last:border-0";

    return (
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm safe-area-inset-top">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-14 sm:h-16">
                    <Link to="/home" className="flex items-center gap-2 no-underline min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm shrink-0">
                            <HomeOutlined className="text-white text-base sm:text-lg" />
                        </div>
                        <span className="font-heading font-bold text-lg sm:text-xl text-primary truncate">EzRoom</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                        {navLink('/home', t('nav.home'))}
                        {navLink('/roommate', t('nav.findRoommate'))}
                        {showVipCta && (
                            <Link
                                to="/vip-plans?source=header"
                                onClick={() => trackEvent('vip_cta_clicked', { source: 'header_desktop' })}
                                className="relative py-2 transition-colors font-medium no-underline after:absolute after:bottom-0 after:left-0 after:h-0.5 after:rounded-full after:bg-primary after:transition-all after:duration-200 text-muted-foreground hover:text-primary after:w-0 hover:after:w-full flex items-center gap-1.5"
                            >
                                VIP
                            </Link>
                        )}
                        {user?.role === 'LANDLORD' && navLink('/rental-management', t('nav.rentalManagement'))}
                        {navLink('/blog', t('nav.blog'), <BookOutlined className="text-sm" />)}
                    </nav>

                    <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0">
                        <Button
                            type="text"
                            icon={<MenuOutlined className="text-xl" />}
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden p-2 -mr-1 text-foreground hover:text-primary touch-manipulation"
                            aria-label={t('nav.menu') || 'Menu'}
                        />
                        <Dropdown menu={{ items: langMenuItems }} placement="bottomRight" trigger={['click']}>
                            <Button type="text" icon={<GlobalOutlined className="text-base sm:text-lg" />} className="text-foreground hover:text-primary p-2 sm:px-2 touch-manipulation" title={langLabels[i18n.language as SupportedLang] ?? 'Language'} />
                        </Dropdown>
                        <Badge count={favorites.length} size="small" offset={[-2, 2]}>
                            <Button
                                type="text"
                                icon={<HeartOutlined className="text-base sm:text-lg" />}
                                onClick={() => navigate('/favorites')}
                                className="flex items-center justify-center text-foreground hover:text-accent p-2 sm:px-2 touch-manipulation"
                                title={t('nav.favorites')}
                            />
                        </Badge>
                        {user && (
                            <Button
                                type="text"
                                icon={<MessageOutlined className="text-base sm:text-lg" />}
                                onClick={() => (chatBox ? chatBox.openChat() : navigate('/chat'))}
                                className="flex items-center justify-center text-foreground hover:text-primary p-2 sm:px-2 touch-manipulation"
                                title={t('nav.chat', 'Tin nhắn')}
                            />
                        )}
                        {user && (
                            <Button
                                type="text"
                                icon={<WalletOutlined className="text-base sm:text-lg" />}
                                onClick={() => navigate('/wallet')}
                                className="flex items-center justify-center text-foreground hover:text-primary p-2 sm:px-2 touch-manipulation"
                                title="Ví tiền"
                            />
                        )}

                        {user ? (
                            <div className="flex items-center gap-1 sm:gap-2">
                                <Link to="/profile" className="hidden sm:flex items-center gap-2 text-foreground text-sm max-w-35 truncate hover:opacity-90 no-underline">
                                    {user.avatarUrl ? (
                                        <Avatar src={user.avatarUrl} size={32} className="ring-2 ring-border" />
                                    ) : (
                                        <Avatar icon={<UserOutlined />} size={32} className="bg-primary/10 text-primary" />
                                    )}
                                    <span className="truncate">{user.fullName || user.email}</span>
                                </Link>
                                <Link to="/profile" className="sm:hidden" title={t('nav.account')}>
                                    <Button type="text" icon={<UserOutlined />} className="text-foreground p-2 touch-manipulation" />
                                </Link>
                                <Button type="text" icon={<LogoutOutlined />} onClick={() => signOut()} className="text-muted-foreground hover:text-foreground hidden sm:inline-flex items-center gap-2 p-2 touch-manipulation" title={t('nav.logout')}>
                                    <span className="hidden sm:inline">{t('nav.logout')}</span>
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Button type="text" onClick={handleLogin} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground p-2 sm:px-3 touch-manipulation" icon={<LoginOutlined />}>
                                    <span className="hidden sm:inline">{t('nav.login')}</span>
                                </Button>
                                <Button type="primary" onClick={handleRegister} size="middle" className="rounded-xl px-4 touch-manipulation min-h-9 sm:min-h-10 shadow-sm hover:shadow">
                                    {t('nav.register')}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Drawer
                open={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                placement="right"
                size={320}
                className="md:hidden [&_.ant-drawer-header]:border-b [&_.ant-drawer-body]:p-4"
                title={<span className="font-heading font-bold text-primary">EzRoom</span>}
            >
                <nav className="flex flex-col">
                    <Link to="/home" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                        {t('nav.home')}
                    </Link>
                    <Link to="/roommate" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                        {t('nav.findRoommate')}
                    </Link>
                    {showVipCta && (
                        <Link
                            to="/vip-plans?source=header"
                            className={navLinkClass}
                            onClick={() => {
                                trackEvent('vip_cta_clicked', { source: 'header_mobile' });
                                setMobileMenuOpen(false);
                            }}
                        >
                            VIP
                        </Link>
                    )}
                    {user?.role === 'LANDLORD' && (
                        <Link to="/rental-management" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                            {t('nav.rentalManagement')}
                        </Link>
                    )}
                    <Link to="/blog" className={`${navLinkClass} flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
                        <BookOutlined />
                        {t('nav.blog')}
                    </Link>
                    <div className="border-t border-border pt-4 mt-4 flex flex-col gap-3">
                        {!user ? (
                            <>
                                <Button type="default" block size="large" onClick={handleLogin} icon={<LoginOutlined />} className="rounded-xl min-h-12">
                                    {t('nav.login')}
                                </Button>
                                <Button type="primary" block size="large" onClick={handleRegister} className="rounded-xl min-h-12">
                                    {t('nav.register')}
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    type="default"
                                    block
                                    size="large"
                                    icon={<MessageOutlined />}
                                    className="rounded-xl min-h-12"
                                    onClick={() => { setMobileMenuOpen(false); chatBox ? chatBox.openChat() : navigate('/chat'); }}
                                >
                                    {t('nav.chat', 'Tin nhắn')}
                                </Button>
                                <Link to="/wallet" onClick={() => setMobileMenuOpen(false)}>
                                    <Button type="default" block size="large" icon={<WalletOutlined />} className="rounded-xl min-h-12">
                                        Ví tiền
                                    </Button>
                                </Link>
                                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                                    <Button type="default" block size="large" icon={<UserOutlined />} className="rounded-xl min-h-12">
                                        {t('nav.account')}
                                    </Button>
                                </Link>
                                <Button type="default" block size="large" onClick={() => { signOut(); setMobileMenuOpen(false); }} icon={<LogoutOutlined />} className="rounded-xl min-h-12">
                                    {t('nav.logout')}
                                </Button>
                            </>
                        )}
                    </div>
                </nav>
            </Drawer>
        </header>
    );
}
