import { Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="bg-card border-t border-border mt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1">
                        <Link to="/home" className="flex items-center gap-2 mb-5">
                            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                                <HomeIcon className="w-5 h-5 text-primary-foreground" strokeWidth={2} />
                            </div>
                            <span className="font-heading font-bold text-xl text-primary">EzRoom</span>
                        </Link>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-[240px]">
                            Nền tảng cho thuê phòng trọ thông minh và an toàn
                        </p>
                    </div>

                    <div>
                        <h4 className="font-heading font-semibold text-foreground mb-5">Về chúng tôi</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link to="/about" className="hover:text-primary transition-colors">Giới thiệu</Link></li>
                            <li><Link to="/contact" className="hover:text-primary transition-colors">Liên hệ</Link></li>
                            <li><Link to="/careers" className="hover:text-primary transition-colors">Tuyển dụng</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-heading font-semibold text-foreground mb-5">Hỗ trợ</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link to="/help" className="hover:text-primary transition-colors">Trung tâm trợ giúp</Link></li>
                            <li><Link to="/terms" className="hover:text-primary transition-colors">Điều khoản sử dụng</Link></li>
                            <li><Link to="/privacy" className="hover:text-primary transition-colors">Chính sách bảo mật</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-heading font-semibold text-foreground mb-5">Tải ứng dụng</h4>
                        <div className="space-y-3">
                            <button type="button" className="w-full px-4 py-3 bg-muted hover:bg-muted/80 rounded-xl transition-colors text-sm font-medium text-foreground">
                                App Store
                            </button>
                            <button type="button" className="w-full px-4 py-3 bg-muted hover:bg-muted/80 rounded-xl transition-colors text-sm font-medium text-foreground">
                                Google Play
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border pt-8 text-center text-muted-foreground text-sm">
                    <p>&copy; 2026 EzRoom. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
