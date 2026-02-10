import { NavLink } from 'react-router-dom';
import {
    Building2,
    CirclePlus,
    ChevronLeft,
    ChevronRight,
    LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SidebarProps = {
    open: boolean;
    onToggle: () => void;
    sidebarWidth?: number;
    collapsedWidth?: number;
};

const defaultSidebarWidth = 264;
const defaultCollapsedWidth = 76;

const items = [
    { label: 'Overview', path: '/rental-management', Icon: LayoutDashboard },
    { label: 'View list rental', path: '/rental-management/rentals', Icon: Building2 },
    { label: 'Create rental', path: '/rental-management/rentals/create', Icon: CirclePlus },
] as const;

export default function SidebarRentalManagements({
    open,
    onToggle,
    sidebarWidth = defaultSidebarWidth,
    collapsedWidth = defaultCollapsedWidth,
}: SidebarProps) {
    return (
        <aside
            className="fixed inset-y-0 left-0 z-50 border-r border-slate-200 bg-white pt-16"
            style={{
                width: open ? sidebarWidth : collapsedWidth,
                transition: 'width 220ms ease',
            }}
        >
            <nav className="flex h-full flex-col">
                <ul className="flex-1 space-y-1 p-2">
                    {items.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                end={item.path === '/rental-management'}
                                className={({ isActive }) =>
                                    cn(
                                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition-colors',
                                        'hover:bg-slate-100 hover:text-slate-900',
                                        isActive && 'bg-slate-100 text-slate-900'
                                    )
                                }
                            >
                                <item.Icon className="h-5 w-5 shrink-0" />
                                <span
                                    className={cn(
                                        'whitespace-nowrap transition-opacity',
                                        open ? 'opacity-100' : 'pointer-events-none opacity-0'
                                    )}
                                >
                                    {item.label}
                                </span>
                            </NavLink>
                        </li>
                    ))}
                </ul>

                <div className="border-t border-slate-200 p-2">
                    <button
                        type="button"
                        onClick={onToggle}
                        className="flex w-full items-center justify-center rounded-xl px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        {open ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                    </button>
                </div>
            </nav>
        </aside>
    );
}
