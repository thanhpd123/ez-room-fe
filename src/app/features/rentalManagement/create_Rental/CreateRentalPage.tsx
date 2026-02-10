import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RentalStatus } from '@/lib/models/rental.model';
import { createManagedRental } from '../shared/rental-storage';
import { PROPERTY_TYPE_OPTIONS, RENTAL_STATUS_OPTIONS, type CreateManagedRentalInput, type PropertyType } from '../shared/types';

interface CreateRentalFormState {
    title: string;
    summary: string;
    description: string;
    city: string;
    district: string;
    address: string;
    property_type: PropertyType;
    available_room: string;
    status: RentalStatus;
    thumbnail_url: string;
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
    status: 'pending',
    thumbnail_url: '',
};

export function CreateRentalPage() {
    const navigate = useNavigate();
    const [form, setForm] = useState<CreateRentalFormState>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availableRoomNumber = useMemo(() => Number(form.available_room), [form.available_room]);

    const validateForm = () => {
        const nextErrors: FormErrors = {};

        if (!form.title.trim()) nextErrors.title = 'Title is required.';
        if (!form.city.trim()) nextErrors.city = 'City is required.';
        if (!form.district.trim()) nextErrors.district = 'District is required.';
        if (!form.address.trim()) nextErrors.address = 'Address is required.';
        if (!Number.isFinite(availableRoomNumber) || availableRoomNumber < 0) {
            nextErrors.available_room = 'Available room must be a positive number.';
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const onChangeField =
        <K extends keyof CreateRentalFormState>(key: K) =>
        (value: CreateRentalFormState[K]) => {
            setForm((prev) => ({ ...prev, [key]: value }));
            setErrors((prev) => ({ ...prev, [key]: undefined }));
        };

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!validateForm()) return;

        const payload: CreateManagedRentalInput = {
            user_id: 'owner-demo',
            title: form.title,
            summary: form.summary,
            description: form.description,
            city: form.city,
            district: form.district,
            address: form.address,
            property_type: form.property_type,
            available_room: availableRoomNumber,
            status: form.status,
            thumbnail_url: form.thumbnail_url,
        };

        setIsSubmitting(true);
        await createManagedRental(payload);
        setIsSubmitting(false);
        navigate('/rental-management/rentals');
    };

    return (
        <section className="mx-auto w-full max-w-4xl">
            <header className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">Create Rental</h2>
                <p className="mt-1 text-sm text-slate-500">
                    Rental in this feature is a rental property (building/apartment/house listing).
                </p>
            </header>

            <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Title *</label>
                        <input
                            value={form.title}
                            onChange={(event) => onChangeField('title')(event.target.value)}
                            placeholder="Example: Maple Residence - near university"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.title ? <p className="mt-1 text-xs text-rose-600">{errors.title}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Property type</label>
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
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
                        <select
                            value={form.status}
                            onChange={(event) =>
                                onChangeField('status')(event.target.value as RentalStatus)
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        >
                            {RENTAL_STATUS_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">City *</label>
                        <input
                            value={form.city}
                            onChange={(event) => onChangeField('city')(event.target.value)}
                            placeholder="Ha Noi"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.city ? <p className="mt-1 text-xs text-rose-600">{errors.city}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">District *</label>
                        <input
                            value={form.district}
                            onChange={(event) => onChangeField('district')(event.target.value)}
                            placeholder="Dong Da"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.district ? <p className="mt-1 text-xs text-rose-600">{errors.district}</p> : null}
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Address *</label>
                        <input
                            value={form.address}
                            onChange={(event) => onChangeField('address')(event.target.value)}
                            placeholder="268 Tay Son"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                        {errors.address ? <p className="mt-1 text-xs text-rose-600">{errors.address}</p> : null}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Available rooms *
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

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Thumbnail URL
                        </label>
                        <input
                            value={form.thumbnail_url}
                            onChange={(event) => onChangeField('thumbnail_url')(event.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Summary</label>
                        <textarea
                            value={form.summary}
                            onChange={(event) => onChangeField('summary')(event.target.value)}
                            rows={2}
                            placeholder="Short description for this rental listing"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(event) => onChangeField('description')(event.target.value)}
                            rows={5}
                            placeholder="More details about services, rules, and amenities..."
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                        />
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/rental-management/rentals')}
                        className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSubmitting ? 'Creating...' : 'Create rental'}
                    </button>
                </div>
            </form>
        </section>
    );
}
