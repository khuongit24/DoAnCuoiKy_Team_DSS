import React, { useState, useEffect } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Card, Button, Space, message, Tag, Switch, Modal, Form, Input, InputNumber, Popconfirm, Dropdown } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PageHeader } from '../../components/Common/PageHeader';
import { DataTable } from '../../components/Common/DataTable';
import { dataService } from '../../services/dataService';
import api from '../../services/api';

export const SuppliersPage = () => {
  useDocumentTitle('Suppliers');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchSuppliers = async (page = 1) => {
    setLoading(true);
    try {
      const response = await dataService.getAll('suppliers', { page, limit: pagination.pageSize });
      if (response && response.success) {
        setData(response.data);
        setPagination({ ...pagination, current: page, total: response.meta?.total || 0 });
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu nhà cung cấp');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleOpenModal = (supplier = null) => {
    setEditingSupplier(supplier);
    if (supplier) {
      form.setFieldsValue(supplier);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingSupplier(null);
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    try {
      if (editingSupplier) {
        await dataService.update('suppliers', editingSupplier.id, values);
        message.success('Cập nhật nhà cung cấp thành công');
      } else {
        await dataService.create('suppliers', values);
        message.success('Thêm nhà cung cấp thành công');
      }
      handleCloseModal();
      fetchSuppliers(pagination.current);
    } catch (error) {
      message.error(editingSupplier ? 'Cập nhật thất bại' : 'Thêm mới thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dataService.delete('suppliers', id);
      message.success('Xóa nhà cung cấp thành công');
      fetchSuppliers(pagination.current);
    } catch (error) {
      message.error('Xóa nhà cung cấp thất bại');
    }
  };

  const handleToggleStatus = async (id, checked) => {
    try {
      await api.put(`/suppliers/${id}/status`, { is_active: checked });
      message.success('Cập nhật trạng thái thành công');
      fetchSuppliers(pagination.current);
    } catch (error) {
      message.error('Cập nhật trạng thái thất bại');
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await api.get('/suppliers', {
        params: { export: 'json' },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `suppliers_${new Date().getTime()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error('Lỗi khi xuất file JSON');
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Danh Sach Nha Cung Cap", 14, 15);
      
      const tableColumn = ["Ten San Pham", "Ten Nha Cung Cap", "Gia", "Thoi Gian Giao (Ngay)", "Ty Le Loi (%)", "Trang Thai"];
      const tableRows = [];

      data.forEach(item => {
        const rowData = [
          item.product_name || item.product_id,
          item.supplier_name || 'Unknown',
          `${Number(item.price).toLocaleString()} d`,
          item.lead_time,
          `${(item.defect_rate * 100).toFixed(2)}%`,
          item.is_active ? 'Active' : 'Inactive'
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });
      
      doc.save(`suppliers_${new Date().getTime()}.pdf`);
      message.success('Xuất file PDF thành công');
    } catch (error) {
      message.error('Lỗi khi xuất file PDF');
    }
  };

  const exportMenuItems = [
    {
      key: '1',
      label: 'Xuất JSON (Backup)',
      icon: <FileTextOutlined />,
      onClick: handleExportJSON,
    },
    {
      key: '2',
      label: 'Xuất PDF (Báo cáo)',
      icon: <FilePdfOutlined />,
      onClick: handleExportPDF,
    },
  ];

  const columns = [
    { title: 'Tên Sản Phẩm', key: 'product_id', render: (_, record) => record.product_name || record.product_id },
    { title: 'Tên Nhà Cung Cấp', key: 'supplier_name', render: (_, record) => record.supplier_name || 'Unknown' },
    { title: 'Giá', dataIndex: 'price', key: 'price', render: (val) => val != null ? `${Number(val).toLocaleString()} đ` : '-' },
    { title: 'Thời Gian Giao (Ngày)', dataIndex: 'lead_time', key: 'lead_time' },
    { title: 'Tỷ Lệ Lỗi (%)', dataIndex: 'defect_rate', key: 'defect_rate' },
    { title: 'Trạng Thái', dataIndex: 'is_active', key: 'is_active', render: (active, record) => (
      <Switch 
        checked={active} 
        checkedChildren="Active" 
        unCheckedChildren="Inactive" 
        onChange={(checked) => handleToggleStatus(record.id, checked)}
      />
    )},
    { title: 'Hành Động', key: 'action', render: (_, record) => (
      <Space size="middle">
        <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>Sửa</Button>
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa nhà cung cấp này?"
          onConfirm={() => handleDelete(record.id)}
          okText="Có"
          cancelText="Không"
        >
          <Button type="link" danger icon={<DeleteOutlined />}>Xóa</Button>
        </Popconfirm>
      </Space>
    )}
  ];

  return (
    <div>
      <PageHeader
        title="Quản Lý Nhà Cung Cấp"
        breadcrumbs={[{ title: 'Trang chủ', path: '/' }, { title: 'Dữ liệu' }, { title: 'Nhà cung cấp' }]}
      />
      <Card style={{ marginTop: 24, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Space>
            <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
              <Button icon={<DownloadOutlined />}>Xuất dữ liệu</Button>
            </Dropdown>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>Thêm Nhà Cung Cấp</Button>
          </Space>
        </div>
        <DataTable
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={pagination}
          onChange={(pagination) => fetchSuppliers(pagination.current)}
        />
      </Card>

      <Modal
        title={editingSupplier ? "Sửa Nhà Cung Cấp" : "Thêm Nhà Cung Cấp"}
        open={isModalVisible}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Tên Nhà Cung Cấp" rules={[{ required: true, message: 'Vui lòng nhập tên nhà cung cấp' }]}>
            <Input placeholder="Nhập tên" />
          </Form.Item>
          <Form.Item name="rating" label="Đánh Giá (0-5)">
            <InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="lead_time_days" label="Lead Time (Ngày)" rules={[{ required: true, message: 'Vui lòng nhập thời gian chờ' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="defect_rate" label="Tỷ Lệ Lỗi (%)">
            <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};


