import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { AuthProvider } from './context/AuthProvider';
import { FavoritesProvider } from './context/FavoritesProvider';
import { ChatBoxProvider } from './context/ChatBoxContext';
import { LanguageProvider } from './context/LanguageContext';
import { FloatingChatBox } from './components/FloatingChatBox';
import { AppRouter } from '@/lib/routers';
import { ezRoomTheme } from '@/lib/antd-theme';

export function AppWithLocale() {
    return (
        <ConfigProvider theme={ezRoomTheme} locale={viVN}>
            <LanguageProvider>
                <AuthProvider>
                    <FavoritesProvider>
                        <ChatBoxProvider>
                            <AppRouter />
                            <FloatingChatBox />
                        </ChatBoxProvider>
                    </FavoritesProvider>
                </AuthProvider>
            </LanguageProvider>
        </ConfigProvider>
    );
}
