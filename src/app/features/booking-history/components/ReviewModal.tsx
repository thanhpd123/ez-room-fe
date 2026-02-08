import React from 'react';
import { X, Star, Upload, AlertCircle } from 'lucide-react';
import { RATING_LABELS, PROFANITY_WORDS } from '../constants';
import type { ReviewData } from '../types';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ReviewData) => void;
    propertyName: string;
    existingRating?: number;
    existingComment?: string;
    isEditMode?: boolean;
}

export function ReviewModal({
    isOpen,
    onClose,
    onSubmit,
    propertyName,
    existingRating,
    existingComment,
    isEditMode = false,
}: ReviewModalProps) {
    const [rating, setRating] = React.useState(existingRating || 0);
    const [hoveredRating, setHoveredRating] = React.useState(0);
    const [comment, setComment] = React.useState(existingComment || '');
    const [images, setImages] = React.useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);
    const [errors, setErrors] = React.useState<{
        rating?: string;
        comment?: string;
        profanity?: string;
    }>({});
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const checkProfanity = (text: string): boolean => {
        const lowerText = text.toLowerCase();
        return PROFANITY_WORDS.some((word) => lowerText.includes(word));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + images.length > 5) {
            alert('Bạn chỉ có thể tải lên tối đa 5 hình ảnh');
            return;
        }

        const newPreviews = files.map((file) => URL.createObjectURL(file));
        setImagePreviews((prev) => [...prev, ...newPreviews]);
        setImages((prev) => [...prev, ...files]);
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: typeof errors = {};

        if (rating === 0) {
            newErrors.rating = 'Vui lòng chọn số sao đánh giá';
        }

        if (!comment.trim()) {
            newErrors.comment = 'Vui lòng nhập nhận xét của bạn';
        } else if (comment.trim().length < 10) {
            newErrors.comment = 'Nhận xét phải có ít nhất 10 ký tự';
        } else if (checkProfanity(comment)) {
            newErrors.profanity = 'Nhận xét chứa từ ngữ không phù hợp.';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setErrors({});
        onSubmit({ rating, comment, images });
        handleClose();
    };

    const handleClose = () => {
        setRating(existingRating || 0);
        setComment(existingComment || '');
        setImages([]);
        setImagePreviews([]);
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 overflow-y-auto">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={handleClose}
            />

            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-135 my-6 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <div>
                        <h2 className="font-semibold">
                            {isEditMode ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá'}
                        </h2>
                        <p className="text-sm text-foreground/60 mt-0.5">{propertyName}</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-full hover:bg-muted transition-colors"
                        aria-label="Đóng"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Profanity error */}
                    {errors.profanity && (
                        <div className="flex gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                            <p className="text-sm text-destructive">{errors.profanity}</p>
                        </div>
                    )}

                    {/* Rating */}
                    <div className="space-y-2">
                        <label className="text-sm text-foreground/80">
                            Đánh giá của bạn <span className="text-destructive">*</span>
                        </label>
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    className="transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-8 h-8 ${star <= (hoveredRating || rating)
                                                ? 'fill-accent text-accent'
                                                : 'text-muted'
                                            }`}
                                    />
                                </button>
                            ))}
                            {(hoveredRating > 0 || rating > 0) && (
                                <span className="ml-2 text-sm text-foreground/70 font-medium">
                                    {RATING_LABELS[hoveredRating || rating]}
                                </span>
                            )}
                        </div>
                        {errors.rating && (
                            <p className="text-xs text-destructive">{errors.rating}</p>
                        )}
                    </div>

                    {/* Comment */}
                    <div className="space-y-1.5">
                        <label htmlFor="comment" className="text-sm text-foreground/80">
                            Nhận xét chi tiết <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            id="comment"
                            rows={4}
                            value={comment}
                            onChange={(e) => {
                                setComment(e.target.value);
                                if (errors.comment || errors.profanity) {
                                    setErrors({ ...errors, comment: undefined, profanity: undefined });
                                }
                            }}
                            placeholder="Chia sẻ trải nghiệm của bạn..."
                            className={`w-full px-3 py-2 bg-background border rounded-lg resize-none focus:outline-none focus:ring-2 text-sm ${errors.comment || errors.profanity
                                    ? 'border-destructive focus:ring-destructive/20'
                                    : 'border-border focus:ring-primary/20 focus:border-primary'
                                }`}
                        />
                        <div className="flex justify-between text-xs text-foreground/50">
                            {errors.comment ? (
                                <span className="text-destructive">{errors.comment}</span>
                            ) : (
                                <span />
                            )}
                            <span>{comment.length} ký tự</span>
                        </div>
                    </div>

                    {/* Images */}
                    <div className="space-y-2">
                        <label className="text-sm text-foreground/80">Hình ảnh (tùy chọn)</label>

                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-5 gap-2">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative aspect-square group">
                                        <img
                                            src={preview}
                                            alt=""
                                            className="w-full h-full object-cover rounded-md"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {imagePreviews.length < 5 && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full px-4 py-5 border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-primary/5 flex flex-col items-center gap-1 text-sm"
                            >
                                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <Upload className="w-5 h-5 text-primary" />
                                </div>
                                <span>Tải lên hình ảnh</span>
                                <span className="text-xs text-foreground/50">Tối đa 5 ảnh</span>
                            </button>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </div>

                    {/* Info */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-xs text-foreground/70">
                        💡 Đánh giá sẽ được hiển thị công khai để giúp người thuê khác.
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm hover:bg-muted"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 shadow-sm"
                        >
                            {isEditMode ? 'Cập nhật' : 'Gửi đánh giá'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
