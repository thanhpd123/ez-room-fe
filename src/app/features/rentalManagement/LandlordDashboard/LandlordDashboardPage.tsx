import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Typography } from 'antd';
import {
    HomeOutlined,
    CheckCircleOutlined,
    StopOutlined,
    DollarOutlined,
    StarOutlined,
    ShoppingCartOutlined,
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
import { getLandlordDashboardStatsRequest, type LandlordDashboardStats } from '@/lib/api';

const { Title, Text } = Typography;

const COLORS = ['#52c41a', '#1677ff', '#faad14', '#ff4d4f', '#722ed1', '#d9d9d9'];

export function LandlordDashboardPage() {
    const [stats, setStats] = useState<LandlordDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadStats = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await getLandlordDashboardStatsRequest();
                setStats(response.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
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

    if (error || !stats) {
        return (
            <div style={{ textAlign: 'center', padding: '100px 0' }}>
                <p style={{ color: 'red', fontSize: 16 }}>{error || 'Không thể tải dữ liệu'}</p>
            </div>
        );
    }

    // Prepare chart data
    const rentalStatusData = [
        { name: 'Đang hiển thị', value: stats.rentals.byStatus.AVAILABLE, fill: '#52c41a' },
        { name: 'Tạm ngưng', value: stats.rentals.byStatus.UNAVAILABLE, fill: '#1677ff' },
        { name: 'Đã ẩn', value: stats.rentals.byStatus.HIDDEN, fill: '#faad14' },
        { name: 'Vi phạm', value: stats.rentals.byStatus.VIOLATE, fill: '#ff4d4f' },
        { name: 'Chờ duyệt', value: stats.rentals.byStatus.PENDING, fill: '#722ed1' },
        { name: 'Tạm khóa', value: stats.rentals.byStatus.SUSPEND, fill: '#d9d9d9' },
    ];

    const preorderStatusData = [
        { name: 'Chờ xác nhận', value: stats.preorders.byStatus.PENDING },
        { name: 'Đã duyệt', value: stats.preorders.byStatus.CONFIRMED },
        { name: 'Đã hủy', value: stats.preorders.byStatus.CANCELLED },
        { name: 'Hết hạn', value: stats.preorders.byStatus.EXPIRED },
    ];

    return (
        <div>
            <Title level={2}>Dashboard</Title>
            <Text type="secondary">Tổng quan quản lý nhà cho thuê</Text>

            {/* Main Stats Cards */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Tổng số Nhà cho thuê"
                            value={stats.rentals.total}
                            prefix={<HomeOutlined style={{ color: '#1677ff' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Tổng số Phòng trọ"
                            value={stats.rooms.total}
                            prefix={<HomeOutlined style={{ color: '#722ed1' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Tổng số dư ví"
                            value={Number(stats.wallet.balance).toLocaleString('vi-VN') + ' đ'}
                            prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                            styles={{ content: { color: '#52c41a', fontSize: 18 } }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Tổng đặt cọc"
                            value={stats.preorders.total}
                            prefix={<ShoppingCartOutlined style={{ color: '#eb2f96' }} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Feedback Stats */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Tổng đánh giá"
                            value={stats.feedback.total}
                            prefix={<StarOutlined style={{ color: '#faad14' }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Đánh giá trung bình"
                            value={stats.feedback.averageRating.toFixed(1)}
                            suffix="/ 5"
                            prefix={<StarOutlined style={{ color: '#faad14' }} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Status breakdown */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={12} sm={6}>
                    <Card size="small" variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Đang hiển thị"
                            value={stats.rentals.byStatus.AVAILABLE}
                            styles={{ content: { fontSize: 20, color: '#52c41a' } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Chờ duyệt"
                            value={stats.rentals.byStatus.PENDING}
                            styles={{ content: { fontSize: 20, color: '#722ed1' } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Tạm ẩn"
                            value={stats.rentals.byStatus.HIDDEN}
                            styles={{ content: { fontSize: 20, color: '#faad14' } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Vi phạm"
                            value={stats.rentals.byStatus.VIOLATE}
                            styles={{ content: { fontSize: 20, color: '#ff4d4f' } }}
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
                                <HomeOutlined /> Trạng thái Nhà cho thuê
                            </span>
                        }
                        variant="borderless"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={rentalStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value }) =>
                                        value > 0 ? `${name}: ${value}` : ''
                                    }
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {rentalStatusData.map((_, index) => (
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
                                <ShoppingCartOutlined /> Trạng thái Đặt cọc
                            </span>
                        }
                        variant="borderless"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={preorderStatusData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" fill="#1677ff" name="Số lượng" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </Col>
            </Row>

            {/* Status summary */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col xs={24}>
                    <Card
                        title="Tổng hợp trạng thái"
                        variant="borderless"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    >
                        <Row gutter={[16, 16]}>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title="Nhà Available"
                                    value={stats.rentals.byStatus.AVAILABLE}
                                    styles={{ content: { color: '#52c41a' } }}
                                    prefix={<CheckCircleOutlined />}
                                />
                            </Col>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title="Nhà Unavailable"
                                    value={stats.rentals.byStatus.UNAVAILABLE}
                                    styles={{ content: { color: '#1677ff' } }}
                                    prefix={<HomeOutlined />}
                                />
                            </Col>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title="Nhà Hidden"
                                    value={stats.rentals.byStatus.HIDDEN}
                                    styles={{ content: { color: '#faad14' } }}
                                    prefix={<StopOutlined />}
                                />
                            </Col>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title="Đơn xác nhận"
                                    value={stats.preorders.byStatus.CONFIRMED}
                                    styles={{ content: { color: '#52c41a' } }}
                                    prefix={<CheckCircleOutlined />}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
