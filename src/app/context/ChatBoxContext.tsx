import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ChatBoxContextValue = {
    isOpen: boolean;
    openChat: () => void;
    closeChat: () => void;
    toggleChat: () => void;
    /** Open the chat box and optionally select conversation with this user (e.g. from roommate "Nhắn tin"). */
    openChatWith: (userId: string | null) => void;
    /** When set, floating box should select this conversation (cleared after selecting). */
    openWithUserId: string | null;
};

const ChatBoxContext = createContext<ChatBoxContextValue | null>(null);

export function ChatBoxProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [openWithUserId, setOpenWithUserId] = useState<string | null>(null);

    const openChat = useCallback(() => {
        setIsOpen(true);
    }, []);

    const closeChat = useCallback(() => {
        setIsOpen(false);
        setOpenWithUserId(null);
    }, []);

    const toggleChat = useCallback(() => {
        setIsOpen((prev) => !prev);
        if (isOpen) setOpenWithUserId(null);
    }, [isOpen]);

    const openChatWith = useCallback((userId: string | null) => {
        setOpenWithUserId(userId);
        setIsOpen(true);
    }, []);

    return (
        <ChatBoxContext.Provider
            value={{
                isOpen,
                openChat,
                closeChat,
                toggleChat,
                openChatWith,
                openWithUserId,
            }}
        >
            {children}
        </ChatBoxContext.Provider>
    );
}

export function useChatBox() {
    const ctx = useContext(ChatBoxContext);
    if (!ctx) return null;
    return ctx;
}
