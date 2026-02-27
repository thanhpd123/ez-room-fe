import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { RentalDetail } from './components/RentalDetail';
import type { RentalDetailData, RentalRoom } from './types';

const getBaseUrl = () =>
  (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000';

export function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rental, setRental] = useState<RentalDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setError('Không tìm thấy ID nhà trọ');
      return;
    }

    const fetchRental = async () => {
      try {
        setIsLoading(true);
        
        // Fetch rental and rooms in parallel
        const [rentalRes, roomsRes] = await Promise.all([
          fetch(`${getBaseUrl()}/rentals/${id}`),
          fetch(`${getBaseUrl()}/rooms?rental_id=${id}`),
        ]);
        
        const rentalData = await rentalRes.json();
        const roomsData = await roomsRes.json();

        if (rentalData.success && rentalData.data) {
          const apiRental = rentalData.data;
          const location = apiRental.location;
          const rooms: RentalRoom[] = (roomsData.success && Array.isArray(roomsData.data))
            ? roomsData.data.map((r: { id: string; title?: string; roomName?: string; price?: number; area?: number; sizeM2?: number; status?: string }) => ({
                id: r.id,
                title: r.title || r.roomName || 'Phòng trọ',
                price: r.price || 0,
                area: r.area || r.sizeM2 || 0,
                status: r.status === 'rented' ? 'occupied' : 'available',
              }))
            : [];
          
          const availableRooms = rooms.filter(r => r.status === 'available').length;
          
          const mappedRental: RentalDetailData = {
            id: apiRental.id,
            title: apiRental.title || 'Nhà trọ',
            description: apiRental.description || '',
            summary: apiRental.summary || apiRental.description?.substring(0, 200) || '',
            availableRoom: availableRooms,
            status: apiRental.status || 'AVAILABLE',
            address: location ? [location.address, location.district, location.city].filter(Boolean).join(', ') : '',
            images: (apiRental.images || []).map((img: { imageUrl?: string } | string) => typeof img === 'string' ? img : img.imageUrl || ''),
            totalRooms: rooms.length,
            amenities: (apiRental.amenities || []).map((a: { name?: string } | string) => typeof a === 'string' ? a : a.name || ''),
            landlord: {
              name: apiRental.owner?.fullName || 'Chủ nhà',
              phone: apiRental.owner?.phone || '',
              email: apiRental.owner?.email || '',
              avatar: apiRental.owner?.avatarUrl || '',
            },
            rooms,
          };
          setRental(mappedRental);
        } else {
          setError('Không tìm thấy thông tin nhà trọ');
        }
      } catch (err) {
        console.error('Error fetching rental:', err);
        setError('Lỗi khi tải thông tin nhà trọ');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchRental();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !rental) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{error || 'Không tìm thấy thông tin nhà trọ'}</p>
      </div>
    );
  }

  return (
    <RentalDetail
      rental={rental}
      onBack={() => navigate('/search')}
      onViewRoom={(roomId) => navigate(`/room/${roomId}`)}
    />
  );
}