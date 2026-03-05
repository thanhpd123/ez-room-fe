import { useEffect, useState } from 'react';
import {
    Table,
    Card,
    Input,
    Select,
    Button,
    Space,
    Tag,
    Avatar,
    Modal,
    Drawer,
    Descriptions,
    Spin,
    message,
    Typography,
    Popconfirm,
    Divider,
    Badge,
    List,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
    SearchOutlined,
    UserOutlined,
    EditOutlined,
    StopOutlined,
    CheckOutlined,
    EyeOutlined,
    WalletOutlined,
    HomeOutlined,
    ShoppingCartOutlined,
    HeartOutlined,
    CrownOutlined,
} from '@ant-design/icons';
import {
    getUsers,
    getUserDetail,
    updateUserRole,
    updateUserStatus,
    type User,
    type UserDetail,
    type PaginationInfo,
} from './shared/admin-api';

const { Title, Text } = Typography;
const { Option } = Select;

const ROLE_OPTIONS = [
    { value: 'ADMIN', label: 'Admin', color: 'red' },
    { value: 'MODERATOR', label: 'Moderator', color: 'purple' },
    { value: 'LANDLORD', label: 'Chủ trọ', color: 'blue' },
    { value: 'TENANT', label: 'Người thuê', color: 'green' },
    { value: 'GUEST', label: 'Khách', color: 'default' },
];

const STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Hoạt động', color: 'success' },
    { value: 'INACTIVE', label: 'Không hoạt động', color: 'default' },
    { value: 'SUSPENDED', label: 'Tạm ngưng', color: 'warning' },
    { value: 'BANNED', label: 'Bị cấm', color: 'error' },
];

const RENTAL_STATUS_MAP: Record<string, { label: string; color: string }> = {
    AVAILABLE: { label: 'Đang hiển thị', color: 'success' },
    UNAVAILABLE: { label: 'Tạm ngưng', color: 'processing' },
    HIDDEN: { label: 'Đã ẩn', color: 'default' },
    VIOLATE: { label: 'Vi phạm', color: 'error' },
    PENDING: { label: 'Chờ duyệt', color: 'warning' },
    SUSPEND: { label: 'Tạm khóa', color: 'default' },
};

export function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
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
    const [roleFilter, setRoleFilter] = useState<string | undefined>();
    const [statusFilter, setStatusFilter] = useState<string | undefined>();

    // Role edit modal
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState<string>('');
    const [modalLoading, setModalLoading] = useState(false);

    // User detail drawer
    const [detailUser, setDetailUser] = useState<UserDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Fetch users when filters change
    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            setLoading(true);
            const result = await getUsers({
                page: 1,
                limit: 10,
                search: appliedSearch || undefined,
                role: roleFilter,
                status: statusFilter,
            });
            if (!cancelled) {
                setUsers(result.data);
                setPagination(result.pagination);
                setLoading(false);
            }
        };
        fetchData();
        return () => { cancelled = true; };
    }, [appliedSearch, roleFilter, statusFilter]);

    const loadUsers = async (page = 1) => {
        setLoading(true);
        const result = await getUsers({
            page,
            limit: 10,
            search: appliedSearch || undefined,
            role: roleFilter,
            status: statusFilter,
        });
        setUsers(result.data);
        setPagination(result.pagination);
        setLoading(false);
    };

    const handleSearch = () => {
        setAppliedSearch(search);
    };

    const handleTableChange = (pag: TablePaginationConfig) => {
        loadUsers(pag.current || 1);
    };

    const handleRoleChange = async () => {
        if (!editingUser || !newRole) return;

        setModalLoading(true);
        const result = await updateUserRole(editingUser.id, newRole);
        setModalLoading(false);

        if (result.success) {
            message.success(result.message);
            setEditingUser(null);
            loadUsers(pagination.page);
        } else {
            message.error(result.message);
        }
    };

    const handleStatusToggle = async (user: User, newStatus: 'ACTIVE' | 'BANNED') => {
        const result = await updateUserStatus(user.id, newStatus);
        if (result.success) {
            message.success(result.message);
            loadUsers(pagination.page);
        } else {
            message.error(result.message);
        }
    };

    const handleViewDetail = async (user: User) => {
        setDrawerOpen(true);
        setDetailLoading(true);
        const detail = await getUserDetail(user.id);
        setDetailUser(detail);
        setDetailLoading(false);
    };

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatMoney = (value: string | number | null | undefined) => {
        if (value == null) return '-';
        return Number(value).toLocaleString('vi-VN') + ' đ';
    };

    const columns: ColumnsType<User> = [
        {
            title: 'User',
            key: 'user',
            render: (_, record) => (
                <Space>
                    <Avatar
                        src={record.avatarUrl}
                        icon={!record.avatarUrl && <UserOutlined />}
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.fullName}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{record.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: (phone) => phone || '-',
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role) => {
                const option = ROLE_OPTIONS.find((r) => r.value === role);
                return <Tag color={option?.color}>{option?.label || role}</Tag>;
            },
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const option = STATUS_OPTIONS.find((s) => s.value === status);
                return <Tag color={option?.color}>{option?.label || status}</Tag>;
            },
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date) =>
                new Date(date).toLocaleDateString('vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                }),
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
                        title="Xem chi tiết"
                    />
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingUser(record);
                            setNewRole(record.role);
                        }}
                        title="Đổi role"
                    />
                    {record.role !== 'ADMIN' && (
                        record.status === 'ACTIVE' ? (
                            <Popconfirm
                                title="Ban user này?"
                                description={`Bạn có chắc muốn ban "${record.fullName}"?`}
                                onConfirm={() => handleStatusToggle(record, 'BANNED')}
                                okText="Ban"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    type="text"
                                    danger
                                    icon={<StopOutlined />}
                                    title="Ban user"
                                />
                            </Popconfirm>
                        ) : (
                            <Popconfirm
                                title="Mở khóa user này?"
                                description={`Bạn có chắc muốn mở khóa "${record.fullName}"?`}
                                onConfirm={() => handleStatusToggle(record, 'ACTIVE')}
                                okText="Mở khóa"
                                cancelText="Hủy"
                            >
                                <Button
                                    type="text"
                                    style={{ color: '#52c41a' }}
                                    icon={<CheckOutlined />}
                                    title="Unban user"
                                />
                            </Popconfirm>
                        )
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Title level={2}>Quản lý Users</Title>

            {/* Filters */}
            <Card style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Input
                        placeholder="Tìm theo tên, email, phone..."
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{ width: 280 }}
                        allowClear
                    />
                    <Select
                        placeholder="Lọc theo Role"
                        value={roleFilter}
                        onChange={setRoleFilter}
                        style={{ width: 150 }}
                        allowClear
                    >
                        {ROLE_OPTIONS.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                                {opt.label}
                            </Option>
                        ))}
                    </Select>
                    <Select
                        placeholder="Lọc theo Status"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        style={{ width: 150 }}
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
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.page,
                        pageSize: pagination.limit,
                        total: pagination.total,
                        showSizeChanger: false,
                        showTotal: (total) => `Tổng ${total} users`,
                    }}
                    onChange={handleTableChange}
                />
            </Card>

            {/* Edit Role Modal */}
            <Modal
                title={`Đổi role cho "${editingUser?.fullName}"`}
                open={!!editingUser}
                onOk={handleRoleChange}
                onCancel={() => setEditingUser(null)}
                confirmLoading={modalLoading}
                okText="Lưu"
                cancelText="Hủy"
            >
                <div style={{ marginTop: 16 }}>
                    <p style={{ marginBottom: 8 }}>Chọn role mới:</p>
                    <Select
                        value={newRole}
                        onChange={setNewRole}
                        style={{ width: '100%' }}
                    >
                        {ROLE_OPTIONS.map((opt) => (
                            <Option key={opt.value} value={opt.value}>
                                <Tag color={opt.color}>{opt.label}</Tag>
                            </Option>
                        ))}
                    </Select>
                </div>
            </Modal>

            {/* User Detail Drawer */}
            <Drawer
                title="Chi tiết người dùng"
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setDetailUser(null); }}
                size="large"
            >
                {detailLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <Spin size="large" />
                    </div>
                ) : detailUser ? (
                    <div>
                        {/* User header */}
                        <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                            <Avatar
                                src={detailUser.avatarUrl}
                                icon={!detailUser.avatarUrl && <UserOutlined />}
                                size={64}
                                style={{ backgroundColor: '#1677ff' }}
                            />
                            <div>
                                <Title level={4} style={{ margin: 0 }}>
                                    {detailUser.fullName}
                                    {detailUser.isVip && (
                                        <CrownOutlined
                                            style={{ color: '#faad14', marginLeft: 8, fontSize: 16 }}
                                            title="VIP"
                                        />
                                    )}
                                </Title>
                                <Text type="secondary">{detailUser.email}</Text>
                                <div style={{ marginTop: 4 }}>
                                    <Tag color={ROLE_OPTIONS.find((r) => r.value === detailUser.role)?.color}>
                                        {ROLE_OPTIONS.find((r) => r.value === detailUser.role)?.label}
                                    </Tag>
                                    <Tag color={STATUS_OPTIONS.find((s) => s.value === detailUser.status)?.color}>
                                        {STATUS_OPTIONS.find((s) => s.value === detailUser.status)?.label}
                                    </Tag>
                                </div>
                            </div>
                        </div>

                        {/* Basic info */}
                        <Descriptions bordered size="small" column={2}>
                            <Descriptions.Item label="ID">
                                <Text copyable style={{ fontSize: 12 }}>{detailUser.id}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="SĐT">
                                {detailUser.phone || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Ngày tạo">
                                {formatDate(detailUser.createdAt)}
                            </Descriptions.Item>
                            <Descriptions.Item label="Cập nhật lần cuối">
                                {formatDate(detailUser.updated_at)}
                            </Descriptions.Item>
                        </Descriptions>

                        {/* Stats summary */}
                        <Divider titlePlacement="left">Thống kê</Divider>
                        <Space size="large" wrap>
                            <Badge count={detailUser.stats.totalRentals} showZero overflowCount={999}>
                                <Tag icon={<HomeOutlined />} style={{ padding: '4px 12px' }}>
                                    Bài đăng
                                </Tag>
                            </Badge>
                            <Badge count={detailUser.stats.totalFavorites} showZero overflowCount={999}>
                                <Tag icon={<HeartOutlined />} style={{ padding: '4px 12px' }}>
                                    Yêu thích
                                </Tag>
                            </Badge>
                            <Badge count={detailUser.stats.totalPreorders} showZero overflowCount={999}>
                                <Tag icon={<ShoppingCartOutlined />} style={{ padding: '4px 12px' }}>
                                    Đặt cọc
                                </Tag>
                            </Badge>
                        </Space>

                        {/* Wallet info (read-only) */}
                        {detailUser.wallet && (
                            <>
                                <Divider titlePlacement="left">
                                    <WalletOutlined /> Ví
                                </Divider>
                                <Descriptions bordered size="small" column={1}>
                                    <Descriptions.Item label="Số dư">
                                        <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                                            {formatMoney(detailUser.wallet.balance)}
                                        </Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Ngày tạo ví">
                                        {formatDate(detailUser.wallet.createdAt)}
                                    </Descriptions.Item>
                                </Descriptions>
                            </>
                        )}

                        {/* Preferences */}
                        {detailUser.preference && (
                            <>
                                <Divider titlePlacement="left">Sở thích tìm phòng</Divider>
                                <Descriptions bordered size="small" column={2}>
                                    <Descriptions.Item label="Ngân sách">
                                        {detailUser.preference.budget_min && detailUser.preference.budget_max
                                            ? `${formatMoney(detailUser.preference.budget_min)} - ${formatMoney(detailUser.preference.budget_max)}`
                                            : '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Loại phòng">
                                        {detailUser.preference.room_type || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Khu vực" span={2}>
                                        {detailUser.preference.preferredLocation || '-'}
                                    </Descriptions.Item>
                                </Descriptions>
                            </>
                        )}

                        {/* Lifestyle profile */}
                        {detailUser.lifestyleProfile && (
                            <>
                                <Divider titlePlacement="left">Hồ sơ lối sống</Divider>
                                <Descriptions bordered size="small" column={2}>
                                    <Descriptions.Item label="Nghề nghiệp">
                                        {detailUser.lifestyleProfile.occupation_type || '-'}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Tính cách">
                                        {detailUser.lifestyleProfile.personalityType || '-'}
                                    </Descriptions.Item>
                                </Descriptions>
                            </>
                        )}

                        {/* Landlord: rentals list */}
                        {detailUser.role === 'LANDLORD' && detailUser.rentals.length > 0 && (
                            <>
                                <Divider titlePlacement="left">
                                    <HomeOutlined /> Bài đăng ({detailUser.rentals.length})
                                </Divider>
                                <List
                                    size="small"
                                    dataSource={detailUser.rentals}
                                    renderItem={(rental) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                title={rental.title}
                                                description={
                                                    <Space>
                                                        <Tag color={RENTAL_STATUS_MAP[rental.status]?.color || 'default'}>
                                                            {RENTAL_STATUS_MAP[rental.status]?.label || rental.status}
                                                        </Tag>
                                                        <Text type="secondary">{rental.rooms.length} phòng</Text>
                                                        <Text type="secondary">{formatDate(rental.createdAt)}</Text>
                                                    </Space>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </>
                        )}

                        {/* Preorders */}
                        {detailUser.preorders.length > 0 && (
                            <>
                                <Divider titlePlacement="left">
                                    <ShoppingCartOutlined /> Đặt cọc gần đây
                                </Divider>
                                <List
                                    size="small"
                                    dataSource={detailUser.preorders}
                                    renderItem={(preorder) => (
                                        <List.Item>
                                            <List.Item.Meta
                                                description={
                                                    <Space>
                                                        <Tag>{preorder.status}</Tag>
                                                        <Tag color={preorder.payment_status === 'PAID' ? 'success' : 'warning'}>
                                                            {preorder.payment_status}
                                                        </Tag>
                                                        {preorder.deposit_amount && (
                                                            <Text>{formatMoney(preorder.deposit_amount)}</Text>
                                                        )}
                                                        <Text type="secondary">{formatDate(preorder.createdAt)}</Text>
                                                    </Space>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            </>
                        )}

                        {/* Warning note for landlord data */}
                        {detailUser.role === 'LANDLORD' && (
                            <div style={{
                                marginTop: 24,
                                padding: '12px 16px',
                                background: '#fffbe6',
                                border: '1px solid #ffe58f',
                                borderRadius: 6,
                            }}>
                                <Text type="warning" strong>
                                    Lưu ý: Dữ liệu chủ trọ có thể liên kết với nhiều bài đăng, phòng,
                                    đặt cọc và giao dịch. Không nên xóa tài khoản chủ trọ.
                                </Text>
                            </div>
                        )}
                    </div>
                ) : (
                    <Text type="secondary">Không tìm thấy thông tin.</Text>
                )}
            </Drawer>
        </div>
    );
}
