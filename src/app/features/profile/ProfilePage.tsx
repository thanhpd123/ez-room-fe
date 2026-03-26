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
    Lock,
    Eye,
    EyeOff,
    Circle,
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
    getCitizenCardRequest,
    upsertCitizenCardRequest,
    registerLandlordRequest,
    changePasswordRequest,
    type CitizenCardVerificationResponse,
    type LifestyleProfileResponse,
    type UserPreferenceResponse,
} from '@/lib/api';
import type { ProvinceItem, WardItem } from '@/lib/provinces-api';

type Tab = 'profile' | 'lifestyle' | 'preference' | 'landlord' | 'password';

function passwordStrength(pwd: string) {
    return {
        length: pwd.length >= 8,
        upper: /[A-Z]/.test(pwd),
        number: /[0-9]/.test(pwd),
        special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pwd),
    };
}

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

const CLEANLINESS_OPTIONS = ['Rất sạch sẽ', 'Sạch sẽ', 'Bình thường', 'Không quá quan trọng'];
const NOISE_TOLERANCE_OPTIONS = ['Rất thấp', 'Thấp', 'Trung bình', 'Cao', 'Rất cao'];
const COOKING_FREQUENCY_OPTIONS = ['Hàng ngày', 'Vài lần/tuần', 'Thỉnh thoảng', 'Hiếm khi', 'Không nấu'];
const GUEST_FREQUENCY_OPTIONS = ['Thường xuyên', 'Thỉnh thoảng', 'Hiếm khi', 'Không bao giờ'];
const SOCIAL_LEVEL_OPTIONS = ['Rất ít giao tiếp', 'Ít giao tiếp', 'Trung bình', 'Thích giao tiếp', 'Rất thích giao tiếp'];
const OCCUPATION_OPTIONS = ['Sinh viên', 'Văn phòng', 'Freelancer', 'Kinh doanh', 'Công nhân', 'Khác'];
const TEMPERATURE_OPTIONS = ['Thích lạnh', 'Mát mẻ', 'Bình thường', 'Thích ấm'];
const SLEEP_SCHEDULE_OPTIONS = ['Ngủ sớm dậy sớm', 'Ngủ sớm dậy muộn', 'Ngủ muộn dậy sớm', 'Ngủ muộn dậy muộn', 'Không cố định'];
const QUIET_HOURS_OPTIONS = ['21h - 6h', '22h - 6h', '22h - 7h', '23h - 7h', '23h - 8h', 'Không yêu cầu'];
const WAKE_TIME_OPTIONS = ['5:00', '5:30', '6:00', '6:30', '7:00', '7:30', '8:00', '8:30', '9:00', '9:30', '10:00'];
const BEDTIME_OPTIONS = ['21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '0:00', '0:30', '1:00'];

const INTEREST_OPTIONS = [
    'Đọc sách', 'Thể thao', 'Nấu ăn', 'Du lịch', 'Âm nhạc', 'Phim ảnh',
    'Gaming', 'Yoga', 'Chạy bộ', 'Bơi lội', 'Nhiếp ảnh', 'Vẽ tranh',
    'Cà phê', 'Thú cưng', 'Công nghệ', 'Thời trang',
];
const LANGUAGE_OPTIONS = ['Tiếng Việt', 'English', '日本語', '한국어', '中文', 'Français', 'Khác'];

const AMENITY_OPTIONS = [
    'Điều hòa', 'Wifi', 'Máy giặt', 'Tủ lạnh', 'Nóng lạnh', 'Bếp',
    'Chỗ để xe', 'Thang máy', 'Ban công', 'Bảo vệ 24/7', 'Camera an ninh',
    'Tự do giờ giấc', 'Máy sấy', 'Bồn tắm', 'TV', 'Giường', 'Tủ quần áo', 'Bàn làm việc',
];

function ChipSelect({ options, value, onChange, multiple = false }: {
    options: string[];
    value: string | string[];
    onChange: (val: string | string[]) => void;
    multiple?: boolean;
}) {
    const selected = multiple ? (Array.isArray(value) ? value : []) : [];
    const singleValue = multiple ? '' : (typeof value === 'string' ? value : '');

    const toggle = (opt: string) => {
        if (multiple) {
            const next = selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt];
            onChange(next);
        } else {
            onChange(singleValue === opt ? '' : opt);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
                const active = multiple ? selected.includes(opt) : singleValue === opt;
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => toggle(opt)}
                        className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all border min-h-[36px] touch-manipulation ${
                            active
                                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                : 'bg-muted/50 text-foreground border-border hover:bg-muted hover:border-primary/30'
                        }`}
                    >
                        {active && <Check className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}
                        {opt}
                    </button>
                );
            })}
        </div>
    );
}

function RangeSlider({ value, onChange, min, max, step, labels }: {
    value: number | '';
    onChange: (v: number | '') => void;
    min: number;
    max: number;
    step: number;
    labels?: { left: string; right: string };
}) {
    const numValue = value === '' ? min : value;
    const pct = ((numValue - min) / (max - min)) * 100;
    return (
        <div className="space-y-2">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={numValue}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
                style={{
                    background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${pct}%, hsl(var(--muted)) ${pct}%, hsl(var(--muted)) 100%)`,
                }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>{labels?.left ?? min}</span>
                <span className="font-semibold text-foreground text-sm">{value === '' ? '—' : value}</span>
                <span>{labels?.right ?? max}</span>
            </div>
        </div>
    );
}

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
    const [hasLifestyleProfile, setHasLifestyleProfile] = useState(false);

    const [preference, setPreference] = useState(toPreferenceForm(null));
    const [preferenceLoading, setPreferenceLoading] = useState(true);
    const [preferenceSaving, setPreferenceSaving] = useState(false);
    const [preferenceError, setPreferenceError] = useState<string | null>(null);
    const [preferenceSuccess, setPreferenceSuccess] = useState(false);
    const [hasPreferenceProfile, setHasPreferenceProfile] = useState(false);

    const [citizenCardForm, setCitizenCardForm] = useState({
        citizenCardNumber: '',
        citizenCardFrontImageUrl: '',
        citizenCardBackImageUrl: '',
    });
    const [citizenCardStatus, setCitizenCardStatus] = useState<CitizenCardVerificationResponse['status'] | 'NOT_SUBMITTED'>('NOT_SUBMITTED');
    const [citizenCardReviewNote, setCitizenCardReviewNote] = useState<string | null>(null);
    const [citizenCardSaving, setCitizenCardSaving] = useState(false);
    const [citizenCardLoading, setCitizenCardLoading] = useState(true);
    const [citizenCardError, setCitizenCardError] = useState<string | null>(null);
    const [citizenCardSuccess, setCitizenCardSuccess] = useState(false);
    const [landlordLoading, setLandlordLoading] = useState(false);
    const [landlordError, setLandlordError] = useState<string | null>(null);
    const [landlordSuccess, setLandlordSuccess] = useState(false);

    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [pwSaving, setPwSaving] = useState(false);
    const [pwError, setPwError] = useState<string | null>(null);
    const [pwSuccess, setPwSuccess] = useState(false);
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

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
            .then((r) => {
                setHasLifestyleProfile(!!r.profile);
                setLifestyle(toLifestyleForm(r.profile ?? null));
            })
            .catch(() => setLifestyleError('Không tải được'))
            .finally(() => setLifestyleLoading(false));
    }, []);

    useEffect(() => {
        getPreferenceRequest()
            .then((r) => {
                setHasPreferenceProfile(!!r.preference);
                setPreference(toPreferenceForm(r.preference ?? null));
            })
            .catch(() => setPreferenceError('Không tải được'))
            .finally(() => setPreferenceLoading(false));
    }, []);

    useEffect(() => {
        getCitizenCardRequest()
            .then((r) => {
                const c = r.citizenCard;
                if (!c) {
                    setCitizenCardStatus('NOT_SUBMITTED');
                    return;
                }
                setCitizenCardForm({
                    citizenCardNumber: c.citizenCardNumber ?? '',
                    citizenCardFrontImageUrl: c.citizenCardFrontImageUrl ?? '',
                    citizenCardBackImageUrl: c.citizenCardBackImageUrl ?? '',
                });
                setCitizenCardStatus(c.status ?? 'NOT_SUBMITTED');
                setCitizenCardReviewNote(c.reviewNote ?? null);
            })
            .catch(() => {
                setCitizenCardStatus('NOT_SUBMITTED');
            })
            .finally(() => setCitizenCardLoading(false));
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
            setHasLifestyleProfile(true);
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
            setHasPreferenceProfile(true);
            setPreferenceSuccess(true);
            setTimeout(() => setPreferenceSuccess(false), 3000);
        } catch (err) {
            setPreferenceError(err instanceof Error ? err.message : 'Lưu thất bại');
        } finally {
            setPreferenceSaving(false);
        }
    };

    const isProfileReady = !!(
        profileForm.fullName.trim().length >= 2 &&
        profileForm.phone.trim().length > 0 &&
        profileForm.gender.trim().length > 0
    );
    const isCitizenCardInputReady = !!(
        /^\d{12}$/.test(citizenCardForm.citizenCardNumber.trim()) &&
        citizenCardForm.citizenCardFrontImageUrl.trim().length > 0 &&
        citizenCardForm.citizenCardBackImageUrl.trim().length > 0
    );
    const isCitizenCardVerified = citizenCardStatus === 'VERIFIED';

    const handleSubmitCitizenCard = async () => {
        setCitizenCardError(null);
        setCitizenCardSuccess(false);
        setCitizenCardSaving(true);
        try {
            const res = await upsertCitizenCardRequest({
                citizenCardNumber: citizenCardForm.citizenCardNumber.trim(),
                citizenCardFrontImageUrl: citizenCardForm.citizenCardFrontImageUrl.trim(),
                citizenCardBackImageUrl: citizenCardForm.citizenCardBackImageUrl.trim(),
            });
            setCitizenCardStatus(res.citizenCard.status ?? 'PENDING');
            setCitizenCardReviewNote(res.citizenCard.reviewNote ?? null);
            setCitizenCardSuccess(true);
            setTimeout(() => setCitizenCardSuccess(false), 4000);
        } catch (err) {
            setCitizenCardError(err instanceof Error ? err.message : 'Gửi CCCD thất bại');
        } finally {
            setCitizenCardSaving(false);
        }
    };

    const handleRegisterLandlord = async () => {
        setLandlordError(null);
        setLandlordSuccess(false);
        setLandlordLoading(true);
        try {
            await registerLandlordRequest({});
            await refreshUser();
            setLandlordSuccess(true);
            setTimeout(() => setLandlordSuccess(false), 4000);
        } catch (err) {
            setLandlordError(err instanceof Error ? err.message : 'Đăng ký chủ nhà thất bại');
        } finally {
            setLandlordLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPwError(null);
        setPwSuccess(false);
        setPwSaving(true);
        try {
            await changePasswordRequest({
                currentPassword: pwForm.currentPassword,
                newPassword: pwForm.newPassword,
                confirmNewPassword: pwForm.confirmNewPassword,
            });
            setPwSuccess(true);
            setPwForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
            setTimeout(() => setPwSuccess(false), 4000);
        } catch (err) {
            const e = err as Error & { errors?: string[] };
            setPwError(e.errors?.length ? e.errors.join('. ') : e.message);
        } finally {
            setPwSaving(false);
        }
    };

    const pwReqs = passwordStrength(pwForm.newPassword);
    const isPwFormReady = !!(
        pwForm.currentPassword.trim() &&
        pwForm.newPassword.trim() &&
        pwForm.confirmNewPassword.trim() &&
        pwReqs.length && pwReqs.upper && pwReqs.number && pwReqs.special &&
        pwForm.newPassword === pwForm.confirmNewPassword
    );

    const avatarUrl = profileForm.avatarUrl?.trim() || user?.avatarUrl;
    const [avatarError, setAvatarError] = useState(false);
    useEffect(() => { setAvatarError(false); }, [avatarUrl]);
    const tabs: { id: Tab; label: string; icon: typeof User }[] = [
        { id: 'profile', label: 'Thông tin cá nhân', icon: User },
        { id: 'lifestyle', label: 'Phong cách sống', icon: Heart },
        { id: 'preference', label: 'Sở thích tìm phòng', icon: Sliders },
        ...(user?.role !== 'LANDLORD' ? [{ id: 'landlord' as Tab, label: 'Đăng ký chủ nhà', icon: Users }] : []),
        { id: 'password', label: 'Đổi mật khẩu', icon: Lock },
    ];

    return (
        <div className="min-h-screen bg-background">
            <Header onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
                {/* Profile header card */}
                <div className="bg-card rounded-2xl border border-border shadow-sm p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <div className="relative shrink-0">
                            {avatarUrl && !avatarError ? (
                                <img
                                    src={avatarUrl}
                                    alt=""
                                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-border"
                                    onError={() => setAvatarError(true)}
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

                <h2 className="font-heading text-base sm:text-lg font-bold text-foreground mb-3 sm:mb-4">Cài đặt</h2>
                <div className="flex flex-wrap gap-2 mb-4 sm:mb-6 border-b border-border pb-4 -mx-1 overflow-x-auto scrollbar-hide">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 sm:px-5 rounded-xl font-medium text-xs sm:text-sm transition-all shrink-0 min-h-[44px] touch-manipulation ${
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
                                    <ChipSelect
                                        options={SLEEP_SCHEDULE_OPTIONS}
                                        value={lifestyle.sleep_schedule}
                                        onChange={(v) => setLifestyle((l) => ({ ...l, sleep_schedule: v as string }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>
                                        <Sparkles className="w-4 h-4 inline mr-1.5 -mt-0.5 text-muted-foreground" />
                                        Kiểu tính cách
                                    </label>
                                    <ChipSelect
                                        options={PERSONALITY_OPTIONS.filter((o) => o.value).map((o) => o.label)}
                                        value={lifestyle.personalityType}
                                        onChange={(v) => setLifestyle((l) => ({ ...l, personalityType: v as string }))}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Giờ thức dậy</label>
                                        <select
                                            value={lifestyle.wake_time}
                                            onChange={(e) => setLifestyle((l) => ({ ...l, wake_time: e.target.value }))}
                                            className={inputClass}
                                        >
                                            <option value="">— Chọn —</option>
                                            {WAKE_TIME_OPTIONS.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Giờ đi ngủ</label>
                                        <select
                                            value={lifestyle.bedtime}
                                            onChange={(e) => setLifestyle((l) => ({ ...l, bedtime: e.target.value }))}
                                            className={inputClass}
                                        >
                                            <option value="">— Chọn —</option>
                                            {BEDTIME_OPTIONS.map((t) => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Độ sạch sẽ</label>
                                    <ChipSelect
                                        options={CLEANLINESS_OPTIONS}
                                        value={lifestyle.cleanliness}
                                        onChange={(v) => setLifestyle((l) => ({ ...l, cleanliness: v as string }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Chịu ồn</label>
                                    <ChipSelect
                                        options={NOISE_TOLERANCE_OPTIONS}
                                        value={lifestyle.noise_tolerance}
                                        onChange={(v) => setLifestyle((l) => ({ ...l, noise_tolerance: v as string }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Tần suất nấu ăn</label>
                                    <ChipSelect
                                        options={COOKING_FREQUENCY_OPTIONS}
                                        value={lifestyle.cooking_frequency}
                                        onChange={(v) => setLifestyle((l) => ({ ...l, cooking_frequency: v as string }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Khách tới chơi</label>
                                    <ChipSelect
                                        options={GUEST_FREQUENCY_OPTIONS}
                                        value={lifestyle.guest_frequency}
                                        onChange={(v) => setLifestyle((l) => ({ ...l, guest_frequency: v as string }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Mức độ giao tiếp</label>
                                    <ChipSelect
                                        options={SOCIAL_LEVEL_OPTIONS}
                                        value={lifestyle.social_level}
                                        onChange={(v) => setLifestyle((l) => ({ ...l, social_level: v as string }))}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Nghề nghiệp / loại công việc</label>
                                    <ChipSelect
                                        options={OCCUPATION_OPTIONS}
                                        value={lifestyle.occupation_type}
                                        onChange={(v) => setLifestyle((l) => ({ ...l, occupation_type: v as string }))}
                                    />
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
                                    <label className={labelClass}>Sở thích</label>
                                    <ChipSelect
                                        options={INTEREST_OPTIONS}
                                        value={lifestyle.interests ? lifestyle.interests.split(',').map((s) => s.trim()).filter(Boolean) : []}
                                        onChange={(v) => setLifestyle((l) => ({ ...l, interests: (v as string[]).join(', ') }))}
                                        multiple
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Ngôn ngữ</label>
                                    <ChipSelect
                                        options={LANGUAGE_OPTIONS}
                                        value={lifestyle.languages ? lifestyle.languages.split(',').map((s) => s.trim()).filter(Boolean) : []}
                                        onChange={(v) => setLifestyle((l) => ({ ...l, languages: (v as string[]).join(', ') }))}
                                        multiple
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Thời hạn thuê ưa thích (tháng)</label>
                                        <ChipSelect
                                            options={['3', '6', '12', '24']}
                                            value={lifestyle.preferred_lease_months === '' ? '' : String(lifestyle.preferred_lease_months)}
                                            onChange={(v) => setLifestyle((l) => ({ ...l, preferred_lease_months: v ? Number(v) : '' }))}
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
                                        <ChipSelect
                                            options={TEMPERATURE_OPTIONS}
                                            value={lifestyle.temperature_preference}
                                            onChange={(v) => setLifestyle((l) => ({ ...l, temperature_preference: v as string }))}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Giờ giữ yên tĩnh</label>
                                        <ChipSelect
                                            options={QUIET_HOURS_OPTIONS}
                                            value={lifestyle.quiet_hours_preference}
                                            onChange={(v) => setLifestyle((l) => ({ ...l, quiet_hours_preference: v as string }))}
                                        />
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
                                    <ChipSelect
                                        options={ROOM_TYPE_OPTIONS.filter((o) => o.value).map((o) => o.label)}
                                        value={
                                            ROOM_TYPE_OPTIONS.find((o) => o.value === preference.room_type)?.label ?? ''
                                        }
                                        onChange={(v) => {
                                            const match = ROOM_TYPE_OPTIONS.find((o) => o.label === v);
                                            setPreference((p) => ({ ...p, room_type: match?.value ?? '' }));
                                        }}
                                    />
                                </div>
                                <PreferredDistrictsField preference={preference} setPreference={setPreference} labelClass={labelClass} inputClass={inputClass} />
                                <div>
                                    <label className={labelClass}>Tiện nghi mong muốn</label>
                                    <ChipSelect
                                        options={AMENITY_OPTIONS}
                                        value={preference.preferred_amenities ? preference.preferred_amenities.split(',').map((s) => s.trim()).filter(Boolean) : []}
                                        onChange={(v) => setPreference((p) => ({ ...p, preferred_amenities: (v as string[]).join(', ') }))}
                                        multiple
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Tiện nghi bắt buộc</label>
                                    <ChipSelect
                                        options={AMENITY_OPTIONS}
                                        value={preference.must_have_amenities ? preference.must_have_amenities.split(',').map((s) => s.trim()).filter(Boolean) : []}
                                        onChange={(v) => setPreference((p) => ({ ...p, must_have_amenities: (v as string[]).join(', ') }))}
                                        multiple
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Thời hạn thuê ưa thích (tháng)</label>
                                        <ChipSelect
                                            options={['3', '6', '12', '24']}
                                            value={preference.preferred_lease_months === '' ? '' : String(preference.preferred_lease_months)}
                                            onChange={(v) => setPreference((p) => ({ ...p, preferred_lease_months: v ? Number(v) : '' }))}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Khoảng cách tối đa (km)</label>
                                        <RangeSlider
                                            value={preference.max_distance_km}
                                            onChange={(v) => setPreference((p) => ({ ...p, max_distance_km: v }))}
                                            min={1}
                                            max={30}
                                            step={1}
                                            labels={{ left: '1 km', right: '30 km' }}
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
                                        <label className={labelClass}>Trọng số khớp phong cách sống</label>
                                        <RangeSlider
                                            value={preference.lifestyle_match_weight}
                                            onChange={(v) => setPreference((p) => ({ ...p, lifestyle_match_weight: v }))}
                                            min={0}
                                            max={1}
                                            step={0.1}
                                            labels={{ left: 'Không quan trọng', right: 'Rất quan trọng' }}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Mức ưu tiên an ninh</label>
                                        <RangeSlider
                                            value={preference.safety_priority}
                                            onChange={(v) => setPreference((p) => ({ ...p, safety_priority: v }))}
                                            min={1}
                                            max={10}
                                            step={1}
                                            labels={{ left: 'Thấp', right: 'Cao' }}
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

                {tab === 'landlord' && user?.role !== 'LANDLORD' && (
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary" />
                                Đăng ký trở thành Chủ nhà
                            </h3>
                            <p className="text-muted-foreground text-xs mt-0.5">
                                Hoàn tất hồ sơ và cung cấp CCCD để trở thành chủ nhà cho thuê
                            </p>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="rounded-xl border border-border bg-muted/30 p-4">
                                <p className="text-sm font-medium text-foreground mb-3">Yêu cầu để đăng ký chủ nhà:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div className={`flex items-center gap-2 ${isProfileReady ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {isProfileReady ? <Check className="w-4 h-4 shrink-0" /> : <Circle className="w-4 h-4 shrink-0" />}
                                        Hồ sơ cá nhân
                                    </div>
                                    <div className={`flex items-center gap-2 ${hasLifestyleProfile ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {hasLifestyleProfile ? <Check className="w-4 h-4 shrink-0" /> : <Circle className="w-4 h-4 shrink-0" />}
                                        Phong cách sống
                                    </div>
                                    <div className={`flex items-center gap-2 ${hasPreferenceProfile ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {hasPreferenceProfile ? <Check className="w-4 h-4 shrink-0" /> : <Circle className="w-4 h-4 shrink-0" />}
                                        Sở thích tìm phòng
                                    </div>
                                    <div className={`flex items-center gap-2 ${isCitizenCardVerified ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {isCitizenCardVerified ? <Check className="w-4 h-4 shrink-0" /> : <Circle className="w-4 h-4 shrink-0" />}
                                        CCCD đã duyệt
                                    </div>
                                </div>
                            </div>

                            {citizenCardStatus !== 'NOT_SUBMITTED' && (
                                <div className="text-sm text-muted-foreground">
                                    Trạng thái CCCD hiện tại:{' '}
                                    <span className="font-semibold text-foreground">{citizenCardStatus}</span>
                                    {citizenCardReviewNote ? ` — Ghi chú: ${citizenCardReviewNote}` : ''}
                                </div>
                            )}

                            {citizenCardError && (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">{citizenCardError}</div>
                            )}
                            {citizenCardSuccess && (
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm flex items-center gap-2">
                                    <Check className="w-4 h-4 shrink-0" />
                                    Đã gửi CCCD để xác minh thành công.
                                </div>
                            )}
                            {landlordError && (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">{landlordError}</div>
                            )}
                            {landlordSuccess && (
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm flex items-center gap-2">
                                    <Check className="w-4 h-4 shrink-0" />
                                    Đăng ký chủ nhà thành công! Hệ thống đã nâng cấp vai trò của bạn.
                                </div>
                            )}

                            <div>
                                <label className={labelClass}>Số CCCD</label>
                                <input
                                    value={citizenCardForm.citizenCardNumber}
                                    onChange={(e) => setCitizenCardForm((f) => ({ ...f, citizenCardNumber: e.target.value }))}
                                    placeholder="12 chữ số"
                                    className={inputClass}
                                    maxLength={12}
                                />
                            </div>
                            <div>
                                <ImageUpload
                                    label="Ảnh CCCD mặt trước"
                                    value={citizenCardForm.citizenCardFrontImageUrl}
                                    onChange={(url) => setCitizenCardForm((f) => ({ ...f, citizenCardFrontImageUrl: url }))}
                                    placeholder="Chọn ảnh mặt trước CCCD"
                                    previewClassName="w-48 h-28 rounded-xl object-cover border border-border"
                                />
                            </div>
                            <div>
                                <ImageUpload
                                    label="Ảnh CCCD mặt sau"
                                    value={citizenCardForm.citizenCardBackImageUrl}
                                    onChange={(url) => setCitizenCardForm((f) => ({ ...f, citizenCardBackImageUrl: url }))}
                                    placeholder="Chọn ảnh mặt sau CCCD"
                                    previewClassName="w-48 h-28 rounded-xl object-cover border border-border"
                                />
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    type="button"
                                    onClick={handleSubmitCitizenCard}
                                    disabled={citizenCardLoading || citizenCardSaving || !isCitizenCardInputReady}
                                    className="flex items-center gap-2 px-5 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm"
                                >
                                    {citizenCardSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    {citizenCardSaving ? 'Đang gửi CCCD...' : 'Gửi CCCD xác minh'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRegisterLandlord}
                                    disabled={landlordLoading || !isCitizenCardVerified}
                                    className="flex items-center gap-2 px-5 py-3 bg-accent text-accent-foreground rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 transition-all shadow-sm"
                                >
                                    {landlordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                                    {landlordLoading ? 'Đang gửi...' : 'Đăng ký thành Chủ nhà'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'password' && (
                    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-border bg-muted/30">
                            <h3 className="font-heading font-semibold text-foreground flex items-center gap-2">
                                <Lock className="w-4 h-4 text-primary" />
                                Đổi mật khẩu
                            </h3>
                            <p className="text-muted-foreground text-xs mt-0.5">
                                Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi
                            </p>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-6 space-y-5">
                            {pwError && (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm">
                                    {pwError}
                                </div>
                            )}
                            {pwSuccess && (
                                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary text-sm flex items-center gap-2">
                                    <Check className="w-4 h-4 shrink-0" />
                                    Đổi mật khẩu thành công
                                </div>
                            )}

                            <div>
                                <label className={labelClass}>Mật khẩu hiện tại</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type={showCurrentPw ? 'text' : 'password'}
                                        value={pwForm.currentPassword}
                                        onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))}
                                        placeholder="Nhập mật khẩu hiện tại"
                                        className={`${inputClass} pl-11 pr-11`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPw(!showCurrentPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showCurrentPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className={labelClass}>Mật khẩu mới</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type={showNewPw ? 'text' : 'password'}
                                        value={pwForm.newPassword}
                                        onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))}
                                        placeholder="Nhập mật khẩu mới"
                                        className={`${inputClass} pl-11 pr-11`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPw(!showNewPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showNewPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {pwForm.newPassword && (
                                    <div className="mt-2 space-y-1">
                                        {[
                                            { ok: pwReqs.length, text: 'Ít nhất 8 ký tự' },
                                            { ok: pwReqs.upper, text: 'Ít nhất 1 chữ in hoa' },
                                            { ok: pwReqs.number, text: 'Ít nhất 1 chữ số' },
                                            { ok: pwReqs.special, text: 'Ít nhất 1 ký tự đặc biệt (!@#$%...)' },
                                        ].map((r) => (
                                            <div key={r.text} className={`flex items-center gap-2 text-xs ${r.ok ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {r.ok ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                                                {r.text}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className={labelClass}>Xác nhận mật khẩu mới</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <input
                                        type={showConfirmPw ? 'text' : 'password'}
                                        value={pwForm.confirmNewPassword}
                                        onChange={(e) => setPwForm((f) => ({ ...f, confirmNewPassword: e.target.value }))}
                                        placeholder="Nhập lại mật khẩu mới"
                                        className={`${inputClass} pl-11 pr-11`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showConfirmPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {pwForm.confirmNewPassword && pwForm.newPassword !== pwForm.confirmNewPassword && (
                                    <p className="mt-1.5 text-xs text-destructive">Mật khẩu xác nhận không khớp</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={pwSaving || !isPwFormReady}
                                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm"
                            >
                                {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {pwSaving ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                            </button>
                        </form>
                    </div>
                )}
            </main>
        </div>
    );
}
