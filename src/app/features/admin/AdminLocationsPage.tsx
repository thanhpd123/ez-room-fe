import { useEffect, useState } from 'react';
import {
    Table,
    Card,
    Button,
    Space,
    Typography,
    Modal,
    Form,
    Input,
    Select,
    message,
    Popconfirm,
    Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import {
    getLocations,
    getCities,
    createLocation,
    updateLocation,
    deleteLocation,
    type Location,
} from './shared/admin-api';

const { Title } = Typography;
const { Option } = Select;

export function AdminLocationsPage() {
    const [locations, setLocations] = useState<Location[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [cityFilter, setCityFilter] = useState<string | undefined>();

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<Location | null>(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [form] = Form.useForm();

    // Load cities once on mount
    useEffect(() => {
        let cancelled = false;
        const fetchCities = async () => {
            const data = await getCities();
            if (!cancelled) {
                setCities(data);
            }
        };
        fetchCities();
        return () => { cancelled = true; };
    }, []);

    // Load locations when cityFilter changes
    useEffect(() => {
        let cancelled = false;
        const fetchLocations = async () => {
            setLoading(true);
            const data = await getLocations(cityFilter);
            if (!cancelled) {
                setLocations(data);
                setLoading(false);
            }
        };
        fetchLocations();
        return () => { cancelled = true; };
    }, [cityFilter]);

    const loadLocations = async () => {
        setLoading(true);
        const data = await getLocations(cityFilter);
        setLocations(data);
        setLoading(false);
    };

    const loadCities = async () => {
        const data = await getCities();
        setCities(data);
    };

    const openCreateModal = () => {
        setEditingLocation(null);
        form.resetFields();
        setModalOpen(true);
    };

    const openEditModal = (location: Location) => {
        setEditingLocation(location);
        form.setFieldsValue({
            city: location.city,
            district: location.district,
            address: location.address,
        });
        setModalOpen(true);
    };

    const handleSubmit = async (values: { city?: string; district?: string; address: string }) => {
        setModalLoading(true);
        let result;

        if (editingLocation) {
            result = await updateLocation(editingLocation.id, values);
        } else {
            result = await createLocation(values);
        }

        setModalLoading(false);

        if (result.success) {
            message.success(result.message);
            setModalOpen(false);
            loadLocations();
            loadCities(); // Refresh cities list
        } else {
            message.error(result.message);
        }
    };

    const handleDelete = async (location: Location) => {
        const result = await deleteLocation(location.id);
        if (result.success) {
            message.success(result.message);
            loadLocations();
            loadCities();
        } else {
            message.error(result.message);
        }
    };

    const columns: ColumnsType<Location> = [
        {
            title: 'Thành phố',
            dataIndex: 'city',
            key: 'city',
            render: (city) => city ? <Tag color="blue">{city}</Tag> : '-',
        },
        {
            title: 'Quận/Huyện',
            dataIndex: 'district',
            key: 'district',
            render: (district) => district ? <Tag color="green">{district}</Tag> : '-',
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            key: 'address',
            render: (address) => address || '-',
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                        title="Sửa"
                    />
                    <Popconfirm
                        title="Xóa địa điểm này?"
                        description={`Bạn có chắc muốn xóa "${record.city} - ${record.district}"?`}
                        onConfirm={() => handleDelete(record)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                    >
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            title="Xóa"
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={2} style={{ margin: 0 }}>Quản lý Địa điểm</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
                    Thêm địa điểm
                </Button>
            </div>

            {/* Filter */}
            <Card style={{ marginBottom: 16 }}>
                <Space>
                    <span>Lọc theo thành phố:</span>
                    <Select
                        placeholder="Tất cả thành phố"
                        value={cityFilter}
                        onChange={setCityFilter}
                        style={{ width: 200 }}
                        allowClear
                    >
                        {cities.map((city) => (
                            <Option key={city} value={city}>
                                {city}
                            </Option>
                        ))}
                    </Select>
                </Space>
            </Card>

            <Card>
                <Table
                    columns={columns}
                    dataSource={locations}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Tổng ${total} địa điểm`,
                    }}
                />
            </Card>

            {/* Create/Edit Modal */}
            <Modal
                title={editingLocation ? 'Sửa địa điểm' : 'Thêm địa điểm mới'}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    style={{ marginTop: 16 }}
                >
                    <Form.Item
                        name="address"
                        label="Địa chỉ chi tiết"
                        rules={[{ required: true, message: 'Vui lòng nhập địa chỉ' }]}
                    >
                        <Input placeholder="VD: 123 Nguyễn Huệ, Phường Bến Nghé..." />
                    </Form.Item>

                    <Form.Item
                        name="city"
                        label="Thành phố (tùy chọn)"
                    >
                        <Input placeholder="VD: Hồ Chí Minh, Hà Nội..." />
                    </Form.Item>

                    <Form.Item
                        name="district"
                        label="Quận/Huyện (tùy chọn)"
                    >
                        <Input placeholder="VD: Quận 1, Thủ Đức..." />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={() => setModalOpen(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={modalLoading}>
                                {editingLocation ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
