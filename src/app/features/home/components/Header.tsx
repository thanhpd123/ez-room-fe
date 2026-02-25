import { Link, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, BookOpen, LogIn } from 'lucide-react';

export function Header() {
    const navigate = useNavigate();

    return (
        <header className="border-b border-border sticky top-0 z-40 backdrop-blur-sm bg-card/95">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link to="/home" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <HomeIcon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-heading font-bold text-xl text-primary">EzRoom</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <Link to="/home" className="text-foreground hover:text-primary transition-colors font-medium">
                            Trang chủ
                        </Link>
                        <Link to="/roommate" className="text-foreground/70 hover:text-primary transition-colors">
                            Tìm bạn ở ghép
                        </Link>
                        <Link to="/blog" className="text-foreground/70 hover:text-primary transition-colors flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            Blog
                        </Link>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/login')}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 text-foreground/70 hover:text-foreground transition-colors"
                        >
                            <LogIn className="w-4 h-4" />
                            Đăng nhập
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="hidden sm:block px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                            Đăng ký
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
