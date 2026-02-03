import { Home as HomeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="bg-card border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1">
                        <Link to="/home" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <HomeIcon className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <span className="font-heading font-bold text-xl text-primary">EzRoom</span>
                        </Link>
                        <p className="text-foreground/60 text-sm">
                            Nền tảng cho thuê phòng trọ thông minh và an toàn
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Về chúng tôi</h4>
                        <ul className="space-y-2 text-sm text-foreground/70">
                            <li><Link to="/about" className="hover:text-primary transition-colors">Giới thiệu</Link></li>
                            <li><Link to="/contact" className="hover:text-primary transition-colors">Liên hệ</Link></li>
                            <li><Link to="/careers" className="hover:text-primary transition-colors">Tuyển dụng</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Hỗ trợ</h4>
                        <ul className="space-y-2 text-sm text-foreground/70">
                            <li><Link to="/help" className="hover:text-primary transition-colors">Trung tâm trợ giúp</Link></li>
                            <li><Link to="/terms" className="hover:text-primary transition-colors">Điều khoản sử dụng</Link></li>
                            <li><Link to="/privacy" className="hover:text-primary transition-colors">Chính sách bảo mật</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-4">Tải ứng dụng</h4>
                        <div className="space-y-3">
                            <button className="w-full px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm">
                                App Store
                            </button>
                            <button className="w-full px-4 py-2 bg-muted rounded-lg hover:bg-muted/80 transition-colors text-sm">
                                Google Play
                            </button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border pt-8 text-center text-foreground/60 text-sm">
                    <p>&copy; 2026 EzRoom. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
