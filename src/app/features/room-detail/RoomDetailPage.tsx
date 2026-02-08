import { useParams, useNavigate } from 'react-router-dom';
import { RoomDetail } from './components/RoomDetail';
import { MOCK_ROOM_DETAILS } from './constants';

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id || !MOCK_ROOM_DETAILS[id]) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Không tìm thấy thông tin phòng trọ</p>
      </div>
    );
  }

  const room = MOCK_ROOM_DETAILS[id];

  return (
    <RoomDetail
      room={room}
      onBack={() => navigate(-1)}
    />
  );
}