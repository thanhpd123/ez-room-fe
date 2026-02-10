import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Bell,
    Clock3,
    LogOut,
    Menu,
    Search,
    Settings,
    UserCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type RentalManagementNavbarProps = {
    onToggleDrawer: () => void;
    isSidebarOpen: boolean;
    sidebarWidth?: number;
    collapsedWidth?: number;
    title?: string;
    showSearch?: boolean;
    rightActions?: React.ReactNode;
    showBack?: boolean;
};

function useDesktop(breakpoint = 768) {
    const [isDesktop, setIsDesktop] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        return window.matchMedia(`(min-width: ${breakpoint}px)`).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const media = window.matchMedia(`(min-width: ${breakpoint}px)`);
        const listener = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
        setIsDesktop(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [breakpoint]);

    return isDesktop;
}

function toTitleFromPath(pathname: string) {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length <= 1) return 'Property Management';
    const raw = segments[segments.length - 1].replace(/-/g, ' ');
    return raw.replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function NavbarRentalManagements({
    onToggleDrawer,
    isSidebarOpen,
    sidebarWidth = 264,
    collapsedWidth = 76,
    title,
    showSearch = true,
    rightActions,
    showBack = false,
}: RentalManagementNavbarProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const isDesktop = useDesktop();
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [now, setNow] = useState('');

    useEffect(() => {
        const formatNow = () => {
            const date = new Date();
            const timeText = date.toLocaleTimeString('en-GB', { hour12: false });
            const dateText = date.toLocaleDateString('en-GB');
            setNow(`${timeText} | ${dateText}`);
        };

        formatNow();
        const timer = window.setInterval(formatNow, 1000);
        return () => window.clearInterval(timer);
    }, []);

    const computedTitle = useMemo(() => {
        return title ?? toTitleFromPath(location.pathname);
    }, [location.pathname, title]);

    const leftOffset = isDesktop ? (isSidebarOpen ? sidebarWidth : collapsedWidth) : 0;
    const navbarWidth = isDesktop ? `calc(100% - ${leftOffset}px)` : '100%';

    return (
        <header
            className="fixed top-0 z-40 h-16 border-b border-slate-200 bg-white/95 backdrop-blur"
            style={{
                left: leftOffset,
                width: navbarWidth,
                transition: 'left 220ms ease, width 220ms ease',
            }}
        >
            <div className="flex h-full items-center gap-3 px-4 sm:px-6">
                {showBack ? (
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Back"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                ) : null}

                <button
                    type="button"
                    onClick={onToggleDrawer}
                    className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    <Menu className="h-5 w-5" />
                </button>

                <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{computedTitle}</h1>

                <div className="ml-auto flex items-center gap-2 sm:gap-3">
                    {showSearch ? (
                        <label
                            className={cn(
                                'hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 md:flex',
                                'focus-within:border-slate-300 focus-within:bg-white'
                            )}
                        >
                            <Search className="h-4 w-4 text-slate-500" />
                            <input
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Search..."
                                className="w-40 bg-transparent text-sm text-slate-700 outline-none lg:w-56"
                                aria-label="Search"
                            />
                        </label>
                    ) : null}

                    <span className="hidden items-center gap-1 text-xs text-slate-500 lg:flex">
                        <Clock3 className="h-4 w-4" />
                        {now}
                    </span>

                    <button
                        type="button"
                        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Notifications"
                    >
                        <Bell className="h-5 w-5" />
                    </button>

                    {rightActions}

                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setMenuOpen((prev) => !prev)}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                            aria-label="Profile menu"
                        >
                            <UserCircle2 className="h-6 w-6" />
                        </button>

                        {menuOpen ? (
                            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        navigate('/profile');
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                                >
                                    <Settings className="h-4 w-4" />
                                    Profile
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMenuOpen(false);
                                        navigate('/login');
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </header>
    );
}
