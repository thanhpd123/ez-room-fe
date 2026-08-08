import { useEffect, useState } from 'react';
import { Alert, Button, Card, Divider, Form, Input, InputNumber, Space, Tag, Typography, message } from 'antd';
import { getSystemSettings, updateSystemSettings } from './shared/admin-api';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

type SettingsFormValues = {
    defaultPercent: number;
    minPercent: number;
    maxPercent: number;
    baseMonths: number;
    preorderFeeBps: number;
};

type RolePolicyItem = {
    value: string;
    label: string;
    color: string;
    permissions: string[];
};

export function AdminSettingsPage() {
    const { t } = useTranslation();
    const [form] = Form.useForm<SettingsFormValues>();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [rolePolicies, setRolePolicies] = useState<RolePolicyItem[]>([]);
    const [newRoleValue, setNewRoleValue] = useState('');
    const [newRoleLabel, setNewRoleLabel] = useState('');
    const [newRoleColor, setNewRoleColor] = useState('default');
    const [newRolePermissions, setNewRolePermissions] = useState('');

    const loadSettings = async () => {
        setLoading(true);
        const data = await getSystemSettings();
        if (data) {
            form.setFieldsValue({
                defaultPercent: data.settings['preorder.deposit']?.defaultPercent,
                minPercent: data.settings['preorder.deposit']?.minPercent,
                maxPercent: data.settings['preorder.deposit']?.maxPercent,
                baseMonths: data.settings['preorder.deposit']?.baseMonths,
                preorderFeeBps: data.settings['platform.commission']?.preorderFeeBps,
            });
            setRolePolicies(data.settings['site.homeLayout']?.rolePolicies || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        void loadSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onSave = async () => {
        const values = await form.validateFields();
        setSaving(true);
        const result = await updateSystemSettings({
            settings: {
                'preorder.deposit': {
                    defaultPercent: Number(values.defaultPercent),
                    minPercent: Number(values.minPercent),
                    maxPercent: Number(values.maxPercent),
                    baseMonths: Number(values.baseMonths),
                },
                'platform.commission': {
                    preorderFeeBps: Number(values.preorderFeeBps),
                },
                'site.homeLayout': {
                    sections: [],
                    rolePolicies,
                },
            },
        });
        setSaving(false);

        if (!result.success) {
            message.error(result.message);
            return;
        }
        message.success(result.message);
        await loadSettings();
    };

    const addRolePolicy = () => {
        const value = newRoleValue.trim().toUpperCase();
        const label = newRoleLabel.trim();
        const permissions = newRolePermissions
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        if (!value || !label) {
            message.error('Vui lòng nhập mã role và tên hiển thị');
            return;
        }

        const exists = rolePolicies.some((item) => item.value === value);
        if (exists) {
            message.error('Role này đã tồn tại');
            return;
        }

        setRolePolicies((prev) => [...prev, { value, label, color: newRoleColor, permissions }]);
        setNewRoleValue('');
        setNewRoleLabel('');
        setNewRoleColor('default');
        setNewRolePermissions('');
    };

    const removeRolePolicy = (value: string) => {
        setRolePolicies((prev) => prev.filter((item) => item.value !== value));
    };

    return (
        <div>
            <Title level={2}>{t('admin.settings.title')}</Title>
            <Text type="secondary">{t('admin.settings.subtitle')}</Text>

            <Card loading={loading} style={{ marginTop: 16 }}>
                <Alert
                    type="info"
                    showIcon
                    title={t('admin.settings.providerKeysNotice')}
                    style={{ marginBottom: 16 }}
                />

                <Form form={form} layout="vertical">
                    <Divider>{t('admin.settings.sections.depositRules')}</Divider>
                    <Space wrap>
                        <Form.Item
                            label={t('admin.settings.fields.defaultPercent')}
                            name="defaultPercent"
                            rules={[{ required: true, message: t('admin.settings.required') }]}
                        >
                            <InputNumber min={0.01} max={99.99} step={0.01} />
                        </Form.Item>
                        <Form.Item
                            label={t('admin.settings.fields.minPercent')}
                            name="minPercent"
                            rules={[{ required: true, message: t('admin.settings.required') }]}
                        >
                            <InputNumber min={0.01} max={99.99} step={0.01} />
                        </Form.Item>
                        <Form.Item
                            label={t('admin.settings.fields.maxPercent')}
                            name="maxPercent"
                            rules={[{ required: true, message: t('admin.settings.required') }]}
                        >
                            <InputNumber min={0.01} max={99.99} step={0.01} />
                        </Form.Item>
                        <Form.Item
                            label={t('admin.settings.fields.baseMonths')}
                            name="baseMonths"
                            rules={[{ required: true, message: t('admin.settings.required') }]}
                        >
                            <InputNumber min={1} max={120} step={1} />
                        </Form.Item>
                    </Space>

                    <Divider>{t('admin.settings.sections.platformCommission')}</Divider>
                    <Form.Item
                        label={t('admin.settings.fields.preorderFeeBps')}
                        name="preorderFeeBps"
                        extra={t('admin.settings.fields.preorderFeeHelp')}
                        rules={[{ required: true, message: t('admin.settings.required') }]}
                    >
                        <InputNumber min={0} max={10000} step={10} />
                    </Form.Item>

                    <Divider>Quản lý role policy</Divider>
                    <Alert
                        type="info"
                        showIcon
                        title="Bạn có thể thêm role mới ở đây. Role sẽ xuất hiện trong trang quản lý user và có thể dùng cho phân quyền sau này."
                        style={{ marginBottom: 16 }}
                    />

                    <Space wrap style={{ marginBottom: 16 }}>
                        <Input
                            placeholder="Mã role, ví dụ: CONTENT_MANAGER"
                            value={newRoleValue}
                            onChange={(e) => setNewRoleValue(e.target.value)}
                            style={{ width: 240 }}
                        />
                        <Input
                            placeholder="Tên hiển thị"
                            value={newRoleLabel}
                            onChange={(e) => setNewRoleLabel(e.target.value)}
                            style={{ width: 220 }}
                        />
                        <Input
                            placeholder="Màu (default, blue, red, green, orange)"
                            value={newRoleColor}
                            onChange={(e) => setNewRoleColor(e.target.value)}
                            style={{ width: 220 }}
                        />
                        <Input
                            placeholder="Permissions, cách nhau bởi dấu phẩy"
                            value={newRolePermissions}
                            onChange={(e) => setNewRolePermissions(e.target.value)}
                            style={{ width: 280 }}
                        />
                        <Button type="primary" onClick={addRolePolicy}>Thêm role</Button>
                    </Space>

                    <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 8 }}>
                        {rolePolicies.length === 0 ? (
                            <Text type="secondary">Chưa có role policy nào.</Text>
                        ) : (
                            rolePolicies.map((item) => (
                                <div
                                    key={item.value}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '8px 0',
                                        borderBottom: '1px solid #f0f0f0',
                                    }}
                                >
                                    <Space align="start">
                                        <Tag color={item.color}>{item.label}</Tag>
                                        <Text strong>{item.value}</Text>
                                        <Text type="secondary">{item.permissions.join(', ') || 'Không có permission'}</Text>
                                    </Space>
                                    <Button danger onClick={() => removeRolePolicy(item.value)}>
                                        Xóa
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>

                    <Button type="primary" onClick={() => void onSave()} loading={saving} style={{ marginTop: 16 }}>
                        {t('admin.settings.save')}
                    </Button>
                </Form>
            </Card>
        </div>
    );
}
