import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button, Alert, Checkbox } from 'antd';
import { SearchOutlined, FilterOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { PRICE_OPTIONS } from '../constants';
import { ROOM_TYPE_OPTIONS } from '@/lib/constants/room-types';
import { useProvinces } from '@/app/hooks/useProvinces';
import { useRoomTypes } from '@/app/hooks/useRoomTypes';
import { useAmenities } from '@/app/hooks/useAmenities';
import { useAuthLevel } from '@/app/features/search/hooks/useAuthLevel';

interface SearchFormProps {
    onSearch: (query: string, filters: SearchFilters) => void;
    onLogin?: () => void;
}

export interface SearchFilters {
    city: string;
    district: string;
    address: string;
    priceRange: string;
    roomType: string;
    amenities?: string[];
    minArea?: number;
    maxArea?: number;
}

export function SearchForm({ onSearch, onLogin }: SearchFormProps) {
    const { t } = useTranslation();
    const { provinces, getWardsFor, loading: locationsLoading, error: locationsError } = useProvinces();
    const { options: roomTypeOptions, loading: roomTypesLoading } = useRoomTypes();
    const { amenities: amenitiesList, loading: amenitiesLoading } = useAmenities();
    const { isGuest, loading: authLoading } = useAuthLevel();
    const showGuestOverlay = !authLoading && isGuest;

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState<SearchFilters>({
        city: '',
        district: '',
        address: '',
        priceRange: '',
        roomType: '',
    });
    const [advancedExpanded, setAdvancedExpanded] = useState(false);
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [minArea, setMinArea] = useState('');
    const [maxArea, setMaxArea] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: SearchFilters = { ...filters };
        if (!showGuestOverlay && (selectedAmenities.length > 0 || minArea || maxArea)) {
            if (selectedAmenities.length > 0) payload.amenities = selectedAmenities;
            if (minArea && !Number.isNaN(Number(minArea))) payload.minArea = Number(minArea);
            if (maxArea && !Number.isNaN(Number(maxArea))) payload.maxArea = Number(maxArea);
        }
        onSearch(searchQuery, payload);
    };

    const handleFilterChange = (key: keyof SearchFilters, value: string) => {
        setFilters((prev) => {
            const next = { ...prev, [key]: value };
            if (key === 'city') next.district = '';
            return next;
        });
    };

    const toggleAmenity = (id: string) => {
        setSelectedAmenities((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const cityOptions = provinces.map((p) => ({ value: p.name, label: p.name }));
    const wardOptions = filters.city ? getWardsFor(filters.city).map((w) => ({ value: w.name, label: w.name })) : [];
    const effectiveRoomTypes = roomTypeOptions.length > 0 ? roomTypeOptions : ROOM_TYPE_OPTIONS.filter((o) => o.value);
    const roomTypeOptionsFormatted = [
        { value: '', label: t('search.roomType') || 'Loại phòng' },
        ...effectiveRoomTypes.map((o) => ({ value: o.value, label: o.label })),
    ];

    return (
        <div className="bg-card/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 p-4 sm:p-6 lg:p-8 w-full max-w-2xl mx-auto ring-2 ring-white/10">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <Input
                    size="large"
                    placeholder={t('search.placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    prefix={<SearchOutlined className="text-muted-foreground" />}
                    className="rounded-xl [&_.ant-input]:rounded-xl"
                />

                {locationsError && (
                    <Alert type="warning" message={locationsError} showIcon className="rounded-xl" />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Select
                        size="large"
                        placeholder={t('search.city')}
                        value={filters.city || undefined}
                        onChange={(v) => handleFilterChange('city', v || '')}
                        options={cityOptions}
                        allowClear
                        loading={locationsLoading}
                        notFoundContent={locationsLoading ? undefined : t('search.noProvinces')}
                        className="w-full rounded-xl [&_.ant-select-selector]:rounded-xl"
                    />
                    <Select
                        size="large"
                        placeholder={t('search.ward')}
                        value={filters.district || undefined}
                        onChange={(v) => handleFilterChange('district', v || '')}
                        options={wardOptions}
                        allowClear
                        disabled={!filters.city}
                        loading={locationsLoading}
                        notFoundContent={!filters.city ? undefined : t('search.noWards')}
                        className="w-full rounded-xl [&_.ant-select-selector]:rounded-xl"
                    />
                    <Input
                        size="large"
                        placeholder={t('search.detailAddress')}
                        value={filters.address}
                        onChange={(e) => handleFilterChange('address', e.target.value)}
                        className="rounded-xl [&_.ant-input]:rounded-xl"
                        allowClear
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                        size="large"
                        placeholder={t('search.priceRange')}
                        value={filters.priceRange || undefined}
                        onChange={(v) => handleFilterChange('priceRange', v || '')}
                        options={PRICE_OPTIONS.filter((o) => o.value !== '').map((o) => ({ value: o.value, label: o.label }))}
                        allowClear
                        className="w-full rounded-xl [&_.ant-select-selector]:rounded-xl"
                    />
                    <Select
                        size="large"
                        placeholder={t('search.roomType')}
                        value={filters.roomType || undefined}
                        onChange={(v) => handleFilterChange('roomType', v || '')}
                        options={roomTypeOptionsFormatted}
                        allowClear
                        loading={roomTypesLoading}
                        notFoundContent={roomTypesLoading ? undefined : t('search.noRoomTypes')}
                        className="w-full rounded-xl [&_.ant-select-selector]:rounded-xl"
                    />
                </div>

                {/* Advanced search: toggle button */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-1">
                    <Button type="primary" htmlType="submit" size="large" className="flex-1 rounded-xl font-semibold h-11 sm:h-12 min-h-[44px] touch-manipulation shadow-md hover:shadow-lg transition-shadow active:scale-[0.98]">
                        {t('search.search')}
                    </Button>
                    <Button
                        size="large"
                        type="default"
                        onClick={() => setAdvancedExpanded((prev) => !prev)}
                        className="rounded-xl h-11 sm:h-12 min-h-[44px] flex items-center justify-center gap-2 touch-manipulation"
                        icon={<FilterOutlined />}
                    >
                        {t('search.advancedSearch')}
                        {advancedExpanded ? <UpOutlined className="text-xs" /> : <DownOutlined className="text-xs" />}
                    </Button>
                </div>

                {/* Advanced section: amenities, area – tenant/VIP only */}
                {advancedExpanded && (
                    <div className={`rounded-xl border p-4 space-y-4 ${showGuestOverlay ? 'opacity-60 relative' : ''}`}>
                        {showGuestOverlay && (
                            <div className="absolute inset-0 rounded-xl bg-background/80 flex flex-col items-center justify-center gap-3 z-10">
                                <p className="text-sm font-medium text-center px-4">
                                    Đăng nhập để sử dụng tiện nghi và gợi ý cá nhân
                                </p>
                                <Button type="primary" size="middle" onClick={onLogin}>
                                    Đăng nhập
                                </Button>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium mb-2">Tiện nghi</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {amenitiesList.map((a) => (
                                    <Checkbox
                                        key={a.id}
                                        checked={selectedAmenities.includes(a.id)}
                                        onChange={() => !showGuestOverlay && toggleAmenity(a.id)}
                                        disabled={showGuestOverlay || amenitiesLoading}
                                    >
                                        {a.name}
                                    </Checkbox>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Diện tích (m²)</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="Tối thiểu"
                                    value={minArea}
                                    onChange={(e) => setMinArea(e.target.value)}
                                    disabled={showGuestOverlay}
                                />
                                <Input
                                    placeholder="Tối đa"
                                    value={maxArea}
                                    onChange={(e) => setMaxArea(e.target.value)}
                                    disabled={showGuestOverlay}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}
