export const FEATURED_LISTINGS = [
    {
        id: '1',
        image: 'https://images.unsplash.com/photo-1663756915301-2ba688e078cf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
        title: 'Căn hộ Studio hiện đại',
        price: '4.5 triệu',
        area: '25m²',
        location: 'Quận 1, TP. HCM',
        rating: 4.8,
        verified: true,
    },
    {
        id: '2',
        image: 'https://images.unsplash.com/photo-1611095459865-47682ae3c41c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
        title: 'Phòng ấm cúng gần ĐH Bách Khoa',
        price: '2.8 triệu',
        area: '20m²',
        location: 'Quận 10, TP. HCM',
        rating: 4.6,
        verified: true,
    },
    {
        id: '3',
        image: 'https://images.unsplash.com/photo-1702014861449-202805baa272?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
        title: 'Căn hộ mini cao cấp',
        price: '5.2 triệu',
        area: '30m²',
        location: 'Quận 7, TP. HCM',
        rating: 4.9,
        verified: true,
    },
    {
        id: '4',
        image: 'https://images.unsplash.com/photo-1651752523215-9bf678c29355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
        title: 'Phòng trọ giá tốt Bình Thạnh',
        price: '3.5 triệu',
        area: '22m²',
        location: 'Bình Thạnh, TP. HCM',
        rating: 4.5,
        verified: false,
    },
];

export const POPULAR_LOCATIONS = [
    {
        name: 'Quận 1',
        count: '1.2k phòng',
        image: 'https://images.unsplash.com/photo-1663756915301-2ba688e078cf?w=400',
    },
    {
        name: 'Quận 7',
        count: '890 phòng',
        image: 'https://images.unsplash.com/photo-1702014861449-202805baa272?w=400',
    },
    {
        name: 'Bình Thạnh',
        count: '1.5k phòng',
        image: 'https://images.unsplash.com/photo-1611095459865-47682ae3c41c?w=400',
    },
    {
        name: 'Quận 10',
        count: '750 phòng',
        image: 'https://images.unsplash.com/photo-1651752523215-9bf678c29355?w=400',
    },
];

/** City options for location (city → district → address). */
export const CITY_OPTIONS = [
    { value: '', label: 'Chọn thành phố' },
    { value: 'Hà Nội', label: 'Hà Nội' },
    { value: 'TP. Hồ Chí Minh', label: 'TP. Hồ Chí Minh' },
];

/** Districts per city. Keys must match CITY_OPTIONS value. */
export const DISTRICTS_BY_CITY: Record<string, { value: string; label: string }[]> = {
    'Hà Nội': [
        { value: 'Hoàn Kiếm', label: 'Hoàn Kiếm' },
        { value: 'Cầu Giấy', label: 'Cầu Giấy' },
        { value: 'Hoàng Mai', label: 'Hoàng Mai' },
        { value: 'Đống Đa', label: 'Đống Đa' },
        { value: 'Tây Hồ', label: 'Tây Hồ' },
    ],
    'TP. Hồ Chí Minh': [
        { value: 'Quận 1', label: 'Quận 1' },
        { value: 'Quận 3', label: 'Quận 3' },
        { value: 'Quận 7', label: 'Quận 7' },
        { value: 'Quận 10', label: 'Quận 10' },
        { value: 'Bình Thạnh', label: 'Bình Thạnh' },
        { value: 'Thủ Đức', label: 'Thủ Đức' },
    ],
};

/** @deprecated Use city + district + address instead. Kept for any legacy references. */
export const LOCATION_OPTIONS = [
    { value: '', label: 'Chọn khu vực' },
    ...(DISTRICTS_BY_CITY['Hà Nội'] || []).map((d) => ({ value: d.value, label: `${d.label} (Hà Nội)` })),
    ...(DISTRICTS_BY_CITY['TP. Hồ Chí Minh'] || []).map((d) => ({ value: d.value, label: `${d.label} (HCM)` })),
];

export const PRICE_OPTIONS = [
    { value: '', label: 'Khoảng giá' },
    { value: '0-3', label: 'Dưới 3 triệu' },
    { value: '3-5', label: '3 - 5 triệu' },
    { value: '5-8', label: '5 - 8 triệu' },
    { value: '8+', label: 'Trên 8 triệu' },
];

export const ROOM_TYPE_OPTIONS = [
    { value: '', label: 'Loại phòng' },
    { value: 'apartment', label: 'Căn hộ' },
    { value: 'studio', label: 'Studio' },
    { value: 'mini', label: 'Căn hộ mini' },
    { value: 'homestay', label: 'Homestay' },
];
