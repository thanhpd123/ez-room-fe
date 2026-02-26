import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/app/features/home/components';
import {
    User,
    Heart,
    Sliders,
    Loader2,
    Save,
    Mail,
    Phone,
    Check,
    Moon,
    Sparkles,
    MapPin,
    Banknote,
    Users,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { ImageUpload } from '@/app/components/ImageUpload';
import {
    updateProfileRequest,
    getLifestyleRequest,
    upsertLifestyleRequest,
    getPreferenceRequest,
    upsertPreferenceRequest,
} from '@/lib/api';

type Tab = 'profile' | 'lifestyle' | 'preference';

const PERSONALITY_OPTIONS = [
    { value: '', label: '— Chọn —' },
    { value: 'Hướng ngoại', label: 'Hướng ngoại' },
    { value: 'Hướng nội', label: 'Hướng nội' },
    { value: 'Yên tĩnh', label: 'Yên tĩnh' },
    { value: 'Dễ gần', label: 'Dễ gần' },
    { value: 'Năng động', label: 'Năng động' },
    { value: 'Khác', label: 'Khác' },
];

const GENDER_OPTIONS = [
    { value: '', label: '— Chọn —' },
    { value: 'Nam', label: 'Nam' },
    { value: 'Nữ', label: 'Nữ' },
    { value: 'Không yêu cầu', label: 'Không yêu cầu' },
];

const inputClass =
    'w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
const labelClass = 'block text-sm font-medium text-foreground mb-1.5';

export function ProfilePage() {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const [tab, setTab] = useState<Tab>('profile');

    const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', avatarUrl: '' });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState(false);

    const [lifestyle, setLifestyle] = useState({
        smoking: false,
        drinking: false,
        pets_allowed: false,
        sleep_schedule: '',
        personalityType: '',
    });
    const [lifestyleLoading, setLifestyleLoading] = useState(true);
    const [lifestyleSaving, setLifestyleSaving] = useState(false);
    const [lifestyleError, setLifestyleError] = useState<string | null>(null);
    const [lifestyleSuccess, setLifestyleSuccess] = useState(false);

    const [preference, setPreference] = useState({
        budget_min: '' as string | number,
        budget_max: '' as string | number,
        preferredLocation: '',
        preferred_gender: '',
    });
    const [preferenceLoading, setPreferenceLoading] = useState(true);
    const [preferenceSaving, setPreferenceSaving] = useState(false);
    const [preferenceError, setPreferenceError] = useState<string | null>(null);
    const [preferenceSuccess, setPreferenceSuccess] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileForm({
                fullName: user.fullName ?? '',
                phone: user.phone ?? '',
                avatarUrl: user.avatarUrl ?? '',
            });
        }
    }, [user]);

    useEffect(() => {
        getLifestyleRequest()
            .then((r) => {
                if (r.profile) {
                    setLifestyle({
                        smoking: !!r.profile.smoking,
                        drinking: !!r.profile.drinking,
                        pets_allowed: !!r.profile.pets_allowed,
                        sleep_schedule: r.profile.sleep_schedule ?? '',
                        personalityType: r.profile.personalityType ?? '',
                    });
                }
            })
            .catch(() => setLifestyleError('Không tải được'))
            .finally(() => setLifestyleLoading(false));
    }, []);

    useEffect(() => {
        getPreferenceRequest()
            .then((r) => {
                if (r.preference) {
                    setPreference({
                        budget_min: r.preference.budget_min ?? '',
                        budget_max: r.preference.budget_max ?? '',
                        preferredLocation: r.preference.preferredLocation ?? '',
                        preferred_gender: r.preference.preferred_gender ?? '',
                    });
                }
            })
            .catch(() => setPreferenceError('Không tải được'))
            .finally(() => setPreferenceLoading(false));
    }, []);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileError(null);
        setProfileSuccess(false);
        setProfileSaving(true);
        try {
            await updateProfileRequest({
                fullName: profileForm.fullName.trim(),
                phone: profileForm.phone.trim() || undefined,
                avatarUrl: profileForm.avatarUrl.trim() || undefined,
            });
            await refreshUser();
            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 3000);
        } catch (err) {
            setProfileError(err instanceof Error ? err.message : 'Lưu thất bại');
        } finally {
            setProfileSaving(false);
        }
    };

    const handleSaveLifestyle = async (e: React.FormEvent) => {
        e.preventDefault();
        setLifestyleError(null);
        setLifestyleSuccess(false);
        setLifestyleSaving(true);
        try {
            await upsertLifestyleRequest(lifestyle);
            setLifestyleSuccess(true);
            setTimeout(() => setLifestyleSuccess(false), 3000);
        } catch (err) {
            setLifestyleError(err instanceof Error ? err.message : 'Lưu thất bại');
        } finally {
            setLifestyleSaving(false);
        }
    };

    const handleSavePreference = async (e: React.FormEvent) => {
        e.preventDefault();
        setPreferenceError(null);
        setPreferenceSuccess(false);
        setPreferenceSaving(true);
        try {
            await upsertPreferenceRequest({
                budget_min: preference.budget_min === '' ? null : Number(preference.budget_min),
                budget_max: preference.budget_max === '' ? null : Number(preference.budget_max),
                preferredLocation: preference.preferredLocation || null,
                preferred_gender: preference.preferred_gender || null,
            });
            setPreferenceSuccess(true);
            setTimeout(() => setPreferenceSuccess(false), 3000);
        } catch (err) {
            setPreferenceError(err instanceof Error ? err.message : 'Lưu thất bại');
        } finally {
            setPreferenceSaving(false);
        }
    };

    const avatarUrl = profileForm.avatarUrl?.trim() || user?.avatarUrl;
    const tabs: { id: Tab; label: string; icon: typeof User }[] = [
        { id: 'profile', label: 'Thông tin cá nhân', icon: User },
        { id: 'lifestyle', label: 'Phong cách sống', icon: Heart },
        { id: 'preference', label: 'Sở thích tìm phòng', icon: Sliders },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Profile header card */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-6 sm:p-8 mb-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="relative shrink-0">
                            {avatarUrl ? (
                                <img
                                    src={avatarUrl}
                                    alt=""
                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-border"
                                />
                            ) : (
                                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-primary/10 flex items-center justify-center">
                                    <User className="w-12 h-12 sm:w-14 sm:h-14 text-primary" strokeWidth={1.5} />
                                </div>
                            )}
                        </div>
                        <div className="text-center sm:text-left flex-1 min-w-0">
                            <h1 className="font-heading text-xl sm:text-2xl font-bold text-foreground truncate">
                                {user?.fullName || 'Chưa có tên'}
                            </h1>
                            <p className="text-muted-foreground text-sm mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                                <Mail className="w-4 h-4 shrink-0" />
                                <span className="truncate">{user?.email || '—'}</span>
                            </p>
                            <div className="mt-3">
                                <span
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                        user?.role === 'LANDLORD'
                                            ? 'bg-accent/15 text-accent'
                                            : 'bg-primary/15 text-primary'
                                    }`}
                                >
                                    {user?.role === 'LANDLORD' ? 'Chủ nhà / Cho thuê' : 'Người thuê phòng'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <h2 className="font-heading text-lg font-bold text-foreground mb-4">Cài đặt</h2>
                <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                                tab === t.id
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'bg-muted text-foreground hover:bg-muted/80'
                            }`}
                        >
                            <t.icon className="w-4 h-4" strokeWidth={2} />
                            {t.label}
                        </button>
                    ))}
                </div>

                {tab === 'profile' && (
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                                <User className="w-4 h-4 text-primary" />
                                Thông tin cơ bản
                            </h3>
                            <p className="text-muted-foreground text-xs mt-0.5">
                                Họ tên, email, số điện thoại và ảnh đại diện
                            </p>
                        </div>
                        <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
                            {profileError && (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                                    {profileError}
                                </div>
                            )}
                            {profileSuccess && (
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm flex items-center gap-2">
                                    <Check className="w-4 h-4 shrink-0" />
                                    Đã lưu thay đổi
                                </div>
                            )}
                            <div>
                                <label className={labelClass}>Họ và tên</label>
                                <input
                                    value={profileForm.fullName}
                                    onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
                                    className={inputClass}
                                    placeholder="Nguyễn Văn A"
                                    required
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Email</label>
                                <input
                                    type="email"
                                    value={user?.email ?? ''}
                                    disabled
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-muted-foreground cursor-not-allowed"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Email không thể thay đổi</p>
                            </div>
                            <div>
                                <label className={labelClass}>Vai trò</label>
                                <div className="px-4 py-3 bg-muted border border-border rounded-xl text-muted-foreground text-sm">
                                    {user?.role === 'LANDLORD' ? 'Chủ nhà / Cho thuê (Landlord)' : 'Người thuê phòng (Tenant)'}
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Số điện thoại</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type="tel"
                                        value={profileForm.phone}
                                        onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                                        placeholder="0123456789"
                                        className={`${inputClass} pl-11`}
                                    />
                                </div>
                            </div>
                            <div>
                                <ImageUpload
                                    label="Ảnh đại diện"
                                    value={profileForm.avatarUrl}
                                    onChange={(url) => setProfileForm((f) => ({ ...f, avatarUrl: url }))}
                                    placeholder="Chọn ảnh từ máy tính"
                                    previewClassName="w-24 h-24 rounded-xl object-cover border border-border"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={profileSaving}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm"
                            >
                                {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Lưu thay đổi
                            </button>
                        </form>
                    </div>
                )}

                {tab === 'lifestyle' && (
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                                <Heart className="w-4 h-4 text-primary" />
                                Phong cách sống
                            </h3>
                            <p className="text-muted-foreground text-xs mt-0.5">
                                Thói quen và tính cách để tìm bạn ở ghép phù hợp
                            </p>
                        </div>
                        {lifestyleLoading ? (
                            <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
                        ) : (
                            <form onSubmit={handleSaveLifestyle} className="p-6 space-y-6">
                                {lifestyleError && (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                                        {lifestyleError}
                                    </div>
                                )}
                                {lifestyleSuccess && (
                                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm flex items-center gap-2">
                                        <Check className="w-4 h-4 shrink-0" />
                                        Đã lưu
                                    </div>
                                )}
                                <div>
                                    <span className={labelClass}>Thói quen</span>
                                    <div className="flex flex-wrap gap-4 sm:gap-6 mt-2">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={lifestyle.smoking}
                                                onChange={(e) => setLifestyle((l) => ({ ...l, smoking: e.target.checked }))}
                                                className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20"
                                            />
                                            <span className="text-foreground group-hover:text-primary transition-colors">Hút thuốc</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={lifestyle.drinking}
                                                onChange={(e) => setLifestyle((l) => ({ ...l, drinking: e.target.checked }))}
                                                className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20"
                                            />
                                            <span className="text-foreground group-hover:text-primary transition-colors">Uống rượu bia</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={lifestyle.pets_allowed}
                                                onChange={(e) => setLifestyle((l) => ({ ...l, pets_allowed: e.target.checked }))}
                                                className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20"
                                            />
                                            <span className="text-foreground group-hover:text-primary transition-colors">Nuôi thú cưng</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        <Moon className="w-4 h-4 inline mr-1.5 -mt-0.5 text-muted-foreground" />
                                        Lịch ngủ
                                    </label>
                                    <input
                                        value={lifestyle.sleep_schedule}
                                        onChange={(e) => setLifestyle((l) => ({ ...l, sleep_schedule: e.target.value }))}
                                        placeholder="VD: 22h - 6h, hoặc Sớm / Muộn"
                                        className={inputClass}
                                        maxLength={50}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        <Sparkles className="w-4 h-4 inline mr-1.5 -mt-0.5 text-muted-foreground" />
                                        Kiểu tính cách
                                    </label>
                                    <select
                                        value={lifestyle.personalityType}
                                        onChange={(e) => setLifestyle((l) => ({ ...l, personalityType: e.target.value }))}
                                        className={inputClass}
                                    >
                                        {PERSONALITY_OPTIONS.map((o) => (
                                            <option key={o.value || 'empty'} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={lifestyleSaving}
                                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm"
                                >
                                    {lifestyleSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {tab === 'preference' && (
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-primary" />
                                Sở thích tìm phòng
                            </h3>
                            <p className="text-muted-foreground text-xs mt-0.5">
                                Ngân sách và khu vực, giới tính bạn ở ghép
                            </p>
                        </div>
                        {preferenceLoading ? (
                            <div className="p-8 text-center text-muted-foreground">Đang tải...</div>
                        ) : (
                            <form onSubmit={handleSavePreference} className="p-6 space-y-5">
                                {preferenceError && (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                                        {preferenceError}
                                    </div>
                                )}
                                {preferenceSuccess && (
                                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm flex items-center gap-2">
                                        <Check className="w-4 h-4 shrink-0" />
                                        Đã lưu
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>
                                            <Banknote className="w-4 h-4 inline mr-1.5 -mt-0.5 text-muted-foreground" />
                                            Ngân sách tối thiểu (VNĐ/tháng)
                                        </label>
                                        <input
                                            type="number"
                                            value={preference.budget_min}
                                            onChange={(e) => setPreference((p) => ({ ...p, budget_min: e.target.value }))}
                                            placeholder="0"
                                            min={0}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>
                                            <Banknote className="w-4 h-4 inline mr-1.5 -mt-0.5 text-muted-foreground" />
                                            Ngân sách tối đa (VNĐ/tháng)
                                        </label>
                                        <input
                                            type="number"
                                            value={preference.budget_max}
                                            onChange={(e) => setPreference((p) => ({ ...p, budget_max: e.target.value }))}
                                            placeholder="0"
                                            min={0}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        <MapPin className="w-4 h-4 inline mr-1.5 -mt-0.5 text-muted-foreground" />
                                        Khu vực ưa thích
                                    </label>
                                    <input
                                        value={preference.preferredLocation}
                                        onChange={(e) => setPreference((p) => ({ ...p, preferredLocation: e.target.value }))}
                                        placeholder="VD: Quận 1, Quận 7, Bình Thạnh"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        <Users className="w-4 h-4 inline mr-1.5 -mt-0.5 text-muted-foreground" />
                                        Giới tính bạn ở ghép ưa thích
                                    </label>
                                    <select
                                        value={preference.preferred_gender}
                                        onChange={(e) => setPreference((p) => ({ ...p, preferred_gender: e.target.value }))}
                                        className={inputClass}
                                    >
                                        {GENDER_OPTIONS.map((o) => (
                                            <option key={o.value || 'empty'} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={preferenceSaving}
                                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm"
                                >
                                    {preferenceSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Lưu
                                </button>
                            </form>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
