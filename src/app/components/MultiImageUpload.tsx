import { useId, useRef, useState } from 'react';
import { Loader2, X, ImagePlus } from 'lucide-react';
import { uploadImageRequest } from '@/lib/api';

interface MultiImageUploadProps {
    value: string[];
    onChange: (urls: string[]) => void;
    label?: string;
    accept?: string;
    maxImages?: number;
    maxSizeMB?: number;
}

const DEFAULT_ACCEPT = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';

export function MultiImageUpload({
    value,
    onChange,
    label = 'Ảnh rental',
    accept = DEFAULT_ACCEPT,
    maxImages = 10,
    maxSizeMB = 5,
}: MultiImageUploadProps) {
    const inputId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadCount, setUploadCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        e.target.value = '';
        setError(null);
        if (!files || files.length === 0) return;

        const remaining = maxImages - value.length;
        if (remaining <= 0) {
            setError(`Tối đa ${maxImages} ảnh`);
            return;
        }

        const selectedFiles = Array.from(files).slice(0, remaining);

        // Validate sizes
        const oversized = selectedFiles.find((f) => f.size > maxSizeMB * 1024 * 1024);
        if (oversized) {
            setError(`Ảnh "${oversized.name}" vượt quá ${maxSizeMB}MB`);
            return;
        }

        setUploading(true);
        setUploadCount(selectedFiles.length);

        const newUrls: string[] = [];
        const errors: string[] = [];

        for (const file of selectedFiles) {
            try {
                const { url } = await uploadImageRequest(file);
                newUrls.push(url);
            } catch (err) {
                errors.push(err instanceof Error ? err.message : `Lỗi upload ${file.name}`);
            }
        }

        if (newUrls.length > 0) {
            onChange([...value, ...newUrls]);
        }
        if (errors.length > 0) {
            setError(errors.join('; '));
        }

        setUploading(false);
        setUploadCount(0);
    };

    const removeImage = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const canAddMore = value.length < maxImages && !uploading;

    return (
        <div>
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
            )}

            {/* Image preview grid */}
            {value.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
                    {value.map((url, index) => (
                        <div key={url} className="group relative">
                            <img
                                src={url}
                                alt={`Rental image ${index + 1}`}
                                className="w-full aspect-square rounded-xl object-cover border border-slate-200"
                            />
                            <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-rose-600"
                            >
                                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Hidden file input */}
            <input
                id={inputId}
                ref={inputRef}
                type="file"
                accept={accept}
                multiple
                onChange={handleFilesChange}
                disabled={!canAddMore}
                className="hidden"
            />

            {/* Upload trigger – uses <label htmlFor> as primary trigger for better browser compat */}
            {value.length < maxImages && (
                <label
                    htmlFor={canAddMore ? inputId : undefined}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-colors text-sm font-medium w-full justify-center ${!canAddMore ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang tải {uploadCount} ảnh...
                        </>
                    ) : (
                        <>
                            <ImagePlus className="w-4 h-4" strokeWidth={2} />
                            Thêm ảnh ({value.length}/{maxImages})
                        </>
                    )}
                </label>
            )}

            {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
            <p className="mt-1 text-xs text-slate-400">
                Định dạng: JPEG, PNG, GIF, WebP. Tối đa {maxSizeMB}MB/ảnh. Ảnh được lưu trên Cloudinary.
            </p>
        </div>
    );
}

