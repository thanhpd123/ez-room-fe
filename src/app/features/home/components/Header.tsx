import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HomeOutlined, BookOutlined, AppstoreOutlined, LoginOutlined, HeartOutlined, LogoutOutlined, UserOutlined, GlobalOutlined, MenuOutlined, MessageOutlined, WalletOutlined, BellOutlined, EnvironmentOutlined, TeamOutlined, DollarOutlined } from '@ant-design/icons';
import { Button, Avatar, Badge, Dropdown, Drawer, Modal, Spin } from 'antd';
import type { MenuProps } from 'antd';
import { useFavorites } from '@/app/context/FavoritesContext';
import { useAuth } from '@/app/context/AuthContext';
import { useChatBox } from '@/app/context/ChatBoxContext';
import { supportedLngs, type SupportedLng } from '@/i18n';
import { trackEvent } from '@/lib/analytics';
import {
    getNotificationsRequest,
    getUnreadCountRequest,
    markNotificationReadRequest,
    markAllNotificationsReadRequest,
    getRoomByIdRequest,
    type NotificationItem,
} from '@/lib/api';

interface HeaderProps {
    onLogin?: () => void;
    onRegister?: () => void;
}

const langLabels: Record<SupportedLng, string> = { en: 'English', vi: 'Tiếng Việt' };

/** Format relative time in Vietnamese */
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

/** Parsed room data for modal */
interface RoomPreview {
    id: string;
    name: string;
    price: number;
    area: number;
    maxPeople: number;
    address: string;
    images: string[];
    amenities: string[];
    rentalName: string;
    status: string;
}

function parseRoomPreview(data: Record<string, unknown>): RoomPreview {
    const rental = (data.rental as { title?: string; location?: { address?: string; district?: string; city?: string } }) || {};
    const loc = rental.location;
    const address = loc ? [loc.address, loc.district, loc.city].filter(Boolean).join(', ') : '';
    const images = (data.images as string[]) || [];
    const amenities = Array.isArray(data.amenities)
        ? (data.amenities as { name?: string }[]).map((a) => (a && typeof a === 'object' && 'name' in a ? String(a.name) : '')).filter(Boolean)
        : [];
    return {
        id: String(data.id ?? ''),
        name: String(data.roomName ?? data.title ?? 'Phòng'),
        price: Number(data.price ?? 0),
        area: Number(data.sizeM2 ?? data.area ?? 0),
        maxPeople: Number(data.maxPeople ?? 1),
        address,
        images: images.length > 0 ? images : [],
        amenities,
        rentalName: String(rental.title ?? ''),
        status: String(data.status ?? ''),
    };
}

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

    // Notification state
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingNotifs, setLoadingNotifs] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // Room preview modal state
    const [roomModalOpen, setRoomModalOpen] = useState(false);
    const [roomPreview, setRoomPreview] = useState<RoomPreview | null>(null);
    const [roomLoading, setRoomLoading] = useState(false);

    // Fetch unread count periodically
    const fetchUnreadCount = useCallback(() => {
        if (!user) return;
        getUnreadCountRequest()
            .then((r) => setUnreadCount(r.unreadCount))
            .catch(() => { });
    }, [user]);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    useEffect(() => {
        const onFocus = () => fetchUnreadCount();
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [fetchUnreadCount]);

    // Load notifications when dropdown opens
    const openNotifications = () => {
        setNotifOpen(true);
        setLoadingNotifs(true);
        getNotificationsRequest({ limit: 15 })
            .then((r) => setNotifications(r.data || []))
            .catch(() => setNotifications([]))
            .finally(() => setLoadingNotifs(false));
    };

    const toggleNotifications = () => {
        if (notifOpen) {
            setNotifOpen(false);
        } else {
            openNotifications();
        }
    };

    // Close dropdown on outside click
    useEffect(() => {
        if (!notifOpen) return;
        const handleClick = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setNotifOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [notifOpen]);

    const handleNotifClick = async (notif: NotificationItem) => {
        // Mark as read
        if (notif.status === 'UNREAD') {
            markNotificationReadRequest(notif.id).catch(() => { });
            setNotifications((prev) =>
                prev.map((n) => (n.id === notif.id ? { ...n, status: 'READ' } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        }
        setNotifOpen(false);

        // If ROOMMATE_INVITE with roomId → show room preview modal
        if (notif.roomId && notif.type === 'ROOMMATE_INVITE') {
            setRoomLoading(true);
            setRoomModalOpen(true);
            setRoomPreview(null);
            try {
                const res = await getRoomByIdRequest(notif.roomId);
                setRoomPreview(parseRoomPreview(res.data as Record<string, unknown>));
            } catch {
                setRoomPreview(null);
            } finally {
                setRoomLoading(false);
            }
        } else if (notif.roomId) {
            navigate(`/room/${notif.roomId}`);
        }
    };

    const handleGoToRoomDetail = () => {
        if (roomPreview) {
            setRoomModalOpen(false);
            navigate(`/room/${roomPreview.id}`);
        }
    };

    const handleMarkAllRead = async () => {
        markAllNotificationsReadRequest().catch(() => { });
        setNotifications((prev) => prev.map((n) => ({ ...n, status: 'READ' })));
        setUnreadCount(0);
    };

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
                        {navLink('/rooms', 'Phòng Trọ')}
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
                        {navLink('/browse', t('nav.browse'), <AppstoreOutlined className="text-sm" />)}
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
                            <Button type="text" icon={<GlobalOutlined className="text-base sm:text-lg" />} className="text-foreground hover:text-primary p-2 sm:px-2 touch-manipulation" title={langLabels[i18n.language as SupportedLng] ?? 'Language'} />
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

                        {/* Notification Bell */}
                        {user && (
                            <div className="relative" ref={notifRef}>
                                <Badge count={unreadCount} size="small" offset={[-2, 2]}>
                                    <Button
                                        type="text"
                                        icon={<BellOutlined className="text-base sm:text-lg" />}
                                        onClick={toggleNotifications}
                                        className="flex items-center justify-center text-foreground hover:text-primary p-2 sm:px-2 touch-manipulation"
                                        title="Thông báo"
                                    />
                                </Badge>

                                {/* Notification Dropdown */}
                                {notifOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 flex flex-col">
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                                            <h3 className="font-semibold text-foreground text-sm">🔔 Thông báo</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={handleMarkAllRead}
                                                    className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                                >
                                                    Đọc tất cả
                                                </button>
                                            )}
                                        </div>

                                        <div className="overflow-y-auto flex-1">
                                            {loadingNotifs ? (
                                                <div className="py-12 text-center text-muted-foreground text-sm">
                                                    Đang tải...
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div className="py-12 text-center text-muted-foreground text-sm">
                                                    <BellOutlined className="text-2xl mb-2 opacity-40 block mx-auto" />
                                                    Chưa có thông báo
                                                </div>
                                            ) : (
                                                notifications.map((notif) => (
                                                    <button
                                                        key={notif.id}
                                                        type="button"
                                                        onClick={() => handleNotifClick(notif)}
                                                        className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors flex gap-3 items-start ${notif.status === 'UNREAD' ? 'bg-primary/5' : ''
                                                            }`}
                                                    >
                                                        <div className="pt-1.5 shrink-0">
                                                            {notif.status === 'UNREAD' ? (
                                                                <span className="block w-2.5 h-2.5 rounded-full bg-primary" />
                                                            ) : (
                                                                <span className="block w-2.5 h-2.5 rounded-full bg-transparent" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`text-sm leading-snug ${notif.status === 'UNREAD' ? 'font-semibold text-foreground' : 'text-muted-foreground'
                                                                }`}>
                                                                {notif.title || 'Thông báo'}
                                                            </p>
                                                            {notif.body && (
                                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                                    {notif.body}
                                                                </p>
                                                            )}
                                                            <p className="text-[11px] text-muted-foreground/60 mt-1">
                                                                {timeAgo(notif.createdAt)}
                                                            </p>
                                                            {notif.roomId && notif.type === 'ROOMMATE_INVITE' && (
                                                                <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium mt-1">
                                                                    🏠 Xem thông tin phòng →
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
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

            {/* Room Preview Modal */}
            <Modal
                open={roomModalOpen}
                onCancel={() => setRoomModalOpen(false)}
                footer={null}
                width={520}
                centered
                destroyOnClose
                className="[&_.ant-modal-content]:rounded-2xl [&_.ant-modal-content]:overflow-hidden [&_.ant-modal-content]:p-0 [&_.ant-modal-close]:top-3 [&_.ant-modal-close]:right-3 [&_.ant-modal-close]:z-10"
            >
                {roomLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Spin size="large" />
                    </div>
                ) : roomPreview ? (
                    <div>
                        {/* Image */}
                        {roomPreview.images.length > 0 ? (
                            <div className="relative w-full h-52 overflow-hidden">
                                <img
                                    src={roomPreview.images[0]}
                                    alt={roomPreview.name}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                <div className="absolute bottom-3 left-4 right-4">
                                    <span className="inline-block bg-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                        🏠 Lời mời ở ghép
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-40 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                                <HomeOutlined className="text-5xl text-primary/30" />
                            </div>
                        )}

                        {/* Content */}
                        <div className="p-5">
                            <h3 className="text-lg font-bold text-foreground mb-1">{roomPreview.name}</h3>
                            {roomPreview.rentalName && (
                                <p className="text-sm text-muted-foreground mb-3">{roomPreview.rentalName}</p>
                            )}

                            <div className="space-y-2.5 mb-4">
                                {roomPreview.address && (
                                    <div className="flex items-start gap-2 text-sm">
                                        <EnvironmentOutlined className="text-primary mt-0.5 shrink-0" />
                                        <span className="text-muted-foreground">{roomPreview.address}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-sm">
                                        <DollarOutlined className="text-primary" />
                                        <span className="font-semibold text-foreground">
                                            {roomPreview.price.toLocaleString('vi-VN')} VNĐ/tháng
                                        </span>
                                    </div>
                                    {roomPreview.area > 0 && (
                                        <span className="text-sm text-muted-foreground">
                                            {roomPreview.area} m²
                                        </span>
                                    )}
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <TeamOutlined className="text-primary" />
                                        <span>Tối đa {roomPreview.maxPeople} người</span>
                                    </div>
                                </div>
                            </div>

                            {roomPreview.amenities.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-5">
                                    {roomPreview.amenities.slice(0, 6).map((a) => (
                                        <span key={a} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                                            {a}
                                        </span>
                                    ))}
                                    {roomPreview.amenities.length > 6 && (
                                        <span className="text-xs text-muted-foreground px-2 py-1">
                                            +{roomPreview.amenities.length - 6}
                                        </span>
                                    )}
                                </div>
                            )}

                            <Button
                                type="primary"
                                block
                                size="large"
                                onClick={handleGoToRoomDetail}
                                className="rounded-xl min-h-12 font-semibold text-base shadow-sm hover:shadow-md transition-shadow"
                            >
                                🏠 Xem chi tiết phòng
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-16 text-center text-muted-foreground">
                        <p>Không tìm thấy thông tin phòng</p>
                    </div>
                )}
            </Modal>

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
                    <Link to="/rooms" className={navLinkClass} onClick={() => setMobileMenuOpen(false)}>
                        Tìm phòng
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
                    <Link to="/browse" className={`${navLinkClass} flex items-center gap-2`} onClick={() => setMobileMenuOpen(false)}>
                        <AppstoreOutlined />
                        {t('nav.browse')}
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
