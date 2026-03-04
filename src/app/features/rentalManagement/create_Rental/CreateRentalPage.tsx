import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MultiImageUpload } from '@/app/components/MultiImageUpload';
import { createRentalRequest } from '@/lib/api';
import { useProvinces } from '@/app/hooks/useProvinces';
import { findOldAddress, type OldAddressInfo } from '@/app/constants/v1-v2-mapping';
import { PROPERTY_TYPE_OPTIONS, type PropertyType } from '../shared/types';

interface CreateRentalFormState {
    title: string;
    summary: string;
    description: string;
    city: string;
    district: string;
    address: string;
    property_type: PropertyType;
    available_room: string;
    images: string[];
}

type FormErrors = Partial<Record<keyof CreateRentalFormState, string>>;

const initialForm: CreateRentalFormState = {
    title: '',
    summary: '',
    description: '',
    city: '',
    district: '',
    address: '',
    property_type: 'boarding_house',
    available_room: '1',
    images: [],
};

export function CreateRentalPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState<CreateRentalFormState>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [oldAddress, setOldAddress] = useState<OldAddressInfo | null>(null);

    const availableRoomNumber = useMemo(() => Number(form.available_room), [form.available_room]);

    const validateForm = () => {
        const nextErrors: FormErrors = {};

        if (!form.title.trim()) nextErrors.title = 'Tiêu đề là bắt buộc.';
        if (!form.city.trim()) nextErrors.city = 'Thành phố là bắt buộc.';
        if (!form.district.trim()) nextErrors.district = 'Phường/xã là bắt buộc.';
        if (!form.address.trim()) nextErrors.address = 'Địa chỉ là bắt buộc.';
        if (!Number.isFinite(availableRoomNumber) || availableRoomNumber < 0) {
            nextErrors.available_room = 'Số phòng phải là số nguyên dương.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const { provinces, getWardsFor, loading: locationsLoading } = useProvinces();
    const wardOptions = form.city ? getWardsFor(form.city) : [];

    // Auto-detect old address when district/city changes
    useEffect(() => {
        const loadOldAddress = async () => {
            const old = await findOldAddress(form.district, form.city);
            setOldAddress(old);
        };
        loadOldAddress();
    }, [form.district, form.city]);

    const onChangeField =
        <K extends keyof CreateRentalFormState>(key: K) =>
            (value: CreateRentalFormState[K]) => {
                setForm((prev) => {
                    const next = { ...prev, [key]: value };
                    if (key === 'city') next.district = '';
                    return next;
                });
                setErrors((prev) => ({ ...prev, [key]: undefined }));
            };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateForm()) return;

        setSubmitError(null);
        setIsSubmitting(true);

        const payload = {
            title: form.title,
            description: form.description || undefined,
            city: form.city,
            district: form.district,
            address: form.address,
            images: form.images.length > 0 ? form.images : undefined,
        };

        try {
            await createRentalRequest(payload);

            navigate('/rental-management/rentals');
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Tạo bài đăng thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="mx-auto w-full max-w-4xl">
            <header className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">Tạo bài đăng mới</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Điền các thông tin bên dưới để tạo bài đăng cho trọ phòng/nhà/căn hộ của bạn.
                </p>
            </header>

            <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                {oldAddress && (
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p className="text-sm text-blue-900">
                            <strong>📋 Cập nhật địa chỉ hành chính:</strong><br/>
                            Trước đó: <strong>{oldAddress.v1District}, {oldAddress.v1Province}</strong><br/>
                            Bây giờ: <strong>{form.district}, {form.city}</strong>
                        </p>
                    </div>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Tiêu đề *</label>
                        <input
                            value={form.title}
                            onChange={(event) => onChangeField('title')(event.target.value)}
                            placeholder="VD: Maple Residence - gần đại học"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Loại bất động sản</label>
                        <select
                            value={form.property_type}
                            onChange={(event) =>
                                onChangeField('property_type')(event.target.value as PropertyType)
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        >
                            {PROPERTY_TYPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                            <p className="text-sm font-medium text-amber-800">⏳ Trạng thái: Chờ duyệt</p>
                            <p className="mt-0.5 text-xs text-amber-600">
                                Bài đăng mới tạo sẽ ở trạng thái chờ duyệt. Moderator sẽ duyệt để chuyển sang Available.
                            </p>
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Tỉnh / Thành phố *</label>
                        <select
                            value={form.city}
                            onChange={(event) => onChangeField('city')(event.target.value)}
                            disabled={locationsLoading}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        >
                            <option value="">Chọn tỉnh / thành phố</option>
                            {provinces.map((p) => (
                                <option key={p.code} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                        {errors.city ? <p className="mt-1 text-xs text-rose-600">{errors.city}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Phường / Xã *</label>
                        <select
                            value={form.district}
                            onChange={(event) => onChangeField('district')(event.target.value)}
                            disabled={!form.city || locationsLoading}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        >
                            <option value="">Chọn phường / xã</option>
                            {wardOptions.map((w) => (
                                <option key={w.code} value={w.name}>{w.name}</option>
                            ))}
                        </select>
                        {errors.district ? <p className="mt-1 text-xs text-rose-600">{errors.district}</p> : null}
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Địa chỉ chi tiết (đường, số nhà) *</label>
                        <input
                            value={form.address}
                            onChange={(event) => onChangeField('address')(event.target.value)}
                            placeholder="VD: 268 Tây Sơn"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.address ? <p className="mt-1 text-xs text-rose-600">{errors.address}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Số phòng trống *
                        </label>
                        <input
                            type="number"
                            min={0}
                            value={form.available_room}
                            onChange={(event) => onChangeField('available_room')(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.available_room ? (
                            <p className="mt-1 text-xs text-rose-600">{errors.available_room}</p>
                        ) : null}
                    </div>

                    <div className="md:col-span-2">
                        <MultiImageUpload
                            label="Ảnh bài đăng"
                            value={form.images}
                            onChange={(urls) => onChangeField('images')(urls)}
                            maxImages={10}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Tóm tắt</label>
                        <textarea
                            value={form.summary}
                            onChange={(event) => onChangeField('summary')(event.target.value)}
                            rows={2}
                            placeholder="Mô tả ngắn gọn cho bài đăng"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Mô tả chi tiết</label>
                        <textarea
                            value={form.description}
                            onChange={(event) => onChangeField('description')(event.target.value)}
                            rows={5}
                            placeholder="Thông tin chi tiết về dịch vụ, nội quy, tiện ích..."
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                    </div>
                </div>

                {submitError && (
                    <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                        <p className="text-sm text-rose-700">{submitError}</p>
                    </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/rental-management/rentals')}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? 'Đang tạo...' : 'Tạo bài đăng'}
                    </button>
                </div>
            </form>
        </section>
    );
}
