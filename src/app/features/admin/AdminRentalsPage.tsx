import { useEffect, useState } from 'react';
import {
    Table,
    Card,
    Input,
    Select,
    Button,
    Space,
    Tag,
    Modal,
    message,
    Typography,
    Popconfirm,
    Descriptions,
    Statistic,
    Row,
    Col,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
    SearchOutlined,
    EyeOutlined,
    DeleteOutlined,
    HomeOutlined,
} from '@ant-design/icons';
import {
    getRentals,
    getRentalById,
    updateRentalStatus,
    deleteRental,
    getRentalStats,
    type Rental,
    type RentalStats,
    type PaginationInfo,
} from './shared/admin-api';

const { Title } = Typography;
const { Option } = Select;

const STATUS_OPTIONS = [
    { value: 'AVAILABLE', label: 'Đang cho thuê', color: 'success' },
    { value: 'HIDDEN', label: 'Đã ẩn', color: 'default' },
    { value: 'RENTED', label: 'Đã có người thuê', color: 'processing' },
    { value: 'ARCHIVED', label: 'Lưu trữ', color: 'warning' },
];

export function AdminRentalsPage() {
    const [rentals, setRentals] = useState<Rental[]>([]);
    const [stats, setStats] = useState<RentalStats | null>(null);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | undefined>();

    // Detail Modal
    const [viewingRental, setViewingRental] = useState<Rental | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Initial load and filter changes
    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            setLoading(true);
            const [rentalsResult, statsData] = await Promise.all([
                getRentals({
                    page: 1,
                    limit: 10,
                    search: appliedSearch || undefined,
                    status: statusFilter,
                }),
                getRentalStats(),
            ]);
            if (!cancelled) {
                setRentals(rentalsResult.data);
                setPagination(rentalsResult.pagination);
                setStats(statsData);
                setLoading(false);
            }
        };
        fetchData();
        return () => { cancelled = true; };
    }, [appliedSearch, statusFilter]);

    const loadRentals = async (page = 1) => {
        setLoading(true);
        const result = await getRentals({
            page,
            limit: 10,
            search: appliedSearch || undefined,
            status: statusFilter,
        });
        setRentals(result.data);
        setPagination(result.pagination);
        setLoading(false);
    };

    const refreshStats = async () => {
        const data = await getRentalStats();
        setStats(data);
    };

    const handleSearch = () => {
        setAppliedSearch(search);
    };

    const handleTableChange = (pag: TablePaginationConfig) => {
        loadRentals(pag.current || 1);
    };

    const handleViewDetail = async (rental: Rental) => {
        setDetailLoading(true);
        try {
            const detail = await getRentalById(rental.id);
            setViewingRental(detail);
        } catch {
            message.error('Không thể tải chi tiết');
        }
        setDetailLoading(false);
    };

    const handleStatusChange = async (rentalId: string, newStatus: string) => {
        const result = await updateRentalStatus(rentalId, newStatus);
        if (result.success) {
            message.success(result.message);
            loadRentals(pagination.page);
            refreshStats();
        } else {
            message.error(result.message);
        }
    };

    const handleDelete = async (rental: Rental) => {
        const result = await deleteRental(rental.id);
        if (result.success) {
            message.success(result.message);
            loadRentals(pagination.page);
            refreshStats();
        } else {
            message.error(result.message);
        }
    };

    const columns: ColumnsType<Rental> = [
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
            render: (title) => (
                <div style={{ maxWidth: 200 }}>
                    <div style={{ fontWeight: 500 }}>{title}</div>
                </div>
            ),
        },
        {
            title: 'Chủ trọ',
            key: 'owner',
            render: (_, record) => record.owner?.fullName || '-',
        },
        {
            title: 'Số phòng',
            key: 'roomCount',
            render: (_, record) => record.roomCount || record.rooms?.length || 0,
        },
        {
            title: 'Địa chỉ',
            key: 'location',
            render: (_, record) => {
                const loc = record.location;
                if (!loc) return '-';
                return `${loc.address || ''}${loc.district ? ', ' + loc.district : ''}`;
            },
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => {
                return (
                    <Select
                        value={status}
                        onChange={(val) => handleStatusChange(record.id, val)}
                        style={{ width: 140 }}
                        size="small"
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                                <Tag color={opt.color}>{opt.label}</Tag>
                            </Option>
                        ))}
                    </Select>
                );
            },
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(record)}
                        loading={detailLoading}
                        title="Xem chi tiết"
                    />
                    <Popconfirm
                        title="Xóa phòng này?"
                        description="Hành động này không thể hoàn tác!"
                        onConfirm={() => handleDelete(record)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            title="Xóa"
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Title level={2}>Quản lý Phòng trọ</Title>

            {/* Stats */}
            {stats && (
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Tổng phòng"
                                value={stats.total}
                                prefix={<HomeOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Đang cho thuê"
                                value={stats.byStatus.available || 0}
                                styles={{ content: { color: '#52c41a' } }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Đã có người thuê"
                                value={stats.byStatus.unavailable || 0}
                                styles={{ content: { color: '#1890ff' } }}
                            />
                        </Card>
                    </Col>
                    <Col span={6}>
                        <Card>
                            <Statistic
                                title="Đã ẩn"
                                value={stats.byStatus.hidden || 0}
                                styles={{ content: { color: '#999' } }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Filters */}
            <Card style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Input
                        placeholder="Tìm theo tiêu đề, địa chỉ..."
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{ width: 280 }}
                        allowClear
                    />
                    <Select
                        placeholder="Lọc theo Status"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 180 }}
                        allowClear
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                                {opt.label}
                            </Option>
                        ))}
                    </Select>
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                        Tìm kiếm
                    </Button>
                </Space>
            </Card>

            {/* Table */}
            <Card>
                <Table
                    columns={columns}
                    dataSource={rentals}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.page,
                        pageSize: pagination.limit,
                        total: pagination.total,
                        showSizeChanger: false,
                        showTotal: (total) => `Tổng ${total} phòng`,
                    }}
                    onChange={handleTableChange}
                />
            </Card>

            {/* Detail Modal */}
            <Modal
                title={viewingRental?.title}
                open={!!viewingRental}
                onCancel={() => setViewingRental(null)}
                footer={null}
                width={700}
            >
                {viewingRental && (
                    <div>
                        <Descriptions
                            bordered
                            column={2}
                            style={{ marginTop: 16 }}
                            size="small"
                        >
                            <Descriptions.Item label="Chủ trọ">
                                {viewingRental.owner?.fullName || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="SĐT">
                                {viewingRental.owner?.phone || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Địa chỉ" span={2}>
                                {viewingRental.location?.address || '-'}
                                {viewingRental.location?.district && `, ${viewingRental.location.district}`}
                                {viewingRental.location?.city && `, ${viewingRental.location.city}`}
                            </Descriptions.Item>
                            <Descriptions.Item label="Số phòng">
                                {viewingRental.roomCount || viewingRental.rooms?.length || 0}
                            </Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={STATUS_OPTIONS.find(s => s.value === viewingRental.status)?.color}>
                                    {STATUS_OPTIONS.find(s => s.value === viewingRental.status)?.label}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Mô tả" span={2}>
                                {viewingRental.description || '-'}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>
        </div>
    );
}
