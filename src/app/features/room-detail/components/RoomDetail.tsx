import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Users,
  Maximize,
  Wifi,
  Wind,
  Droplet,
  Zap,
  Shield,
  Phone,
  Mail,
  Check,
  MessageCircle
} from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '@/app/context/FavoritesContext';
import { useAuth } from '@/app/context/AuthContext';
import { useChatBox } from '@/app/context/ChatBoxContext';
import { RoomReviews } from './RoomReviews';

export interface RoomDetailData {
  id: string;
  title: string;
  description: string;
  price: number;
  area: number;
  max_occupants: number;
  status: 'available' | 'occupied' | 'maintenance';
  address: string;
  images: string[];
  amenities: string[];
  rentalName: string;
  landlord: {
    id: string;
    name: string;
    phone: string;
    email: string;
    avatar: string;
  };
}

interface RoomDetailProps {
  room: RoomDetailData;
  onBack: () => void;
}

export function RoomDetail({ room, onBack }: RoomDetailProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const chatBox = useChatBox();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const favorited = isFavorite(room.id);
  const [selectedImage, setSelectedImage] = useState(0);

  const handleContactNow = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // Prevent landlord from chatting with themselves
    if (room.landlord.id === user.id) {
      alert('Bạn không thể nhắn tin với chính mình');
      return;
    }
    if (chatBox && room.landlord.id) {
      chatBox.openChatWith(room.landlord.id);
    }
  };

  const handleFavoriteClick = () => {
    if (favorited) {
      removeFavorite(room.id);
    } else {
      addFavorite({
        id: room.id,
        name: room.title,
        price: room.price,
        area: room.area,
        address: room.address,
        image: room.images[0] ?? '',
        available: room.status === 'available',
      });
    }
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    available: { label: 'Còn trống', color: 'bg-primary text-primary-foreground' },
    occupied: { label: 'Đã cho thuê', color: 'bg-muted text-muted-foreground' },
    maintenance: { label: 'Bảo trì', color: 'bg-accent text-accent-foreground' },
  };
  const statusInfo = statusConfig[room.status] ?? statusConfig.available;

  const amenityIcons: { [key: string]: any } = {
    'Wifi': Wifi,
    'Điều hòa': Wind,
    'Nóng lạnh': Droplet,
    'Điện riêng': Zap,
    'An ninh 24/7': Shield,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Quay lại</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleFavoriteClick}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title={favorited ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
              >
                <Heart
                  className={`w-5 h-5 ${favorited ? 'fill-accent text-accent' : 'text-foreground'}`}
                />
              </button>
              <button className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Image Gallery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="lg:col-span-2">
            <img
              src={room.images[selectedImage]}
              alt={room.title}
              className="w-full h-96 object-cover rounded-xl"
            />
          </div>
          <div className="lg:col-span-2 grid grid-cols-4 gap-4">
            {room.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`relative overflow-hidden rounded-lg aspect-video ${selectedImage === index ? 'ring-2 ring-primary' : ''
                  }`}
              >
                <img
                  src={image}
                  alt={`Gallery ${index + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & Status */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="font-nunito">{room.title}</h1>
                <span className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <p>{room.address}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Thuộc: <span className="text-foreground font-medium">{room.rentalName}</span>
              </p>
            </div>

            {/* Key Info */}
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
                    <Maximize className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{room.area}m²</p>
                  <p className="text-sm text-muted-foreground">Diện tích</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
                    <Users className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{room.max_occupants}</p>
                  <p className="text-sm text-muted-foreground">Người tối đa</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-2">
                    <span className="text-xl">₫</span>
                  </div>
                  <p className="text-2xl font-semibold text-primary">{room.price.toLocaleString('vi-VN')}</p>
                  <p className="text-sm text-muted-foreground">đ/tháng</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-nunito mb-4">Mô tả chi tiết</h3>
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {room.description}
              </p>
            </div>

            {/* Amenities */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-nunito mb-4">Tiện ích</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {room.amenities.map((amenity, index) => {
                  const Icon = amenityIcons[amenity] || Check;
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-foreground">{amenity}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reviews */}
            <RoomReviews roomId={room.id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Price Card */}
              <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                <div className="text-center mb-6">
                  <p className="text-3xl font-bold text-primary mb-1">
                    {room.price.toLocaleString('vi-VN')} ₫
                  </p>
                  <p className="text-muted-foreground">/ tháng</p>
                </div>

                <button
                  type="button"
                  onClick={handleContactNow}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg transition-colors mb-3 flex items-center justify-center gap-2 font-medium"
                >
                  <MessageCircle className="w-5 h-5" />
                  {user ? 'Liên hệ ngay' : 'Đăng nhập để nhắn tin'}
                </button>
                <button
                  type="button"
                  onClick={handleFavoriteClick}
                  className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 rounded-lg transition-colors mb-3 flex items-center justify-center gap-2 font-medium"
                >
                  <Heart className={`w-5 h-5 ${favorited ? 'fill-accent text-accent' : ''}`} />
                  {favorited ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
                </button>
                <button className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 rounded-lg transition-colors">
                  Yêu cầu xem phòng
                </button>
              </div>

              {/* Landlord Info */}
              <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                <h3 className="font-nunito mb-4">Người cho thuê</h3>

                <div className="flex items-center gap-3 mb-4">
                  <Link
                    to={`/landlord/${room.landlord.id}`}
                    className="flex-shrink-0 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={room.landlord.avatar}
                      alt={room.landlord.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  </Link>
                  <div>
                    <p className="font-medium text-foreground">{room.landlord.name}</p>
                    <p className="text-sm text-muted-foreground">Chủ nhà</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <a
                    href={`tel:${room.landlord.phone}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="text-foreground">{room.landlord.phone}</span>
                  </a>
                  <a
                    href={`mailto:${room.landlord.email}`}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-foreground text-sm">{room.landlord.email}</span>
                  </a>
                </div>
              </div>

              {/* Safety Notice */}
              <div className="bg-accent/10 rounded-xl border border-accent/20 p-6">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-accent mb-1">Lưu ý an toàn</p>
                    <p className="text-sm text-foreground/80">
                      Hãy xem phòng trực tiếp trước khi thanh toán. Không chuyển tiền trước khi ký hợp đồng.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}