import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MultiImageUpload } from '@/app/components/MultiImageUpload';
import { getRentalByIdRequest, updateRentalRequest } from '@/lib/api';
import { useProvinces } from '@/app/hooks/useProvinces';
import { findOldAddress, type OldAddressInfo } from '@/app/constants/v1-v2-mapping';

type RentalStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'HIDDEN';

interface EditRentalFormState {
    title: string;
    description: string;
    address: string;
    district: string;
    city: string;
    images: string[];
    status: RentalStatus;
}

type FormErrors = Partial<Record<keyof EditRentalFormState, string>>;

export function EditRentalPage() {
    const navigate = useNavigate();
    const { rentalId = '' } = useParams();
    const [form, setForm] = useState<EditRentalFormState>({
        title: '',
        description: '',
        address: '',
        district: '',
        city: 'Thành phố Hà Nội',
        images: [],
        status: 'AVAILABLE',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [originalStatus, setOriginalStatus] = useState<string>('');
    const [oldAddress, setOldAddress] = useState<OldAddressInfo | null>(null);

    // Landlord chỉ được thay đổi status khi đã được moderator duyệt
    const canEditStatus = ['AVAILABLE', 'UNAVAILABLE', 'HIDDEN'].includes(originalStatus);

    // Provinces / wards
    const { getWardsFor, loading: locationsLoading } = useProvinces();
    const wardOptions = form.city ? getWardsFor(form.city) : [];

    // Auto-detect old address when district/city changes
    useEffect(() => {
        const loadOldAddress = async () => {
            if (form.district && form.city) {
                const old = await findOldAddress(form.district, form.city);
                setOldAddress(old);
            } else {
                setOldAddress(null);
            }
        };
        loadOldAddress();
    }, [form.district, form.city]);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            try {
                const result = await getRentalByIdRequest(rentalId);
                if (!active) return;
                const rental = result.data;
                setOriginalStatus(rental.status || '');
                setForm({
                    title: rental.title || '',
                    description: rental.description || '',
                    address: rental.location?.address || '',
                    district: rental.location?.district || '',
                    city: 'Thành phố Hà Nội', // Cố định Hà Nội như trong CreateRentalPage
                    images: rental.images || [],
                    status: (['AVAILABLE', 'UNAVAILABLE', 'HIDDEN'].includes(rental.status) ? rental.status : 'AVAILABLE') as RentalStatus,
                });
            } catch (err) {
                if (!active) return;
                setSubmitError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
            } finally {
                if (active) setIsLoading(false);
            }
        };

        if (rentalId) {
            void load();
        }

        return () => {
            active = false;
        };
    }, [rentalId]);

    const validateForm = () => {
        const nextErrors: FormErrors = {};

        if (!form.title.trim()) nextErrors.title = 'Tiêu đề là bắt buộc.';
        if (!form.district.trim()) nextErrors.district = 'Phường/xã là bắt buộc.';
        if (!form.address.trim()) nextErrors.address = 'Địa chỉ là bắt buộc.';

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const onChangeField =
        <K extends keyof EditRentalFormState>(key: K) =>
            (value: EditRentalFormState[K]) => {
                setForm((prev) => {
                    const next = { ...prev, [key]: value };
                    // Reset district khi thay đổi city
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

        try {
            await updateRentalRequest(rentalId, {
                title: form.title,
                description: form.description || undefined,
                address: form.address,
                district: form.district,
                city: form.city,
                images: form.images,
                ...(canEditStatus ? { status: form.status } : {}),
            });

            navigate(`/rental-management/rentals/${rentalId}`);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'Cập nhật bài đăng thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <section className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm text-slate-600">Đang tải...</p>
            </section>
        );
    }

    return (
        <section className="mx-auto w-full max-w-4xl">
            <header className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">Chỉnh sửa bài đăng</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Cập nhật thông tin bài đăng của bạn.
                </p>
            </header>

            <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                {oldAddress && (
                    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p className="text-sm text-blue-900">
                            <strong> Cập nhật địa chỉ hành chính:</strong><br/>
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
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Tỉnh / Thành phố</label>
                        <input
                            value="Thành phố Hà Nội"
                            disabled
                            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 cursor-not-allowed"
                        />
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
                            {/* Nếu district đã lưu không có trong danh sách, hiển thị nó như option riêng */}
                            {form.district && !wardOptions.some(w => w.name === form.district) && (
                                <option value={form.district}>{form.district} (đã lưu)</option>
                            )}
                            {wardOptions.map((w) => (
                                <option key={w.code} value={w.name}>{w.name}</option>
                            ))}
                        </select>
                        {errors.district ? <p className="mt-1 text-xs text-rose-600">{errors.district}</p> : null}
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Trạng thái</label>
                        {canEditStatus ? (
                            <select
                                value={form.status}
                                onChange={(event) => onChangeField('status')(event.target.value as RentalStatus)}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                            >
                                <option value="AVAILABLE">Có sẵn</option>
                                <option value="UNAVAILABLE">Không có sẵn</option>
                                <option value="HIDDEN">Ẩn</option>
                            </select>
                        ) : (
                            <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                                {originalStatus === 'PENDING' && 'Chờ duyệt'}
                                {originalStatus === 'SUSPEND' && 'Tạm ngưng'}
                                {originalStatus === 'VIOLATE' && 'Vi phạm'}
                                {!['PENDING', 'SUSPEND', 'VIOLATE'].includes(originalStatus) && originalStatus}
                                <span className="ml-2 text-xs text-slate-400">(Chỉ moderator có thể thay đổi)</span>
                            </div>
                        )}
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Địa chỉ chi tiết *</label>
                        <input
                            value={form.address}
                            onChange={(event) => onChangeField('address')(event.target.value)}
                            placeholder="VD: 268 Tây Sơn"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.address ? <p className="mt-1 text-xs text-rose-600">{errors.address}</p> : null}
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
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Mô tả</label>
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
                        onClick={() => navigate(`/rental-management/rentals/${rentalId}`)}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                </div>
            </form>
        </section>
    );
}
