import { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';

type SpeechRecognitionInstance = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onend: (() => void) | null;
    onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
    onspeechend: (() => void) | null;
    start: () => void;
    stop: () => void;
    abort: () => void;
};

type SpeechRecognitionEvent = Event & {
    results: SpeechRecognitionResultList;
    resultIndex: number;
};

type SpeechRecognitionErrorEvent = Event & {
    error: string;
    message?: string;
};

type SpeechRecognitionResultList = ArrayLike<SpeechRecognitionResult>;
type SpeechRecognitionResult = ArrayLike<SpeechRecognitionAlternative> & { isFinal: boolean };
type SpeechRecognitionAlternative = { transcript: string; confidence: number };

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
    const w = window as unknown as Record<string, unknown>;
    return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as SpeechRecognitionConstructor | null;
}

interface VoiceSearchButtonProps {
    /** Called with final transcript when speech ends. */
    onResult: (transcript: string) => void;
    /** Called with interim transcript while speaking. */
    onInterim?: (transcript: string) => void;
    disabled?: boolean;
    /** Language code. Default: 'vi-VN' */
    lang?: string;
    /** Button size variant */
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function VoiceSearchButton({
    onResult,
    onInterim,
    disabled = false,
    lang = 'vi-VN',
    size = 'md',
    className = '',
}: VoiceSearchButtonProps) {
    const [state, setState] = useState<'idle' | 'listening' | 'processing'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [supported, setSupported] = useState(true);
    const [interimText, setInterimText] = useState('');
    const recRef = useRef<SpeechRecognitionInstance | null>(null);

    useEffect(() => {
        if (!getSpeechRecognition()) setSupported(false);
    }, []);

    const stopListening = useCallback(() => {
        if (recRef.current) {
            recRef.current.stop();
            recRef.current = null;
        }
    }, []);

    const startListening = useCallback(() => {
        setError(null);
        setInterimText('');

        const Rec = getSpeechRecognition();
        if (!Rec) {
            setError('Trình duyệt không hỗ trợ. Hãy dùng Chrome hoặc Edge.');
            return;
        }

        // Stop any previous instance
        stopListening();

        const rec = new Rec();
        rec.lang = lang;
        rec.continuous = false;
        rec.interimResults = true;
        rec.maxAlternatives = 1;
        recRef.current = rec;

        rec.onresult = (e: SpeechRecognitionEvent) => {
            let interim = '';
            let final = '';

            for (let i = e.resultIndex; i < e.results.length; i++) {
                const result = e.results[i];
                if (!result || !result[0]) continue;
                const transcript = result[0].transcript;

                if (result.isFinal) {
                    final += transcript;
                } else {
                    interim += transcript;
                }
            }

            if (interim) {
                setInterimText(interim);
                onInterim?.(interim);
            }

            if (final) {
                setInterimText('');
                setState('processing');
                onResult(final.trim());
                setTimeout(() => setState('idle'), 500);
            }
        };

        rec.onerror = (e: SpeechRecognitionErrorEvent) => {
            recRef.current = null;
            setState('idle');
            setInterimText('');

            switch (e.error) {
                case 'not-allowed':
                case 'service-not-allowed':
                    setError('Vui lòng cho phép quyền truy cập micro');
                    break;
                case 'no-speech':
                    setError('Không nhận được giọng nói. Thử lại?');
                    break;
                case 'network':
                    setError('Lỗi mạng. Kiểm tra kết nối internet');
                    break;
                case 'aborted':
                    break;
                default:
                    setError('Lỗi nhận diện giọng nói');
            }
        };

        rec.onend = () => {
            recRef.current = null;
            if (state === 'listening') {
                setState('idle');
                setInterimText('');
            }
        };

        rec.onspeechend = () => {
            // Natural end of speech
        };

        setState('listening');
        rec.start();
    }, [lang, onResult, onInterim, stopListening, state]);

    const handleClick = () => {
        if (state === 'listening') {
            stopListening();
            setState('idle');
            setInterimText('');
        } else {
            startListening();
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recRef.current) {
                recRef.current.abort();
                recRef.current = null;
            }
        };
    }, []);

    if (!supported) return null;

    const sizeClasses = {
        sm: 'w-9 h-9',
        md: 'w-11 h-11',
        lg: 'w-12 h-12',
    };

    const iconSize = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
    };

    const isListening = state === 'listening';
    const isProcessing = state === 'processing';

    return (
        <div className="relative inline-flex flex-col items-center">
            <button
                type="button"
                onClick={handleClick}
                disabled={disabled || isProcessing}
                title={isListening ? 'Nhấn để dừng' : 'Tìm kiếm bằng giọng nói'}
                className={`
                    ${sizeClasses[size]}
                    rounded-xl border flex items-center justify-center
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isListening
                        ? 'border-red-400 bg-red-50 text-red-500 shadow-lg shadow-red-100 dark:bg-red-950 dark:border-red-500 dark:shadow-red-900/30'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground hover:border-primary/30'}
                    ${className}
                `}
            >
                {isProcessing ? (
                    <Loader2 className={`${iconSize[size]} animate-spin text-primary`} />
                ) : isListening ? (
                    <MicOff className={`${iconSize[size]} animate-pulse`} />
                ) : (
                    <Mic className={iconSize[size]} />
                )}
            </button>

            {/* Listening indicator */}
            {isListening && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-bounce [animation-delay:300ms]" />
                </div>
            )}

            {/* Interim text & errors */}
            {(interimText || error) && (
                <div className={`
                    absolute top-full mt-2 left-1/2 -translate-x-1/2
                    whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium
                    shadow-lg z-50 max-w-[280px] text-center
                    ${error
                        ? 'bg-destructive/10 text-destructive border border-destructive/20'
                        : 'bg-primary/10 text-primary border border-primary/20'}
                `}>
                    {error || `"${interimText}"`}
                </div>
            )}
        </div>
    );
}
