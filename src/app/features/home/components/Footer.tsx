import { HomeOutlined, AppleOutlined, AndroidOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

export function Footer() {
    const { t } = useTranslation();
    return (
        <footer className="bg-card border-t border-border mt-12 sm:mt-16 lg:mt-20 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-8 sm:mb-12">
                    <div className="col-span-1">
                        <Link to="/home" className="flex items-center gap-2 mb-5 no-underline">
                            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm bg-primary">
                                <HomeOutlined className="text-white text-lg" />
                            </div>
                            <span className="font-heading font-bold text-xl text-primary">EzRoom</span>
                        </Link>
                        <Text type="secondary" className="text-sm leading-relaxed block max-w-[280px]">
                            {t('footer.tagline')}
                        </Text>
                    </div>

                    <div>
                        <Typography.Title level={5} className="!mb-5 !font-heading !font-semibold !text-foreground">
                            {t('footer.aboutUs')}
                        </Typography.Title>
                        <ul className="space-y-3 text-sm text-muted-foreground list-none p-0 m-0">
                            <li><Link to="/about" className="text-muted-foreground hover:text-primary transition-colors no-underline py-1 inline-block">{t('footer.intro')}</Link></li>
                            <li><Link to="/contact" className="text-muted-foreground hover:text-primary transition-colors no-underline py-1 inline-block">{t('footer.contact')}</Link></li>
                            <li><Link to="/careers" className="text-muted-foreground hover:text-primary transition-colors no-underline py-1 inline-block">{t('footer.careers')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <Typography.Title level={5} className="!mb-5 !font-heading !font-semibold !text-foreground">
                            {t('footer.support')}
                        </Typography.Title>
                        <ul className="space-y-3 text-sm text-muted-foreground list-none p-0 m-0">
                            <li><Link to="/help" className="text-muted-foreground hover:text-primary transition-colors no-underline py-1 inline-block">{t('footer.helpCenter')}</Link></li>
                            <li><Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors no-underline py-1 inline-block">{t('footer.terms')}</Link></li>
                            <li><Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors no-underline py-1 inline-block">{t('footer.privacy')}</Link></li>
                        </ul>
                    </div>

                    <div>
                        <Typography.Title level={5} className="!mb-5 !font-heading !font-semibold !text-foreground">
                            {t('footer.downloadApp')}
                        </Typography.Title>
                        <div className="flex flex-col gap-2 sm:gap-3">
                            <Button block icon={<AppleOutlined />} size="large" className="rounded-xl min-h-[44px] touch-manipulation hover:border-primary/50 transition-colors">
                                App Store
                            </Button>
                            <Button block icon={<AndroidOutlined />} size="large" className="rounded-xl min-h-[44px] touch-manipulation hover:border-primary/50 transition-colors">
                                Google Play
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="border-t border-border pt-6 sm:pt-8 text-center">
                    <Text type="secondary" className="text-xs sm:text-sm">{t('footer.copyright')}</Text>
                </div>
            </div>
        </footer>
    );
}
