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
  MessageCircle,
  type LucideIcon
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '@/app/context/FavoritesContext';
import { useAuth } from '@/app/context/AuthContext';
import { useChatBox } from '@/app/context/ChatBoxContext';
import { RoomReviews } from './RoomReviews';
import { createPreorderDepositPaymentRequest } from '@/lib/api';

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
  const [depositSubmitting, setDepositSubmitting] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmountInput, setDepositAmountInput] = useState('');
  const [depositMonthsOption, setDepositMonthsOption] = useState('1');
  const [depositError, setDepositError] = useState('');
  const [redirectingToPayOS, setRedirectingToPayOS] = useState(false);

  const depositMonthChoices = [
    { value: '0.5', label: '0.5 tháng' },
    { value: '1', label: '1 tháng' },
    { value: '2', label: '2 tháng' },
    { value: '3', label: '3 tháng' },
  ];

  const selectedDepositMonths = useMemo(() => {
    const parsed = Number(depositMonthsOption);
    if (!Number.isFinite(parsed) || parsed <= 0) return 1;
    return parsed;
  }, [depositMonthsOption]);

  const inferredDepositAmount = useMemo(() => {
    return Math.max(0, Math.round(room.price * selectedDepositMonths));
  }, [room.price, selectedDepositMonths]);

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

  const handleOpenDepositModal = () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if ((user.role || '').toUpperCase() !== 'TENANT') {
      alert('Chức năng đặt cọc hiện chỉ áp dụng cho tài khoản người thuê (TENANT).');
      return;
    }

    if (room.status !== 'available') {
      alert('Phòng hiện không khả dụng để đặt cọc.');
      return;
    }

    const suggestedAmount = Math.max(1000, Math.round(room.price * selectedDepositMonths));
    setDepositAmountInput(String(suggestedAmount));
    setDepositMonthsOption('1');
    setDepositError('');
    setShowDepositModal(true);
  };

  const handleDepositNow = async () => {
    if (!user) {
      setDepositError('Vui lòng đăng nhập để tiếp tục đặt cọc.');
      return;
    }

    const normalized = Number(depositAmountInput.replace(/[^0-9]/g, ''));
    if (!Number.isInteger(normalized) || normalized <= 0) {
      setDepositError('Số tiền đặt cọc không hợp lệ. Vui lòng nhập số nguyên dương.');
      return;
    }

    const selectedMonths = Number(depositMonthsOption);
    if (!Number.isFinite(selectedMonths) || selectedMonths <= 0) {
      setDepositError('Vui lòng chọn số tháng đặt cọc hợp lệ.');
      return;
    }

    setDepositError('');

    try {
      setDepositSubmitting(true);

      const response = await createPreorderDepositPaymentRequest({
        roomId: room.id,
        depositMonths: selectedMonths,
        depositAmount: normalized,
        buyerName: user.fullName || undefined,
        buyerEmail: user.email || undefined,
        buyerPhone: user.phone || undefined,
      });

      const checkoutUrl = response?.data?.payment?.checkoutUrl;
      if (!checkoutUrl) {
        throw new Error('Không nhận được link thanh toán từ PayOS.');
      }

      setShowDepositModal(false);
      setRedirectingToPayOS(true);
      window.setTimeout(() => {
        window.location.href = checkoutUrl;
      }, 700);
    } catch (error) {
      setDepositError(error instanceof Error ? error.message : 'Không thể tạo thanh toán đặt cọc');
    } finally {
      setDepositSubmitting(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    available: { label: 'Còn trống', color: 'bg-primary text-primary-foreground' },
    occupied: { label: 'Đã cho thuê', color: 'bg-muted text-muted-foreground' },
    maintenance: { label: 'Bảo trì', color: 'bg-accent text-accent-foreground' },
  };
  const statusInfo = statusConfig[room.status] ?? statusConfig.available;

  const amenityIcons: Record<string, LucideIcon> = {
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
                <MapPin className="w-4 h-4 shrink-0" />
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
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
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
                <button
                  type="button"
                  onClick={handleOpenDepositModal}
                  disabled={depositSubmitting || room.status !== 'available'}
                  className="group relative w-full overflow-hidden rounded-lg bg-linear-to-r from-amber-500 to-rose-500 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:scale-[1.01] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <span className="relative">{depositSubmitting ? 'Đang tạo thanh toán...' : room.status === 'available' ? 'Đặt cọc phòng ngay' : 'Phòng không khả dụng'}</span>
                </button>
              </div>

              {/* Landlord Info */}
              <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                <h3 className="font-nunito mb-4">Người cho thuê</h3>

                <div className="flex items-center gap-3 mb-4">
                  <Link
                    to={`/landlord/${room.landlord.id}`}
                    className="shrink-0 hover:opacity-80 transition-opacity"
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
                  <Shield className="w-5 h-5 text-accent shrink-0 mt-0.5" />
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

      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            aria-label="Đóng"
            onClick={() => {
              if (!depositSubmitting) setShowDepositModal(false);
            }}
            className="absolute inset-0 bg-black/40"
          />

          <section className="relative w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-xl">
            <h3 className="font-nunito text-xl mb-2">Đặt cọc phòng</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Chọn số tháng cọc và nhập số tiền tương ứng, hệ thống sẽ chuyển bạn sang PayOS để thanh toán.
            </p>

            <label className="block text-sm font-medium text-foreground mb-2">Cọc mấy tháng</label>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {depositMonthChoices.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  onClick={() => {
                    setDepositMonthsOption(choice.value);
                    setDepositAmountInput(String(Math.max(1000, Math.round(room.price * Number(choice.value)))));
                    if (depositError) setDepositError('');
                  }}
                  className={`rounded-lg border px-2 py-2 text-sm font-medium transition-colors ${depositMonthsOption === choice.value
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-border bg-white text-foreground hover:bg-muted'
                    }`}
                  disabled={depositSubmitting}
                >
                  {choice.label}
                </button>
              ))}
            </div>

            <label className="block text-sm font-medium text-foreground mb-2">Số tiền đặt cọc</label>
            <input
              value={depositAmountInput}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/[^0-9]/g, '');
                setDepositAmountInput(onlyDigits);
                if (depositError) setDepositError('');
              }}
              inputMode="numeric"
              placeholder="Ví dụ: 3000000"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              disabled={depositSubmitting}
            />

            {!!depositAmountInput && (
              <p className="mt-2 text-sm text-muted-foreground">
                Tương đương: {Number(depositAmountInput || 0).toLocaleString('vi-VN')} ₫
              </p>
            )}

            <p className="mt-1 text-xs text-muted-foreground">
              Gợi ý theo {selectedDepositMonths} tháng: {inferredDepositAmount.toLocaleString('vi-VN')} ₫
            </p>

            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              Lưu ý: Vui lòng liên hệ với chủ trọ để xác nhận chính xác mức cọc trước khi thanh toán.
            </div>

            {!!depositError && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{depositError}</p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
                disabled={depositSubmitting}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDepositNow}
                disabled={depositSubmitting}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {depositSubmitting ? 'Đang xử lý...' : 'Tiếp tục thanh toán'}
              </button>
            </div>
          </section>
        </div>
      )}

      {redirectingToPayOS && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60">
          <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-medium text-primary shadow-sm">
            Đang chuyển tới PayOS...
          </div>
        </div>
      )}
    </div>
  );
}