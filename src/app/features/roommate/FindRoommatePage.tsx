import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/app/features/home/components';
import { useAuth } from '@/app/context/AuthContext';
import { useChatBox } from '@/app/context/ChatBoxContext';
import { ImageWithFallback } from '@/app/components/ImageWithFallback';
import { RoommateProfileModal } from './RoommateProfileModal';
import {
    Users,
    UserPlus,
    Loader2,
    Check,
    X,
    Sparkles,
    Heart,
    MessageCircle,
    Eye,
} from 'lucide-react';
import {
    getRoommateSuggestionsRequest,
    getRoommateMatchesRequest,
    sendRoommateRequestRequest,
    updateRoommateMatchStatusRequest,
    type RoommateSuggestionItem,
    type RoommateMatchItem,
} from '@/lib/api';

const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';

function LifestyleTags({ item }: { item: RoommateSuggestionItem }) {
    const tags: string[] = [];
    const L = item.lifestyle;
    if (L?.work_from_home) tags.push('Làm việc tại nhà');
    if (L?.smoking === false && L?.drinking === false) tags.push('Không hút thuốc, không rượu');
    else if (L?.smoking === false) tags.push('Không hút thuốc');
    else if (L?.smoking === true) tags.push('Hút thuốc');
    if (L?.pets_allowed) tags.push('Nuôi thú cưng');
    if (L?.sleep_schedule) tags.push(`Ngủ: ${L.sleep_schedule}`);
    if (L?.personalityType) tags.push(L.personalityType);
    if (L?.social_level) tags.push(L.social_level);
    if (item.preference?.preferred_districts?.length) {
        tags.push(item.preference.preferred_districts.slice(0, 2).join(', '));
    }
    if (tags.length === 0) return null;
    return (
        <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.slice(0, 5).map((t) => (
                <span
                    key={t}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                >
                    {t}
                </span>
            ))}
        </div>
    );
}

export function FindRoommatePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const chatBox = useChatBox();
    const [suggestions, setSuggestions] = useState<RoommateSuggestionItem[]>([]);
    const [matches, setMatches] = useState<RoommateMatchItem[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [sendingId, setSendingId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [viewingProfile, setViewingProfile] = useState<{ userId: string; matchScore?: number } | null>(null);

    const hasGender = user?.gender && String(user.gender).trim() && String(user.gender).toLowerCase() !== 'không tiết lộ';

    const loadSuggestions = () => {
        setLoadingSuggestions(true);
        getRoommateSuggestionsRequest(24)
            .then((r) => setSuggestions(r.data || []))
            .catch(() => setSuggestions([]))
            .finally(() => setLoadingSuggestions(false));
    };

    const loadMatches = () => {
        setLoadingMatches(true);
        getRoommateMatchesRequest()
            .then((r) => setMatches(r.data || []))
            .catch(() => setMatches([]))
            .finally(() => setLoadingMatches(false));
    };

    useEffect(() => {
        loadSuggestions();
    }, [user?.id]);

    useEffect(() => {
        loadMatches();
    }, []);

    const handleSendRequest = (targetId: string) => {
        setSendingId(targetId);
        setMessage(null);
        sendRoommateRequestRequest(targetId)
            .then(() => {
                setSuggestions((prev) => prev.filter((s) => s.user.id !== targetId));
                loadMatches();
            })
            .catch((e) => setMessage(e instanceof Error ? e.message : 'Gửi thất bại'))
            .finally(() => setSendingId(null));
    };

    const handleAcceptReject = (matchId: string, status: 'ACCEPTED' | 'REJECTED') => {
        setUpdatingId(matchId);
        setMessage(null);
        updateRoommateMatchStatusRequest(matchId, status)
            .then(() => loadMatches())
            .catch((e) => setMessage(e instanceof Error ? e.message : 'Cập nhật thất bại'))
            .finally(() => setUpdatingId(null));
    };

    const sentPending = matches.filter((m) => m.isRequester && m.status === 'PENDING');
    const receivedPending = matches.filter((m) => !m.isRequester && m.status === 'PENDING');
    const accepted = matches.filter((m) => m.status === 'ACCEPTED');

    return (
        <div className="min-h-screen bg-background">
            <Header onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                <div className="mb-8">
                    <h1 className="font-heading text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
                        <Users className="w-8 h-8 text-primary" />
                        Tìm bạn ở ghép
                    </h1>
                    <p className="text-muted-foreground">
                        Ghép phòng với người cùng giới tính và có phong cách sống tương đồng
                    </p>
                </div>

                {message && (
                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                        {message}
                    </div>
                )}

                {!hasGender && (
                    <div className="mb-8 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center">
                        <UserPlus className="w-14 h-14 text-primary mx-auto mb-4 opacity-80" />
                        <h2 className="font-heading text-xl font-semibold text-foreground mb-2">
                            Cập nhật giới tính để lọc gợi ý chính xác hơn
                        </h2>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Bạn vẫn sẽ thấy danh sách tenant phù hợp theo điểm match. Thêm giới tính để ưu tiên lọc cùng giới tính.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/profile')}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
                        >
                            Cập nhật hồ sơ
                        </button>
                    </div>
                )}

                <>
                    {/* Suggestions */}
                    <section className="mb-12">
                            <h2 className="font-heading text-xl font-semibold text-foreground mb-1 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-accent" />
                                Gợi ý roommate
                            </h2>
                            <p className="text-muted-foreground text-sm mb-6">
                                {hasGender
                                    ? 'Ưu tiên người cùng giới và có phong cách sống phù hợp với bạn'
                                    : 'Tenant phù hợp được sắp xếp theo điểm match cao đến thấp'}
                            </p>
                            {loadingSuggestions ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="bg-card rounded-2xl border border-border p-6 animate-pulse">
                                            <div className="flex gap-4">
                                                <div className="w-16 h-16 rounded-full bg-muted" />
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-5 bg-muted rounded w-2/3" />
                                                    <div className="h-4 bg-muted rounded w-1/2" />
                                                    <div className="h-10 bg-muted rounded-xl w-full mt-4" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : suggestions.length === 0 ? (
                                <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-12 text-center text-muted-foreground">
                                    Chưa có gợi ý phù hợp. Hãy cập nhật Phong cách sống và Sở thích tìm phòng trong Hồ sơ để nhận gợi ý tốt hơn.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {suggestions.map((item) => (
                                        <div
                                            key={item.user.id}
                                            className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="p-5 flex gap-4">
                                                <button
                                                    type="button"
                                                    className="shrink-0 group relative"
                                                    onClick={() => setViewingProfile({ userId: item.user.id, matchScore: item.matchScore })}
                                                    title="Xem hồ sơ"
                                                >
                                                    <ImageWithFallback
                                                        src={item.user.avatarUrl || AVATAR_PLACEHOLDER}
                                                        alt={item.user.fullName}
                                                        className="w-16 h-16 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors"
                                                    />
                                                    <span className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Eye className="w-5 h-5 text-white" />
                                                    </span>
                                                </button>
                                                <div className="min-w-0 flex-1">
                                                    <button
                                                        type="button"
                                                        className="font-semibold text-foreground truncate block hover:text-primary transition-colors text-left"
                                                        onClick={() => setViewingProfile({ userId: item.user.id, matchScore: item.matchScore })}
                                                        title="Xem hồ sơ"
                                                    >
                                                        {item.user.fullName}
                                                    </button>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                            {item.matchScore}% phù hợp
                                                        </span>
                                                    </div>
                                                    <LifestyleTags item={item} />
                                                </div>
                                            </div>
                                            <div className="px-5 pb-5 flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingProfile({ userId: item.user.id, matchScore: item.matchScore })}
                                                    className="flex-1 py-2.5 rounded-xl font-medium border border-border hover:bg-muted flex items-center justify-center gap-2 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Xem hồ sơ
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={!!sendingId}
                                                    onClick={() => handleSendRequest(item.user.id)}
                                                    className="flex-1 py-2.5 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
                                                >
                                                    {sendingId === item.user.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <UserPlus className="w-4 h-4" />
                                                    )}
                                                    Gửi lời mời
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                    </section>

                    {/* My matches */}
                    <section>
                            <h2 className="font-heading text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                                <Heart className="w-5 h-5 text-accent" />
                                Lời mời của tôi
                            </h2>

                            {loadingMatches ? (
                                <div className="space-y-4">
                                    <div className="h-24 bg-muted rounded-2xl animate-pulse" />
                                    <div className="h-24 bg-muted rounded-2xl animate-pulse" />
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {receivedPending.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Lời mời nhận được</h3>
                                            <div className="space-y-3">
                                                {receivedPending.map((m) => (
                                                    <div
                                                        key={m.id}
                                                        className="flex items-center justify-between gap-4 p-4 bg-card rounded-2xl border border-border"
                                                    >
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                                                            onClick={() => m.otherUser?.id && setViewingProfile({ userId: m.otherUser.id })}
                                                            title="Xem hồ sơ"
                                                        >
                                                            <ImageWithFallback
                                                                src={m.otherUser?.avatarUrl || AVATAR_PLACEHOLDER}
                                                                alt={m.otherUser?.fullName || ''}
                                                                className="w-12 h-12 rounded-full object-cover shrink-0"
                                                            />
                                                            <span className="font-medium text-foreground truncate">
                                                                {m.otherUser?.fullName || '—'}
                                                            </span>
                                                        </button>
                                                        <div className="flex gap-2 shrink-0">
                                                            <button
                                                                type="button"
                                                                disabled={!!updatingId}
                                                                onClick={() => handleAcceptReject(m.id, 'ACCEPTED')}
                                                                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                                                                title="Chấp nhận"
                                                            >
                                                                {updatingId === m.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={!!updatingId}
                                                                onClick={() => handleAcceptReject(m.id, 'REJECTED')}
                                                                className="p-2.5 rounded-xl border border-border hover:bg-muted disabled:opacity-60"
                                                                title="Từ chối"
                                                            >
                                                                <X className="w-5 h-5 text-muted-foreground" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {sentPending.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Lời mời đã gửi</h3>
                                            <div className="space-y-3">
                                                {sentPending.map((m) => (
                                                    <div
                                                        key={m.id}
                                                        className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border"
                                                    >
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-3 min-w-0 hover:opacity-80 transition-opacity"
                                                            onClick={() => m.otherUser?.id && setViewingProfile({ userId: m.otherUser.id })}
                                                            title="Xem hồ sơ"
                                                        >
                                                            <ImageWithFallback
                                                                src={m.otherUser?.avatarUrl || AVATAR_PLACEHOLDER}
                                                                alt={m.otherUser?.fullName || ''}
                                                                className="w-12 h-12 rounded-full object-cover shrink-0"
                                                            />
                                                            <span className="font-medium text-foreground truncate">
                                                                {m.otherUser?.fullName || '—'}
                                                            </span>
                                                        </button>
                                                        <span className="text-sm text-muted-foreground ml-auto">Đang chờ phản hồi</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {accepted.length > 0 && (
                                        <div>
                                            <h3 className="text-sm font-medium text-muted-foreground mb-3">Đã kết nối</h3>
                                            <div className="space-y-3">
                                                {accepted.map((m) => (
                                                    <div
                                                        key={m.id}
                                                        className="flex items-center gap-3 p-4 bg-primary/5 rounded-2xl border border-primary/20"
                                                    >
                                                        <button
                                                            type="button"
                                                            className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity"
                                                            onClick={() => m.otherUser?.id && setViewingProfile({ userId: m.otherUser.id })}
                                                            title="Xem hồ sơ"
                                                        >
                                                            <ImageWithFallback
                                                                src={m.otherUser?.avatarUrl || AVATAR_PLACEHOLDER}
                                                                alt={m.otherUser?.fullName || ''}
                                                                className="w-12 h-12 rounded-full object-cover shrink-0"
                                                            />
                                                            <span className="font-medium text-foreground truncate flex-1 min-w-0">
                                                                {m.otherUser?.fullName || '—'}
                                                            </span>
                                                        </button>
                                                        <span className="text-sm text-primary font-medium flex items-center gap-1 shrink-0">
                                                            <Check className="w-4 h-4" /> Đã chấp nhận
                                                        </span>
                                                        {m.otherUser?.id && (
                                                            <button
                                                                type="button"
                                                                onClick={() => (chatBox ? chatBox.openChatWith(m.otherUser!.id) : navigate(`/chat/${m.otherUser!.id}`))}
                                                                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                                                                title="Nhắn tin"
                                                            >
                                                                <MessageCircle className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {sentPending.length === 0 && receivedPending.length === 0 && accepted.length === 0 && (
                                        <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-8 text-center text-muted-foreground">
                                            Chưa có lời mời nào. Gửi lời mời cho ai đó trong danh sách gợi ý phía trên.
                                        </div>
                                    )}
                                </div>
                            )}
                    </section>
                </>

                <RoommateProfileModal
                    userId={viewingProfile?.userId ?? null}
                    matchScore={viewingProfile?.matchScore}
                    onClose={() => setViewingProfile(null)}
                />
            </main>
        </div>
    );
}
