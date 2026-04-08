import { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Spin, Typography } from 'antd';
import {
    HomeOutlined,
    CheckCircleOutlined,
    StopOutlined,
    DollarOutlined,
    StarOutlined,
    ShoppingCartOutlined,
    LineChartOutlined,
    PercentageOutlined,
    FireOutlined,
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
import { getLandlordDashboardStatsRequest, getLandlordPerformanceMetricsRequest, getTopSearchedRoomsRequest, type LandlordDashboardStats, type LandlordPerformanceMetrics, type TopSearchedRoom } from '@/lib/api';

const { Title, Text } = Typography;

const COLORS = ['#52c41a', '#1677ff', '#faad14', '#ff4d4f', '#722ed1', '#d9d9d9'];

export function LandlordDashboardPage() {
    const [stats, setStats] = useState<LandlordDashboardStats | null>(null);
    const [performance, setPerformance] = useState<LandlordPerformanceMetrics | null>(null);
    const [topSearchedRooms, setTopSearchedRooms] = useState<TopSearchedRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [statsRes, perfRes, topSearchRes] = await Promise.all([
                    getLandlordDashboardStatsRequest(),
                    getLandlordPerformanceMetricsRequest(),
                    getTopSearchedRoomsRequest(5),
                ]);
                setStats(statsRes.data);
                setPerformance(perfRes.data);
                setTopSearchedRooms(topSearchRes.data.rooms);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Lỗi khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        loadData();
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

    const roomStatusData = [
        { name: 'Sẵn sàng cho thuê', value: stats.rooms.byStatus.AVAILABLE, fill: '#52c41a' },
        { name: 'Đang thuê', value: stats.rooms.byStatus.RENTED, fill: '#1677ff' },
        { name: 'Sắp trống', value: stats.rooms.byStatus.NEARLY_AVAILABLE, fill: '#fa8c16' },
        { name: 'Chờ duyệt', value: stats.rooms.byStatus.PENDING, fill: '#722ed1' },
        { name: 'Bảo trì', value: stats.rooms.byStatus.MAINTENANCE, fill: '#faad14' },
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

            {/* Room status breakdown */}
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={12} sm={6}>
                    <Card size="small" variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Phòng sẵn sàng"
                            value={stats.rooms.byStatus.AVAILABLE}
                            styles={{ content: { fontSize: 20, color: '#52c41a' } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Phòng đang thuê"
                            value={stats.rooms.byStatus.RENTED}
                            styles={{ content: { fontSize: 20, color: '#1677ff' } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Phòng sắp trống"
                            value={stats.rooms.byStatus.NEARLY_AVAILABLE}
                            styles={{ content: { fontSize: 20, color: '#fa8c16' } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card size="small" variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Phòng chờ duyệt"
                            value={stats.rooms.byStatus.PENDING}
                            styles={{ content: { fontSize: 20, color: '#722ed1' } }}
                        />
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={6}>
                    <Card size="small" variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                        <Statistic
                            title="Phòng bảo trì"
                            value={stats.rooms.byStatus.MAINTENANCE}
                            styles={{ content: { fontSize: 20, color: '#faad14' } }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Performance Metrics */}
            {performance && (
                <>
                    <Title level={4} style={{ marginTop: 24 }}>Chỉ số Hiệu suất Thuê phòng</Title>
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                <Statistic
                                    title="Tỷ lệ chiếm dụng"
                                    value={performance.occupancyRate}
                                    suffix="%"
                                    prefix={<PercentageOutlined style={{ color: '#1677ff' }} />}
                                    styles={{ content: { fontSize: 20 } }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                <Statistic
                                    title="Doanh thu tháng này"
                                    value={Number(performance.revenue.thisMonth).toLocaleString('vi-VN')}
                                    suffix="đ"
                                    prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
                                    styles={{ content: { color: '#52c41a', fontSize: 16 } }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                <Statistic
                                    title="Tỷ lệ hủy đơn"
                                    value={performance.cancellationRate}
                                    suffix="%"
                                    prefix={<LineChartOutlined style={{ color: '#ff4d4f' }} />}
                                    styles={{ content: { fontSize: 20, color: '#ff4d4f' } }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                <Statistic
                                    title="Tỷ lệ xác nhận đặt cọc"
                                    value={performance.conversionRate}
                                    suffix="%"
                                    prefix={<CheckCircleOutlined style={{ color: '#722ed1' }} />}
                                    styles={{ content: { fontSize: 20, color: '#722ed1' } }}
                                />
                            </Card>
                        </Col>
                    </Row>
                    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                        <Col xs={24}>
                            <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                                <Text strong>Tổng doanh thu: </Text>
                                <Text style={{ fontSize: 18, color: '#52c41a', fontWeight: 'bold' }}>
                                    {Number(performance.revenue.total).toLocaleString('vi-VN')} đ
                                </Text>
                                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                                    <Text>
                                        Đơn đang cho thuê: <strong>{performance.bookingStats.active}</strong> |
                                        Đơn đã hủy: <strong>{performance.bookingStats.cancelled}</strong> |
                                        Tổng cộng: <strong>{performance.bookingStats.total}</strong>
                                    </Text>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </>
            )}

            {/* Top Searched Rooms */}
            {topSearchedRooms.length > 0 && (
                <>
                    <Title level={4} style={{ marginTop: 24 }}>🔥 Phòng Được Tìm Kiếm Nhiều</Title>
                    <Row gutter={[16, 16]}>
                        {topSearchedRooms.map((room) => (
                            <Col xs={24} sm={12} lg={8} key={room.id}>
                                <Card
                                    hoverable
                                    cover={
                                        room.image ? (
                                            <div style={{ height: 200, overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                                                <img
                                                    alt={room.name}
                                                    src={room.image}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                        ) : (
                                            <div style={{ height: 200, backgroundColor: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <HomeOutlined style={{ fontSize: 40, color: '#bfbfbf' }} />
                                            </div>
                                        )
                                    }
                                    style={{ position: 'relative' }}
                                >
                                    <div style={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#ff4d4f', color: 'white', padding: '4px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                                        <FireOutlined />
                                        {room.searchCount} lượt tìm
                                    </div>
                                    <Text strong>{room.name}</Text>
                                    <p style={{ margin: '8px 0', fontSize: 12, color: '#999' }}>
                                        {room.location.address}, {room.location.district}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text style={{ fontSize: 14, color: '#1677ff', fontWeight: 'bold' }}>
                                            {Number(room.price).toLocaleString('vi-VN')} đ
                                        </Text>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </>
            )}

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
                                <HomeOutlined /> Trạng thái Phòng trọ
                            </span>
                        }
                        variant="borderless"
                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={roomStatusData}
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
                                    {roomStatusData.map((_, index) => (
                                        <Cell key={`room-cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title="Phòng đang thuê"
                                    value={stats.rooms.byStatus.RENTED}
                                    styles={{ content: { color: '#1677ff' } }}
                                    prefix={<HomeOutlined />}
                                />
                            </Col>
                            <Col xs={12} sm={6}>
                                <Statistic
                                    title="Phòng sắp trống"
                                    value={stats.rooms.byStatus.NEARLY_AVAILABLE}
                                    styles={{ content: { color: '#fa8c16' } }}
                                    prefix={<HomeOutlined />}
                                />
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
