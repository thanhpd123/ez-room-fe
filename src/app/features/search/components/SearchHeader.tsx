import { Link, useNavigate } from 'react-router-dom';
import { Home as HomeIcon, Heart } from 'lucide-react';
import { useFavorites } from '@/app/context/FavoritesContext';

interface SearchHeaderProps {
    title?: string;
    subtitle?: string;
}

export function SearchHeader({
    title = 'Tìm kiếm phòng trọ',
    subtitle = 'Tìm ngôi nhà lý tưởng cho bạn với công nghệ tìm kiếm thông minh',
}: SearchHeaderProps) {
    const navigate = useNavigate();
    const { favorites } = useFavorites();

    return (
        <header className="bg-card shadow-sm border-b sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between mb-4">
                    <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <HomeIcon className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-heading font-bold text-primary">EzRoom</span>
                    </Link>
                    <button
                        onClick={() => navigate('/favorites')}
                        className="relative p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Phòng yêu thích"
                    >
                        <Heart className="w-5 h-5 text-foreground" />
                        {favorites.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                {favorites.length}
                            </span>
                        )}
                    </button>
                </div>
                <h1 className="text-center text-foreground">{title}</h1>
                <p className="text-center text-foreground/60 mt-2">{subtitle}</p>
            </div>
        </header>
    );
}
