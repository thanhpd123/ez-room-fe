import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { RoomStatus } from '@/lib/models/room.model';
import { MultiImageUpload } from '@/app/components/MultiImageUpload';
import { getManagedRentalById } from '@/app/features/rentalManagement/shared/rental-storage';
import { getRoomPostById, updateRoomPost, fetchAmenities } from '../shared/room-post-storage';

interface Amenity {
    id: string;
    name: string;
}

interface EditRoomPostFormState {
    title: string;
    description: string;
    price: string;
    area: string;
    max_occupants: string;
    status: RoomStatus;
    images: string[];
    amenityIds: string[];
}

type FormErrors = Partial<Record<keyof EditRoomPostFormState, string>>;

export function EditRoomPostPage() {
    const navigate = useNavigate();
    const { rentalId = '', roomPostId = '' } = useParams();
    const [rentalTitle, setRentalTitle] = useState('');
    const [form, setForm] = useState<EditRoomPostFormState>({
        title: '',
        description: '',
        price: '',
        area: '',
        max_occupants: '1',
        status: 'PENDING',
        images: [],
        amenityIds: [],
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [amenities, setAmenities] = useState<Amenity[]>([]);

    useEffect(() => {
        let active = true;

        const load = async () => {
            setIsLoading(true);
            const [rental, roomPost, amenitiesList] = await Promise.all([
                getManagedRentalById(rentalId),
                getRoomPostById(rentalId, roomPostId),
                fetchAmenities(),
            ]);
            if (!active) return;
            setRentalTitle(rental?.title ?? '');
            setAmenities(amenitiesList);
            if (roomPost) {
                setForm({
                    title: roomPost.title || '',
                    description: roomPost.description || '',
                    price: String(roomPost.price || ''),
                    area: String(roomPost.area || ''),
                    max_occupants: String(roomPost.max_occupants || '1'),
                    status: roomPost.status || 'PENDING',
                    images: roomPost.images || [],
                    amenityIds: roomPost.amenities?.map(a => a.id) || [],
                });
            }
            setIsLoading(false);
        };

        if (rentalId && roomPostId) {
            void load();
        }

        return () => {
            active = false;
        };
    }, [rentalId, roomPostId]);

    const parsed = useMemo(() => ({
        price: parseFloat(form.price) || 0,
        area: parseFloat(form.area) || 0,
        maxOccupants: parseInt(form.max_occupants, 10) || 1,
    }), [form.price, form.area, form.max_occupants]);

    const validate = () => {
        const next: FormErrors = {};
        if (!form.title.trim()) next.title = 'Tên phòng là bắt buộc.';
        if (parsed.price <= 0) next.price = 'Giá phòng phải lớn hơn 0.';
        if (parsed.area <= 0) next.area = 'Diện tích phải lớn hơn 0.';
        if (parsed.maxOccupants <= 0) next.max_occupants = 'Số người tối đa phải lớn hơn 0.';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const onChangeField = <K extends keyof EditRoomPostFormState>(key: K) => (value: EditRoomPostFormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validate()) return;

        setIsSubmitting(true);
        const result = await updateRoomPost(roomPostId, {
            title: form.title,
            description: form.description,
            price: parsed.price,
            area: parsed.area,
            max_occupants: parsed.maxOccupants,
            thumbnail_url: form.images[0] || '',
            images: form.images,
            amenityIds: form.amenityIds,
        });
        setIsSubmitting(false);

        if (result) {
            navigate(`/rental-management/rentals/${rentalId}/room-posts/${roomPostId}`);
        } else {
            setErrors({ title: 'Cập nhật phòng thất bại' });
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
                <h2 className="text-2xl font-semibold text-slate-900">Chỉnh sửa phòng</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Cập nhật thông tin phòng trong: <strong>{rentalTitle || rentalId}</strong>
                </p>
            </header>

            <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Tên phòng *</label>
                        <input
                            value={form.title}
                            onChange={(e) => onChangeField('title')(e.target.value)}
                            placeholder="VD: Phòng 101"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.title && <p className="mt-1 text-xs text-rose-600">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Giá thuê (VNĐ/tháng) *</label>
                        <input
                            type="number"
                            min={0}
                            value={form.price}
                            onChange={(e) => onChangeField('price')(e.target.value)}
                            placeholder="3000000"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.price && <p className="mt-1 text-xs text-rose-600">{errors.price}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Diện tích (m²) *</label>
                        <input
                            type="number"
                            min={0}
                            value={form.area}
                            onChange={(e) => onChangeField('area')(e.target.value)}
                            placeholder="20"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.area && <p className="mt-1 text-xs text-rose-600">{errors.area}</p>}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Số người tối đa *</label>
                        <input
                            type="number"
                            min={1}
                            value={form.max_occupants}
                            onChange={(e) => onChangeField('max_occupants')(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.max_occupants && <p className="mt-1 text-xs text-rose-600">{errors.max_occupants}</p>}
                    </div>

                    <div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                            <p className="text-sm font-medium text-slate-700">Trạng thái: {form.status}</p>
                        </div>
                    </div>

                    {/* Amenities */}
                    {amenities.length > 0 && (
                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">Tiện ích</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {amenities.map((amenity) => (
                                    <label
                                        key={amenity.id}
                                        className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 cursor-pointer hover:bg-slate-50"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.amenityIds.includes(amenity.id)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    onChangeField('amenityIds')([...form.amenityIds, amenity.id]);
                                                } else {
                                                    onChangeField('amenityIds')(form.amenityIds.filter(id => id !== amenity.id));
                                                }
                                            }}
                                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                        />
                                        <span className="text-sm text-slate-700">{amenity.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <MultiImageUpload
                            label="Ảnh phòng"
                            value={form.images}
                            onChange={(urls) => onChangeField('images')(urls)}
                            maxImages={10}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Mô tả phòng</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => onChangeField('description')(e.target.value)}
                            rows={4}
                            placeholder="Mô tả chi tiết về phòng..."
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(`/rental-management/rentals/${rentalId}/room-posts/${roomPostId}`)}
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
