import { useState, useEffect } from 'react';
import {
    X,
    Loader2,
    Cigarette,
    Wine,
    PawPrint,
    Moon,
    Sparkles,
    Users,
    Volume2,
    UserCheck,
    Shield,
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
    const [loading, setLoading] = useState(!!userId);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) {
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const r = await getRoommateProfileRequest(userId);
                setProfile(r.data);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Lỗi tải hồ sơ');
            } finally {
                setLoading(false);
            }
        };

        void fetchData();
    }, [userId]);

    if (!userId) return null;

    const L = profile?.lifestyle;
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
                                            <InfoRow icon={Moon} label="Lịch ngủ" value={L.sleep_schedule} />
                                            <InfoRow icon={UserCheck} label="Tính cách" value={L.personalityType} />
                                            <InfoRow icon={Shield} label="Sạch sẽ" value={L.cleanliness} />
                                            <InfoRow icon={Volume2} label="Chịu ồn" value={L.noise_tolerance} />
                                            <InfoRow icon={Users} label="Khách đến chơi" value={L.guest_frequency} />
                                        </div>

                                        {/* ★ Interests – highlighted */}
                                        {L.interests.length > 0 && (
                                            <div className="mt-4 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/30">
                                                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 block mb-2">★ Sở thích</span>
                                                <TagList items={L.interests} color="primary" />
                                            </div>
                                        )}

                                        {/* Languages */}
                                        {L.languages && L.languages.length > 0 && (
                                            <div className="mt-3 p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-800/30">
                                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 block mb-2">🗣️ Ngôn ngữ</span>
                                                <TagList items={L.languages} color="primary" />
                                            </div>
                                        )}

                                        {/* ★ Deal-breakers – highlighted */}
                                        {L.deal_breakers && (
                                            <div className="mt-3 p-3 rounded-xl bg-red-50/80 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30">
                                                <span className="text-xs font-semibold text-red-600 dark:text-red-300 block mb-2">★ Điều không chấp nhận</span>
                                                <p className="text-sm text-red-700 dark:text-red-200">{L.deal_breakers}</p>
                                            </div>
                                        )}
                                    </Section>
                                )}

                                {!L && (
                                    <Section title="Phong cách sống">
                                        <p className="text-sm text-muted-foreground italic">Chưa cập nhật thông tin lifestyle.</p>
                                    </Section>
                                )}

                                {/* Preferences – hidden temporarily */}
                                {/* <hr className="border-border" />

                            {P && (
                                <Section title="Sở thích tìm phòng">
                                    ...
                                </Section>
                            )}

                            {!P && (
                                <Section title="Sở thích tìm phòng">
                                    <p className="text-sm text-muted-foreground italic">Chưa cập nhật sở thích tìm phòng.</p>
                                </Section>
                            )} */}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
