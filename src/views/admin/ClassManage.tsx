import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Modal, Form, Input, Space, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../../utils/request';

const ClassManage: React.FC = () => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [editingId, setEditingId] = useState<number | null>(null);

    useEffect(() => { fetchClasses(); }, []);

    const fetchClasses = async () => {
        setLoading(true);
        try {
            const res: any = await api.get('/api/admin-manage/classes/');
            setClasses(res.results || res);
        } finally { setLoading(false); }
    };

    const handleAddOrEdit = async (values: any) => {
        try {
            if (editingId) {
                await api.put(`/api/admin-manage/classes/${editingId}/`, values);
                message.success('更新成功');
            } else {
                await api.post('/api/admin-manage/classes/', values);
                message.success('创建成功');
            }
            setIsModalOpen(false);
            fetchClasses();
        } catch (e) { message.error('操作失败'); }
    };

    const columns = [
        { title: '班级名称', dataIndex: 'name', key: 'name' },
        { title: '班级代码', dataIndex: 'code', key: 'code' },
        { title: '创建时间', dataIndex: 'create_time', key: 'create_time' },
        {
            title: '操作',
            render: (_: any, record: any) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => {
                        setEditingId(record.id);
                        form.setFieldsValue(record);
                        setIsModalOpen(true);
                    }}>编辑</Button>
                    <Popconfirm title="确定删除吗？" onConfirm={() => api.delete(`/api/admin-manage/classes/${record.id}/`).then(fetchClasses)}>
                        <Button danger icon={<DeleteOutlined />}>删除</Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Card title="班级架构管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}>新建班级</Button>}>
            <Table columns={columns} dataSource={classes} rowKey="id" loading={loading} />
            <Modal title={editingId ? "编辑班级" : "新建班级"} open={isModalOpen} onOk={() => form.submit()} onCancel={() => setIsModalOpen(false)}>
                <Form form={form} layout="vertical" onFinish={handleAddOrEdit}>
                    <Form.Item name="name" label="班级名称" rules={[{ required: true }]}><Input placeholder="如：六年级1班" /></Form.Item>
                    <Form.Item name="code" label="班级代码"><Input placeholder="选填，如：2026-01" /></Form.Item>
                </Form>
            </Modal>
        </Card>
    );
};

export default ClassManage;