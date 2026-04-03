import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '@/app/components/ImageWithFallback';
import {
    getConversationsRequest,
    getThreadRequest,
    sendMessageRequest,
    type ConversationItem,
    type ChatMessage,
} from '@/lib/api';
import { MessageCircle, ArrowLeft, Send, Loader2 } from 'lucide-react';

const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';
const POLL_INTERVAL_MS = 2000;

function formatTime(iso: string) {
    try {
        const d = new Date(iso);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
    } catch {
        return '';
    }
}

/** Messenger-style bubble: tail on one corner, rounded rest. */
function Bubble({
    message,
    isFromMe,
    peerAvatar,
    showAvatar,
}: {
    message: ChatMessage;
    isFromMe: boolean;
    peerAvatar: string | null;
    showAvatar: boolean;
}) {
    return (
        <div className={`flex gap-2 w-full ${isFromMe ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[85%] sm:max-w-[75%] ${isFromMe ? 'ml-auto' : ''}`}>
            {!isFromMe && (
                <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {showAvatar ? (
                        <ImageWithFallback
                            src={peerAvatar || AVATAR_PLACEHOLDER}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full" />
                    )}
                </div>
            )}
            <div className={`flex flex-col min-w-0 ${isFromMe ? 'items-end' : 'items-start'}`}>
                <div
                    className={`relative px-4 py-2.5 shadow-sm ${
                        isFromMe
                            ? 'bg-primary text-primary-foreground rounded-[18px_18px_4px_18px]'
                            : 'bg-muted text-foreground rounded-[18px_18px_18px_4px]'
                    }`}
                >
                    <p className="text-[15px] leading-snug whitespace-pre-wrap break-words">{message.content}</p>
                </div>
                <span className={`text-[11px] mt-0.5 px-1 ${isFromMe ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                    {formatTime(message.created_at)}
                </span>
            </div>
            {isFromMe && <div className="w-8 shrink-0" />}
        </div>
    );
}

export function ChatPage() {
    const { userId: paramUserId } = useParams<{ userId?: string }>();
    const navigate = useNavigate();
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [selectedPeerId, setSelectedPeerId] = useState<string | null>(paramUserId || null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [peer, setPeer] = useState<{ id: string; fullName: string; avatarUrl: string | null } | null>(null);
    const [input, setInput] = useState('');
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingThread, setLoadingThread] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadConversations = useCallback(() => {
        setLoadingConvs(true);
        getConversationsRequest()
            .then((r) => setConversations(r.data || []))
            .catch(() => setConversations([]))
            .finally(() => setLoadingConvs(false));
    }, []);

    const loadThread = useCallback(
        (peerId: string) => {
            if (!peerId) return;
            setLoadingThread(true);
            setError(null);
            getThreadRequest(peerId, { limit: 80 })
                .then((r) => {
                    setMessages(r.data.messages || []);
                    setPeer(r.data.peer);
                })
                .catch((e) => {
                    setError(e instanceof Error ? e.message : 'Lỗi tải tin nhắn');
                    setMessages([]);
                    setPeer(null);
                })
                .finally(() => setLoadingThread(false));
        },
        []
    );

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (paramUserId) setSelectedPeerId(paramUserId);
    }, [paramUserId]);

    useEffect(() => {
        if (selectedPeerId) {
            loadThread(selectedPeerId);
            if (!paramUserId || paramUserId !== selectedPeerId) {
                navigate(`/chat/${selectedPeerId}`, { replace: true });
            }
        } else {
            setMessages([]);
            setPeer(null);
            if (paramUserId) navigate('/chat', { replace: true });
        }
    }, [selectedPeerId]);

    useEffect(() => {
        if (!selectedPeerId) return;
        pollRef.current = setInterval(() => {
            getThreadRequest(selectedPeerId, { limit: 80 })
                .then((r) => setMessages(r.data.messages || []))
                .catch(() => {});
        }, POLL_INTERVAL_MS);
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [selectedPeerId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || !selectedPeerId || sending) return;
        setSending(true);
        setInput('');
        try {
            const res = await sendMessageRequest(selectedPeerId, text);
            setMessages((prev) => [...prev, res.data]);
            loadConversations();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Gửi thất bại');
        } finally {
            setSending(false);
        }
    };

    /** Show avatar only on last message of a consecutive group from the same sender (for received). */
    const showAvatarFor = (index: number) => {
        if (index < 0 || index >= messages.length) return false;
        const m = messages[index];
        if (m.isFromMe) return false;
        const next = messages[index + 1];
        return !next || next.isFromMe || next.senderId !== m.senderId;
    };

    return (
        <div className="flex flex-col h-[calc(100vh-5rem)] max-w-5xl mx-auto w-full">
            {/* Chat box container - Messenger style */}
            <div className="flex-1 flex flex-col md:flex-row rounded-lg overflow-hidden border border-border bg-card">
                {/* Conversation list - left sidebar */}
                <aside className="w-full md:w-72 lg:w-80 border-b md:border-b-0 md:border-r border-border bg-card flex-shrink-0 flex flex-col">
                    <div className="p-3 border-b border-border">
                        <h2 className="font-heading text-lg font-semibold text-foreground flex items-center gap-2 px-1">
                            <MessageCircle className="w-5 h-5 text-primary" />
                            Tin nhắn
                        </h2>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-0">
                        {loadingConvs ? (
                            <div className="p-8 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-sm">
                                Chưa có hội thoại. Bắt đầu trò chuyện từ hồ sơ người dùng hoặc bạn đã ghép phòng.
                            </div>
                        ) : (
                            <ul className="py-1">
                                {conversations.map((c) => (
                                    <li key={c.peer.id}>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPeerId(c.peer.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/80 transition-colors ${
                                                selectedPeerId === c.peer.id ? 'bg-primary/10' : ''
                                            }`}
                                        >
                                            <div className="relative shrink-0">
                                                <ImageWithFallback
                                                    src={c.peer.avatarUrl || AVATAR_PLACEHOLDER}
                                                    alt={c.peer.fullName}
                                                    className="w-12 h-12 rounded-full object-cover ring-2 ring-transparent"
                                                />
                                                {c.unreadCount > 0 && (
                                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium px-1">
                                                        {c.unreadCount > 9 ? '9+' : c.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-medium text-foreground truncate text-[15px]">
                                                        {c.peer.fullName}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground shrink-0">
                                                        {formatTime(c.lastMessage.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate mt-0.5">
                                                    {c.lastMessage.isFromMe ? 'Bạn: ' : ''}{c.lastMessage.content}
                                                </p>
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </aside>

                {/* Thread - chat area */}
                <main className="flex-1 flex flex-col min-h-0 bg-muted/50">
                    {!selectedPeerId ? (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground p-8">
                            <div className="text-center">
                                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                                    <MessageCircle className="w-10 h-10 text-muted-foreground" />
                                </div>
                                <p className="text-[15px]">Chọn một hội thoại hoặc bắt đầu trò chuyện từ bạn ở ghép.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Chat header - Messenger style */}
                            <header className="flex items-center gap-3 px-4 py-2.5 bg-card border-b border-border shrink-0 shadow-sm">
                                <button
                                    type="button"
                                    onClick={() => setSelectedPeerId(null)}
                                    className="md:hidden p-2 -ml-1 rounded-full hover:bg-muted"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                {peer && (
                                    <>
                                        <ImageWithFallback
                                            src={peer.avatarUrl || AVATAR_PLACEHOLDER}
                                            alt={peer.fullName}
                                            className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-transparent"
                                        />
                                        <span className="font-semibold text-foreground truncate text-[16px]">
                                            {peer.fullName}
                                        </span>
                                    </>
                                )}
                            </header>

                            {error && (
                                <div className="mx-4 mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Message list - bubbles */}
                            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                                {loadingThread ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    messages.map((m, i) => {
                                        const prev = messages[i - 1];
                                        const isNewGroup = !prev || prev.isFromMe !== m.isFromMe;
                                        return (
                                            <div
                                                key={m.id}
                                                className={`flex flex-col gap-0.5 ${i === 0 ? '' : isNewGroup ? 'mt-3' : 'mt-0.5'}`}
                                            >
                                                <Bubble
                                                    message={m}
                                                    isFromMe={m.isFromMe}
                                                    peerAvatar={peer?.avatarUrl ?? null}
                                                    showAvatar={showAvatarFor(i)}
                                                />
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input bar - Messenger style rounded */}
                            <form onSubmit={handleSend} className="p-3 bg-card border-t border-border shrink-0">
                                <div className="flex items-end gap-2 rounded-2xl bg-muted pl-4 pr-1 py-1.5">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Nhập tin nhắn..."
                                        className="flex-1 min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground text-[15px] py-2 focus:outline-none"
                                        maxLength={5000}
                                        disabled={sending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !input.trim()}
                                        className="shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-colors"
                                    >
                                        {sending ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Send className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
