import { useState, useEffect, useMemo } from 'react';
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
    Search,
    SlidersHorizontal,
    RotateCcw,
    MapPin,
    Banknote,
    Home,
    DoorOpen,
    Send,
    Link2,
    Copy,
    ExternalLink,
    TrendingUp,
} from 'lucide-react';
import {
    getRoommateSuggestionsRequest,
    getRoommateMatchesRequest,
    sendRoommateRequestRequest,
    updateRoommateMatchStatusRequest,
    getMyActiveRoomsRequest,
    inviteRoommateRequest,
    searchRoommatesRequest,
    getTopSearchersByAreaRequest,
    getPreferenceRequest,
    fetchAuthMe,
    getPeopleYouMayKnowRequest,
    type RoommateSuggestionItem,
    type RoommateMatchItem,
    type MyActiveRoomItem,
    type RoommateSearchResultItem,
    type AreaSearcherItem,
    type PeopleYouMayKnowItem,
} from '@/lib/api';

const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';

function LifestyleTags({ item }: { item: RoommateSuggestionItem }) {
    const tags: { label: string; color?: string }[] = [];
    const L = item.lifestyle;

    // Habits
    if (L?.smoking === false && L?.drinking === false) tags.push({ label: 'Không thuốc/rượu' });
    else if (L?.smoking === false) tags.push({ label: 'Không hút thuốc' });
    else if (L?.smoking === true) tags.push({ label: 'Hút thuốc', color: 'warning' });
    if (L?.pets_allowed) tags.push({ label: 'Nuôi thú cưng' });

    // Core lifestyle
    if (L?.sleep_schedule) tags.push({ label: `Ngủ: ${L.sleep_schedule}` });
    if (L?.personalityType) tags.push({ label: L.personalityType });
    if (L?.cleanliness) tags.push({ label: `Sạch sẽ: ${L.cleanliness}` });
    if (L?.noise_tolerance) tags.push({ label: `Chịu ồn: ${L.noise_tolerance}` });
    if (L?.guest_frequency) tags.push({ label: `Khách: ${L.guest_frequency}` });

    // ★ Interests (key factor)
    const interests = (L as Record<string, unknown>)?.interests as string[] | undefined;
    if (interests && interests.length > 0) {
        interests.slice(0, 3).forEach((i) => tags.push({ label: i, color: 'interest' }));
    }

    // ★ Deal-breakers (key factor)
    const dealBreakers = (L as Record<string, unknown>)?.deal_breakers as string | null | undefined;
    if (dealBreakers) {
        const dbItems = dealBreakers.split(/[,，、]+/).map((s) => s.trim()).filter(Boolean);
        if (dbItems.length > 0) {
            tags.push({ label: `⚠ ${dbItems.slice(0, 2).join(', ')}`, color: 'danger' });
        }
    }

    // Location
    if (item.preference?.preferred_districts?.length) {
        tags.push({ label: item.preference.preferred_districts.slice(0, 2).join(', ') });
    }

    if (tags.length === 0) return null;

    const getTagStyle = (color?: string) => {
        switch (color) {
            case 'interest':
                return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
            case 'danger':
                return 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300';
            case 'warning':
                return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    return (
        <div className="flex flex-wrap gap-1.5 mt-2">
            {tags.slice(0, 6).map((t, idx) => (
                <span
                    key={`${t.label}-${idx}`}
                    className={`text-xs px-2 py-0.5 rounded-full ${getTagStyle(t.color)}`}
                >
                    {t.label}
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

    // Invite roommate modal state
    const [inviteTarget, setInviteTarget] = useState<{ userId: string; fullName: string } | null>(null);
    const [activeRooms, setActiveRooms] = useState<MyActiveRoomItem[]>([]);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [sendingInvite, setSendingInvite] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);

    // AI search state
    const [aiQuery, setAiQuery] = useState('');
    const [aiResults, setAiResults] = useState<RoommateSearchResultItem[]>([]);
    const [aiSearching, setAiSearching] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiActive, setAiActive] = useState(false);

    // Area searcher state
    const [areaSearchResults, setAreaSearchResults] = useState<AreaSearcherItem[]>([]);
    const [areaSearching, setAreaSearching] = useState(false);
    const [areaSearchArea, setAreaSearchArea] = useState('');
    const [areaSearchTotalRooms, setAreaSearchTotalRooms] = useState(0);
    const [areaSearchActive, setAreaSearchActive] = useState(false);

    // Current user's preferred districts (for quick-select chips)
    const [myPreferredDistricts, setMyPreferredDistricts] = useState<string[]>([]);

    // People You May Know
    const [pymkList, setPymkList] = useState<PeopleYouMayKnowItem[]>([]);
    const [loadingPymk, setLoadingPymk] = useState(true);

    // Filter state (live inputs)
    const [filterArea, setFilterArea] = useState('');
    const [filterBudgetMax, setFilterBudgetMax] = useState<number | ''>('');
    const [filterRoomType, setFilterRoomType] = useState('');
    const [filterGender, setFilterGender] = useState('');
    const [showFilters, setShowFilters] = useState(true);

    // Applied filter state (only set when user clicks Search)
    const [appliedFilter, setAppliedFilter] = useState<{
        area: string; budgetMax: number | ''; roomType: string; gender: string;
    }>({ area: '', budgetMax: '', roomType: '', gender: '' });

    // Use a local fresh gender state so the banner hides immediately after a profile update
    // without requiring a full auth context refresh (cached user can be stale).
    const [myGender, setMyGender] = useState<string | null | undefined>(user?.gender);

    const hasGender = myGender && String(myGender).trim() && String(myGender).toLowerCase() !== 'không tiết lộ';

    const hasActiveFilter = !!filterArea || filterBudgetMax !== '' || !!filterRoomType || !!filterGender;
    const hasAppliedFilter = !!appliedFilter.area || appliedFilter.budgetMax !== '' || !!appliedFilter.roomType || !!appliedFilter.gender;

    const resetFilters = () => {
        setFilterArea('');
        setFilterBudgetMax('');
        setFilterRoomType('');
        setFilterGender('');
        setAppliedFilter({ area: '', budgetMax: '', roomType: '', gender: '' });
        setAreaSearchActive(false);
        setAreaSearchResults([]);
    };

    const handleSearch = async () => {
        // 1. Apply client-side filters
        setAppliedFilter({
            area: filterArea.trim(),
            budgetMax: filterBudgetMax,
            roomType: filterRoomType,
            gender: filterGender,
        });

        // 2. If area is set, also call area searcher API
        const area = filterArea.trim();
        if (area) {
            setAreaSearching(true);
            setAreaSearchActive(true);
            try {
                const r = await getTopSearchersByAreaRequest(area, 10);
                setAreaSearchResults(r.data || []);
                setAreaSearchArea(r.area || area);
                setAreaSearchTotalRooms(r.totalRoomsInArea || 0);
            } catch {
                setAreaSearchResults([]);
                setAreaSearchArea(area);
                setAreaSearchTotalRooms(0);
            } finally {
                setAreaSearching(false);
            }
        } else {
            setAreaSearchActive(false);
            setAreaSearchResults([]);
        }
    };

    const filteredSuggestions = useMemo(() => {
        if (!hasAppliedFilter) return suggestions;
        return suggestions.filter((item) => {
            // Area filter
            if (appliedFilter.area) {
                const q = appliedFilter.area.toLowerCase();
                const districts = item.preference?.preferred_districts ?? [];
                const location = item.preference?.preferredLocation ?? '';
                const areaMatch =
                    districts.some((d) => d.toLowerCase().includes(q)) ||
                    location.toLowerCase().includes(q);
                if (!areaMatch) return false;
            }
            // Budget filter
            if (appliedFilter.budgetMax !== '') {
                const candidateBudgetMax = item.preference?.budget_max;
                if (candidateBudgetMax != null && candidateBudgetMax > Number(appliedFilter.budgetMax)) {
                    return false;
                }
            }
            // Room type filter
            if (appliedFilter.roomType) {
                if (item.preference?.room_type !== appliedFilter.roomType) return false;
            }
            // Gender filter
            if (appliedFilter.gender) {
                const g = (item.user.gender ?? '').toLowerCase();
                if (g !== appliedFilter.gender.toLowerCase()) return false;
            }
            return true;
        });
    }, [suggestions, appliedFilter, hasAppliedFilter]);

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

    // Fetch fresh user data to ensure gender check is not stale after a profile update
    useEffect(() => {
        if (!user?.id) return;
        fetchAuthMe()
            .then((r) => { if (r.user?.gender !== undefined) setMyGender(r.user.gender ?? null); })
            .catch(() => { });
    }, [user?.id]);

    // Fetch current user's preferred_districts for quick-select chips
    useEffect(() => {
        if (!user?.id) return;
        getPreferenceRequest()
            .then((r) => {
                const districts = r.preference?.preferred_districts;
                if (Array.isArray(districts) && districts.length > 0) {
                    setMyPreferredDistricts(districts);
                }
            })
            .catch(() => { });
    }, [user?.id]);

    useEffect(() => {
        loadMatches();
    }, []);

    // Load People You May Know
    useEffect(() => {
        if (!user?.id) return;
        setLoadingPymk(true);
        getPeopleYouMayKnowRequest()
            .then((r) => setPymkList(r.data || []))
            .catch(() => setPymkList([]))
            .finally(() => setLoadingPymk(false));
    }, [user?.id]);

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

    const openInviteModal = (userId: string, fullName: string) => {
        setInviteTarget({ userId, fullName });
        setSelectedRoomId(null);
        setInviteSuccess(null);
        setLoadingRooms(true);
        getMyActiveRoomsRequest()
            .then((r) => setActiveRooms(r.data || []))
            .catch(() => setActiveRooms([]))
            .finally(() => setLoadingRooms(false));
    };

    const closeInviteModal = () => {
        setInviteTarget(null);
        setActiveRooms([]);
        setSelectedRoomId(null);
        setInviteSuccess(null);
    };

    const handleSendInvite = () => {
        if (!inviteTarget || !selectedRoomId) return;
        setSendingInvite(true);
        setMessage(null);
        inviteRoommateRequest(inviteTarget.userId, selectedRoomId)
            .then((r) => {
                setInviteSuccess(r.message || 'Đã gửi lời mời ở ghép!');
            })
            .catch((e) => setMessage(e instanceof Error ? e.message : 'Gửi lời mời thất bại'))
            .finally(() => setSendingInvite(false));
    };

    const handleAiSearch = async () => {
        const q = aiQuery.trim();
        if (!q || q.length < 3) return;
        setAiSearching(true);
        setAiError(null);
        setAiActive(true);
        try {
            const r = await searchRoommatesRequest(q, 10);
            setAiResults(r.data || []);
        } catch (err) {
            setAiError(err instanceof Error ? err.message : 'Lỗi tìm kiếm');
            setAiResults([]);
        } finally {
            setAiSearching(false);
        }
    };

    const clearAiSearch = () => {
        setAiQuery('');
        setAiResults([]);
        setAiActive(false);
        setAiError(null);
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
                    {/* AI Personality Search (VIP) - Temporarily hidden */}
                    {/* <section className="mb-8">
                        <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/80 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                <h2 className="font-heading text-lg font-semibold text-foreground">
                                    Tìm roommate AI
                                </h2>
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-white">
                                    VIP
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                                Mô tả tính cách bạn muốn tìm, AI sẽ tìm roommate phù hợp nhất.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                                    placeholder="VD: Tìm bạn chill chill, không hút thuốc..."
                                    className="flex-1 px-4 py-3 bg-white dark:bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all"
                                />
                                {aiActive ? (
                                    <button
                                        type="button"
                                        onClick={clearAiSearch}
                                        className="px-4 py-3 rounded-xl border border-border hover:bg-muted text-sm font-medium transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={handleAiSearch}
                                    disabled={aiSearching || aiQuery.trim().length < 3}
                                    className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
                                >
                                    {aiSearching ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                    Tìm
                                </button>
                            </div>
                            {aiError && (
                                <p className="text-sm text-red-500 mt-2">{aiError}</p>
                            )}
                        </div>
                    </section> */}

                    {/* AI Search Results - Temporarily hidden */}
                    {/* {aiActive && (
                        <section className="mb-12">
                            <h2 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2 mb-4">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                Kết quả AI
                                <span className="text-sm font-normal text-muted-foreground ml-1">
                                    ({aiResults.length} kết quả)
                                </span>
                            </h2>
                            {aiSearching ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                                    <span className="ml-3 text-muted-foreground">Đang tìm kiếm AI...</span>
                                </div>
                            ) : aiResults.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                                    <p>Không tìm thấy roommate phù hợp. Thử mô tả khác nhé!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {aiResults.map((r) => (
                                        <div
                                            key={r.user.id}
                                            className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow relative"
                                        >
                                            <div className="absolute top-3 right-3">
                                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.similarityScore >= 70
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                        : r.similarityScore >= 40
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                                            : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                                    }`}>
                                                    {r.similarityScore}% phù hợp
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 mb-3">
                                                <ImageWithFallback
                                                    src={r.user.avatarUrl || AVATAR_PLACEHOLDER}
                                                    alt={r.user.fullName || ''}
                                                    className="w-14 h-14 rounded-full object-cover border-2 border-border"
                                                />
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-foreground truncate">
                                                        {r.user.fullName}
                                                    </p>
                                                    {r.user.gender && (
                                                        <p className="text-xs text-muted-foreground">{r.user.gender}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {r.lifestyle && (
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {r.lifestyle.personalityType && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                            {r.lifestyle.personalityType}
                                                        </span>
                                                    )}
                                                    {r.lifestyle.smoking === false && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                            Không hút thuốc
                                                        </span>
                                                    )}
                                                    {r.lifestyle.smoking === true && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                            Hút thuốc
                                                        </span>
                                                    )}
                                                    {r.lifestyle.cleanliness && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                            Sạch sẽ: {r.lifestyle.cleanliness}
                                                        </span>
                                                    )}
                                                    {r.lifestyle.noise_tolerance && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                            Chịu ồn: {r.lifestyle.noise_tolerance}
                                                        </span>
                                                    )}
                                                    {r.lifestyle.interests.slice(0, 3).map((i) => (
                                                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                                            {i}
                                                        </span>
                                                    ))}
                                                    {r.lifestyle.deal_breakers && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300">
                                                            ⚠ {r.lifestyle.deal_breakers.split(/[,，、]+/)[0]?.trim()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {r.aiReason && (
                                                <p className="text-xs italic text-primary/80 mb-3 leading-relaxed bg-primary/5 rounded-lg px-3 py-2">
                                                    💡 {r.aiReason}
                                                </p>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingProfile({ userId: r.user.id, matchScore: r.similarityScore })}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" /> Xem hồ sơ
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSendingId(r.user.id);
                                                        sendRoommateRequestRequest(r.user.id)
                                                            .then(() => setMessage('Đã gửi lời mời!'))
                                                            .catch((e) => setMessage(e instanceof Error ? e.message : 'Lỗi'))
                                                            .finally(() => setSendingId(null));
                                                    }}
                                                    disabled={sendingId === r.user.id}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
                                                >
                                                    {sendingId === r.user.id ? (
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
                    )} */}

                    {/* Suggestions */}
                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="font-heading text-xl font-semibold text-foreground flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-accent" />
                                Gợi ý roommate
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShowFilters((v) => !v)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${showFilters
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-foreground hover:bg-muted/80'
                                    }`}
                            >
                                <SlidersHorizontal className="w-4 h-4" />
                                Bộ lọc
                                {hasActiveFilter && (
                                    <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                                )}
                            </button>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">
                            {areaSearchActive
                                ? <>Ưu tiên người đang tìm phòng ở <strong className="text-primary">{areaSearchArea}</strong> — xếp hạng theo lượt tương tác từ cao đến thấp</>
                                : hasGender
                                    ? 'Ưu tiên người cùng giới và có phong cách sống phù hợp với bạn'
                                    : 'Tenant phù hợp được sắp xếp theo điểm match cao đến thấp'}
                        </p>

                        {/* Filter bar */}
                        {showFilters && (
                            <div className="mb-6 p-4 bg-card rounded-2xl border border-border shadow-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {/* Area */}
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            Khu vực
                                        </label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <input
                                                type="text"
                                                value={filterArea}
                                                onChange={(e) => setFilterArea(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                placeholder="VD: Quận 1, Bình Thạnh..."
                                                className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>
                                    {/* Budget max */}
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                            <Banknote className="w-3.5 h-3.5" />
                                            Ngân sách tối đa (VNĐ)
                                        </label>
                                        <input
                                            type="number"
                                            value={filterBudgetMax}
                                            onChange={(e) => setFilterBudgetMax(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="VD: 5000000"
                                            min={0}
                                            className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        />
                                    </div>
                                    {/* Room type */}
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                            <Home className="w-3.5 h-3.5" />
                                            Loại phòng
                                        </label>
                                        <select
                                            value={filterRoomType}
                                            onChange={(e) => setFilterRoomType(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        >
                                            <option value="">Tất cả</option>
                                            <option value="PRIVATE">Phòng riêng</option>
                                            <option value="SHARED">Ở ghép</option>
                                            <option value="STUDIO">Studio</option>
                                            <option value="APARTMENT">Căn hộ</option>
                                        </select>
                                    </div>
                                    {/* Gender */}
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                            <Users className="w-3.5 h-3.5" />
                                            Giới tính
                                        </label>
                                        <select
                                            value={filterGender}
                                            onChange={(e) => setFilterGender(e.target.value)}
                                            className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        >
                                            <option value="">Tất cả</option>
                                            <option value="Nam">Nam</option>
                                            <option value="Nữ">Nữ</option>
                                            <option value="Khác">Khác</option>
                                        </select>
                                    </div>
                                </div>
                                {/* Search button + result count */}
                                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
                                    <button
                                        type="button"
                                        onClick={handleSearch}
                                        disabled={!hasActiveFilter || areaSearching}
                                        className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                                    >
                                        {areaSearching ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Search className="w-4 h-4" />
                                        )}
                                        Tìm kiếm
                                    </button>
                                    {hasAppliedFilter && (
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5" />
                                            Xóa bộ lọc
                                        </button>
                                    )}
                                    {hasAppliedFilter && !areaSearchActive && (
                                        <p className="text-sm text-muted-foreground ml-auto">
                                            Tìm thấy <span className="font-semibold text-foreground">{filteredSuggestions.length}</span> roommate phù hợp
                                        </p>
                                    )}
                                    {areaSearchActive && (
                                        <p className="text-sm text-muted-foreground ml-auto">
                                            Tìm thấy <span className="font-semibold text-foreground">{areaSearchResults.length}</span> roommate ở <span className="font-semibold text-primary">{areaSearchArea}</span>
                                            <span className="text-xs ml-1">({areaSearchTotalRooms} phòng trong khu vực)</span>
                                        </p>
                                    )}
                                </div>

                                {/* Quick-select: preferred districts from user's profile */}
                                {myPreferredDistricts.length > 0 && (
                                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                                            <MapPin className="w-3 h-3" />
                                            Khu vực muốn tìm roommate của bạn:
                                        </span>
                                        {myPreferredDistricts.map((district) => (
                                            <button
                                                key={district}
                                                type="button"
                                                onClick={async () => {
                                                    setFilterArea(district);
                                                    // Apply & search immediately
                                                    setAppliedFilter({ area: district, budgetMax: filterBudgetMax, roomType: filterRoomType, gender: filterGender });
                                                    setAreaSearching(true);
                                                    setAreaSearchActive(true);
                                                    try {
                                                        const r = await getTopSearchersByAreaRequest(district, 10);
                                                        setAreaSearchResults(r.data || []);
                                                        setAreaSearchArea(r.area || district);
                                                        setAreaSearchTotalRooms(r.totalRoomsInArea || 0);
                                                    } catch {
                                                        setAreaSearchResults([]);
                                                        setAreaSearchArea(district);
                                                        setAreaSearchTotalRooms(0);
                                                    } finally {
                                                        setAreaSearching(false);
                                                    }
                                                }}
                                                className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border transition-all font-medium ${filterArea === district
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                    : 'bg-background border-border text-muted-foreground hover:border-primary/50 hover:text-primary hover:bg-primary/5'
                                                    }`}
                                            >
                                                <MapPin className="w-2.5 h-2.5" />
                                                {district}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Main Results: Area-based OR general suggestions ── */}
                        {areaSearchActive ? (
                            /* Area-based: show users ranked by activity in area */
                            areaSearching ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    <span className="ml-3 text-muted-foreground">Đang tìm người cùng khu vực...</span>
                                </div>
                            ) : areaSearchResults.length === 0 ? (
                                <div className="rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/50 dark:bg-orange-950/20 p-12 text-center">
                                    <TrendingUp className="w-10 h-10 mx-auto mb-3 text-orange-400 opacity-60" />
                                    <p className="text-muted-foreground">
                                        Chưa có ai tương tác với phòng ở khu vực "<strong>{areaSearchArea}</strong>". Thử khu vực khác.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {areaSearchResults.map((item, index) => (
                                        <div
                                            key={item.user.id}
                                            className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-stretch">
                                                {/* Rank badge */}
                                                <div className={`flex items-center justify-center px-4 shrink-0 ${index === 0 ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-white' :
                                                    index === 1 ? 'bg-gradient-to-b from-slate-300 to-slate-400 text-white' :
                                                        index === 2 ? 'bg-gradient-to-b from-amber-600 to-amber-700 text-white' :
                                                            'bg-muted/50 text-muted-foreground'
                                                    }`}>
                                                    <span className="text-lg font-bold">{index + 1}</span>
                                                </div>

                                                {/* Main content */}
                                                <div className="flex-1 p-5">
                                                    <div className="flex gap-4">
                                                        <button
                                                            type="button"
                                                            className="shrink-0 group relative"
                                                            onClick={() => setViewingProfile({ userId: item.user.id, matchScore: item.matchScore })}
                                                            title="Xem hồ sơ"
                                                        >
                                                            <ImageWithFallback
                                                                src={item.user.avatarUrl || AVATAR_PLACEHOLDER}
                                                                alt={item.user.fullName}
                                                                className="w-14 h-14 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors"
                                                            />
                                                            <span className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Eye className="w-5 h-5 text-white" />
                                                            </span>
                                                        </button>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <button
                                                                    type="button"
                                                                    className="font-semibold text-foreground truncate block hover:text-primary transition-colors text-left"
                                                                    onClick={() => setViewingProfile({ userId: item.user.id, matchScore: item.matchScore })}
                                                                    title="Xem hồ sơ"
                                                                >
                                                                    {item.user.fullName}
                                                                </button>
                                                                <div className="flex items-center gap-2 shrink-0">
                                                                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                                        {item.matchScore}% phù hợp
                                                                    </span>
                                                                    {item.isSameGender && (
                                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">Cùng giới</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Activity badges - the core info for area search */}
                                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                                                                    <TrendingUp className="w-3 h-3" />
                                                                    {item.activityInArea.totalScore} điểm tương tác
                                                                </span>
                                                                {item.activityInArea.views > 0 && (
                                                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400">
                                                                        👁️ {item.activityInArea.views} lượt xem
                                                                    </span>
                                                                )}
                                                                {item.activityInArea.favorites > 0 && (
                                                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                                                                        ❤️ {item.activityInArea.favorites} lưu
                                                                    </span>
                                                                )}
                                                                {item.activityInArea.preorders > 0 && (
                                                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                                                        📝 {item.activityInArea.preorders} đặt cọc
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Gender info */}
                                                            {item.user.gender && (
                                                                <p className="text-xs text-muted-foreground mt-1">
                                                                    {item.user.gender}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="flex items-center gap-2 px-5 shrink-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingProfile({ userId: item.user.id, matchScore: item.matchScore })}
                                                        className="py-2.5 px-4 rounded-xl font-medium text-sm border border-border hover:bg-muted flex items-center justify-center gap-1.5 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" /> Hồ sơ
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={!!sendingId}
                                                        onClick={() => handleSendRequest(item.user.id)}
                                                        className="py-2.5 px-4 rounded-xl font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-1.5 transition-colors"
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
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : null}

                        {/* Secondary section: people whose preferred_districts matches the area */}
                        {areaSearchActive && !areaSearching && (() => {
                            const areaLower = areaSearchArea.toLowerCase();
                            const activityIds = new Set(areaSearchResults.map((r) => r.user.id));
                            const matched = suggestions.filter((s) => {
                                if (activityIds.has(s.user.id)) return false; // already shown above
                                const districts: string[] = s.preference?.preferred_districts ?? [];
                                return districts.some((d) => d.toLowerCase().includes(areaLower) || areaLower.includes(d.toLowerCase()));
                            });
                            if (matched.length === 0) return null;
                            return (
                                <div className="mt-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="w-4 h-4 text-primary" />
                                        <h3 className="font-semibold text-foreground text-sm">
                                            Người có sở thích khu vực <span className="text-primary">"{areaSearchArea}"</span>
                                        </h3>
                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            {matched.length} người
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Những người này đã khai báo <strong>{areaSearchArea}</strong> là khu vực ưa thích trong hồ sơ tìm phòng — chưa có tương tác thực tế nhưng đang tìm cùng khu vực với bạn.
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {matched.map((item) => (
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
                                                            className="w-14 h-14 rounded-full object-cover border-2 border-border group-hover:border-primary transition-colors"
                                                        />
                                                        <span className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Eye className="w-4 h-4 text-white" />
                                                        </span>
                                                    </button>
                                                    <div className="min-w-0 flex-1">
                                                        <button
                                                            type="button"
                                                            className="font-semibold text-foreground truncate block hover:text-primary transition-colors text-left text-sm"
                                                            onClick={() => setViewingProfile({ userId: item.user.id, matchScore: item.matchScore })}
                                                        >
                                                            {item.user.fullName}
                                                        </button>
                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                                {item.matchScore}% phù hợp
                                                            </span>
                                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                                                                <MapPin className="w-2.5 h-2.5" />
                                                                Sở thích khu vực
                                                            </span>
                                                        </div>
                                                        <LifestyleTags item={item} />
                                                    </div>
                                                </div>
                                                <div className="px-5 pb-5 flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setViewingProfile({ userId: item.user.id, matchScore: item.matchScore })}
                                                        className="flex-1 py-2 rounded-xl font-medium border border-border hover:bg-muted flex items-center justify-center gap-1.5 text-sm transition-colors"
                                                    >
                                                        <Eye className="w-3.5 h-3.5" /> Hồ sơ
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={!!sendingId}
                                                        onClick={() => handleSendRequest(item.user.id)}
                                                        className="flex-1 py-2 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-1.5 text-sm transition-colors"
                                                    >
                                                        {sendingId === item.user.id ? (
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                        ) : (
                                                            <UserPlus className="w-3.5 h-3.5" />
                                                        )}
                                                        Gửi lời mời
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* General suggestions (no area filter) */}
                        {!areaSearchActive ? (
                            loadingSuggestions ? (
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
                            ) : filteredSuggestions.length === 0 ? (
                                <div className="rounded-2xl border-2 border-dashed border-border bg-muted/20 p-12 text-center text-muted-foreground">
                                    {hasActiveFilter
                                        ? 'Không tìm thấy roommate phù hợp với bộ lọc. Thử thay đổi tiêu chí lọc.'
                                        : 'Chưa có gợi ý phù hợp. Hãy cập nhật Phong cách sống và Sở thích tìm phòng trong Hồ sơ để nhận gợi ý tốt hơn.'}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                    {filteredSuggestions.map((item) => (
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
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                                            {item.matchScore}% phù hợp
                                                        </span>
                                                        {item.experienceScore >= 8 && (
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                                ⭐ Đánh giá tốt
                                                            </span>
                                                        )}
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
                                                {item.matchStatus === 'ACCEPTED' ? (
                                                    <span className="flex-1 py-2.5 rounded-xl font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 flex items-center justify-center gap-2 text-sm">
                                                        <Check className="w-4 h-4" />
                                                        Đã kết bạn
                                                    </span>
                                                ) : item.matchStatus === 'PENDING' ? (
                                                    <span className="flex-1 py-2.5 rounded-xl font-medium bg-muted text-muted-foreground flex items-center justify-center gap-2 text-sm">
                                                        <Loader2 className="w-4 h-4" />
                                                        Đang chờ
                                                    </span>
                                                ) : (
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
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : null}
                    </section>

                    {/* ── People You May Know ──
                    {!loadingPymk && pymkList.length > 0 && (
                        <section className="mt-2">
                            <h2 className="font-heading text-xl font-semibold text-foreground mb-2 flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Có thể bạn quan tâm
                            </h2>
                            <p className="text-sm text-muted-foreground mb-5">
                                Gợi ý dựa trên bạn chung và khu vực tìm phòng
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {pymkList.map((item) => (
                                    <div
                                        key={item.user.id}
                                        className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col"
                                    >
                                        
                                        <div className="flex items-center gap-3 mb-3">
                                            <ImageWithFallback
                                                src={item.user.avatarUrl || AVATAR_PLACEHOLDER}
                                                alt={item.user.fullName}
                                                className="w-11 h-11 rounded-full object-cover border-2 border-primary/20"
                                            />
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-foreground truncate">
                                                    {item.user.fullName}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    {item.user.gender && (
                                                        <span className="text-xs text-muted-foreground">{item.user.gender}</span>
                                                    )}
                                                    {item.matchScore > 0 && (
                                                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${item.matchScore >= 80 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                            {Math.round(item.matchScore)}% phù hợp
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        
                                        <div className="flex flex-col gap-1.5 mb-4 flex-1">
                                            {item.reasons.map((reason, idx) => (
                                                <div key={idx}>
                                                    {reason.type === 'mutual_friends' && (
                                                        <div className="flex items-start gap-1.5 text-xs">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 font-medium shrink-0">
                                                                🤝 {reason.count} bạn chung
                                                            </span>
                                                            {(reason.names?.length ?? 0) > 0 && (
                                                                <span className="text-muted-foreground pt-1 leading-tight">
                                                                    {reason.names!.join(', ')}{(reason.count ?? 0) > (reason.names?.length ?? 0) ? '...' : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {reason.type === 'common_area' && (
                                                        <div className="flex items-start gap-1.5 text-xs">
                                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium shrink-0">
                                                                📍 Cùng khu vực
                                                            </span>
                                                            <span className="text-muted-foreground pt-1 leading-tight">
                                                                {reason.districts?.join(', ')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        
                                        <div className="flex items-center gap-2 mt-auto pt-3 border-t border-border">
                                            <button
                                                type="button"
                                                onClick={() => setViewingProfile({ userId: item.user.id })}
                                                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                Xem hồ sơ
                                            </button>
                                            {item.matchStatus === 'ACCEPTED' ? (
                                                <span className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                                    <Check className="w-3.5 h-3.5" />
                                                    Đã kết bạn
                                                </span>
                                            ) : item.matchStatus === 'PENDING' ? (
                                                <span className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                                    <Loader2 className="w-3.5 h-3.5" />
                                                    Đang chờ
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={sendingId === item.user.id}
                                                    onClick={() => {
                                                        setSendingId(item.user.id);
                                                        sendRoommateRequestRequest(item.user.id)
                                                            .then(() => {
                                                                setPymkList((prev) =>
                                                                    prev.map((p) =>
                                                                        p.user.id === item.user.id
                                                                            ? { ...p, matchStatus: 'PENDING' }
                                                                            : p
                                                                    )
                                                                );
                                                                loadMatches();
                                                            })
                                                            .catch((e) => setMessage(e instanceof Error ? e.message : 'Lỗi gửi lời mời'))
                                                            .finally(() => setSendingId(null));
                                                    }}
                                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                                                >
                                                    {sendingId === item.user.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <UserPlus className="w-3.5 h-3.5" />
                                                    )}
                                                    Gửi lời mời
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )} 
                    */}

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
                                                        <div className="flex gap-2 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => openInviteModal(m.otherUser!.id, m.otherUser!.fullName || '')}
                                                                className="p-2.5 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 shrink-0"
                                                                title="Mời ở ghép"
                                                            >
                                                                <DoorOpen className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => (chatBox ? chatBox.openChatWith(m.otherUser!.id) : navigate(`/chat/${m.otherUser!.id}`))}
                                                                className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shrink-0"
                                                                title="Nhắn tin"
                                                            >
                                                                <MessageCircle className="w-5 h-5" />
                                                            </button>
                                                        </div>
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

                {/* Invite Roommate Modal */}
                {inviteTarget && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={closeInviteModal}>
                        <div
                            className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-border">
                                <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2">
                                    <DoorOpen className="w-5 h-5 text-accent" />
                                    Mời {inviteTarget.fullName} ở ghép
                                </h2>
                                <button
                                    type="button"
                                    onClick={closeInviteModal}
                                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-5 overflow-y-auto flex-1">
                                {inviteSuccess ? (
                                    <div className="text-center py-8">
                                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                            <Check className="w-8 h-8 text-primary" />
                                        </div>
                                        <p className="text-lg font-semibold text-foreground mb-2">Thành công!</p>
                                        <p className="text-muted-foreground text-sm">{inviteSuccess}</p>

                                        {/* Shareable room link */}
                                        {selectedRoomId && (
                                            <div className="mt-5 bg-muted/50 rounded-xl p-4 text-left">
                                                <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                                    <Link2 className="w-3.5 h-3.5" />
                                                    Link phòng – gửi cho bạn bè để xem trực tiếp:
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={`${window.location.origin}/room/${selectedRoomId}`}
                                                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground select-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`${window.location.origin}/room/${selectedRoomId}`);
                                                            setCopiedLink(true);
                                                            setTimeout(() => setCopiedLink(false), 2000);
                                                        }}
                                                        className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${copiedLink
                                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                            : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                            }`}
                                                    >
                                                        {copiedLink ? (
                                                            <><Check className="w-3.5 h-3.5" /> Đã sao chép</>
                                                        ) : (
                                                            <><Copy className="w-3.5 h-3.5" /> Sao chép</>
                                                        )}
                                                    </button>
                                                </div>
                                                <a
                                                    href={`/room/${selectedRoomId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 mt-2.5 text-xs text-primary hover:underline"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Mở trang phòng
                                                </a>
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={closeInviteModal}
                                            className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                ) : loadingRooms ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : activeRooms.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Home className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
                                        <p className="text-muted-foreground">Bạn chưa thuê phòng nào.</p>
                                        <p className="text-muted-foreground text-sm mt-1">Hãy thuê phòng trước khi mời ở ghép.</p>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Chọn phòng bạn đang thuê để mời <strong>{inviteTarget.fullName}</strong> ở ghép:
                                        </p>
                                        <div className="space-y-3">
                                            {activeRooms.map((room) => (
                                                <label
                                                    key={room.roomId}
                                                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedRoomId === room.roomId
                                                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                                                        : 'border-border hover:border-primary/30 hover:bg-muted/30'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="invite-room"
                                                        checked={selectedRoomId === room.roomId}
                                                        onChange={() => setSelectedRoomId(room.roomId)}
                                                        className="w-4 h-4 text-primary accent-primary shrink-0"
                                                    />
                                                    {room.image && (
                                                        <ImageWithFallback
                                                            src={room.image}
                                                            alt={room.roomName}
                                                            className="w-16 h-16 rounded-lg object-cover shrink-0"
                                                        />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-foreground truncate">
                                                            {room.roomName} – {room.propertyName}
                                                        </p>
                                                        {room.address && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />{room.address}
                                                            </p>
                                                        )}
                                                        {room.price != null && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                                <Banknote className="w-3 h-3" />{Number(room.price).toLocaleString('vi-VN')} VNĐ/tháng
                                                            </p>
                                                        )}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            {!inviteSuccess && activeRooms.length > 0 && !loadingRooms && (
                                <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
                                    <button
                                        type="button"
                                        onClick={closeInviteModal}
                                        className="px-5 py-2.5 rounded-xl font-medium border border-border hover:bg-muted transition-colors"
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        disabled={!selectedRoomId || sendingInvite}
                                        onClick={handleSendInvite}
                                        className="px-5 py-2.5 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2 transition-colors"
                                    >
                                        {sendingInvite ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        Gửi lời mời ở ghép
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
