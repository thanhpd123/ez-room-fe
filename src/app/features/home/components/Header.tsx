import { Link, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, BookOpen, LogIn, Heart, LogOut, User } from 'lucide-react';
import { useFavorites } from '@/app/context/FavoritesContext';
import { useAuth } from '@/app/context/AuthContext';

interface HeaderProps {
    onLogin?: () => void;
    onRegister?: () => void;
}

export function Header({ onLogin, onRegister }: HeaderProps) {
    const navigate = useNavigate();
    const { favorites } = useFavorites();
    const { user, signOut } = useAuth();

    const handleLogin = () => {
        if (onLogin) onLogin();
        else navigate('/login');
    };

    const handleRegister = () => {
        if (onRegister) onRegister();
        else navigate('/register');
    };

    return (
        <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/home" className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                            <HomeIcon className="w-5 h-5 text-primary-foreground" strokeWidth={2} />
                        </div>
                        <span className="font-heading font-bold text-xl text-primary">EzRoom</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/home" className="text-foreground hover:text-primary transition-colors font-medium">
                            Trang chủ
                        </Link>
                        <Link to="/roommate" className="text-muted-foreground hover:text-primary transition-colors">
                            Tìm bạn ở ghép
                        </Link>
                        {user?.role === 'LANDLORD' && (
                            <Link to="/rental-management" className="text-muted-foreground hover:text-primary transition-colors">
                                Quản lý cho thuê
                            </Link>
                        )}
                        <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                            <BookOpen className="w-4 h-4" strokeWidth={2} />
                            Blog
                        </Link>
                    </nav>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => navigate('/favorites')}
                            className="relative p-2.5 rounded-xl hover:bg-muted transition-colors group text-foreground hover:text-accent"
                            title="Phòng yêu thích"
                        >
                            <Heart className="w-5 h-5" strokeWidth={2} />
                            {favorites.length > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 min-w-[1.25rem] h-5 px-1 bg-accent text-accent-foreground text-xs rounded-full flex items-center justify-center font-semibold">
                                    {favorites.length}
                                </span>
                            )}
                        </button>

                        {user ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/profile"
                                    className="hidden sm:flex items-center gap-2 text-foreground text-sm max-w-[140px] truncate hover:opacity-90"
                                >
                                    {user.avatarUrl ? (
                                        <img
                                            src={user.avatarUrl}
                                            alt=""
                                            className="w-8 h-8 rounded-full object-cover ring-2 ring-border"
                                        />
                                    ) : (
                                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <User className="w-4 h-4 text-primary" strokeWidth={2} />
                                        </span>
                                    )}
                                    {user.fullName || user.email}
                                </Link>
                                <Link
                                    to="/profile"
                                    className="sm:hidden p-2.5 rounded-xl hover:bg-muted text-foreground"
                                    title="Tài khoản"
                                >
                                    <User className="w-5 h-5" strokeWidth={2} />
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => signOut()}
                                    className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors text-sm font-medium"
                                    title="Đăng xuất"
                                >
                                    <LogOut className="w-4 h-4" strokeWidth={2} />
                                    <span className="hidden sm:inline">Đăng xuất</span>
                                </button>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={handleLogin}
                                    className="hidden sm:flex items-center gap-2 px-4 py-2.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition-colors font-medium text-sm"
                                >
                                    <LogIn className="w-4 h-4" strokeWidth={2} />
                                    Đăng nhập
                                </button>
                                <button
                                    onClick={handleRegister}
                                    className="hidden sm:block px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm hover:bg-primary/90 shadow-sm transition-all"
                                >
                                    Đăng ký
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}