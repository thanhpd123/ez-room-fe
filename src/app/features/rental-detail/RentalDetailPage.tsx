import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { RentalDetail } from './components/RentalDetail';
import { Header, Footer } from '@/app/features/home/components';
import { getPublicRentalByIdRequest } from '@/lib/api';
import type { RentalDetailData } from './types';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800';

function mapApiToRentalDetailData(api: {
  id: string;
  title?: string;
  description?: string | null;
  status?: string;
  location?: { address?: string; district?: string | null; city?: string | null } | null;
  images?: string[];
  owner?: { fullName?: string; phone?: string | null; email?: string; avatarUrl?: string | null } | null;
  rooms?: Array<{
    id: string;
    room_name?: string | null;
    price?: number;
    size_m2?: number | null;
    images?: string[];
    amenities?: string[];
  }>;
  amenities?: string[];
}): RentalDetailData {
  const location = api.location;
  const address = location
    ? [location.address, location.district, location.city].filter(Boolean).join(', ')
    : '';
  const rooms = api.rooms || [];
  return {
    id: api.id,
    title: api.title || 'Nhà trọ',
    description: api.description || '',
    summary: (api.description && api.description.slice(0, 200)) || api.title || 'Nhà trọ',
    availableRoom: rooms.length,
    status: (api.status as RentalDetailData['status']) || 'PENDING',
    address,
    totalRooms: rooms.length,
    images: api.images?.length ? api.images : [PLACEHOLDER_IMAGE],
    amenities: Array.isArray(api.amenities) ? api.amenities : [],
    landlord: {
      name: api.owner?.fullName ?? 'Chủ nhà',
      phone: api.owner?.phone ?? '',
      email: api.owner?.email ?? '',
      avatar: api.owner?.avatarUrl ?? '',
    },
    rooms: rooms.map((r) => ({
      id: r.id,
      title: r.room_name || 'Phòng',
      price: typeof r.price === 'number' ? r.price : 0,
      area: r.size_m2 != null ? Number(r.size_m2) : 0,
      status: 'available' as const,
      images: Array.isArray(r.images) && r.images.length > 0 ? r.images : undefined,
      amenities: Array.isArray(r.amenities) ? r.amenities : [],
    })),
  };
}

export function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setError(null);
    getPublicRentalByIdRequest(id)
      .then((res) => {
        const raw = res?.data;
        if (!raw || typeof raw !== 'object') {
          setError('Dữ liệu không hợp lệ');
          return;
        }
        setRental(mapApiToRentalDetailData(raw));
      })
      .catch((e) => {
        const msg = e instanceof Error ? e.message : 'Lỗi tải dữ liệu';
        setError(msg);
        console.error('[RentalDetailPage]', id, e);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleLogin = () => navigate('/login');
  const handleRegister = () => navigate('/register');

  const renderContent = () => {
    if (!id) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-muted-foreground">Không tìm thấy thông tin nhà trọ</p>
          <button type="button" onClick={() => navigate('/browse')} className="text-primary font-medium hover:underline">
            Xem tất cả nhà trọ
          </button>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-pulse text-muted-foreground">Đang tải...</div>
        </div>
      );
    }

    if (error || !rental) {
      return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <p className="text-muted-foreground">{error || 'Không tìm thấy thông tin nhà trọ'}</p>
          <button type="button" onClick={() => navigate('/browse')} className="text-primary font-medium hover:underline">
            Xem tất cả nhà trọ
          </button>
        </div>
      );
    }

    return (
      <RentalDetail
        rental={rental}
        onBack={() => navigate('/browse')}
        onViewRoom={(roomId) => navigate(`/room/${roomId}`)}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onLogin={handleLogin} onRegister={handleRegister} />
      <main className="min-h-[60vh]">{renderContent()}</main>
      <Footer />
    </div>
  );
}
