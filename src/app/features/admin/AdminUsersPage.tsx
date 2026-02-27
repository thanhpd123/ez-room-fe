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
    message,
    Typography,
    Popconfirm,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
    SearchOutlined,
    UserOutlined,
    EditOutlined,
    StopOutlined,
    CheckOutlined,
} from '@ant-design/icons';
import {
    getUsers,
    updateUserRole,
    updateUserStatus,
    type User,
    type PaginationInfo,
} from './shared/admin-api';

const { Title } = Typography;
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
    const [appliedSearch, setAppliedSearch] = useState(''); // Search that's actually applied
    const [roleFilter, setRoleFilter] = useState<string | undefined>();
    const [statusFilter, setStatusFilter] = useState<string | undefined>();

    // Modal state
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newRole, setNewRole] = useState<string>('');
    const [modalLoading, setModalLoading] = useState(false);

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
        setAppliedSearch(search); // This triggers the useEffect
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
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingUser(record);
                            setNewRole(record.role);
                        }}
                        title="Đổi role"
                    />
                    {record.status === 'ACTIVE' ? (
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
        </div>
    );
}
