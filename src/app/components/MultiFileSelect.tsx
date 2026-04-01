import { useRef, useState } from 'react';
import { X, FileUp } from 'lucide-react';

interface MultiFileSelectProps {
    value: File[];
    onChange: (files: File[]) => void;
    label?: string;
    accept?: string;
    maxFiles?: number;
    maxSizeMB?: number;
}

const DEFAULT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp';

export function MultiFileSelect({
    value,
    onChange,
    label = 'Chọn file',
    accept = DEFAULT_ACCEPT,
    maxFiles = 5,
    maxSizeMB = 10,
}: MultiFileSelectProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) {
            return;
        }

        const filesArray = Array.from(files);
        e.target.value = '';
        setError(null);

        const remaining = maxFiles - value.length;
        if (remaining <= 0) {
            setError(`Tối đa ${maxFiles} file`);
            return;
        }

        const selectedFiles = filesArray.slice(0, remaining);

        // Validate sizes
        const oversized = selectedFiles.find((f) => f.size > maxSizeMB * 1024 * 1024);
        if (oversized) {
            const msg = `File "${oversized.name}" vượt quá ${maxSizeMB}MB`;
            setError(msg);
            return;
        }

        // Add files to existing list
        onChange([...value, ...selectedFiles]);
    };

    const handleRemove = (index: number) => {
        onChange(value.filter((_, i) => i !== index));
    };

    const handleClear = () => {
        onChange([]);
        setError(null);
    };

    return (
        <div className="w-full">
            <label className="mb-2 block text-sm font-medium text-slate-700">
                {label}
            </label>

            <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 transition-colors hover:border-slate-400 hover:bg-slate-100">
                <input
                    ref={inputRef}
                    type="file"
                    multiple
                    accept={accept}
                    onChange={handleFilesChange}
                    className="hidden"
                    aria-label={label}
                />

                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="flex w-full flex-col items-center gap-2 text-center"
                >
                    <FileUp className="h-6 w-6 text-slate-400" />
                    <div>
                        <p className="text-sm font-medium text-slate-700">
                            Nhấp để chọn file hoặc kéo thả
                        </p>
                        <p className="text-xs text-slate-500">
                            PDF, JPG, PNG, WebP (tối đa {maxSizeMB}MB/file)
                        </p>
                    </div>
                </button>
            </div>

            {error && (
                <p className="mt-2 text-xs text-rose-600">{error}</p>
            )}

            {value.length > 0 && (
                <div className="mt-3 space-y-2">
                    {value.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="truncate text-sm text-slate-700">
                                    {file.name}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {(file.size / 1024 / 1024).toFixed(2)}MB
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                className="ml-2 inline-flex p-1 text-slate-400 hover:text-rose-600"
                                aria-label="Remove file"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}

                    {value.length > 0 && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="mt-2 text-xs text-slate-600 hover:text-slate-900 underline"
                        >
                            Xóa tất cả
                        </button>
                    )}
                </div>
            )}

            <p className="mt-2 text-xs text-slate-500">
                {value.length}/{maxFiles} file được chọn
            </p>
        </div>
    );
}
