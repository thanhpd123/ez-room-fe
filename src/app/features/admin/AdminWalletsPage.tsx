import { useEffect, useState } from 'react';
import {
    Table,
    Card,
    Input,
    Button,
    Space,
    Tag,
    Avatar,
    Typography,
    Drawer,
    Descriptions,
    Spin,
    Statistic,
    Row,
    Col,
    Select,
    Modal,
    message,
    Badge,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import {
    SearchOutlined,
    UserOutlined,
    WalletOutlined,
    EyeOutlined,
    DollarOutlined,
    SwapOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
} from '@ant-design/icons';
import {
    getWallets,
    getWalletTransactions,
    getWalletStats,
    approveWalletWithdrawal,
    rejectWalletWithdrawal,
    type WalletInfo,
    type WalletTransaction,
    type WalletStats,
    type PaginationInfo,
} from './shared/admin-api';

const { Title, Text } = Typography;
const { Option } = Select;

const TX_TYPE_MAP: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
    DEPOSIT: { label: 'Nạp tiền', color: 'success', icon: <ArrowDownOutlined /> },
    WITHDRAW: { label: 'Rút tiền', color: 'error', icon: <ArrowUpOutlined /> },
    TRANSFER: { label: 'Chuyển tiền', color: 'processing', icon: <SwapOutlined /> },
    PREORDER: { label: 'Đặt cọc', color: 'warning' },
    REFUND: { label: 'Hoàn tiền', color: 'cyan' },
    PAYMENT: { label: 'Thanh toán', color: 'purple' },
};

const TX_STATUS_MAP: Record<string, { label: string; color: string }> = {
    PENDING: { label: 'Đang xử lý', color: 'warning' },
    SUCCESS: { label: 'Thành công', color: 'success' },
    FAILED: { label: 'Thất bại', color: 'error' },
    CANCELLED: { label: 'Đã hủy', color: 'default' },
};

const ROLE_COLOR_MAP: Record<string, string> = {
    ADMIN: 'red',
    MODERATOR: 'purple',
    LANDLORD: 'blue',
    TENANT: 'green',
    GUEST: 'default',
};

export function AdminWalletsPage() {
    const [wallets, setWallets] = useState<WalletInfo[]>([]);
    const [stats, setStats] = useState<WalletStats | null>(null);
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

    // Transaction drawer
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [txLoading, setTxLoading] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<{
        id: string;
        balance: string;
        user: { id: string; fullName: string; email: string; role: string };
    } | null>(null);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [txPagination, setTxPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });
    const [txTypeFilter, setTxTypeFilter] = useState<string | undefined>();
    const [txStatusFilter, setTxStatusFilter] = useState<string | undefined>();
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [selectedRejectTx, setSelectedRejectTx] = useState<WalletTransaction | null>(null);

    // Load stats once
    useEffect(() => {
        getWalletStats().then(setStats);
    }, []);

    // Load wallets
    useEffect(() => {
        let cancelled = false;
        const fetchData = async () => {
            setLoading(true);
            const result = await getWallets({
                page: 1,
                limit: 10,
                search: appliedSearch || undefined,
            });
            if (!cancelled) {
                setWallets(result.data);
                setPagination(result.pagination);
                setLoading(false);
            }
        };
        fetchData();
        return () => { cancelled = true; };
    }, [appliedSearch]);

    const loadWallets = async (page = 1) => {
        setLoading(true);
        const result = await getWallets({
            page,
            limit: 10,
            search: appliedSearch || undefined,
        });
        setWallets(result.data);
        setPagination(result.pagination);
        setLoading(false);
    };

    const handleSearch = () => {
        setAppliedSearch(search);
    };

    const handleTableChange = (pag: TablePaginationConfig) => {
        loadWallets(pag.current || 1);
    };

    const openTransactions = async (wallet: WalletInfo) => {
        setDrawerOpen(true);
        setTxLoading(true);
        setTxTypeFilter(undefined);
        setTxStatusFilter(undefined);

        const result = await getWalletTransactions(wallet.id);
        setSelectedWallet(result.wallet);
        setTransactions(result.transactions);
        setTxPagination(result.pagination);
        setTxLoading(false);
    };

    const loadTransactions = async (page = 1) => {
        if (!selectedWallet) return;
        setTxLoading(true);
        const result = await getWalletTransactions(selectedWallet.id, {
            page,
            limit: 20,
            type: txTypeFilter,
            status: txStatusFilter,
        });
        setSelectedWallet(result.wallet);
        setTransactions(result.transactions);
        setTxPagination(result.pagination);
        setTxLoading(false);
    };

    const refreshWalletData = async () => {
        await Promise.all([
            loadTransactions(txPagination.page || 1),
            loadWallets(pagination.page || 1),
        ]);
        const latestStats = await getWalletStats();
        setStats(latestStats);
    };

    const handleApproveWithdrawal = async (tx: WalletTransaction) => {
        setActionLoadingId(tx.id);
        const result = await approveWalletWithdrawal(tx.id);
        if (result.success) {
            message.success(result.message);
            await refreshWalletData();
        } else {
            message.error(result.message);
        }
        setActionLoadingId(null);
    };

    const openRejectModal = (tx: WalletTransaction) => {
        setSelectedRejectTx(tx);
        setRejectReason('');
        setRejectModalOpen(true);
    };

    const handleRejectWithdrawal = async () => {
        if (!selectedRejectTx) return;
        setActionLoadingId(selectedRejectTx.id);
        const result = await rejectWalletWithdrawal(selectedRejectTx.id, rejectReason);
        if (result.success) {
            message.success(result.message);
            setRejectModalOpen(false);
            setSelectedRejectTx(null);
            setRejectReason('');
            await refreshWalletData();
        } else {
            message.error(result.message);
        }
        setActionLoadingId(null);
    };

    const applyPendingWithdrawPreset = () => {
        setTxTypeFilter('WITHDRAW');
        setTxStatusFilter('PENDING');
    };

    const clearTransactionFilters = () => {
        setTxTypeFilter(undefined);
        setTxStatusFilter(undefined);
    };

    const handleQuickViewPendingWithdrawals = () => {
        if (!drawerOpen || !selectedWallet) {
            message.info('Mở giao dịch của một ví rồi bấm lại để lọc các yêu cầu rút tiền chờ duyệt.');
            return;
        }
        applyPendingWithdrawPreset();
    };

    // Reload transactions when filters change
    useEffect(() => {
        if (drawerOpen && selectedWallet) {
            loadTransactions(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [txTypeFilter, txStatusFilter]);

    const formatMoney = (value: string | number | null | undefined) => {
        if (value == null) return '0 đ';
        return Number(value).toLocaleString('vi-VN') + ' đ';
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

    const walletColumns: ColumnsType<WalletInfo> = [
        {
            title: 'User',
            key: 'user',
            render: (_, record) => (
                <Space>
                    <Avatar
                        src={record.user.avatarUrl}
                        icon={!record.user.avatarUrl && <UserOutlined />}
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.user.fullName}</div>
                        <div style={{ fontSize: 12, color: '#888' }}>{record.user.email}</div>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Role',
            key: 'role',
            render: (_, record) => (
                <Tag color={ROLE_COLOR_MAP[record.user.role] || 'default'}>
                    {record.user.role}
                </Tag>
            ),
            width: 120,
        },
        {
            title: 'Số dư',
            key: 'balance',
            render: (_, record) => (
                <Text strong style={{ color: Number(record.balance) > 0 ? '#52c41a' : undefined }}>
                    {formatMoney(record.balance)}
                </Text>
            ),
            sorter: (a, b) => Number(a.balance) - Number(b.balance),
        },
        {
            title: 'Ngày tạo',
            key: 'createdAt',
            render: (_, record) => formatDate(record.createdAt),
        },
        {
            title: '',
            key: 'actions',
            width: 80,
            render: (_, record) => (
                <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => openTransactions(record)}
                    title="Xem giao dịch"
                >
                    Giao dịch
                </Button>
            ),
        },
    ];

    const txColumns: ColumnsType<WalletTransaction> = [
        {
            title: 'Loại',
            dataIndex: 'transaction_type',
            key: 'type',
            width: 120,
            render: (type) => {
                const info = TX_TYPE_MAP[type];
                return info ? (
                    <Tag color={info.color} icon={info.icon}>
                        {info.label}
                    </Tag>
                ) : (
                    <Tag>{type}</Tag>
                );
            },
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount) => (
                <Text strong>{formatMoney(amount)}</Text>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 120,
            render: (status) => {
                const info = TX_STATUS_MAP[status];
                return info ? (
                    <Tag color={info.color}>{info.label}</Tag>
                ) : (
                    <Tag>{status}</Tag>
                );
            },
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (desc) => desc || '-',
            ellipsis: true,
        },
        {
            title: 'Thời gian',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 160,
            render: (date) => formatDate(date),
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 220,
            render: (_, record) => {
                const isPendingWithdraw =
                    record.transaction_type === 'WITHDRAW' && record.status === 'PENDING';

                if (!isPendingWithdraw) {
                    return <Text type="secondary">-</Text>;
                }

                return (
                    <Space>
                        <Button
                            type="primary"
                            size="small"
                            loading={actionLoadingId === record.id}
                            onClick={() => handleApproveWithdrawal(record)}
                        >
                            Duyệt
                        </Button>
                        <Button
                            danger
                            size="small"
                            loading={actionLoadingId === record.id}
                            onClick={() => openRejectModal(record)}
                        >
                            Từ chối
                        </Button>
                    </Space>
                );
            },
        },
    ];

    return (
        <div>
            <Title level={2}>
                <WalletOutlined style={{ marginRight: 8 }} />
                Quản lý Ví
                {stats && (
                    <Button
                        type="text"
                        style={{ marginLeft: 8, paddingInline: 8 }}
                        onClick={handleQuickViewPendingWithdrawals}
                        title="Bấm để lọc nhanh các yêu cầu rút tiền chờ duyệt trong drawer giao dịch"
                    >
                        <Space size={6}>
                            <span>Chờ duyệt</span>
                            <Badge
                                count={stats.pendingWithdrawRequests}
                                style={{ backgroundColor: stats.pendingWithdrawRequests > 0 ? '#faad14' : '#d9d9d9' }}
                            />
                        </Space>
                    </Button>
                )}
            </Title>

            <div style={{
                marginBottom: 16,
                padding: '8px 16px',
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: 6,
            }}>
                <Text>
                    Admin có thể theo dõi ví và duyệt/từ chối các yêu cầu rút tiền đang chờ xử lý.
                    Số dư chỉ thay đổi khi yêu cầu được duyệt thành công.
                </Text>
            </div>

            {/* Stats */}
            {stats && (
                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} lg={6}>
                        <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                            <Statistic
                                title="Tổng số ví"
                                value={stats.totalWallets}
                                prefix={<WalletOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                            <Statistic
                                title="Tổng số dư hệ thống"
                                value={formatMoney(stats.totalBalance)}
                                prefix={<DollarOutlined />}
                                styles={{ content: { color: '#52c41a', fontSize: 20 } }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                            <Statistic
                                title="Số dư trung bình"
                                value={formatMoney(stats.avgBalance)}
                                prefix={<DollarOutlined />}
                                styles={{ content: { fontSize: 20 } }}
                            />
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                        <Card variant="borderless" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                            <Statistic
                                title="Số dư cao nhất"
                                value={formatMoney(stats.maxBalance)}
                                prefix={<DollarOutlined />}
                                styles={{ content: { color: '#1677ff', fontSize: 20 } }}
                            />
                        </Card>
                    </Col>
                </Row>
            )}

            {/* Transaction type stats */}
            {stats && stats.transactionsByType.length > 0 && (
                <Card
                    title="Thống kê giao dịch theo loại"
                    style={{ marginBottom: 16 }}
                    variant="borderless"
                    styles={{ body: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' } }}
                >
                    <Row gutter={[16, 8]}>
                        {stats.transactionsByType.map((t) => {
                            const info = TX_TYPE_MAP[t.type];
                            return (
                                <Col xs={12} sm={8} lg={4} key={t.type}>
                                    <div style={{ textAlign: 'center' }}>
                                        <Tag color={info?.color || 'default'} style={{ marginBottom: 4 }}>
                                            {info?.label || t.type}
                                        </Tag>
                                        <div style={{ fontSize: 16, fontWeight: 600 }}>{t.count}</div>
                                        <div style={{ fontSize: 12, color: '#888' }}>
                                            {formatMoney(t.totalAmount)}
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                </Card>
            )}

            {/* Search */}
            <Card style={{ marginBottom: 16 }}>
                <Space wrap>
                    <Input
                        placeholder="Tìm theo tên, email..."
                        prefix={<SearchOutlined />}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onPressEnter={handleSearch}
                        style={{ width: 280 }}
                        allowClear
                    />
                    <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                        Tìm kiếm
                    </Button>
                </Space>
            </Card>

            {/* Wallets Table */}
            <Card>
                <Table
                    columns={walletColumns}
                    dataSource={wallets}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: pagination.page,
                        pageSize: pagination.limit,
                        total: pagination.total,
                        showSizeChanger: false,
                        showTotal: (total) => `Tổng ${total} ví`,
                    }}
                    onChange={handleTableChange}
                />
            </Card>

            {/* Transaction Drawer */}
            <Drawer
                title="Lịch sử giao dịch"
                open={drawerOpen}
                onClose={() => { setDrawerOpen(false); setSelectedWallet(null); }}
                size="large"
            >
                {selectedWallet && (
                    <>
                        <Descriptions bordered size="small" column={2} style={{ marginBottom: 16 }}>
                            <Descriptions.Item label="Chủ ví">
                                {selectedWallet.user.fullName}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {selectedWallet.user.email}
                            </Descriptions.Item>
                            <Descriptions.Item label="Role">
                                <Tag color={ROLE_COLOR_MAP[selectedWallet.user.role] || 'default'}>
                                    {selectedWallet.user.role}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Số dư hiện tại">
                                <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                                    {formatMoney(selectedWallet.balance)}
                                </Text>
                            </Descriptions.Item>
                        </Descriptions>

                        {/* Transaction filters */}
                        <Space wrap style={{ marginBottom: 16 }}>
                            <Button onClick={applyPendingWithdrawPreset}>
                                Chờ duyệt rút tiền
                            </Button>
                            <Button onClick={clearTransactionFilters}>
                                Tất cả giao dịch
                            </Button>
                            <Select
                                placeholder="Lọc theo loại"
                                value={txTypeFilter}
                                onChange={setTxTypeFilter}
                                style={{ width: 150 }}
                                allowClear
                            >
                                {Object.entries(TX_TYPE_MAP).map(([key, val]) => (
                                    <Option key={key} value={key}>
                                        {val.label}
                                    </Option>
                                ))}
                            </Select>
                            <Select
                                placeholder="Lọc theo trạng thái"
                                value={txStatusFilter}
                                onChange={setTxStatusFilter}
                                style={{ width: 150 }}
                                allowClear
                            >
                                {Object.entries(TX_STATUS_MAP).map(([key, val]) => (
                                    <Option key={key} value={key}>
                                        {val.label}
                                    </Option>
                                ))}
                            </Select>
                        </Space>

                        {txLoading ? (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <Spin size="large" />
                            </div>
                        ) : (
                            <Table
                                columns={txColumns}
                                dataSource={transactions}
                                rowKey="id"
                                size="small"
                                pagination={{
                                    current: txPagination.page,
                                    pageSize: txPagination.limit,
                                    total: txPagination.total,
                                    showSizeChanger: false,
                                    showTotal: (total) => `Tổng ${total} giao dịch`,
                                }}
                                onChange={(pag) => loadTransactions(pag.current || 1)}
                            />
                        )}
                    </>
                )}
            </Drawer>

            <Modal
                title="Từ chối yêu cầu rút tiền"
                open={rejectModalOpen}
                onCancel={() => {
                    setRejectModalOpen(false);
                    setSelectedRejectTx(null);
                    setRejectReason('');
                }}
                onOk={handleRejectWithdrawal}
                confirmLoading={Boolean(selectedRejectTx && actionLoadingId === selectedRejectTx.id)}
                okText="Xác nhận từ chối"
                cancelText="Hủy"
            >
                <Text type="secondary">
                    Bạn có thể nhập lý do để thông báo cho người dùng (không bắt buộc).
                </Text>
                <Input.TextArea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ví dụ: Thông tin tài khoản nhận tiền chưa hợp lệ"
                    maxLength={300}
                    style={{ marginTop: 12 }}
                    showCount
                />
            </Modal>
        </div>
    );
}
