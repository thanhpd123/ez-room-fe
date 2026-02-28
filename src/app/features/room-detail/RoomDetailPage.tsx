import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RoomDetail } from './components/RoomDetail';
import { getRoomByIdRequest } from '@/lib/api';
import type { RoomDetailData } from './types';

function mapApiToRoomDetailData(api: Record<string, unknown>): RoomDetailData {
  const rental = (api.rental as { title?: string; location?: { address?: string; district?: string; city?: string }; owner?: { fullName?: string; phone?: string; avatarUrl?: string } }) || {};
  const loc = rental.location;
  const address = loc ? [loc.address, loc.district, loc.city].filter(Boolean).join(', ') : '';
  const owner = rental.owner || {};
  const images = (api.images as string[]) || [];
  const amenities = Array.isArray(api.amenities)
    ? (api.amenities as { name?: string }[]).map((a) => (a && typeof a === 'object' && 'name' in a ? String(a.name) : '')).filter(Boolean)
    : [];

  return {
    id: String(api.id ?? ''),
    title: String(api.roomName ?? api.title ?? 'Phòng'),
    description: String(api.description ?? ''),
    price: Number(api.price ?? 0),
    area: Number(api.sizeM2 ?? api.area ?? 0),
    max_occupants: Number(api.maxPeople ?? api.max_occupants ?? 1),
    status: (api.status as RoomDetailData['status']) || 'available',
    address,
    images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
    amenities,
    rentalName: String(rental.title ?? 'Nhà trọ'),
    landlord: {
      name: String(owner.fullName ?? 'Chủ nhà'),
      phone: String(owner.phone ?? ''),
      email: '',
      avatar: String(owner.avatarUrl ?? ''),
    },
  };
}

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [room, setRoom] = useState<RoomDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    getRoomByIdRequest(id)
      .then((res) => setRoom(mapApiToRoomDetailData(res.data as Record<string, unknown>)))
      .catch((e) => setError(e instanceof Error ? e.message : t('roomDetail.loadError')))
      .finally(() => setLoading(false));
  }, [id, t]);

  if (!id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t('roomDetail.notFound')}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('roomDetail.loading')}</div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{error || t('roomDetail.notFound')}</p>
      </div>
    );
  }

  return <RoomDetail room={room} onBack={() => navigate(-1)} />;
}
