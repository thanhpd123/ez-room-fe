import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Typography } from 'antd';
import {
    UserOutlined,
    HomeOutlined,
    CheckCircleOutlined,
    StopOutlined,
    TeamOutlined,
    ShopOutlined,
} from '@ant-design/icons';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { getAdminStats, getRentalStats, type AdminStats, type RentalStats } from './shared/admin-api';

const { Title, Text } = Typography;

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1'];

export function AdminDashboardPage() {
    const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
    const [rentalStats, setRentalStats] = useState<RentalStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true);
            const [admin, rental] = await Promise.all([getAdminStats(), getRentalStats()]);
            setAdminStats(admin);
            setRentalStats(rental);
            setLoading(false);
        };
        loadStats();
    }, []);

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <Spin size="large" />
                <p style={{ marginTop: 16 }}>Đang tải dữ liệu...</p>
            </div>
        );
    }

    // Prepare chart data
    const userRoleData = adminStats
        ? [
            { name: 'Admin', value: adminStats.users.byRole.admins },
            { name: 'Moderator', value: adminStats.users.byRole.moderators },
            { name: 'Landlord', value: adminStats.users.byRole.landlords },
            { name: 'Tenant', value: adminStats.users.byRole.tenants },
        ]
        : [];

    const rentalStatusData = rentalStats
        ? [
            { name: 'Đang hiển thị', value: rentalStats.byStatus.available, fill: '#52c41a' },
            { name: 'Tạm ngưng', value: rentalStats.byStatus.unavailable, fill: '#1677ff' },
            { name: 'Đã ẩn', value: rentalStats.byStatus.hidden, fill: '#faad14' },
            { name: 'Vi phạm', value: rentalStats.byStatus.violate, fill: '#ff4d4f' },
            { name: 'Chờ duyệt', value: rentalStats.byStatus.pending, fill: '#722ed1' },
            { name: 'Tạm khóa', value: rentalStats.byStatus.suspend, fill: '#d9d9d9' },
        ]
        : [];

    return (
        <div>
            <Title level={2}>Dashboard</Title>
            <Text type="secondary">Tổng quan hệ thống EZ-Room</Text>

            {/* Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Tổng số Users"
                            value={adminStats?.users.total || 0}
                            prefix={<UserOutlined style={{ color: '#1677ff' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Users hoạt động"
                            value={adminStats?.users.byStatus.active || 0}
                            prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                            styles={{ content: { color: '#52c41a' } }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Tổng số Bài đăng"
                            value={rentalStats?.total || 0}
                            prefix={<HomeOutlined style={{ color: '#722ed1' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Bài đăng tháng này"
                            value={rentalStats?.thisMonth || 0}
                            prefix={<ShopOutlined style={{ color: '#faad14' }} />}
                            styles={{ content: { color: '#faad14' } }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Role breakdown */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={12} sm={6}>
                    <Card size="small" variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Admin"
                            value={adminStats?.users.byRole.admins || 0}
                            styles={{ content: { fontSize: 20 } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Moderator"
                            value={adminStats?.users.byRole.moderators || 0}
                            styles={{ content: { fontSize: 20 } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Chủ trọ"
                            value={adminStats?.users.byRole.landlords || 0}
                            styles={{ content: { fontSize: 20 } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Người thuê"
                            value={adminStats?.users.byRole.tenants || 0}
                            styles={{ content: { fontSize: 20 } }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Charts */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <span>
                                <TeamOutlined /> Phân bố Users theo Role
                            </span>
                        }
                        variant="borderless"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={userRoleData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) =>
                                        `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                                    }
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {userRoleData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
                <Col xs={24} lg={12}>
                    <Card
                        title={
                            <span>
                                <HomeOutlined /> Trạng thái Bài đăng
                            </span>
                        }
                        variant="borderless"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={rentalStatusData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" name="Số lượng" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

            {/* Status summary */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24}>
                    <Card
                        title="Tình trạng hệ thống"
                        variant="borderless"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    >
                        <Row gutter={[16, 16]}>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title="Bài đăng Available"
                                    value={rentalStats?.byStatus.available || 0}
                                    styles={{ content: { color: '#52c41a' } }}
                                    prefix={<CheckCircleOutlined />}
                                />
                            </Col>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title="Bài đăng Unavailable"
                                    value={rentalStats?.byStatus.unavailable || 0}
                                    styles={{ content: { color: '#1677ff' } }}
                                    prefix={<HomeOutlined />}
                                />
                            </Col>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title="Bài đăng Hidden"
                                    value={rentalStats?.byStatus.hidden || 0}
                                    styles={{ content: { color: '#faad14' } }}
                                    prefix={<StopOutlined />}
                                />
                            </Col>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title="Users bị Ban"
                                    value={adminStats?.users.byStatus.banned || 0}
                                    styles={{ content: { color: '#ff4d4f' } }}
                                    prefix={<StopOutlined />}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
