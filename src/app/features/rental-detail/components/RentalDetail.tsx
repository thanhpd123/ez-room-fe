import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Building2,
  Wifi,
  Wind,
  Droplet,
  Car,
  Shield,
  Phone,
  Mail,
  Check,
  Bed
} from 'lucide-react';
import { useState } from 'react';
import { ImageWithFallback } from '@/app/components/ImageWithFallback';
import type { RentalDetailData } from '../types';

interface RentalDetailProps {
  rental: RentalDetailData;
  onBack: () => void;
  onViewRoom: (roomId: string) => void;
}

export function RentalDetail({ rental, onBack, onViewRoom }: RentalDetailProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const statusConfig: Record<string, { label: string; color: string }> = {
    AVAILABLE: { label: 'Còn phòng', color: 'bg-primary text-primary-foreground' },
    UNAVAILABLE: { label: 'Hết phòng', color: 'bg-muted text-muted-foreground' },
    HIDDEN: { label: 'Đang ẩn', color: 'bg-muted text-muted-foreground' },
    VIOLATE: { label: 'Vi phạm', color: 'bg-destructive text-destructive-foreground' },
    PENDING: { label: 'Chờ duyệt', color: 'bg-accent text-accent-foreground' },
    SUSPEND: { label: 'Tạm ngưng', color: 'bg-muted text-muted-foreground' },
  };
  const statusInfo = statusConfig[rental.status] ?? statusConfig.PENDING;

  const amenityIcons: Record<string, typeof Check> = {
    'Wifi miễn phí': Wifi,
    'Wifi': Wifi,
    'Điều hòa': Wind,
    'Nóng lạnh': Droplet,
    'Bãi xe': Car,
    'An ninh 24/7': Shield,
    'An ninh': Shield,
  };
  const defaultPlaceholder = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800';

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
                onClick={() => setIsFavorite(!isFavorite)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Heart
                  className={`w-5 h-5 ${isFavorite ? 'fill-accent text-accent' : 'text-foreground'
                    }`}
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
        {/* Image Gallery – actual rental images */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div className="lg:col-span-2">
            <ImageWithFallback
              src={rental.images[selectedImage] || rental.images[0] || defaultPlaceholder}
              alt={rental.title}
              className="w-full h-96 object-cover rounded-xl"
            />
          </div>
          <div className="lg:col-span-2 grid grid-cols-4 gap-4">
            {(rental.images?.length ? rental.images : []).map((image, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedImage(index)}
                className={`relative overflow-hidden rounded-lg aspect-video ${selectedImage === index ? 'ring-2 ring-primary' : ''
                  }`}
              >
                <ImageWithFallback
                  src={image}
                  alt={`Ảnh ${index + 1}`}
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
                <h1 className="font-nunito">{rental.title}</h1>
                <span className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <p>{rental.address}</p>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-primary/10 rounded-xl border border-primary/20 p-6">
              <h3 className="font-nunito text-primary mb-2">Tóm tắt</h3>
              <p className="text-foreground leading-relaxed">
                {rental.summary}
              </p>
            </div>

            {/* Key Info */}
            <div className="bg-white rounded-xl border border-border p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-2">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-semibold text-foreground">{rental.totalRooms}</p>
                  <p className="text-sm text-muted-foreground">Tổng số phòng</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-accent/10 text-accent mb-2">
                    <Bed className="w-6 h-6" />
                  </div>
                  <p className="text-2xl font-semibold text-accent">{rental.availableRoom}</p>
                  <p className="text-sm text-muted-foreground">Phòng còn trống</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-nunito mb-4">Mô tả chi tiết</h3>
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {rental.description}
              </p>
            </div>

            {/* Amenities – actual from DB (aggregated from rooms) */}
            {(rental.amenities?.length ?? 0) > 0 && (
              <div className="bg-white rounded-xl border border-border p-6">
                <h3 className="font-nunito mb-4">Tiện ích chung</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {rental.amenities.map((amenity, index) => {
                    const Icon = amenityIcons[amenity] || Check;
                    return (
                      <div key={`${amenity}-${index}`} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="text-foreground">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Available Rooms – actual room data with images */}
            <div className="bg-white rounded-xl border border-border p-6">
              <h3 className="font-nunito mb-4">Danh sách phòng</h3>
              <div className="space-y-4">
                {rental.rooms.map((room) => {
                  const roomImages = room.images?.length ? room.images : [];
                  const thumbSrc = roomImages[0] || defaultPlaceholder;
                  return (
                    <div
                      key={room.id}
                      className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <div className="flex-shrink-0 w-full sm:w-40 h-32 rounded-lg overflow-hidden bg-muted">
                        <ImageWithFallback
                          src={thumbSrc}
                          alt={room.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground mb-1">{room.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-1">
                          <span>{room.area}m²</span>
                          <span className="h-1 w-1 bg-muted-foreground rounded-full" />
                          <span className={room.status === 'available' ? 'text-primary' : 'text-muted-foreground'}>
                            {room.status === 'available' ? 'Còn trống' : 'Đã cho thuê'}
                          </span>
                        </div>
                        {room.amenities?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {room.amenities.slice(0, 5).map((a, i) => (
                              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {a}
                              </span>
                            ))}
                            {room.amenities.length > 5 && (
                              <span className="text-xs text-muted-foreground">+{room.amenities.length - 5}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-primary">
                            {Number(room.price).toLocaleString('vi-VN')} ₫
                          </p>
                          <p className="text-xs text-muted-foreground">/tháng</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onViewRoom(room.id)}
                          disabled={room.status !== 'available'}
                          className={`px-4 py-2 rounded-lg transition-colors ${room.status === 'available'
                            ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                        >
                          {room.status === 'available' ? 'Xem phòng' : 'Đã thuê'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Availability Card */}
              <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                <div className="text-center mb-6">
                  <p className="text-4xl font-bold text-accent mb-1">
                    {rental.availableRoom}
                  </p>
                  <p className="text-muted-foreground">phòng còn trống</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    / {rental.totalRooms} tổng số phòng
                  </p>
                </div>

                <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg transition-colors mb-3">
                  Liên hệ thuê phòng
                </button>
                <button className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground py-3 rounded-lg transition-colors">
                  Đặt lịch xem nhà
                </button>
              </div>

              {/* Landlord Info – actual owner from DB */}
              <div className="bg-white rounded-xl border border-border p-6 shadow-sm">
                <h3 className="font-nunito mb-4">Chủ nhà trọ</h3>

                <div className="flex items-center gap-3 mb-4">
                  <ImageWithFallback
                    src={rental.landlord.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=96&h=96&fit=crop'}
                    alt={rental.landlord.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-foreground">{rental.landlord.name || 'Chủ nhà'}</p>
                    <p className="text-sm text-muted-foreground">Chủ nhà</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {rental.landlord.phone && (
                    <a
                      href={`tel:${rental.landlord.phone}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Phone className="w-5 h-5 text-primary" />
                      <span className="text-foreground">{rental.landlord.phone}</span>
                    </a>
                  )}
                  {rental.landlord.email && (
                    <a
                      href={`mailto:${rental.landlord.email}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Mail className="w-5 h-5 text-primary" />
                      <span className="text-foreground text-sm break-all">{rental.landlord.email}</span>
                    </a>
                  )}
                  {!rental.landlord.phone && !rental.landlord.email && (
                    <p className="text-sm text-muted-foreground">Liên hệ qua tin nhắn trên trang.</p>
                  )}
                </div>
              </div>

              {/* Safety Notice */}
              <div className="bg-accent/10 rounded-xl border border-accent/20 p-6">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-accent mb-1">Lưu ý an toàn</p>
                    <p className="text-sm text-foreground/80">
                      Hãy đến xem nhà trực tiếp và kiểm tra kỹ trước khi quyết định thuê.
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
