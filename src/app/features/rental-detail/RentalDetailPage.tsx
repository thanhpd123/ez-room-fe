import { useParams, useNavigate } from 'react-router-dom';
import { RentalDetail } from './components/RentalDetail';
import { MOCK_RENTAL_DETAILS } from './constants';

export function RentalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id || !MOCK_RENTAL_DETAILS[id]) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Không tìm thấy thông tin nhà trọ</p>
      </div>
    );
  }

  const rental = MOCK_RENTAL_DETAILS[id];

  return (
    <RentalDetail
      rental={rental}
      onBack={() => navigate('/search')}
      onViewRoom={(roomId) => navigate(`/room/${roomId}`)}
    />
  );
}