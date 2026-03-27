import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Camera, Heart, Search } from 'lucide-react';
import { Header, Footer } from '@/app/features/home/components';
import { getPublicRoomsRequest, type PublicRoomItem } from '@/lib/api';
import './RoomsPage.css';

const PAGE_SIZE = 10;

const ROOM_TYPE_TABS = [
    { label: 'Tất cả', value: '' },
    { label: 'Phòng riêng', value: 'single' },
    { label: 'Phòng ghép', value: 'shared' },
    { label: 'Studio', value: 'studio' },
    { label: 'Apartment', value: 'apartment' },
];

const SORT_TABS = [
    { label: 'Mới đăng', value: 'newest' },
    { label: 'Đề xuất', value: 'recommended' },
];

function formatPrice(price: number): string {
    if (price >= 1_000_000) {
        const millions = price / 1_000_000;
        return `${Number.isInteger(millions) ? millions : millions.toFixed(1)} triệu/tháng`;
    }
    return `${price.toLocaleString('vi-VN')} đ/tháng`;
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
}

export function RoomsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [rooms, setRooms] = useState<PublicRoomItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });

    const roomTypeFromUrl = searchParams.get('roomType') || '';
    const pageFromUrl = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const sortFromUrl = searchParams.get('sort') || 'newest';

    const [activeType, setActiveType] = useState(roomTypeFromUrl);
    const [activeSort, setActiveSort] = useState(sortFromUrl);

    useEffect(() => {
        setActiveType(roomTypeFromUrl);
        setActiveSort(sortFromUrl);
    }, [roomTypeFromUrl, sortFromUrl]);

    useEffect(() => {
        setLoading(true);
        getPublicRoomsRequest({
            page: pageFromUrl,
            limit: PAGE_SIZE,
            roomType: roomTypeFromUrl || undefined,
        })
            .then((res) => {
                setRooms(res.data || []);
                setPagination(res.pagination || { page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
            })
            .catch(() => {
                setRooms([]);
                setPagination({ page: 1, limit: PAGE_SIZE, total: 0, pages: 0 });
            })
            .finally(() => setLoading(false));
    }, [pageFromUrl, roomTypeFromUrl]);

    const updateParams = (updates: Record<string, string | undefined>) => {
        const p = new URLSearchParams(searchParams);
        for (const [key, val] of Object.entries(updates)) {
            if (val) p.set(key, val);
            else p.delete(key);
        }
        setSearchParams(p);
    };

    const handleTypeChange = (type: string) => {
        setActiveType(type);
        updateParams({ roomType: type || undefined, page: undefined });
    };

    const handleSortChange = (sort: string) => {
        setActiveSort(sort);
        updateParams({ sort, page: undefined });
    };

    const goToPage = (newPage: number) => {
        if (newPage < 1 || newPage > pagination.pages) return;
        updateParams({ page: newPage > 1 ? String(newPage) : undefined });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRoomClick = (id: string) => navigate(`/room/${id}`);

    const pageNumbers = useMemo(() => {
        const total = pagination.pages;
        const current = pagination.page;
        const range: number[] = [];
        const start = Math.max(1, current - 2);
        const end = Math.min(total, current + 2);
        for (let i = start; i <= end; i++) range.push(i);
        return range;
    }, [pagination]);

    return (
        <div className="rooms-page">
            <Header onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />

            {/* Hero */}
            <div className="rooms-hero">
                <h1>Tìm phòng trọ</h1>
                <p>Khám phá hàng trăm phòng trọ chất lượng trên EzRoom</p>
            </div>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Category tabs */}
                <div className="rooms-category-bar">
                    {ROOM_TYPE_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            className={`rooms-cat-btn ${activeType === tab.value ? 'active' : ''}`}
                            onClick={() => handleTypeChange(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Sort tabs + stats */}
                <div className="rooms-sort-bar">
                    {SORT_TABS.map((tab) => (
                        <button
                            key={tab.value}
                            type="button"
                            className={`rooms-sort-tab ${activeSort === tab.value ? 'active' : ''}`}
                            onClick={() => handleSortChange(tab.value)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="rooms-stats">
                    <span>
                        {loading ? '...' : `Hiện có ${pagination.total} phòng`}
                        {activeType && ` loại "${ROOM_TYPE_TABS.find(t => t.value === activeType)?.label}"`}
                    </span>
                    <span>Trang {pagination.page}/{pagination.pages || 1}</span>
                </div>

                {/* Room list */}
                {loading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="room-card-skeleton">
                            <div className="skel-img" />
                            <div className="skel-body">
                                <div className="skel-line w80" />
                                <div className="skel-line w60" />
                                <div className="skel-line w40" />
                                <div className="skel-line w80" />
                                <div className="skel-line w30" />
                            </div>
                        </div>
                    ))
                ) : rooms.length === 0 ? (
                    <div className="rooms-empty">
                        <div className="rooms-empty-icon">
                            <Search />
                        </div>
                        <p className="text-muted-foreground text-base">Không tìm thấy phòng trọ nào</p>
                        <button
                            type="button"
                            className="mt-3 text-primary font-semibold hover:underline"
                            onClick={() => handleTypeChange('')}
                        >
                            Xem tất cả phòng
                        </button>
                    </div>
                ) : (
                    rooms.map((room) => {
                        const images = room.images || [];
                        const loc = room.rental?.location;
                        const address = loc ? [loc.district, loc.city].filter(Boolean).join(', ') : '';
                        const name = room.roomName || room.title || 'Phòng trọ';
                        const desc = room.description || '';
                        const amenities = room.amenities || [];
                        const created = room.createdAt;

                        return (
                            <div
                                key={room.id}
                                className="room-card"
                                onClick={() => handleRoomClick(room.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleRoomClick(room.id)}
                            >
                                {/* Image grid */}
                                <div className="room-card-images">
                                    <div className="img-main">
                                        <img
                                            src={images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'}
                                            alt={name}
                                            loading="lazy"
                                        />
                                    </div>
                                    {images.length > 1 && (
                                        <div className="img-sub">
                                            <img src={images[1]} alt="" loading="lazy" />
                                        </div>
                                    )}
                                    {images.length > 2 && (
                                        <div className="img-sub">
                                            <img src={images[2]} alt="" loading="lazy" />
                                        </div>
                                    )}
                                    {images.length > 3 && (
                                        <div className="img-count">
                                            <Camera size={12} />
                                            {images.length}
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="room-card-body">
                                    <h3 className="room-card-title">{name}</h3>

                                    <div className="room-card-meta">
                                        <span className="room-card-price">{formatPrice(room.price)}</span>
                                        {room.sizeM2 && (
                                            <span className="room-card-area">{room.sizeM2} m²</span>
                                        )}
                                        {address && (
                                            <span className="room-card-location">
                                                <MapPin size={14} />
                                                {address}
                                            </span>
                                        )}
                                    </div>

                                    {amenities.length > 0 && (
                                        <div className="room-card-amenities">
                                            {amenities.slice(0, 5).map((a) => (
                                                <span key={a.id} className="room-card-amenity">{a.name}</span>
                                            ))}
                                            {amenities.length > 5 && (
                                                <span className="room-card-amenity">+{amenities.length - 5}</span>
                                            )}
                                        </div>
                                    )}

                                    {desc && (
                                        <p className="room-card-desc">{desc}</p>
                                    )}

                                    <div className="room-card-owner">
                                        <div className="room-card-owner-info">
                                            <div className="room-card-owner-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#2FA4A9', background: 'rgba(47,164,169,0.1)' }}>
                                                {(room.rental?.title || '?')[0]}
                                            </div>
                                            <div>
                                                <div className="room-card-owner-name">{room.rental?.title || 'Chủ nhà'}</div>
                                                <div className="room-card-owner-date">{created ? timeAgo(created) : ''}</div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="room-card-heart"
                                            onClick={(e) => { e.stopPropagation(); }}
                                            title="Yêu thích"
                                        >
                                            <Heart size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                    <div className="rooms-pagination">
                        <button
                            type="button"
                            className="rooms-page-btn"
                            disabled={pagination.page <= 1}
                            onClick={() => goToPage(pagination.page - 1)}
                        >
                            ‹
                        </button>
                        {pageNumbers.map((num) => (
                            <button
                                key={num}
                                type="button"
                                className={`rooms-page-btn ${num === pagination.page ? 'active' : ''}`}
                                onClick={() => goToPage(num)}
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            type="button"
                            className="rooms-page-btn"
                            disabled={pagination.page >= pagination.pages}
                            onClick={() => goToPage(pagination.page + 1)}
                        >
                            ›
                        </button>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
