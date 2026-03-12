import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, theme, Avatar, Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import {
    DashboardOutlined,
    UserOutlined,
    HomeOutlined,
    EnvironmentOutlined,
    AppstoreOutlined,
    WalletOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    LogoutOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/app/context/AuthContext';

const { Header, Sider, Content } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
    label: React.ReactNode,
    key: string,
    icon?: React.ReactNode,
    children?: MenuItem[]
): MenuItem {
    return { label, key, icon, children } as MenuItem;
}

const menuItems: MenuItem[] = [
    getItem('Dashboard', '/admin', <DashboardOutlined />),
    getItem('Quản lý Users', '/admin/users', <UserOutlined />),
    getItem('Quản lý Bài đăng', '/admin/rentals', <HomeOutlined />),
    getItem('Quản lý Ví', '/admin/wallets', <WalletOutlined />),
    getItem('Quản lý Địa điểm', '/admin/locations', <EnvironmentOutlined />),
    getItem('Quản lý Tiện ích', '/admin/amenities', <AppstoreOutlined />),
];

export function AdminLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, signOut } = useAuth();
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();

    const handleMenuClick = (e: { key: string }) => {
        navigate(e.key);
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <SettingOutlined />,
            label: 'Cài đặt',
            onClick: () => navigate('/profile'),
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            onClick: handleLogout,
            danger: true,
        },
    ];

    // Determine selected key based on current path
    const selectedKey = menuItems.find(
        (item) => item && 'key' in item && location.pathname === item.key
    )
        ? location.pathname
        : location.pathname.startsWith('/admin/users')
            ? '/admin/users'
            : location.pathname.startsWith('/admin/rentals')
                ? '/admin/rentals'
                : location.pathname.startsWith('/admin/wallets')
                    ? '/admin/wallets'
                    : location.pathname.startsWith('/admin/locations')
                        ? '/admin/locations'
                        : location.pathname.startsWith('/admin/amenities')
                            ? '/admin/amenities'
                            : '/admin';

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <div
                    style={{
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: collapsed ? 16 : 20,
                        fontWeight: 'bold',
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                    }}
                >
                    {collapsed ? 'EZ' : 'EZ-Room Admin'}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    onClick={handleMenuClick}
                />
            </Sider>
            <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
                <Header
                    style={{
                        padding: '0 24px',
                        background: colorBgContainer,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}
                >
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ fontSize: 16, width: 48, height: 48 }}
                    />
                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                cursor: 'pointer',
                            }}
                        >
                            <Avatar
                                src={user?.avatarUrl}
                                icon={!user?.avatarUrl && <UserOutlined />}
                                style={{ backgroundColor: '#1677ff' }}
                            />
                            <span style={{ fontWeight: 500 }}>
                                {user?.fullName || user?.email || 'Admin'}
                            </span>
                        </div>
                    </Dropdown>
                </Header>
                <Content
                    style={{
                        margin: 24,
                        padding: 24,
                        minHeight: 280,
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                    }}
                >
                    <Outlet />
                </Content>
            </Layout>
        </Layout>
    );
}
