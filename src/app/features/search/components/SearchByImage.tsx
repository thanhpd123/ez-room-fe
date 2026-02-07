import React, { useState, useRef, useCallback } from 'react';
import { Upload, Image as ImageIcon, X, AlertCircle, CheckCircle } from 'lucide-react';
import { MAX_IMAGE_SIZE, VALID_IMAGE_TYPES } from '../constants';

interface SearchByImageProps {
    onSearch: (imageFile: File) => void;
    isSearching: boolean;
}

export function SearchByImage({ onSearch, isSearching }: SearchByImageProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateImage = useCallback((file: File): boolean => {
        // Check file type
        if (!VALID_IMAGE_TYPES.includes(file.type)) {
            setError('Định dạng ảnh không hợp lệ. Vui lòng chọn file JPG, PNG hoặc WebP');
            return false;
        }

        // Check file size
        if (file.size > MAX_IMAGE_SIZE) {
            setError('Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 5MB');
            return false;
        }

        return true;
    }, []);

    const handleFileSelect = useCallback(
        (file: File) => {
            setError('');

            if (!validateImage(file)) {
                return;
            }

            setSelectedFile(file);

            // Create preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        },
        [validateImage]
    );

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleRemoveImage = () => {
        setSelectedFile(null);
        setPreviewUrl('');
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!selectedFile) {
            setError('Vui lòng chọn một ảnh để tìm kiếm');
            return;
        }

        onSearch(selectedFile);
    };

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="bg-card rounded-2xl shadow-lg p-6 sm:p-8 max-w-4xl mx-auto">
            {error && (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-destructive text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Upload Area */}
                {!previewUrl ? (
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all ${isDragging
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-muted/30'
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="flex flex-col items-center space-y-4">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                <Upload className="w-10 h-10 text-primary" />
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold text-foreground">
                                    Tải ảnh lên để tìm kiếm
                                </h3>
                                <p className="text-foreground/60 text-sm max-w-md mx-auto">
                                    Kéo thả ảnh vào đây hoặc nhấn nút bên dưới để chọn ảnh từ thiết bị
                                    của bạn
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleBrowseClick}
                                disabled={isSearching}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <ImageIcon className="w-4 h-4" />
                                Chọn ảnh
                            </button>

                            <p className="text-xs text-foreground/50">
                                Định dạng: JPG, PNG, WebP • Kích thước tối đa: 5MB
                            </p>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleFileInputChange}
                            className="hidden"
                            disabled={isSearching}
                        />
                    </div>
                ) : (
                    // Preview Area
                    <div className="space-y-4">
                        <div className="relative rounded-xl overflow-hidden bg-muted">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-auto max-h-96 object-contain"
                            />
                            <button
                                type="button"
                                onClick={handleRemoveImage}
                                disabled={isSearching}
                                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/90 hover:bg-background flex items-center justify-center transition-colors shadow-lg disabled:opacity-50"
                            >
                                <X className="w-5 h-5 text-foreground" />
                            </button>
                        </div>

                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-primary text-sm">
                                Ảnh đã được chọn. Nhấn "Tìm kiếm" để tìm phòng tương tự
                            </p>
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-2">
                    <h4 className="flex items-center gap-2 font-medium text-foreground">
                        <ImageIcon className="w-5 h-5 text-primary" />
                        Cách tìm kiếm bằng hình ảnh hoạt động
                    </h4>
                    <p className="text-sm text-foreground/60 leading-relaxed">
                        Hệ thống sử dụng AI để phân tích các đặc điểm trực quan của ảnh bạn tải lên
                        như màu sắc, bố cục, nội thất và phong cách thiết kế. Sau đó sẽ đề xuất các
                        phòng trọ có đặc điểm tương tự nhất để giúp bạn tìm được nơi ở phù hợp.
                    </p>
                </div>

                {/* Submit Button */}
                {previewUrl && (
                    <button
                        type="submit"
                        disabled={isSearching || !selectedFile}
                        className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <Upload className="w-4 h-4" />
                        {isSearching ? 'Đang phân tích ảnh...' : 'Tìm kiếm phòng tương tự'}
                    </button>
                )}
            </form>
        </div>
    );
}
