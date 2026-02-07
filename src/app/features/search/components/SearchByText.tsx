import React, { useState } from 'react';
import { Search, MapPin, DollarSign, Maximize, Home, AlertCircle, RotateCcw } from 'lucide-react';
import type { SearchCriteria, RoomType } from '../types';
import { AMENITIES_LIST, ROOM_TYPE_OPTIONS } from '../constants';

interface SearchByTextProps {
    onSearch: (criteria: SearchCriteria) => void;
    isSearching: boolean;
}

interface FormState {
    location: string;
    minPrice: string;
    maxPrice: string;
    minArea: string;
    maxArea: string;
    roomType: RoomType | '';
    selectedAmenities: string[];
}

const initialFormState: FormState = {
    location: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    roomType: '',
    selectedAmenities: [],
};

export function SearchByText({ onSearch, isSearching }: SearchByTextProps) {
    const [formState, setFormState] = useState<FormState>(initialFormState);
    const [error, setError] = useState('');

    const handleInputChange = (key: keyof FormState, value: string) => {
        setFormState((prev) => ({ ...prev, [key]: value }));
    };

    const handleAmenityToggle = (amenityId: string) => {
        setFormState((prev) => ({
            ...prev,
            selectedAmenities: prev.selectedAmenities.includes(amenityId)
                ? prev.selectedAmenities.filter((id) => id !== amenityId)
                : [...prev.selectedAmenities, amenityId],
        }));
    };

    const validateInput = (): boolean => {
        const { minPrice, maxPrice, minArea, maxArea } = formState;

        // Validate price range
        if (minPrice && isNaN(Number(minPrice))) {
            setError('Giá tối thiểu phải là số hợp lệ');
            return false;
        }
        if (maxPrice && isNaN(Number(maxPrice))) {
            setError('Giá tối đa phải là số hợp lệ');
            return false;
        }
        if (minPrice && Number(minPrice) < 0) {
            setError('Giá tối thiểu không thể là số âm');
            return false;
        }
        if (maxPrice && Number(maxPrice) < 0) {
            setError('Giá tối đa không thể là số âm');
            return false;
        }
        if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
            setError('Giá tối thiểu không thể lớn hơn giá tối đa');
            return false;
        }

        // Validate area range
        if (minArea && isNaN(Number(minArea))) {
            setError('Diện tích tối thiểu phải là số hợp lệ');
            return false;
        }
        if (maxArea && isNaN(Number(maxArea))) {
            setError('Diện tích tối đa phải là số hợp lệ');
            return false;
        }
        if (minArea && Number(minArea) < 0) {
            setError('Diện tích tối thiểu không thể là số âm');
            return false;
        }
        if (maxArea && Number(maxArea) < 0) {
            setError('Diện tích tối đa không thể là số âm');
            return false;
        }
        if (minArea && maxArea && Number(minArea) > Number(maxArea)) {
            setError('Diện tích tối thiểu không thể lớn hơn diện tích tối đa');
            return false;
        }

        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!validateInput()) {
            return;
        }

        const criteria: SearchCriteria = {
            location: formState.location.trim() || undefined,
            minPrice: formState.minPrice ? Number(formState.minPrice) : undefined,
            maxPrice: formState.maxPrice ? Number(formState.maxPrice) : undefined,
            minArea: formState.minArea ? Number(formState.minArea) : undefined,
            maxArea: formState.maxArea ? Number(formState.maxArea) : undefined,
            roomType: formState.roomType || undefined,
            amenities: formState.selectedAmenities.length > 0 ? formState.selectedAmenities : undefined,
        };

        onSearch(criteria);
    };

    const handleReset = () => {
        setFormState(initialFormState);
        setError('');
    };

    return (
        <div className="bg-card rounded-2xl shadow-lg p-6 sm:p-8 max-w-4xl mx-auto">
            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-destructive text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Location */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 font-medium text-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        Địa điểm
                    </label>
                    <input
                        type="text"
                        value={formState.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="Nhập quận, thành phố..."
                        disabled={isSearching}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                    />
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 font-medium text-foreground">
                        <DollarSign className="w-4 h-4 text-primary" />
                        Khoảng giá (VNĐ)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={formState.minPrice}
                            onChange={(e) => handleInputChange('minPrice', e.target.value)}
                            placeholder="Giá tối thiểu"
                            disabled={isSearching}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                        />
                        <input
                            type="text"
                            value={formState.maxPrice}
                            onChange={(e) => handleInputChange('maxPrice', e.target.value)}
                            placeholder="Giá tối đa"
                            disabled={isSearching}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Area Range */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 font-medium text-foreground">
                        <Maximize className="w-4 h-4 text-primary" />
                        Diện tích (m²)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                            type="text"
                            value={formState.minArea}
                            onChange={(e) => handleInputChange('minArea', e.target.value)}
                            placeholder="Diện tích tối thiểu"
                            disabled={isSearching}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                        />
                        <input
                            type="text"
                            value={formState.maxArea}
                            onChange={(e) => handleInputChange('maxArea', e.target.value)}
                            placeholder="Diện tích tối đa"
                            disabled={isSearching}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Room Type */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 font-medium text-foreground">
                        <Home className="w-4 h-4 text-primary" />
                        Loại phòng
                    </label>
                    <select
                        value={formState.roomType}
                        onChange={(e) => handleInputChange('roomType', e.target.value)}
                        disabled={isSearching}
                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                    >
                        <option value="">Chọn loại phòng</option>
                        {ROOM_TYPE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Amenities */}
                <div className="space-y-3">
                    <label className="font-medium text-foreground">Tiện nghi</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {AMENITIES_LIST.map((amenity) => (
                            <label
                                key={amenity.id}
                                className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formState.selectedAmenities.includes(amenity.id)
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                    } ${isSearching ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <input
                                    type="checkbox"
                                    checked={formState.selectedAmenities.includes(amenity.id)}
                                    onChange={() => handleAmenityToggle(amenity.id)}
                                    disabled={isSearching}
                                    className="w-4 h-4 text-primary accent-primary"
                                />
                                <span className="text-sm">{amenity.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                        type="submit"
                        disabled={isSearching}
                        className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Search className="w-4 h-4" />
                        {isSearching ? 'Đang tìm kiếm...' : 'Tìm kiếm'}
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={isSearching}
                        className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-muted transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Đặt lại
                    </button>
                </div>
            </form>
        </div>
    );
}
