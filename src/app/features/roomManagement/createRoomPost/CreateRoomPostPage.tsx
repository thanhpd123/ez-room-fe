import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { RoomStatus } from '@/lib/models/room.model';
import { ImageUpload } from '@/app/components/ImageUpload';
import { getManagedRentalById } from '@/app/features/rentalManagement/shared/rental-storage';
import { createRoomPost } from '../shared/room-post-storage';
import {
    ROOM_POST_GENDER_OPTIONS,
    ROOM_POST_STATUS_OPTIONS,
    type CreateManagedRoomPostInput,
    type RoomPostGenderPreference,
} from '../shared/types';

interface CreateRoomPostFormState {
    title: string;
    description: string;
    price: string;
    area: string;
    max_occupants: string;
    floor: string;
    gender_preference: RoomPostGenderPreference;
    status: RoomStatus;
    thumbnail_url: string;
}

type FormErrors = Partial<Record<keyof CreateRoomPostFormState, string>>;

const initialForm: CreateRoomPostFormState = {
    title: '',
    description: '',
    price: '',
    area: '',
    max_occupants: '1',
    floor: '',
    gender_preference: 'any',
    status: 'available',
    thumbnail_url: '',
};

export function CreateRoomPostPage() {
    const navigate = useNavigate();
    const { rentalId = '' } = useParams();
    const [rentalTitle, setRentalTitle] = useState('');
    const [form, setForm] = useState<CreateRoomPostFormState>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let active = true;
        const loadRental = async () => {
            const rental = await getManagedRentalById(rentalId);
            if (!active) return;
            setRentalTitle(rental?.title ?? '');
        };
        if (rentalId) void loadRental();
        return () => {
            active = false;
        };
    }, [rentalId]);

    const parsed = useMemo(() => {
        return {
            price: Number(form.price),
            area: Number(form.area),
            maxOccupants: Number(form.max_occupants),
            floor: form.floor.trim().length > 0 ? Number(form.floor) : undefined,
        };
    }, [form.area, form.floor, form.max_occupants, form.price]);

    const onChangeField =
        <K extends keyof CreateRoomPostFormState>(key: K) =>
        (value: CreateRoomPostFormState[K]) => {
            setForm((prev) => ({ ...prev, [key]: value }));
            setErrors((prev) => ({ ...prev, [key]: undefined }));
        };

    const validate = () => {
        const nextErrors: FormErrors = {};
        if (!form.title.trim()) nextErrors.title = 'Title is required.';
        if (!Number.isFinite(parsed.price) || parsed.price <= 0)
            nextErrors.price = 'Price must be greater than 0.';
        if (!Number.isFinite(parsed.area) || parsed.area <= 0)
            nextErrors.area = 'Area must be greater than 0.';
        if (!Number.isFinite(parsed.maxOccupants) || parsed.maxOccupants <= 0)
            nextErrors.max_occupants = 'Max occupants must be greater than 0.';
        if (form.floor.trim().length > 0) {
            const floorValue = parsed.floor;
            if (floorValue === undefined || !Number.isFinite(floorValue) || floorValue < 0) {
                nextErrors.floor = 'Floor must be 0 or greater.';
            }
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!rentalId) return;
        if (!validate()) return;

        const payload: CreateManagedRoomPostInput = {
            rental_id: rentalId,
            title: form.title,
            description: form.description,
            price: parsed.price,
            area: parsed.area,
            max_occupants: parsed.maxOccupants,
            floor: parsed.floor,
            gender_preference: form.gender_preference,
            status: form.status,
            thumbnail_url: form.thumbnail_url,
        };

        setIsSubmitting(true);
        await createRoomPost(payload);
        setIsSubmitting(false);
        navigate(`/rental-management/rentals/${rentalId}/room-posts`);
    };

    if (!rentalId) {
        return (
            <section className="mx-auto w-full max-w-4xl rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-slate-700">Missing rental id.</p>
                <button
                    type="button"
                    onClick={() => navigate('/rental-management/rentals')}
                    className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                    Back to rental list
                </button>
            </section>
        );
    }

    return (
        <section className="mx-auto w-full max-w-4xl">
            <header className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">createRoomPost</h2>
                <p className="mt-1 text-sm text-slate-500">Rental: {rentalTitle || rentalId}</p>
            </header>

            <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Title *</label>
                        <input
                            value={form.title}
                            onChange={(event) => onChangeField('title')(event.target.value)}
                            placeholder="Example: Room 201 - furnished"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Price (VND) *</label>
                        <input
                            type="number"
                            min={0}
                            value={form.price}
                            onChange={(event) => onChangeField('price')(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.price ? <p className="mt-1 text-xs text-rose-600">{errors.price}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Area (m2) *</label>
                        <input
                            type="number"
                            min={0}
                            value={form.area}
                            onChange={(event) => onChangeField('area')(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.area ? <p className="mt-1 text-xs text-rose-600">{errors.area}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Max occupants *
                        </label>
                        <input
                            type="number"
                            min={1}
                            value={form.max_occupants}
                            onChange={(event) => onChangeField('max_occupants')(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.max_occupants ? (
                            <p className="mt-1 text-xs text-rose-600">{errors.max_occupants}</p>
                        ) : null}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Floor</label>
                        <input
                            type="number"
                            min={0}
                            value={form.floor}
                            onChange={(event) => onChangeField('floor')(event.target.value)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.floor ? <p className="mt-1 text-xs text-rose-600">{errors.floor}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                        <select
                            value={form.status}
                            onChange={(event) => onChangeField('status')(event.target.value as RoomStatus)}
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        >
                            {ROOM_POST_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Gender preference
                        </label>
                        <select
                            value={form.gender_preference}
                            onChange={(event) =>
                                onChangeField('gender_preference')(
                                    event.target.value as RoomPostGenderPreference
                                )
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        >
                            {ROOM_POST_GENDER_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <ImageUpload
                            label="Ảnh bìa (thumbnail)"
                            value={form.thumbnail_url}
                            onChange={(url) => onChangeField('thumbnail_url')(url)}
                            placeholder="Chọn ảnh từ máy tính"
                            previewClassName="w-24 h-24 rounded-xl object-cover border border-slate-200"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(event) => onChangeField('description')(event.target.value)}
                            rows={4}
                            placeholder="Describe room condition, amenities, utility fees..."
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(`/rental-management/rentals/${rentalId}/room-posts`)}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? 'Creating...' : 'Create room post'}
                    </button>
                </div>
            </form>
        </section>
    );
}
