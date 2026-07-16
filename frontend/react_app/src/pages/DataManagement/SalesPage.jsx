import React, { useState, useEffect } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Card, Button, Space, message, DatePicker, Modal, Form, InputNumber, Upload, Input, Dropdown, Popconfirm } from 'antd';
import { PlusOutlined, UploadOutlined, DownloadOutlined, FilePdfOutlined, FileTextOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PageHeader } from '../../components/Common/PageHeader';
import { DataTable } from '../../components/Common/DataTable';
import { dataService } from '../../services/dataService';

const { RangePicker } = DatePicker;

export const SalesPage = () => {
  useDocumentTitle('Sales');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  const [dateRange, setDateRange] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchSales = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.pageSize };
      if (dateRange && dateRange.length === 2) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await dataService.getAll('sales', params);
      if (response && response.success) {
        setData(response.data);
        setPagination({ ...pagination, current: page, total: response.meta?.total || 0 });
      }
    } catch (error) {
      message.error('Không thể tải dữ liệu bán hàng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [dateRange]);

  const handleOpenModal = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    try {
      // API expects date in YYYY-MM-DD string format if required, we can map date field from datepicker
      const payload = {
        ...values,
        date: values.date ? values.date.format('YYYY-MM-DD') : new Date().toISOString().split('T')[0]
      };
      await dataService.create('sales', payload);
      message.success('Ghi nhận doanh số thành công');
      handleCloseModal();
      fetchSales(pagination.current);
    } catch (error) {
      message.error('Ghi nhận doanh số thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const importUploadProps = {
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        await dataService.importJSON('sales', file);
        message.success('Import file JSON thành công');
        onSuccess("ok");
        fetchSales(pagination.current);
      } catch (error) {
        message.error('Import file JSON thất bại');
        onError(error);
      }
    },
    showUploadList: false,
    accept: ".json"
  };

  const handleExportJSON = async () => {
    try {
      const params = { export: 'json' };
      if (dateRange && dateRange.length === 2) {
        params.start_date = dateRange[0].format('YYYY-MM-DD');
        params.end_date = dateRange[1].format('YYYY-MM-DD');
      }
      const response = await api.get('/sales', {
        params,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_${new Date().getTime()}.json`);
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
      doc.text("Bao Cao Doanh So", 14, 15);
      
      const tableColumn = ["Ten San Pham", "Ngay Ban", "So Luong", "Doanh Thu", "Ten Nha Cung Cap"];
      const tableRows = [];

      data.forEach(item => {
        const rowData = [
          item.product_name || item.product_id,
          new Date(item.sale_date).toLocaleDateString('vi-VN'),
          item.quantity_sold,
          `${Number(item.revenue).toLocaleString()} d`,
          item.supplier_name || 'Unknown'
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });
      
      doc.save(`sales_${new Date().getTime()}.pdf`);
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
    { title: 'Ngày Bán', dataIndex: 'sale_date', key: 'sale_date', render: (date) => new Date(date).toLocaleDateString('vi-VN') },
    { title: 'Số Lượng', dataIndex: 'quantity_sold', key: 'quantity_sold' },
    { title: 'Doanh Thu', dataIndex: 'revenue', key: 'revenue', render: (val) => `${Number(val).toLocaleString()} đ` },
    { title: 'Hành Động', key: 'action', render: (_, record) => (
      <Space size="middle">
        <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>Sửa</Button>
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa bản ghi này?"
          onConfirm={() => {/* handleDelete(record.sales_id) */}}
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
        title="Quản Lý Doanh Số"
        breadcrumbs={[{ title: 'Trang chủ', path: '/' }, { title: 'Dữ liệu' }, { title: 'Doanh số' }]}
      />
      <Card style={{ marginTop: 24, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <RangePicker 
            style={{ width: 300 }} 
            onChange={(dates) => setDateRange(dates)}
          />
          <Space>
            <Upload {...importUploadProps}>
              <Button icon={<UploadOutlined />}>Nhập tệp JSON</Button>
            </Upload>
            <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
              <Button icon={<DownloadOutlined />}>Xuất dữ liệu</Button>
            </Dropdown>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenModal}>Ghi Nhận Mới</Button>
          </Space>
        </div>
        <DataTable
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={pagination}
          onChange={(pagination) => fetchSales(pagination.current)}
        />
      </Card>

      <Modal
        title="Ghi Nhận Doanh Số"
        open={isModalVisible}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="product_id" label="Sản Phẩm ID" rules={[{ required: true, message: 'Vui lòng nhập ID sản phẩm' }]}>
            <Input placeholder="Ví dụ: PRD001" />
          </Form.Item>
          <Form.Item name="date" label="Ngày Bán" rules={[{ required: true, message: 'Vui lòng chọn ngày bán' }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="quantity" label="Số Lượng" rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="unit_price" label="Đơn Giá" rules={[{ required: true, message: 'Vui lòng nhập đơn giá' }]}>
            <InputNumber style={{ width: '100%' }} min={0} step={1000} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};


