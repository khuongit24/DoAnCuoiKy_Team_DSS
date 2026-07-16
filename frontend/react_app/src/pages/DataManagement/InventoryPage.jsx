import React, { useState, useEffect } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Card, Button, Space, message, Tag, Modal, Form, InputNumber, Dropdown } from 'antd';
import { EditOutlined, DownloadOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PageHeader } from '../../components/Common/PageHeader';
import { DataTable } from '../../components/Common/DataTable';
import { dataService } from '../../services/dataService';
import api from '../../services/api';

export const InventoryPage = () => {
  useDocumentTitle('Inventory');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async (page = 1) => {
    setLoading(true);
    try {
      const response = await dataService.getAll('inventory', { page, limit: pagination.pageSize });
      if (response && response.success) {
        setData(response.data);
        setPagination({ ...pagination, current: page, total: response.meta?.total || 0 });
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu tồn kho');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleOpenModal = (record) => {
    setEditingInventory(record);
    form.setFieldsValue({
      current_stock: record.current_stock,
      safety_stock: record.safety_stock
    });
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingInventory(null);
  };

  const handleUpdateStock = async (values) => {
    setSubmitting(true);
    try {
      await api.patch(`/inventory/${editingInventory.id}/stock`, values);
      message.success('Cập nhật tồn kho thành công');
      handleCloseModal();
      fetchInventory(pagination.current);
    } catch (error) {
      message.error('Cập nhật tồn kho thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await api.get('/inventory', {
        params: { export: 'json', search },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_${new Date().getTime()}.json`);
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
      doc.text("Bao Cao Ton Kho", 14, 15);
      
      const tableColumn = ["Ten San Pham", "Ton Kho Hien Tai", "Ton Kho An Toan", "Kho Chua", "Trang Thai", "Ten Nha Cung Cap"];
      const tableRows = [];

      data.forEach(item => {
        const isCritical = item.stock_quantity < item.safety_stock;
        const rowData = [
          item.product_name || item.product_id,
          item.stock_quantity,
          item.safety_stock,
          item.warehouse_id,
          isCritical ? 'CANH BAO' : 'AN TOAN',
          item.supplier_name || 'Unknown'
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });
      
      doc.save(`inventory_${new Date().getTime()}.pdf`);
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
    { title: 'Tên Nhà Cung Cấp', dataIndex: 'supplier_name', key: 'supplier_name', render: (val) => val || 'Unknown' },
    { title: 'Số Lượng Tồn', dataIndex: 'stock_quantity', key: 'stock_quantity' },
    { title: 'Tồn Kho An Toàn', dataIndex: 'safety_stock', key: 'safety_stock' },
    { title: 'Kho Chứa', dataIndex: 'warehouse_id', key: 'warehouse_id' },
    { title: 'Trạng Thái', key: 'status', render: (_, record) => {
      const isCritical = record.stock_quantity < record.safety_stock;
      return <Tag color={isCritical ? 'red' : 'green'}>{isCritical ? 'CẢNH BÁO' : 'AN TOÀN'}</Tag>;
    }},
    { title: 'Hành Động', key: 'action', render: (_, record) => (
      <Space size="middle">
        <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>Sửa</Button>
      </Space>
    )}
  ];

  return (
    <div>
      <PageHeader
        title="Quản Lý Tồn Kho"
        breadcrumbs={[{ title: 'Trang chủ', path: '/' }, { title: 'Dữ liệu' }, { title: 'Tồn kho' }]}
      />
      <Card style={{ marginTop: 24, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
          <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
            <Button icon={<DownloadOutlined />}>Xuất dữ liệu</Button>
          </Dropdown>
        </div>
        <DataTable
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={pagination}
          onChange={(pagination) => fetchInventory(pagination.current)}
        />
      </Card>

      <Modal
        title="Cập Nhật Tồn Kho"
        open={isModalVisible}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateStock}>
          <Form.Item name="current_stock" label="Tồn Kho Hiện Tại" rules={[{ required: true, message: 'Vui lòng nhập tồn kho hiện tại' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="safety_stock" label="Tồn Kho An Toàn" rules={[{ required: true, message: 'Vui lòng nhập tồn kho an toàn' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};


