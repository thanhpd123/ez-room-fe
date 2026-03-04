import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/app/features/home/components';
import {
    depositWalletRequest,
    getMyWalletRequest,
    getMyWalletTransactionsRequest,
    withdrawWalletRequest,
    type WalletSummary,
    type WalletTransactionItem,
} from '@/lib/api';

type ActionType = 'DEPOSIT' | 'WITHDRAW';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
});

function formatMoney(v: number): string {
    return currencyFormatter.format(v || 0);
}

function txTypeLabel(type: WalletTransactionItem['type']): string {
    if (type === 'DEPOSIT') return 'Nạp tiền';
    if (type === 'WITHDRAW') return 'Rút tiền';
    if (type === 'REFUND') return 'Hoàn tiền';
    if (type === 'PAYMENT') return 'Thanh toán';
    if (type === 'PREORDER') return 'Đặt cọc';
    return type;
}

export function WalletPage() {
    const navigate = useNavigate();
    const [wallet, setWallet] = useState<WalletSummary | null>(null);
    const [transactions, setTransactions] = useState<WalletTransactionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [actionType, setActionType] = useState<ActionType>('DEPOSIT');
    const [amountText, setAmountText] = useState('');
    const [description, setDescription] = useState('');

    const amount = useMemo(() => Number(amountText), [amountText]);

    const loadWallet = async () => {
        const [walletRes, txRes] = await Promise.all([
            getMyWalletRequest(),
            getMyWalletTransactionsRequest({ page: 1, limit: 20 }),
        ]);
        setWallet(walletRes.data);
        setTransactions(txRes.data || []);
    };

    useEffect(() => {
        setLoading(true);
        loadWallet()
            .catch((e) => setError(e instanceof Error ? e.message : 'Không tải được ví'))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!Number.isFinite(amount) || amount <= 0) {
            setError('Vui lòng nhập số tiền hợp lệ');
            return;
        }

        setSubmitting(true);
        try {
            const body = {
                amount,
                description: description.trim() || undefined,
            };
            if (actionType === 'DEPOSIT') {
                const res = await depositWalletRequest(body);
                setMessage(res.message || 'Nạp tiền thành công');
            } else {
                const res = await withdrawWalletRequest(body);
                setMessage(res.message || 'Rút tiền thành công');
            }
            setAmountText('');
            setDescription('');
            await loadWallet();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Thao tác thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header onLogin={() => navigate('/login')} onRegister={() => navigate('/register')} />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">Ví tiền</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Quản lý số dư và lịch sử giao dịch (mô phỏng, chưa kết nối tiền thật).
                    </p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
                    {loading ? (
                        <p className="text-muted-foreground">Đang tải số dư...</p>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
                            <p className="text-3xl font-bold text-primary mt-1">
                                {formatMoney(wallet?.balance || 0)}
                            </p>
                        </>
                    )}
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Nạp / Rút tiền</h2>
                    {error && <div className="mb-3 rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}
                    {message && <div className="mb-3 rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 text-sm text-primary">{message}</div>}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setActionType('DEPOSIT')}
                                className={`px-4 py-2 rounded-xl border text-sm font-medium ${actionType === 'DEPOSIT' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                            >
                                Nạp tiền
                            </button>
                            <button
                                type="button"
                                onClick={() => setActionType('WITHDRAW')}
                                className={`px-4 py-2 rounded-xl border text-sm font-medium ${actionType === 'WITHDRAW' ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'}`}
                            >
                                Rút tiền
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                type="number"
                                value={amountText}
                                onChange={(e) => setAmountText(e.target.value)}
                                placeholder="Số tiền (VND)"
                                min={1}
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Ghi chú (không bắt buộc)"
                                className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-60"
                        >
                            {submitting ? 'Đang xử lý...' : actionType === 'DEPOSIT' ? 'Xác nhận nạp tiền' : 'Xác nhận rút tiền'}
                        </button>
                    </form>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-foreground mb-4">Lịch sử giao dịch</h2>
                    {loading ? (
                        <p className="text-muted-foreground">Đang tải lịch sử...</p>
                    ) : transactions.length === 0 ? (
                        <p className="text-muted-foreground">Chưa có giao dịch nào.</p>
                    ) : (
                        <div className="space-y-3">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="border border-border rounded-xl px-4 py-3 flex items-start justify-between gap-4">
                                    <div>
                                        <p className="font-medium text-foreground">{txTypeLabel(tx.type)}</p>
                                        <p className="text-sm text-muted-foreground">{tx.description || '—'}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date(tx.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? 'text-primary' : 'text-foreground'}`}>
                                            {tx.type === 'DEPOSIT' || tx.type === 'REFUND' ? '+' : '-'}{formatMoney(tx.amount)}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">{tx.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
