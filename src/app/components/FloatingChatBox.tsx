import { useState, useEffect, useRef, useCallback } from 'react';
import { useChatBox } from '@/app/context/ChatBoxContext';
import { useAuth } from '@/app/context/AuthContext';
import { ImageWithFallback } from '@/app/components/ImageWithFallback';
import {
    getConversationsRequest,
    getThreadRequest,
    sendMessageRequest,
    type ConversationItem,
    type ChatMessage,
} from '@/lib/api';
import { MessageCircle, ArrowLeft, Send, Loader2, Minus, X } from 'lucide-react';

const AVATAR_PLACEHOLDER = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';
const POLL_INTERVAL_MS = 2000;

function formatTime(iso: string) {
    try {
        const d = new Date(iso);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
        return '';
    }
}

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
        <div className={`flex gap-1.5 w-full ${isFromMe ? 'flex-row-reverse' : 'flex-row'} items-end max-w-[90%] ${isFromMe ? 'ml-auto' : ''}`}>
            {!isFromMe && (
                <div className="shrink-0 w-6 h-6 rounded-full overflow-hidden bg-muted">
                    {showAvatar ? (
                        <ImageWithFallback src={peerAvatar || AVATAR_PLACEHOLDER} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full" />
                    )}
                </div>
            )}
            <div className={`flex flex-col min-w-0 ${isFromMe ? 'items-end' : 'items-start'}`}>
                <div
                    className={`px-3 py-1.5 text-sm ${
                        isFromMe
                            ? 'bg-primary text-primary-foreground rounded-[12px_12px_2px_12px]'
                            : 'bg-muted text-foreground rounded-[12px_12px_12px_2px]'
                    }`}
                >
                    <p className="whitespace-pre-wrap break-words leading-snug">{message.content}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5">{formatTime(message.created_at)}</span>
            </div>
            {isFromMe && <div className="w-6 shrink-0" />}
        </div>
    );
}

export function FloatingChatBox() {
    const { user } = useAuth();
    const chatBox = useChatBox();
    const [conversations, setConversations] = useState<ConversationItem[]>([]);
    const [selectedPeerId, setSelectedPeerId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [peer, setPeer] = useState<{ id: string; fullName: string; avatarUrl: string | null } | null>(null);
    const [input, setInput] = useState('');
    const [loadingConvs, setLoadingConvs] = useState(false);
    const [loadingThread, setLoadingThread] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadConversations = useCallback(() => {
        setLoadingConvs(true);
        getConversationsRequest()
            .then((r) => setConversations(r.data || []))
            .catch(() => setConversations([]))
            .finally(() => setLoadingConvs(false));
    }, []);

    const loadThread = useCallback((peerId: string) => {
        setLoadingThread(true);
        getThreadRequest(peerId, { limit: 50 })
            .then((r) => {
                setMessages(r.data.messages || []);
                setPeer(r.data.peer);
            })
            .catch(() => {
                setMessages([]);
                setPeer(null);
            })
            .finally(() => setLoadingThread(false));
    }, []);

    useEffect(() => {
        if (!chatBox?.isOpen || !user) return;
        loadConversations();
    }, [chatBox?.isOpen, user, loadConversations]);

    useEffect(() => {
        if (chatBox?.openWithUserId && chatBox.isOpen && user) {
            // Prevent opening chat with yourself
            if (chatBox.openWithUserId === user.id) {
                console.warn('Cannot open chat with yourself');
                chatBox.openChatWith(null);
                return;
            }
            setSelectedPeerId(chatBox.openWithUserId);
            chatBox.openChatWith(null);
        }
    }, [chatBox?.openWithUserId, chatBox?.isOpen, user]);

    useEffect(() => {
        if (selectedPeerId) loadThread(selectedPeerId);
        else {
            setMessages([]);
            setPeer(null);
        }
    }, [selectedPeerId, loadThread]);

    useEffect(() => {
        if (!selectedPeerId) return;
        const id = setInterval(() => {
            getThreadRequest(selectedPeerId, { limit: 50 })
                .then((r) => setMessages(r.data.messages || []))
                .catch((err) => {
                    console.error('Error loading messages:', err);
                });
        }, POLL_INTERVAL_MS);
        pollRef.current = id;
        return () => clearInterval(id);
    }, [selectedPeerId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || !selectedPeerId || sending) return;
        setSending(true);
        setInput('');
        sendMessageRequest(selectedPeerId, text)
            .then((res) => {
                setMessages((prev) => [...prev, res.data]);
                loadConversations();
            })
            .finally(() => setSending(false));
    };

    const showAvatarFor = (index: number) => {
        if (index < 0 || index >= messages.length) return false;
        const m = messages[index];
        if (m.isFromMe) return false;
        const next = messages[index + 1];
        return !next || next.isFromMe || next.senderId !== m.senderId;
    };

    if (!user || !chatBox) return null;

    return (
        <>
            {/* Floating button when closed */}
            {!chatBox.isOpen && (
                <button
                    type="button"
                    onClick={chatBox.openChat}
                    className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                    title="Tin nhắn"
                >
                    <MessageCircle className="w-7 h-7" />
                </button>
            )}

            {/* Chat panel when open */}
            {chatBox.isOpen && (
                <div className="fixed bottom-6 right-6 z-[9999] w-[380px] h-[520px] sm:w-[400px] sm:h-[560px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">
                    {/* Header with minimize/close */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card shrink-0">
                        <h3 className="font-semibold text-foreground flex items-center gap-2 text-[15px]">
                            <MessageCircle className="w-5 h-5 text-primary" />
                            Tin nhắn
                        </h3>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={chatBox.closeChat}
                                className="p-2 rounded-full hover:bg-muted text-muted-foreground"
                                title="Thu nhỏ"
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={chatBox.closeChat}
                                className="p-2 rounded-full hover:bg-muted text-muted-foreground"
                                title="Đóng"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex min-h-0">
                        {!selectedPeerId ? (
                            <div className="flex-1 overflow-y-auto bg-muted/50">
                                {loadingConvs ? (
                                    <div className="p-6 flex justify-center">
                                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : conversations.length === 0 ? (
                                    <p className="p-4 text-center text-muted-foreground text-sm">Chưa có hội thoại.</p>
                                ) : (
                                    <ul className="py-1">
                                        {conversations.map((c) => (
                                            <li key={c.peer.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedPeerId(c.peer.id)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/80"
                                                >
                                                    <div className="relative shrink-0">
                                                        <ImageWithFallback
                                                            src={c.peer.avatarUrl || AVATAR_PLACEHOLDER}
                                                            alt=""
                                                            className="w-10 h-10 rounded-full object-cover"
                                                        />
                                                        {c.unreadCount > 0 && (
                                                            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                                                                {c.unreadCount > 9 ? '9+' : c.unreadCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium text-foreground truncate text-sm">{c.peer.fullName}</p>
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {c.lastMessage.isFromMe ? 'Bạn: ' : ''}{c.lastMessage.content}
                                                        </p>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ) : (
                            <>
                                {/* Thread header */}
                                <div className="flex flex-col flex-1 min-w-0">
                                    <header className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-card shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPeerId(null)}
                                            className="p-1.5 rounded-full hover:bg-muted"
                                        >
                                            <ArrowLeft className="w-4 h-4" />
                                        </button>
                                        {peer && (
                                            <>
                                                <ImageWithFallback
                                                    src={peer.avatarUrl || AVATAR_PLACEHOLDER}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full object-cover shrink-0"
                                                />
                                                <span className="font-medium text-foreground truncate text-sm">{peer.fullName}</span>
                                            </>
                                        )}
                                    </header>
                                    {/* Messages */}
                                    <div className="flex-1 overflow-y-auto px-2 py-2 bg-muted/50 space-y-0.5">
                                        {loadingThread ? (
                                            <div className="flex justify-center py-8">
                                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : (
                                            messages.map((m, i) => (
                                                <div key={m.id} className={i > 0 ? 'mt-1' : ''}>
                                                    <Bubble
                                                        message={m}
                                                        isFromMe={m.isFromMe}
                                                        peerAvatar={peer?.avatarUrl ?? null}
                                                        showAvatar={showAvatarFor(i)}
                                                    />
                                                </div>
                                            ))
                                        )}
                                        <div ref={messagesEndRef} />
                                    </div>
                                    {/* Input */}
                                    <form onSubmit={handleSend} className="p-2 border-t border-border bg-card shrink-0">
                                        <div className="flex items-center gap-1.5 rounded-xl bg-muted pl-3 pr-1 py-1">
                                            <input
                                                type="text"
                                                value={input}
                                                onChange={(e) => setInput(e.target.value)}
                                                placeholder="Nhập tin nhắn..."
                                                className="flex-1 min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground text-sm py-1.5 focus:outline-none"
                                                maxLength={5000}
                                                disabled={sending}
                                            />
                                            <button
                                                type="submit"
                                                disabled={sending || !input.trim()}
                                                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-50 shrink-0"
                                            >
                                                {sending ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
