import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    Input,
    Row,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    getFinanceReconciliation,
    getFinanceSummary,
    type FinanceSummaryData,
    type ReconciliationItem,
} from './shared/admin-api';

const { Title, Text } = Typography;

function formatMoney(value: number | string | null | undefined) {
    const amount = Number(value || 0);
    return `${amount.toLocaleString('vi-VN')} đ`;
}

export function AdminFinancePage() {
    const { t } = useTranslation();
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    const [summary, setSummary] = useState<FinanceSummaryData | null>(null);
    const [mismatches, setMismatches] = useState<ReconciliationItem[]>([]);
    const [summaryByType, setSummaryByType] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);

    const loadData = async (nextPage = page, nextPageSize = pageSize) => {
        setLoading(true);
        const [summaryData, reconcileData] = await Promise.all([
            getFinanceSummary({ from: from || undefined, to: to || undefined }),
            getFinanceReconciliation({
                from: from || undefined,
                to: to || undefined,
                page: nextPage,
                limit: nextPageSize,
            }),
        ]);
        setSummary(summaryData);
        setMismatches(reconcileData.data?.mismatches || []);
        setSummaryByType(reconcileData.data?.summary.byType || {});
        setTotal(reconcileData.pagination.total || 0);
        setLoading(false);
    };

    useEffect(() => {
        void loadData(1, pageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const mismatchTypeTags = useMemo(
        () =>
            Object.entries(summaryByType).map(([type, count]) => (
                <Tag key={type} color="orange">
                    {type}: {count}
                </Tag>
            )),
        [summaryByType]
    );

    const chartData = useMemo(() => {
        if (!summary) return [];
        return [
            {
                name: t('admin.finance.charts.deposit'),
                amount: Number(summary.kpis.preorderDeposits.successAmount || 0),
            },
            {
                name: t('admin.finance.charts.topup'),
                amount: Number(summary.kpis.walletTopups.successAmount || 0),
            },
            {
                name: t('admin.finance.charts.vip'),
                amount: Number(summary.kpis.vipPurchases.successAmount || 0),
            },
            {
                name: t('admin.finance.charts.platformFee'),
                amount: Number(summary.kpis.platformFees.amount || 0),
            },
            {
                name: t('admin.finance.charts.refund'),
                amount: Number(summary.kpis.refunds.completedAmount || 0),
            },
        ];
    }, [summary, t]);

    const columns: ColumnsType<ReconciliationItem> = [
        {
            title: 'Mismatch',
            dataIndex: 'type',
            key: 'type',
            width: 280,
            render: (value: string) => <Tag color="red">{value}</Tag>,
        },
        {
            title: t('admin.finance.table.preorder'),
            key: 'preorder',
            render: (_, row) =>
                row.preorder ? (
                    <div>
                        <div>ID: {row.preorder.id}</div>
                        <div>Status: {row.preorder.status}</div>
                        <div>Payment: {row.preorder.payment_status}</div>
                        <div>Deposit: {formatMoney(row.preorder.deposit_amount)}</div>
                    </div>
                ) : (
                    <Text type="secondary">N/A</Text>
                ),
        },
        {
            title: t('admin.finance.table.paymentOrder'),
            key: 'order',
            render: (_, row) =>
                row.order ? (
                    <div>
                        <div>TxnRef: {row.order.vnp_txn_ref}</div>
                        <div>Status: {row.order.status}</div>
                        <div>Amount: {formatMoney(row.order.amount)}</div>
                        <div>Ref: {row.order.ref_type || 'N/A'} / {row.order.ref_id || 'N/A'}</div>
                    </div>
                ) : (
                    <Text type="secondary">N/A</Text>
                ),
        },
    ];

    return (
        <div>
            <Title level={2}>{t('admin.finance.title')}</Title>
            <Text type="secondary">{t('admin.finance.subtitle')}</Text>

            <Card style={{ marginTop: 16 }}>
                <Space wrap>
                    <Input
                        type="date"
                        value={from}
                        onChange={(e) => setFrom(e.target.value)}
                        placeholder={t('admin.finance.filters.from')}
                        style={{ width: 180 }}
                    />
                    <Input
                        type="date"
                        value={to}
                        onChange={(e) => setTo(e.target.value)}
                        placeholder={t('admin.finance.filters.to')}
                        style={{ width: 180 }}
                    />
                    <Button
                        type="primary"
                        onClick={() => {
                            setPage(1);
                            void loadData(1, pageSize);
                        }}
                        loading={loading}
                    >
                        {t('admin.finance.filters.apply')}
                    </Button>
                </Space>
            </Card>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title={t('admin.finance.kpis.platformFees')}
                            value={formatMoney(summary?.kpis.platformFees.amount)}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title={t('admin.finance.kpis.preorderDeposits')}
                            value={formatMoney(summary?.kpis.preorderDeposits.successAmount)}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title={t('admin.finance.kpis.walletTopups')}
                            value={formatMoney(summary?.kpis.walletTopups.successAmount)}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title={t('admin.finance.kpis.refunds')}
                            value={formatMoney(summary?.kpis.refunds.completedAmount)}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title={t('admin.finance.kpis.pendingOrders')}
                            value={summary?.kpis.pendingPaymentOrders || 0}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={8}>
                    <Card>
                        <Statistic
                            title={t('admin.finance.kpis.vipPurchases')}
                            value={formatMoney(summary?.kpis.vipPurchases.successAmount)}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title={t('admin.finance.charts.title')} style={{ marginTop: 16 }}>
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatMoney(Number(value || 0))} />
                        <Legend />
                        <Bar dataKey="amount" name={t('admin.finance.charts.amount')} fill="#1677ff" radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            <Card title={t('admin.finance.reconciliation.title')} style={{ marginTop: 16 }}>
                {mismatchTypeTags.length > 0 ? (
                    <Space wrap style={{ marginBottom: 12 }}>{mismatchTypeTags}</Space>
                ) : (
                    <Alert type="success" showIcon message={t('admin.finance.reconciliation.noMismatch')} style={{ marginBottom: 12 }} />
                )}

                <Table
                    rowKey={(row) => `${row.type}-${row.order?.id || 'no-order'}-${row.preorder?.id || 'no-preorder'}`}
                    columns={columns}
                    dataSource={mismatches}
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize,
                        total,
                        showSizeChanger: true,
                        onChange: (nextPage, nextPageSize) => {
                            setPage(nextPage);
                            setPageSize(nextPageSize);
                            void loadData(nextPage, nextPageSize);
                        },
                    }}
                    scroll={{ x: 960 }}
                />
            </Card>
        </div>
    );
}
