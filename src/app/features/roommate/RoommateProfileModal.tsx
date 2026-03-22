import { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    Cigarette,
    Wine,
    PawPrint,
    Moon,
    Sun,
    Briefcase,
    Home,
    Sparkles,
    Users,
    MapPin,
    DoorOpen,
    Banknote,
    Clock,
    ThermometerSun,
    Volume2,
    UtensilsCrossed,
    UserCheck,
    CalendarDays,
    Shield,
    Bus,
    Eye,
} from 'lucide-react';
import { ImageWithFallback } from '@/app/components/ImageWithFallback';
import { getRoommateProfileRequest, type RoommatePublicProfile } from '@/lib/api';

const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';

/* ────────────────── helpers ────────────────── */

function boolLabel(val: boolean | null | undefined): string {
    if (val === true) return 'Có';
    if (val === false) return 'Không';
    return '—';
}

function formatBudget(min: number | null, max: number | null): string {
    const fmt = (n: number) => {
        if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} tr`;
        if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
        return String(n);
    };
    if (min && max) return `${fmt(min)} – ${fmt(max)} VND`;
    if (min) return `từ ${fmt(min)} VND`;
    if (max) return `đến ${fmt(max)} VND`;
    return '—';
}

/* ────────────────── sub-components ────────────────── */

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
    if (value === null || value === undefined || value === '' || value === '—') return null;
    return (
        <div className="flex items-start gap-3 py-2">
            <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
                <span className="text-xs text-muted-foreground">{label}</span>
                <p className="text-sm font-medium text-foreground">{value}</p>
            </div>
        </div>
    );
}

function TagList({ items, color = 'primary' }: { items: string[]; color?: string }) {
    if (!items.length) return null;
    return (
        <div className="flex flex-wrap gap-1.5">
            {items.map((t) => (
                <span
                    key={t}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium bg-${color}/10 text-${color}`}
                    style={{
                        backgroundColor: color === 'primary' ? 'hsl(var(--primary) / 0.10)' : 'hsl(var(--accent) / 0.15)',
                        color: color === 'primary' ? 'hsl(var(--primary))' : 'hsl(var(--accent-foreground))',
                    }}
                >
                    {t}
                </span>
            ))}
        </div>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{title}</h4>
            {children}
        </div>
    );
}

/* ────────────────── main modal ────────────────── */

interface RoommateProfileModalProps {
    userId: string | null;
    matchScore?: number;
    onClose: () => void;
}

export function RoommateProfileModal({ userId, matchScore, onClose }: RoommateProfileModalProps) {
    const [profile, setProfile] = useState<RoommatePublicProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            setProfile(null);
            return;
        }
        setLoading(true);
        setError(null);
        getRoommateProfileRequest(userId)
            .then((r) => setProfile(r.data))
            .catch((e) => setError(e instanceof Error ? e.message : 'Lỗi tải hồ sơ'))
            .finally(() => setLoading(false));
    }, [userId]);

    if (!userId) return null;

    const L = profile?.lifestyle;
    const P = profile?.preference;
    const U = profile?.user;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
                onClick={onClose}
            />

            {/* Centered modal */}
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
            <div
                className="relative w-full max-w-lg bg-background border border-border shadow-2xl rounded-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                    <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-primary" />
                        <h3 className="font-heading text-lg font-semibold text-foreground">Hồ sơ</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-muted transition-colors"
                        title="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {loading && (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    )}

                    {error && (
                        <div className="p-6 text-center">
                            <p className="text-destructive text-sm">{error}</p>
                        </div>
                    )}

                    {profile && !loading && (
                        <div className="space-y-6 p-6">
                            {/* Profile header */}
                            <div className="text-center space-y-3">
                                <ImageWithFallback
                                    src={U?.avatarUrl || AVATAR_PLACEHOLDER}
                                    alt={U?.fullName || ''}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-primary/20 mx-auto shadow-lg"
                                />
                                <div>
                                    <h2 className="font-heading text-xl font-bold text-foreground">
                                        {U?.fullName}
                                    </h2>
                                    {U?.gender && (
                                        <span className="text-sm text-muted-foreground">{U.gender}</span>
                                    )}
                                </div>

                                {matchScore != null && (
                                    <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                                        <Sparkles className="w-4 h-4" />
                                        {matchScore}% phù hợp
                                    </div>
                                )}

                                {U?.memberSince && (
                                    <p className="text-xs text-muted-foreground">
                                        Thành viên từ {new Date(U.memberSince).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                                    </p>
                                )}
                            </div>

                            <hr className="border-border" />

                            {/* Lifestyle */}
                            {L && (
                                <Section title="Phong cách sống">
                                    <div className="grid grid-cols-1 gap-0.5">
                                        <InfoRow icon={Cigarette} label="Hút thuốc" value={boolLabel(L.smoking)} />
                                        <InfoRow icon={Wine} label="Uống rượu/bia" value={boolLabel(L.drinking)} />
                                        <InfoRow icon={PawPrint} label="Nuôi thú cưng" value={boolLabel(L.pets_allowed)} />
                                        <InfoRow icon={Home} label="Làm việc tại nhà" value={boolLabel(L.work_from_home)} />
                                        <InfoRow icon={Moon} label="Lịch ngủ" value={L.sleep_schedule} />
                                        <InfoRow icon={Sun} label="Giờ dậy" value={L.wake_time} />
                                        <InfoRow icon={Moon} label="Giờ ngủ" value={L.bedtime} />
                                        <InfoRow icon={Shield} label="Sạch sẽ" value={L.cleanliness} />
                                        <InfoRow icon={Volume2} label="Chịu ồn" value={L.noise_tolerance} />
                                        <InfoRow icon={Users} label="Khách đến chơi" value={L.guest_frequency} />
                                        <InfoRow icon={UtensilsCrossed} label="Nấu ăn" value={L.cooking_frequency} />
                                        <InfoRow icon={UserCheck} label="Tính cách" value={L.personalityType} />
                                        <InfoRow icon={Users} label="Mức xã giao" value={L.social_level} />
                                        <InfoRow icon={Briefcase} label="Nghề nghiệp" value={L.occupation_type} />
                                        <InfoRow icon={ThermometerSun} label="Nhiệt độ" value={L.temperature_preference} />
                                        <InfoRow icon={Clock} label="Giờ yên tĩnh" value={L.quiet_hours_preference} />
                                        <InfoRow icon={CalendarDays} label="Thời hạn thuê mong muốn" value={L.preferred_lease_months ? `${L.preferred_lease_months} tháng` : null} />
                                    </div>

                                    {L.interests.length > 0 && (
                                        <div className="mt-3">
                                            <span className="text-xs text-muted-foreground block mb-1.5">Sở thích</span>
                                            <TagList items={L.interests} color="primary" />
                                        </div>
                                    )}

                                    {L.languages.length > 0 && (
                                        <div className="mt-3">
                                            <span className="text-xs text-muted-foreground block mb-1.5">Ngôn ngữ</span>
                                            <TagList items={L.languages} color="accent" />
                                        </div>
                                    )}
                                </Section>
                            )}

                            {!L && (
                                <Section title="Phong cách sống">
                                    <p className="text-sm text-muted-foreground italic">Chưa cập nhật thông tin lifestyle.</p>
                                </Section>
                            )}

                            <hr className="border-border" />

                            {/* Preferences */}
                            {P && (
                                <Section title="Sở thích tìm phòng">
                                    <div className="grid grid-cols-1 gap-0.5">
                                        {P.preferred_districts.length > 0 && (
                                            <InfoRow icon={MapPin} label="Khu vực ưu tiên" value={P.preferred_districts.join(', ')} />
                                        )}
                                        <InfoRow icon={DoorOpen} label="Loại phòng" value={P.room_type} />
                                        <InfoRow icon={Banknote} label="Ngân sách" value={formatBudget(P.budget_min, P.budget_max)} />
                                        <InfoRow icon={CalendarDays} label="Thời hạn thuê" value={P.preferred_lease_months ? `${P.preferred_lease_months} tháng` : null} />
                                        <InfoRow icon={PawPrint} label="Cho phép thú cưng" value={boolLabel(P.pet_friendly)} />
                                        <InfoRow icon={Bus} label="Gần phương tiện" value={boolLabel(P.transport_nearby)} />
                                    </div>

                                    {P.preferred_amenities.length > 0 && (
                                        <div className="mt-3">
                                            <span className="text-xs text-muted-foreground block mb-1.5">Tiện nghi ưu tiên</span>
                                            <TagList items={P.preferred_amenities} color="primary" />
                                        </div>
                                    )}

                                    {P.must_have_amenities.length > 0 && (
                                        <div className="mt-3">
                                            <span className="text-xs text-muted-foreground block mb-1.5">Tiện nghi bắt buộc</span>
                                            <TagList items={P.must_have_amenities} color="accent" />
                                        </div>
                                    )}
                                </Section>
                            )}

                            {!P && (
                                <Section title="Sở thích tìm phòng">
                                    <p className="text-sm text-muted-foreground italic">Chưa cập nhật sở thích tìm phòng.</p>
                                </Section>
                            )}
                        </div>
                    )}
                </div>
            </div>
            </div>
        </>
    );
}
