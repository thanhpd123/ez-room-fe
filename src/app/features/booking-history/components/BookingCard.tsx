import { Star, Calendar, MapPin, MessageCircle, Flag } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/ImageWithFallback';
import type { Booking } from '../types';

interface BookingCardProps {
    booking: Booking;
    onWriteReview: (bookingId: string, propertyName: string) => void;
    onEditReview: (bookingId: string, propertyName: string, existingRating: number) => void;
    onReport: (propertyId: string, propertyName: string) => void;
    onContactLandlord: (bookingId: string) => void;
}

function StatusBadge({ status }: { status: Booking['status'] }) {
    const config = {
        completed: { bg: 'bg-primary/10', text: 'text-primary', label: 'Đã hoàn thành' },
        active: { bg: 'bg-accent/10', text: 'text-accent', label: 'Đang thuê' },
        cancelled: { bg: 'bg-muted', text: 'text-foreground/60', label: 'Đã hủy' },
    };

    const { bg, text, label } = config[status];
    return <span className={`px-3 py-1 ${bg} ${text} rounded-full text-sm`}>{label}</span>;
}

function RatingDisplay({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-2 mb-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-4 h-4 ${i < rating ? 'fill-accent text-accent' : 'text-muted'
                            }`}
                    />
                ))}
            </div>
            <span className="text-foreground/70">Đánh giá của bạn</span>
        </div>
    );
}

export function BookingCard({
    booking,
    onWriteReview,
    onEditReview,
    onReport,
    onContactLandlord,
}: BookingCardProps) {
    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('vi-VN');

    return (
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
            <div className="p-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Property Image */}
                    <div className="w-full sm:w-48 h-48 sm:h-32 shrink-0">
                        <ImageWithFallback
                            src={booking.propertyImage}
                            alt={booking.propertyName}
                            className="w-full h-full object-cover rounded-lg"
                        />
                    </div>

                    {/* Property Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold mb-2 truncate">{booking.propertyName}</h3>
                                <div className="flex items-center gap-2 text-foreground/60 mb-2">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{booking.address}</span>
                                </div>
                                <div className="flex items-center gap-2 text-foreground/60">
                                    <Calendar className="w-4 h-4 shrink-0" />
                                    <span>
                                        {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                                    </span>
                                </div>
                            </div>
                            <StatusBadge status={booking.status} />
                        </div>

                        {/* User's Review */}
                        {booking.hasReview && booking.userRating && (
                            <RatingDisplay rating={booking.userRating} />
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                            {booking.status === 'completed' && !booking.hasReview && (
                                <button
                                    onClick={() => onWriteReview(booking.id, booking.propertyName)}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
                                >
                                    <Star className="w-4 h-4" />
                                    Viết đánh giá
                                </button>
                            )}

                            {booking.status === 'completed' && booking.hasReview && (
                                <button
                                    onClick={() =>
                                        onEditReview(booking.id, booking.propertyName, booking.userRating!)
                                    }
                                    className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-all flex items-center gap-2"
                                >
                                    <Star className="w-4 h-4" />
                                    Sửa đánh giá
                                </button>
                            )}

                            <button
                                onClick={() => onContactLandlord(booking.id)}
                                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-all flex items-center gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                Liên hệ chủ nhà
                            </button>

                            <button
                                onClick={() => onReport(booking.propertyId, booking.propertyName)}
                                className="px-4 py-2 border border-border rounded-lg hover:bg-destructive/5 hover:border-destructive/20 text-foreground/70 hover:text-destructive transition-all flex items-center gap-2"
                            >
                                <Flag className="w-4 h-4" />
                                Báo cáo
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
