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
    Crown,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { ImageUpload } from '@/app/components/ImageUpload';
import { useProvinces } from '@/app/hooks/useProvinces';
import {
    updateProfileRequest,
    getLifestyleRequest,
    upsertLifestyleRequest,
    getPreferenceRequest,
    upsertPreferenceRequest,
    type LifestyleProfileResponse,
    type UserPreferenceResponse,
} from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import type { ProvinceItem, WardItem } from '@/lib/provinces-api';

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

/** Gender in profile – used for roommate matching (same gender). */
const PROFILE_GENDER_OPTIONS = [
    { value: '', label: '— Chọn —' },
    { value: 'Nam', label: 'Nam' },
    { value: 'Nữ', label: 'Nữ' },
    { value: 'Khác', label: 'Khác' },
    { value: 'Không tiết lộ', label: 'Không tiết lộ' },
];

const ROOM_TYPE_OPTIONS = [
    { value: '', label: '— Chọn —' },
    { value: 'PRIVATE', label: 'Phòng riêng' },
    { value: 'SHARED', label: 'Ở ghép' },
    { value: 'STUDIO', label: 'Studio' },
    { value: 'APARTMENT', label: 'Căn hộ' },
];

const SLEEP_SCHEDULE_OPTIONS = [
    { value: '', label: '— Chọn —' },
    { value: 'Sớm (trước 22h)', label: 'Sớm (trước 22h)' },
    { value: 'Bình thường (22h-0h)', label: 'Bình thường (22h-0h)' },
    { value: 'Khuya (sau 0h)', label: 'Khuya (sau 0h)' },
];

const CLEANLINESS_OPTIONS = [
    { value: '', label: '— Chọn —' },
    { value: 'Rất sạch', label: 'Rất sạch' },
    { value: 'Sạch', label: 'Sạch' },
    { value: 'Bình thường', label: 'Bình thường' },
    { value: 'Không quan tâm', label: 'Không quan tâm' },
];

const NOISE_TOLERANCE_OPTIONS = [
    { value: '', label: '— Chọn —' },
    { value: 'Thấp', label: 'Thấp' },
    { value: 'Trung bình', label: 'Trung bình' },
    { value: 'Cao', label: 'Cao' },
];

const COOKING_FREQUENCY_OPTIONS = [
    { value: '', label: '— Chọn —' },
    { value: 'Không nấu', label: 'Không nấu' },
    { value: 'Ít', label: 'Ít' },
    { value: 'Thường xuyên', label: 'Thường xuyên' },
    { value: 'Hàng ngày', label: 'Hàng ngày' },
];

const GUEST_FREQUENCY_OPTIONS = [
    { value: '', label: '— Chọn —' },
    { value: 'Không bao giờ', label: 'Không bao giờ' },
    { value: 'Hiếm', label: 'Hiếm' },
    { value: 'Thỉnh thoảng', label: 'Thỉnh thoảng' },
    { value: 'Thường xuyên', label: 'Thường xuyên' },
];

const SOCIAL_LEVEL_OPTIONS = [
    { value: '', label: '— Chọn —' },
    { value: 'Thấp', label: 'Thấp' },
    { value: 'Trung bình', label: 'Trung bình' },
    { value: 'Cao', label: 'Cao' },
];

const OCCUPATION_OPTIONS = [
    { value: '', label: '— Chọn —' },
    { value: 'Sinh viên', label: 'Sinh viên' },
    { value: 'Văn phòng', label: 'Văn phòng' },
    { value: 'Freelancer', label: 'Freelancer' },
    { value: 'Kinh doanh', label: 'Kinh doanh' },
    { value: 'Khác', label: 'Khác' },
];

const TEMPERATURE_OPTIONS = [
    { value: '', label: '— Chọn —' },
    { value: 'Lạnh', label: 'Lạnh' },
    { value: 'Mát', label: 'Mát' },
    { value: 'Bình thường', label: 'Bình thường' },
    { value: 'Ấm', label: 'Ấm' },
];

const QUIET_HOURS_OPTIONS = [
    { value: '', label: '— Chọn —' },
    { value: '21h-6h', label: '21h - 6h' },
    { value: '22h-7h', label: '22h - 7h' },
    { value: '23h-8h', label: '23h - 8h' },
    { value: 'Không cần', label: 'Không cần' },
];

type PreferenceFormState = ReturnType<typeof toPreferenceForm>;

function PreferredDistrictsField({
    preference,
    setPreference,
    labelClass,
    inputClass,
}: {
    preference: PreferenceFormState;
    setPreference: React.Dispatch<React.SetStateAction<PreferenceFormState>>;
    labelClass: string;
    inputClass: string;
}) {
    const [selectedProvince, setSelectedProvince] = useState('');
    const { provinces, getWardsFor } = useProvinces();
    const wardList = selectedProvince ? getWardsFor(selectedProvince) : [];
    const preferredSet = new Set(
        (preference.preferred_districts ?? '')
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
    );

    const toggleWard = (wardName: string) => {
        const next = new Set(preferredSet);
        if (next.has(wardName)) next.delete(wardName);
        else next.add(wardName);
        setPreference((p: PreferenceFormState) => ({ ...p, preferred_districts: Array.from(next).join(', ') }));
    };

    return (
        <div className="space-y-3">
            <label className={labelClass}>Phường/xã ưa thích</label>
            <input
                value={preference.preferred_districts ?? ''}
                onChange={(e) => setPreference((p: PreferenceFormState) => ({ ...p, preferred_districts: e.target.value }))}
                placeholder="VD: Phường Ba Đình, Phường Cầu Giấy (hoặc chọn bên dưới)"
                className={inputClass}
            />
            <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-sm font-medium text-muted-foreground mb-2">Chọn từ danh sách (34 tỉnh/thành → phường/xã)</p>
                <select
                    value={selectedProvince}
                    onChange={(e) => setSelectedProvince(e.target.value)}
                    className={`${inputClass} mb-3`}
                >
                    <option value="">Chọn tỉnh / thành phố</option>
                    {provinces.map((p: ProvinceItem) => (
                        <option key={p.code} value={p.name}>{p.name}</option>
                    ))}
                </select>
                {wardList.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {wardList.map((w: WardItem) => (
                            <label key={w.code} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={preferredSet.has(w.name)}
                                    onChange={() => toggleWard(w.name)}
                                    className="rounded border-border text-primary"
                                />
                                <span className="text-sm">{w.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function toLifestyleForm(p: LifestyleProfileResponse | null) {
    if (!p) {
        return {
            smoking: false,
            drinking: false,
            pets_allowed: false,
            sleep_schedule: '',
            personalityType: '',
            cleanliness: '',
            noise_tolerance: '',
            guest_frequency: '',
            cooking_frequency: '',
            work_from_home: false,
            wake_time: '',
            bedtime: '',
            social_level: '',
            occupation_type: '',
            interests: ([] as string[]).join(', '),
            languages: ([] as string[]).join(', '),
            preferred_lease_months: '' as number | '',
            move_in_date: '',
            temperature_preference: '',
            quiet_hours_preference: '',
        };
    }
    return {
        smoking: !!p.smoking,
        drinking: !!p.drinking,
        pets_allowed: !!p.pets_allowed,
        sleep_schedule: p.sleep_schedule ?? '',
        personalityType: p.personalityType ?? '',
        cleanliness: p.cleanliness ?? '',
        noise_tolerance: p.noise_tolerance ?? '',
        guest_frequency: p.guest_frequency ?? '',
        cooking_frequency: p.cooking_frequency ?? '',
        work_from_home: !!p.work_from_home,
        wake_time: p.wake_time ?? '',
        bedtime: p.bedtime ?? '',
        social_level: p.social_level ?? '',
        occupation_type: p.occupation_type ?? '',
        interests: (p.interests ?? []).join(', '),
        languages: (p.languages ?? []).join(', '),
        preferred_lease_months: (p.preferred_lease_months ?? '') as number | '',
        move_in_date: p.move_in_date ?? '',
        temperature_preference: p.temperature_preference ?? '',
        quiet_hours_preference: p.quiet_hours_preference ?? '',
    };
}

function toPreferenceForm(p: UserPreferenceResponse | null) {
    if (!p) {
        return {
            budget_min: '' as number | '',
            budget_max: '' as number | '',
            preferredLocation: '',
            preferred_districts: '',
            room_type: '',
            preferred_amenities: '',
            must_have_amenities: '',
            preferred_lease_months: '' as number | '',
            move_in_date_min: '',
            move_in_date_max: '',
            max_distance_km: '' as number | '',
            transport_nearby: null as boolean | null,
            pet_friendly: null as boolean | null,
            preferred_roommate_age_min: '' as number | '',
            preferred_roommate_age_max: '' as number | '',
            lifestyle_match_weight: '' as number | '',
            safety_priority: '' as number | '',
        };
    }
    return {
        budget_min: p.budget_min ?? ('' as number | ''),
        budget_max: p.budget_max ?? ('' as number | ''),
        preferredLocation: p.preferredLocation ?? '',
        preferred_districts: (p.preferred_districts ?? []).join(', '),
        room_type: p.room_type ?? '',
        preferred_amenities: (p.preferred_amenities ?? []).join(', '),
        must_have_amenities: (p.must_have_amenities ?? []).join(', '),
        preferred_lease_months: (p.preferred_lease_months ?? '') as number | '',
        move_in_date_min: p.move_in_date_min ?? '',
        move_in_date_max: p.move_in_date_max ?? '',
        max_distance_km: (p.max_distance_km ?? '') as number | '',
        transport_nearby: p.transport_nearby ?? null,
        pet_friendly: p.pet_friendly ?? null,
        preferred_roommate_age_min: (p.preferred_roommate_age_min ?? '') as number | '',
        preferred_roommate_age_max: (p.preferred_roommate_age_max ?? '') as number | '',
        lifestyle_match_weight: (p.lifestyle_match_weight ?? '') as number | '',
        safety_priority: (p.safety_priority ?? '') as number | '',
    };
}

const inputClass =
    'w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
const labelClass = 'block text-sm font-medium text-foreground mb-1.5';

export function ProfilePage() {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const [tab, setTab] = useState<Tab>('profile');

    const [profileForm, setProfileForm] = useState({ fullName: '', phone: '', avatarUrl: '', gender: '' });
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);
    const [profileSuccess, setProfileSuccess] = useState(false);

    const [lifestyle, setLifestyle] = useState(toLifestyleForm(null));
    const [lifestyleLoading, setLifestyleLoading] = useState(true);
    const [lifestyleSaving, setLifestyleSaving] = useState(false);
    const [lifestyleError, setLifestyleError] = useState<string | null>(null);
    const [lifestyleSuccess, setLifestyleSuccess] = useState(false);

    const [preference, setPreference] = useState(toPreferenceForm(null));
    const [preferenceLoading, setPreferenceLoading] = useState(true);
    const [preferenceSaving, setPreferenceSaving] = useState(false);
    const [preferenceError, setPreferenceError] = useState<string | null>(null);
    const [preferenceSuccess, setPreferenceSuccess] = useState(false);
    const canUpgradeVip =
        user != null &&
        (user.role === 'TENANT' || user.role === 'LANDLORD') &&
        user.isVip !== true;

    useEffect(() => {
        if (user) {
            setProfileForm({
                fullName: user.fullName ?? '',
                phone: user.phone ?? '',
                avatarUrl: user.avatarUrl ?? '',
                gender: user.gender ?? '',
            });
        }
    }, [user]);

    useEffect(() => {
        getLifestyleRequest()
            .then((r) => setLifestyle(toLifestyleForm(r.profile ?? null)))
            .catch(() => setLifestyleError('Không tải được'))
            .finally(() => setLifestyleLoading(false));
    }, []);

    useEffect(() => {
        getPreferenceRequest()
            .then((r) => setPreference(toPreferenceForm(r.preference ?? null)))
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
                gender: profileForm.gender.trim() || null,
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
            const interests = lifestyle.interests
                ? lifestyle.interests.split(',').map((s) => s.trim()).filter(Boolean)
                : [];
            const languages = lifestyle.languages
                ? lifestyle.languages.split(',').map((s) => s.trim()).filter(Boolean)
                : [];
            await upsertLifestyleRequest({
                smoking: lifestyle.smoking,
                drinking: lifestyle.drinking,
                pets_allowed: lifestyle.pets_allowed,
                sleep_schedule: lifestyle.sleep_schedule || null,
                personalityType: lifestyle.personalityType || null,
                cleanliness: lifestyle.cleanliness || null,
                noise_tolerance: lifestyle.noise_tolerance || null,
                guest_frequency: lifestyle.guest_frequency || null,
                cooking_frequency: lifestyle.cooking_frequency || null,
                work_from_home: lifestyle.work_from_home,
                wake_time: lifestyle.wake_time || null,
                bedtime: lifestyle.bedtime || null,
                social_level: lifestyle.social_level || null,
                occupation_type: lifestyle.occupation_type || null,
                interests,
                languages,
                preferred_lease_months: lifestyle.preferred_lease_months === '' ? null : Number(lifestyle.preferred_lease_months),
                move_in_date: lifestyle.move_in_date || null,
                temperature_preference: lifestyle.temperature_preference || null,
                quiet_hours_preference: lifestyle.quiet_hours_preference || null,
            });
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
            const preferred_districts = preference.preferred_districts
                ? preference.preferred_districts.split(',').map((s) => s.trim()).filter(Boolean)
                : [];
            const preferred_amenities = preference.preferred_amenities
                ? preference.preferred_amenities.split(',').map((s) => s.trim()).filter(Boolean)
                : [];
            const must_have_amenities = preference.must_have_amenities
                ? preference.must_have_amenities.split(',').map((s) => s.trim()).filter(Boolean)
                : [];
            await upsertPreferenceRequest({
                budget_min: preference.budget_min === '' ? null : Number(preference.budget_min),
                budget_max: preference.budget_max === '' ? null : Number(preference.budget_max),
                preferredLocation: preference.preferredLocation || null,
                preferred_districts,
                room_type: preference.room_type || null,
                preferred_amenities,
                must_have_amenities,
                preferred_lease_months: preference.preferred_lease_months === '' ? null : Number(preference.preferred_lease_months),
                move_in_date_min: preference.move_in_date_min || null,
                move_in_date_max: preference.move_in_date_max || null,
                max_distance_km: preference.max_distance_km === '' ? null : Number(preference.max_distance_km),
                transport_nearby: preference.transport_nearby,
                pet_friendly: preference.pet_friendly,
                preferred_roommate_age_min: preference.preferred_roommate_age_min === '' ? null : Number(preference.preferred_roommate_age_min),
                preferred_roommate_age_max: preference.preferred_roommate_age_max === '' ? null : Number(preference.preferred_roommate_age_max),
                lifestyle_match_weight: preference.lifestyle_match_weight === '' ? null : Number(preference.lifestyle_match_weight),
                safety_priority: preference.safety_priority === '' ? null : Number(preference.safety_priority),
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
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
                {/* Profile header card */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
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
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${user?.role === 'LANDLORD'
                                        ? 'bg-accent/15 text-accent'
                                        : 'bg-primary/15 text-primary'
                                        }`}
                                >
                                    {user?.role === 'LANDLORD' ? 'Chủ nhà / Cho thuê' : 'Người thuê phòng'}
                                </span>
                            </div>
                            <div className="mt-4">
                                {canUpgradeVip ? (
                                    <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
                                        <p className="text-sm text-amber-900">Bạn đang dùng tài khoản thường. Nâng cấp VIP để mở thêm quyền lợi nâng cao.</p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                trackEvent('vip_cta_clicked', { source: 'profile' });
                                                navigate('/vip-plans?source=profile');
                                            }}
                                            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                                        >
                                            <Crown className="h-3.5 w-3.5" />
                                            Nâng cấp VIP
                                        </button>
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        <Crown className="h-3.5 w-3.5" />
                                        Tài khoản VIP đang hoạt động
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <h2 className="font-heading text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Cài đặt</h2>
                <div className="flex flex-wrap gap-2 mb-4 sm:mb-6 border-b border-border pb-4 -mx-1 overflow-x-auto scrollbar-hide">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 rounded-xl font-medium text-xs sm:text-sm transition-all shrink-0 min-h-11 touch-manipulation ${tab === t.id
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
                                <label className={labelClass}>Giới tính</label>
                                <select
                                    value={profileForm.gender}
                                    onChange={(e) => setProfileForm((f) => ({ ...f, gender: e.target.value }))}
                                    className={inputClass}
                                >
                                    {PROFILE_GENDER_OPTIONS.map((o) => (
                                        <option key={o.value || 'empty'} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground mt-1">Dùng để ghép bạn ở cùng người cùng giới tính</p>
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
                                    <select
                                        value={lifestyle.sleep_schedule}
                                        onChange={(e) => setLifestyle((l) => ({ ...l, sleep_schedule: e.target.value }))}
                                        className={inputClass}
                                    >
                                        {SLEEP_SCHEDULE_OPTIONS.map((o) => (
                                            <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
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
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Giờ thức dậy</label>
                                        <input
                                            value={lifestyle.wake_time}
                                            onChange={(e) => setLifestyle((l) => ({ ...l, wake_time: e.target.value }))}
                                            placeholder="VD: 6h30"
                                            className={inputClass}
                                            maxLength={50}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Giờ đi ngủ</label>
                                        <input
                                            value={lifestyle.bedtime}
                                            onChange={(e) => setLifestyle((l) => ({ ...l, bedtime: e.target.value }))}
                                            placeholder="VD: 23h"
                                            className={inputClass}
                                            maxLength={50}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Độ sạch sẽ</label>
                                    <select
                                        value={lifestyle.cleanliness}
                                        onChange={(e) => setLifestyle((l) => ({ ...l, cleanliness: e.target.value }))}
                                        className={inputClass}
                                    >
                                        {CLEANLINESS_OPTIONS.map((o) => (
                                            <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Chịu ồn</label>
                                    <select
                                        value={lifestyle.noise_tolerance}
                                        onChange={(e) => setLifestyle((l) => ({ ...l, noise_tolerance: e.target.value }))}
                                        className={inputClass}
                                    >
                                        {NOISE_TOLERANCE_OPTIONS.map((o) => (
                                            <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Tần suất nấu ăn</label>
                                    <select
                                        value={lifestyle.cooking_frequency}
                                        onChange={(e) => setLifestyle((l) => ({ ...l, cooking_frequency: e.target.value }))}
                                        className={inputClass}
                                    >
                                        {COOKING_FREQUENCY_OPTIONS.map((o) => (
                                            <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Khách tới chơi</label>
                                    <select
                                        value={lifestyle.guest_frequency}
                                        onChange={(e) => setLifestyle((l) => ({ ...l, guest_frequency: e.target.value }))}
                                        className={inputClass}
                                    >
                                        {GUEST_FREQUENCY_OPTIONS.map((o) => (
                                            <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Mức độ giao tiếp</label>
                                    <select
                                        value={lifestyle.social_level}
                                        onChange={(e) => setLifestyle((l) => ({ ...l, social_level: e.target.value }))}
                                        className={inputClass}
                                    >
                                        {SOCIAL_LEVEL_OPTIONS.map((o) => (
                                            <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>Nghề nghiệp / loại công việc</label>
                                    <select
                                        value={lifestyle.occupation_type}
                                        onChange={(e) => setLifestyle((l) => ({ ...l, occupation_type: e.target.value }))}
                                        className={inputClass}
                                    >
                                        {OCCUPATION_OPTIONS.map((o) => (
                                            <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={lifestyle.work_from_home}
                                        onChange={(e) => setLifestyle((l) => ({ ...l, work_from_home: e.target.checked }))}
                                        className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20"
                                    />
                                    <span className="text-foreground group-hover:text-primary transition-colors">Làm việc từ xa (WFH)</span>
                                </label>
                                <div>
                                    <label className={labelClass}>Sở thích (cách nhau bằng dấu phẩy)</label>
                                    <input
                                        value={lifestyle.interests}
                                        onChange={(e) => setLifestyle((l) => ({ ...l, interests: e.target.value }))}
                                        placeholder="VD: Đọc sách, Thể thao, Du lịch"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Ngôn ngữ (cách nhau bằng dấu phẩy)</label>
                                    <input
                                        value={lifestyle.languages}
                                        onChange={(e) => setLifestyle((l) => ({ ...l, languages: e.target.value }))}
                                        placeholder="VD: Tiếng Việt, English"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Thời hạn thuê ưa thích (tháng)</label>
                                        <input
                                            type="number"
                                            value={lifestyle.preferred_lease_months}
                                            onChange={(e) => setLifestyle((l) => ({ ...l, preferred_lease_months: e.target.value === '' ? '' : Number(e.target.value) }))}
                                            placeholder="VD: 12"
                                            min={1}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Ngày dự định chuyển vào</label>
                                        <input
                                            type="date"
                                            value={lifestyle.move_in_date}
                                            onChange={(e) => setLifestyle((l) => ({ ...l, move_in_date: e.target.value }))}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Nhiệt độ ưa thích</label>
                                        <select
                                            value={lifestyle.temperature_preference}
                                            onChange={(e) => setLifestyle((l) => ({ ...l, temperature_preference: e.target.value }))}
                                            className={inputClass}
                                        >
                                            {TEMPERATURE_OPTIONS.map((o) => (
                                                <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Giờ giữ yên tĩnh</label>
                                        <select
                                            value={lifestyle.quiet_hours_preference}
                                            onChange={(e) => setLifestyle((l) => ({ ...l, quiet_hours_preference: e.target.value }))}
                                            className={inputClass}
                                        >
                                            {QUIET_HOURS_OPTIONS.map((o) => (
                                                <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </div>
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
                                            onChange={(e) => setPreference((p) => ({ ...p, budget_min: e.target.value === '' ? '' : (Number(e.target.value) || 0) }))}
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
                                            onChange={(e) => setPreference((p) => ({ ...p, budget_max: e.target.value === '' ? '' : (Number(e.target.value) || 0) }))}
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
                                    <label className={labelClass}>Loại phòng ưa thích</label>
                                    <select
                                        value={preference.room_type}
                                        onChange={(e) => setPreference((p) => ({ ...p, room_type: e.target.value }))}
                                        className={inputClass}
                                    >
                                        {ROOM_TYPE_OPTIONS.map((o) => (
                                            <option key={o.value || 'empty'} value={o.value}>
                                                {o.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <PreferredDistrictsField preference={preference} setPreference={setPreference} labelClass={labelClass} inputClass={inputClass} />
                                <div>
                                    <label className={labelClass}>Tiện nghi mong muốn (cách nhau bằng dấu phẩy)</label>
                                    <input
                                        value={preference.preferred_amenities}
                                        onChange={(e) => setPreference((p) => ({ ...p, preferred_amenities: e.target.value }))}
                                        placeholder="VD: Điều hòa, Wifi, Máy giặt"
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Tiện nghi bắt buộc (cách nhau bằng dấu phẩy)</label>
                                    <input
                                        value={preference.must_have_amenities}
                                        onChange={(e) => setPreference((p) => ({ ...p, must_have_amenities: e.target.value }))}
                                        placeholder="VD: Điều hòa, Chỗ để xe"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Thời hạn thuê ưa thích (tháng)</label>
                                        <input
                                            type="number"
                                            value={preference.preferred_lease_months}
                                            onChange={(e) => setPreference((p) => ({ ...p, preferred_lease_months: e.target.value === '' ? '' : Number(e.target.value) }))}
                                            placeholder="VD: 12"
                                            min={1}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Khoảng cách tối đa (km)</label>
                                        <input
                                            type="number"
                                            value={preference.max_distance_km}
                                            onChange={(e) => setPreference((p) => ({ ...p, max_distance_km: e.target.value === '' ? '' : Number(e.target.value) }))}
                                            placeholder="VD: 5"
                                            min={0}
                                            step={0.5}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Từ ngày chuyển vào</label>
                                        <input
                                            type="date"
                                            value={preference.move_in_date_min}
                                            onChange={(e) => setPreference((p) => ({ ...p, move_in_date_min: e.target.value }))}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Đến ngày chuyển vào</label>
                                        <input
                                            type="date"
                                            value={preference.move_in_date_max}
                                            onChange={(e) => setPreference((p) => ({ ...p, move_in_date_max: e.target.value }))}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={preference.transport_nearby === true}
                                            onChange={(e) => setPreference((p) => ({ ...p, transport_nearby: e.target.checked || null }))}
                                            className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20"
                                        />
                                        <span className="text-foreground group-hover:text-primary transition-colors">Gần phương tiện công cộng</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={preference.pet_friendly === true}
                                            onChange={(e) => setPreference((p) => ({ ...p, pet_friendly: e.target.checked || null }))}
                                            className="w-5 h-5 rounded border-border text-primary focus:ring-primary/20"
                                        />
                                        <span className="text-foreground group-hover:text-primary transition-colors">Cho phép thú cưng</span>
                                    </label>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Tuổi bạn ở ghép từ</label>
                                        <input
                                            type="number"
                                            value={preference.preferred_roommate_age_min}
                                            onChange={(e) => setPreference((p) => ({ ...p, preferred_roommate_age_min: e.target.value === '' ? '' : Number(e.target.value) }))}
                                            placeholder="VD: 20"
                                            min={18}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Tuổi bạn ở ghép đến</label>
                                        <input
                                            type="number"
                                            value={preference.preferred_roommate_age_max}
                                            onChange={(e) => setPreference((p) => ({ ...p, preferred_roommate_age_max: e.target.value === '' ? '' : Number(e.target.value) }))}
                                            placeholder="VD: 35"
                                            min={18}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Trọng số khớp phong cách (0–1)</label>
                                        <input
                                            type="number"
                                            value={preference.lifestyle_match_weight}
                                            onChange={(e) => setPreference((p) => ({ ...p, lifestyle_match_weight: e.target.value === '' ? '' : Number(e.target.value) }))}
                                            placeholder="VD: 0.5"
                                            min={0}
                                            max={1}
                                            step={0.1}
                                            className={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Mức ưu tiên an ninh (số)</label>
                                        <input
                                            type="number"
                                            value={preference.safety_priority}
                                            onChange={(e) => setPreference((p) => ({ ...p, safety_priority: e.target.value === '' ? '' : Number(e.target.value) }))}
                                            placeholder="VD: 5"
                                            min={0}
                                            className={inputClass}
                                        />
                                    </div>
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
