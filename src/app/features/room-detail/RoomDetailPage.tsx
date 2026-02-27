import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { RoomDetail } from './components/RoomDetail';
import type { RoomDetailData } from './types';

const getBaseUrl = () =>
  (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setError('Không tìm thấy ID phòng');
      return;
    }

    const fetchRoom = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${getBaseUrl()}/rooms/${id}`);
        const data = await res.json();

        if (data.success && data.data) {
          const apiRoom = data.data;
          const rental = apiRoom.rental || apiRoom.rentals;
          const location = rental?.location;
          
          const mappedRoom: RoomDetailData = {
            id: apiRoom.id,
            title: apiRoom.title || apiRoom.roomName || 'Phòng trọ',
            description: apiRoom.description || rental?.description || '',
            price: apiRoom.price || 0,
            area: apiRoom.area || apiRoom.sizeM2 || 0,
            max_occupants: apiRoom.max_occupants || apiRoom.maxPeople || 1,
            status: apiRoom.status || 'available',
            address: location ? [location.address, location.district, location.city].filter(Boolean).join(', ') : '',
            images: apiRoom.images || (apiRoom.thumbnail_url ? [apiRoom.thumbnail_url] : []),
            amenities: (apiRoom.amenities || []).map((a: { name?: string; id?: string }) => a.name || a.id || ''),
            rentalName: rental?.title || 'Nhà trọ',
            landlord: {
              name: rental?.owner?.fullName || 'Chủ nhà',
              phone: rental?.owner?.phone || '',
              email: rental?.owner?.email || '',
              avatar: rental?.owner?.avatarUrl || '',
            },
          };
          setRoom(mappedRoom);
        } else {
          setError('Không tìm thấy thông tin phòng trọ');
        }
      } catch (err) {
        console.error('Error fetching room:', err);
        setError('Lỗi khi tải thông tin phòng');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRoom();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{error || 'Không tìm thấy thông tin phòng trọ'}</p>
      </div>
    );
  }

  return (
    <RoomDetail
      room={room}
      onBack={() => navigate(-1)}
    />
  );
}