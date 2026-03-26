import React, { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, DollarSign, Maximize, Home, AlertCircle, RotateCcw, Navigation, Loader2 } from 'lucide-react';
import type { SearchCriteria, RoomType } from '../types';
import { useProvinces } from '@/app/hooks/useProvinces';
import { useAmenities } from '@/app/hooks/useAmenities';
import { useRoomTypes } from '@/app/hooks/useRoomTypes';
import { VoiceSearchButton } from '@/app/components/VoiceSearchButton';
import { useGeolocation } from '@/app/hooks/useGeolocation';

interface SearchByTextProps {
    onSearch: (criteria: SearchCriteria) => void;
    isSearching: boolean;
    /** Guest: only name, description, location, price, type. Tenant/VIP: full (area, amenities). */
    basicOnly?: boolean;
    /** Voice search: callback with transcribed text to fill q. */
    onVoiceResult?: (text: string) => void;
    /** Called when "use my location" toggle changes. Used to show/hide nearby search block. */
    onUseMyLocationChange?: (enabled: boolean) => void;
}

interface FormState {
    q: string;
    city: string;
    district: string;
    address: string;
    minPrice: string;
    maxPrice: string;
    minArea: string;
    maxArea: string;
    roomType: RoomType | '';
    selectedAmenities: string[];
}

const initialFormState: FormState = {
    q: '',
    city: '',
    district: '',
    address: '',
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    roomType: '',
    selectedAmenities: [],
};

export function SearchByText({ onSearch, isSearching, basicOnly = false, onVoiceResult, onUseMyLocationChange }: SearchByTextProps) {
    const [searchParams] = useSearchParams();
    const [formState, setFormState] = useState<FormState>(initialFormState);
    const [error, setError] = useState('');
    const [useMyLocation, setUseMyLocation] = useState(false);
    const geo = useGeolocation();
    const { provinces, getWardsFor, loading: locationsLoading } = useProvinces();
    const { amenities: amenitiesList } = useAmenities();
    const { options: roomTypeOptions } = useRoomTypes();
    const effectiveRoomTypes = roomTypeOptions.length > 0 ? roomTypeOptions : [
        { value: 'single', label: 'Phòng đơn' },
        { value: 'double', label: 'Phòng đôi' },
        { value: 'studio', label: 'Studio' },
        { value: 'apartment', label: 'Căn hộ' },
    ];
    const wardOptions = formState.city ? getWardsFor(formState.city) : [];

    // Sync form with URL when landing on /search?city=...&district=...&address=...&amenities=...&minArea=...&maxArea=...
    useEffect(() => {
        const city = searchParams.get('city') || '';
        const district = searchParams.get('district') || '';
        const address = searchParams.get('address') || '';
        const amenitiesParam = searchParams.get('amenities');
        const minAreaParam = searchParams.get('minArea');
        const maxAreaParam = searchParams.get('maxArea');
        if (city || district || address || amenitiesParam || minAreaParam || maxAreaParam) {
            setFormState((prev) => {
                const next = { ...prev, city, district, address };
                if (amenitiesParam) next.selectedAmenities = amenitiesParam.split(',').map((s) => s.trim()).filter(Boolean);
                if (minAreaParam) next.minArea = minAreaParam;
                if (maxAreaParam) next.maxArea = maxAreaParam;
                return next;
            });
        }
    }, [searchParams.toString()]);

    const handleInputChange = (key: keyof FormState, value: string) => {
        setFormState((prev) => {
            const next = { ...prev, [key]: value };
            if (key === 'city') next.district = '';
            return next;
        });
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
            q: formState.q.trim() || undefined,
            city: formState.city.trim() || undefined,
            district: formState.district.trim() || undefined,
            address: formState.address.trim() || undefined,
            minPrice: formState.minPrice ? Number(formState.minPrice) : undefined,
            maxPrice: formState.maxPrice ? Number(formState.maxPrice) : undefined,
            minArea: basicOnly ? undefined : (formState.minArea ? Number(formState.minArea) : undefined),
            maxArea: basicOnly ? undefined : (formState.maxArea ? Number(formState.maxArea) : undefined),
            roomType: formState.roomType || undefined,
            amenities: basicOnly ? undefined : (formState.selectedAmenities.length > 0 ? formState.selectedAmenities : undefined),
            lat: useMyLocation && geo.hasLocation ? geo.latitude! : undefined,
            lng: useMyLocation && geo.hasLocation ? geo.longitude! : undefined,
        };

        onSearch(criteria);
    };

    const handleReset = () => {
        setFormState(initialFormState);
        setError('');
    };

    const handleVoiceResult = useCallback((transcript: string) => {
        setFormState((prev) => ({ ...prev, q: transcript }));
        onVoiceResult?.(transcript);
        // Auto-submit with voice transcript
        const criteria: SearchCriteria = {
            q: transcript.trim() || undefined,
            city: formState.city.trim() || undefined,
            district: formState.district.trim() || undefined,
            address: formState.address.trim() || undefined,
            minPrice: formState.minPrice ? Number(formState.minPrice) : undefined,
            maxPrice: formState.maxPrice ? Number(formState.maxPrice) : undefined,
            minArea: basicOnly ? undefined : (formState.minArea ? Number(formState.minArea) : undefined),
            maxArea: basicOnly ? undefined : (formState.maxArea ? Number(formState.maxArea) : undefined),
            roomType: formState.roomType || undefined,
            amenities: basicOnly ? undefined : (formState.selectedAmenities.length > 0 ? formState.selectedAmenities : undefined),
        };
        onSearch(criteria);
    }, [formState, basicOnly, onSearch, onVoiceResult]);

    return (
        <div className="bg-card rounded-2xl shadow-lg p-6 sm:p-8 max-w-4xl mx-auto">
            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-destructive text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Search query (name, description) + Voice */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 font-medium text-foreground">
                        <Search className="w-4 h-4 text-primary" />
                        Từ khóa (tên, mô tả)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={formState.q}
                            onChange={(e) => handleInputChange('q', e.target.value)}
                            placeholder="VD: phòng có ban công, gần trường..."
                            disabled={isSearching}
                            className="flex-1 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                        />
                        <VoiceSearchButton
                            onResult={handleVoiceResult}
                            onInterim={(text) => setFormState((prev) => ({ ...prev, q: text }))}
                            disabled={isSearching}
                            size="md"
                        />
                    </div>
                </div>

                {/* Location – new address: province (34) → phường/xã → detail */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 font-medium text-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        Địa điểm (Tỉnh/TP → Phường/Xã → Địa chỉ chi tiết)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <select
                            value={formState.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            disabled={isSearching || locationsLoading}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                        >
                            <option value="">Chọn tỉnh / thành phố</option>
                            {provinces.map((p) => (
                                <option key={p.code} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                        <select
                            value={formState.district}
                            onChange={(e) => handleInputChange('district', e.target.value)}
                            disabled={!formState.city || isSearching || locationsLoading}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                        >
                            <option value="">Chọn phường / xã</option>
                            {wardOptions.map((w) => (
                                <option key={w.code} value={w.name}>{w.name}</option>
                            ))}
                        </select>
                        <input
                            type="text"
                            value={formState.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder="Địa chỉ chi tiết (đường, số nhà...)"
                            disabled={isSearching}
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Use My Location toggle */}
                {!basicOnly && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={useMyLocation}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setUseMyLocation(checked);
                                onUseMyLocationChange?.(checked);
                                if (checked && !geo.hasLocation) {
                                    geo.requestLocation();
                                }
                            }}
                            className="sr-only peer"
                            disabled={isSearching}
                        />
                        <div className="w-9 h-5 bg-border rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Navigation className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground">Sử dụng vị trí của tôi</span>
                        {geo.loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
                        {useMyLocation && geo.hasLocation && (
                            <span className="text-xs text-green-600 dark:text-green-400 shrink-0">
                                Đã xác định
                            </span>
                        )}
                        {useMyLocation && geo.error && (
                            <span className="text-xs text-destructive truncate">{geo.error}</span>
                        )}
                    </div>
                    {useMyLocation && geo.hasLocation && (
                        <span className="text-xs text-muted-foreground shrink-0">
                            Ưu tiên phòng gần bạn + tiện ích xung quanh
                        </span>
                    )}
                </div>
                )}

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

                {/* Area Range – tenant/VIP only */}
                {!basicOnly && (
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
                )}

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
                        {effectiveRoomTypes.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Amenities – tenant/VIP only */}
                {!basicOnly && (
                <div className="space-y-3">
                    <label className="font-medium text-foreground">Tiện nghi</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {amenitiesList.map((amenity) => (
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
                                <span className="text-sm">{amenity.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
                )}

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
