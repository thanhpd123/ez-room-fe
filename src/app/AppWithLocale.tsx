import { useTranslation } from 'react-i18next';
import { App, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ChatBoxProvider } from './context/ChatBoxContext';
import { FloatingChatBox } from './components/FloatingChatBox';
import { router } from '@/lib/routers';
import { ezRoomTheme } from '@/lib/antd-theme';

export function AppWithLocale() {
    const { i18n } = useTranslation();
    const antdLocale = i18n.language.startsWith('vi') ? viVN : enUS;

    return (
        <ConfigProvider theme={ezRoomTheme} locale={antdLocale}>
            <App>
                <AuthProvider>
                    <FavoritesProvider>
                        <ChatBoxProvider>
                            <RouterProvider router={router} />
                            <FloatingChatBox />
                        </ChatBoxProvider>
                    </FavoritesProvider>
                </AuthProvider>
            </App>
        </ConfigProvider>
    );
}
