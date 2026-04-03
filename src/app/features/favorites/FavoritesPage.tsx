import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Trash2, MapPin, Maximize } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFavorites } from '@/app/context/FavoritesContext';

export function FavoritesPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { favorites, removeFavorite } = useFavorites();

    return (
        <div className="min-h-screen bg-background">
            <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-foreground hover:text-primary transition-colors font-medium"
                        >
                            <ArrowLeft className="w-5 h-5" strokeWidth={2} />
                            {t('favorites.back')}
                        </button>
                        <div className="flex items-center gap-2">
                            <Heart className="w-5 h-5 text-accent fill-accent" strokeWidth={2} />
                            <span className="font-medium text-foreground">{t('favorites.savedCount', { count: favorites.length })}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="mb-10">
                    <h1 className="font-heading text-3xl font-bold text-foreground mb-2">{t('favorites.title')}</h1>
                    <p className="text-muted-foreground">{t('favorites.subtitle')}</p>
                </div>

                {favorites.length > 0 && (
                    <div className="mb-10 bg-accent/5 rounded-2xl border border-accent/20 p-6">
                        <div className="flex items-start gap-3">
                            <Heart className="w-5 h-5 text-accent fill-accent flex-shrink-0 mt-0.5" strokeWidth={2} />
                            <div>
                                <p className="font-semibold text-foreground mb-1">{t('favorites.tip')}</p>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {t('favorites.tipDesc')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {favorites.length > 0 ? (
                    <div className="space-y-5">
                        {favorites.map((room) => (
                            <div
                                key={room.id}
                                className="bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-border overflow-hidden"
                            >
                                <div className="flex flex-col md:flex-row gap-5 p-5">
                                    <div className="relative w-full md:w-64 h-48 md:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-muted">
                                        <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                                        {!room.available && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <span className="bg-card text-foreground px-4 py-2 rounded-xl font-medium text-sm">
                                                    {t('favorites.rented')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between min-w-0">
                                        <div>
                                            <h3 className="font-heading text-lg font-semibold text-foreground mb-2 line-clamp-2">
                                                {room.name}
                                            </h3>
                                            <div className="flex items-start gap-2 text-muted-foreground text-sm mb-4">
                                                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" strokeWidth={2} />
                                                <p className="line-clamp-2">{room.address}</p>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                                                <span className="flex items-center gap-1">
                                                    <Maximize className="w-4 h-4" strokeWidth={2} />
                                                    {room.area}m²
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between gap-4 pt-2">
                                            <div>
                                                <p className="text-2xl font-bold text-primary">{(room.price / 1000000).toFixed(1)}M</p>
                                                <p className="text-sm text-muted-foreground">{t('favorites.perMonth')}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeFavorite(room.id)}
                                                    className="p-2.5 rounded-xl border border-border hover:border-destructive/50 hover:bg-destructive/5 transition-colors group"
                                                    title={t('favorites.removeTitle')}
                                                >
                                                    <Trash2 className="w-5 h-5 text-muted-foreground group-hover:text-destructive transition-colors" strokeWidth={2} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/room/${room.id}`)}
                                                    className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap shadow-sm"
                                                >
                                                    {t('favorites.viewDetail')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-accent/10 mb-6">
                            <Heart className="w-12 h-12 text-accent" strokeWidth={2} />
                        </div>
                        <h3 className="font-heading text-xl font-bold text-foreground mb-2">{t('favorites.empty')}</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
                            {t('favorites.emptyDesc')}
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/search')}
                            className="px-6 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            {t('favorites.explore')}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

export default FavoritesPage;
