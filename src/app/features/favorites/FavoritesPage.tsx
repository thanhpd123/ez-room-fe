import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Trash2, MapPin, Maximize } from 'lucide-react';
import { useFavorites } from '@/app/context/FavoritesContext';

export function FavoritesPage() {
    const navigate = useNavigate();
    const { favorites, removeFavorite } = useFavorites();

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>Quay lại</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                            <span className="font-medium text-foreground">{favorites.length} phòng đã lưu</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Phòng trọ yêu thích</h1>
                    <p className="text-foreground/70">
                        Danh sách các phòng trọ bạn đã lưu để xem lại sau
                    </p>
                </div>

                {/* Tips Section */}
                {favorites.length > 0 && (
                    <div className="mb-8 bg-red-50 rounded-xl border border-red-200 p-6">
                        <div className="flex items-start gap-3">
                            <Heart className="w-5 h-5 text-red-500 fill-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-red-600 mb-1">Mẹo sử dụng</p>
                                <p className="text-sm text-foreground/80">
                                    Lưu các phòng trọ yêu thích để so sánh và xem lại sau. Bạn có thể xóa bất kỳ phòng nào khỏi danh sách bằng cách nhấn vào icon thùng rác.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Saved Rooms List */}
                {favorites.length > 0 ? (
                    <div className="space-y-4">
                        {favorites.map((room) => (
                            <div
                                key={room.id}
                                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-border overflow-hidden"
                            >
                                <div className="flex flex-col md:flex-row gap-4 p-4">
                                    {/* Image */}
                                    <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0 rounded-lg overflow-hidden">
                                        <img
                                            src={room.image}
                                            alt={room.name}
                                            className="w-full h-full object-cover"
                                        />
                                        {!room.available && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="bg-white text-foreground px-4 py-2 rounded-lg font-medium text-sm">
                                                    Đã cho thuê
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div>
                                            <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                                                {room.name}
                                            </h3>

                                            <div className="flex items-start gap-2 text-foreground/70 text-sm mb-4">
                                                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                <p className="line-clamp-2">{room.address}</p>
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-foreground/70 mb-4">
                                                <span className="flex items-center gap-1">
                                                    <Maximize className="w-4 h-4" />
                                                    {room.area}m²
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between gap-4 pt-2">
                                            <div>
                                                <p className="text-2xl font-semibold text-primary">
                                                    {(room.price / 1000000).toFixed(1)}M
                                                </p>
                                                <p className="text-sm text-foreground/70">/tháng</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => removeFavorite(room.id)}
                                                    className="p-2 rounded-lg border border-border hover:border-red-500 hover:bg-red-50 transition-colors group"
                                                    title="Xóa khỏi danh sách yêu thích"
                                                >
                                                    <Trash2 className="w-5 h-5 text-foreground/70 group-hover:text-red-500 transition-colors" />
                                                </button>
                                                <button
                                                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors whitespace-nowrap font-medium"
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
                            <Heart className="w-10 h-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            Chưa có phòng yêu thích
                        </h3>
                        <p className="text-foreground/70 max-w-md mx-auto mb-6">
                            Bạn chưa lưu phòng trọ nào. Hãy tìm kiếm và nhấn vào icon trái tim để lưu những phòng bạn thích!
                        </p>
                        <button
                            onClick={() => navigate('/search')}
                            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium"
                        >
                            Khám phá phòng trọ
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default FavoritesPage;
