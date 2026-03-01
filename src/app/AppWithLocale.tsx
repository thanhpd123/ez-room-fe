import { useTranslation } from 'react-i18next';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import viVN from 'antd/locale/vi_VN';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { router } from '@/lib/routers';
import { ezRoomTheme } from '@/lib/antd-theme';

export function AppWithLocale() {
    const { i18n } = useTranslation();
    const antdLocale = i18n.language.startsWith('vi') ? viVN : enUS;

    return (
        <ConfigProvider theme={ezRoomTheme} locale={antdLocale}>
            <AuthProvider>
                <FavoritesProvider>
                    <RouterProvider router={router} />
                </FavoritesProvider>
            </AuthProvider>
        </ConfigProvider>
    );
}
