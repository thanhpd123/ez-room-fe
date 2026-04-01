import { Link, useSearchParams } from 'react-router-dom';

function normalizeStatus(searchParams: URLSearchParams): 'success' | 'cancel' | 'pending' {
    const code = (searchParams.get('code') || '').toUpperCase();
    const status = (searchParams.get('status') || '').toUpperCase();
    const type = (searchParams.get('type') || '').toLowerCase();

    if (code === '00' || status === 'PAID' || status === 'SUCCESS') return 'success';
    if (type === 'cancel' || status === 'CANCELLED') return 'cancel';
    return 'pending';
}

export function PayOSResultPage() {
    const [searchParams] = useSearchParams();

    const preorderId = searchParams.get('preorderId') || '';
    const state = normalizeStatus(searchParams);

    const title = state === 'success'
        ? 'Thanh toán đặt cọc thành công'
        : state === 'cancel'
            ? 'Bạn đã hủy thanh toán'
            : 'Đã nhận trạng thái thanh toán';

    const description = state === 'success'
        ? 'Hệ thống đã ghi nhận giao dịch. Vui lòng chờ chủ trọ xác nhận yêu cầu đặt cọc của bạn.'
        : state === 'cancel'
            ? 'Bạn có thể quay lại trang phòng để thực hiện đặt cọc lại khi cần.'
            : 'Kết quả thanh toán đang được đồng bộ. Bạn có thể kiểm tra lại trong giây lát.';

    return (
        <main className="min-h-screen bg-background flex items-center justify-center px-4">
            <section className="w-full max-w-xl rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
                <h1 className="text-2xl font-bold text-foreground mb-3">{title}</h1>
                <p className="text-muted-foreground mb-6">{description}</p>

                {preorderId && (
                    <p className="text-sm text-muted-foreground mb-6">
                        Mã preorder: <span className="font-medium text-foreground">{preorderId}</span>
                    </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/history"
                        className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                    >
                        Xem lịch sử thuê
                    </Link>
                    <Link
                        to="/browse"
                        className="inline-flex items-center justify-center rounded-lg border border-border px-5 py-2.5 text-foreground font-medium hover:bg-muted transition-colors"
                    >
                        Tìm phòng khác
                    </Link>
                </div>
            </section>
        </main>
    );
}
