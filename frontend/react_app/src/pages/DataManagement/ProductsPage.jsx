import React, { useState, useEffect } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Card, Button, Input, Select, Space, message, Tag, Modal, Form, Popconfirm, Upload, Dropdown } from 'antd';
import { PlusOutlined, UploadOutlined, DownloadOutlined, EditOutlined, DeleteOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PageHeader } from '../../components/Common/PageHeader';
import { DataTable } from '../../components/Common/DataTable';
import { dataService } from '../../services/dataService';
import api from '../../services/api';

const { Search } = Input;
const { Option } = Select;

export const ProductsPage = () => {
  useDocumentTitle('Products');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [search, setSearch] = useState('');
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const response = await dataService.getAll('products', {
        page,
        limit: pagination.pageSize,
        search,
        ...filters
      });
      if (response && response.success) {
        setData(response.data);
        setPagination({ ...pagination, current: page, total: response.meta?.total || 0 });
      }
    } catch (error) {
      message.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters, search]);

  const handleTableChange = (pagination) => {
    fetchProducts(pagination.current);
  };

  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    if (product) {
      form.setFieldsValue(product);
    } else {
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingProduct(null);
  };

  const handleSave = async (values) => {
    setSubmitting(true);
    try {
      if (editingProduct) {
        await dataService.update('products', editingProduct.product_id, values);
        message.success('Cập nhật sản phẩm thành công');
      } else {
        await dataService.create('products', values);
        message.success('Thêm sản phẩm thành công');
      }
      handleCloseModal();
      fetchProducts(pagination.current);
    } catch (error) {
      message.error(editingProduct ? 'Cập nhật thất bại' : 'Thêm mới thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dataService.delete('products', id);
      message.success('Xóa sản phẩm thành công');
      fetchProducts(pagination.current);
    } catch (error) {
      message.error('Xóa sản phẩm thất bại');
    }
  };

  const handleExportJSON = async () => {
    try {
      const response = await api.get('/products', {
        params: { export: 'json', search, ...filters },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products_${new Date().getTime()}.json`);
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
      doc.text("Danh Sach San Pham", 14, 15);
      
      const tableColumn = ["Ten San Pham", "Phan Loai", "Thuong Hieu", "Vong Doi", "Ten Nha Cung Cap"];
      const tableRows = [];

      data.forEach(item => {
        const rowData = [
          item.product_name || item.product_id,
          item.category,
          item.brand,
          item.lifecycle_stage,
          item.supplier_name || 'Unknown'
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
      });
      
      doc.save(`products_${new Date().getTime()}.pdf`);
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

  const importUploadProps = {
    customRequest: async ({ file, onSuccess, onError }) => {
      try {
        await dataService.importJSON('products', file);
        message.success('Import file JSON thành công');
        onSuccess("ok");
        fetchProducts(pagination.current);
      } catch (error) {
        message.error('Import file JSON thất bại');
        onError(error);
      }
    },
    showUploadList: false,
    accept: ".json"
  };

  const columns = [
    { title: 'Tên Sản Phẩm', key: 'product_id', render: (_, record) => record.product_name || record.product_id },
    { title: 'Phân Loại', dataIndex: 'category', key: 'category' },
    { title: 'Thương Hiệu', dataIndex: 'brand', key: 'brand' },
    { title: 'Vòng Đời', dataIndex: 'lifecycle_stage', key: 'lifecycle_stage', render: stage => (
      <Tag color={stage === 'introduction' ? 'blue' : stage === 'growth' ? 'green' : stage === 'maturity' ? 'orange' : 'red'}>
        {stage.toUpperCase()}
      </Tag>
    )},
    { title: 'Tên Nhà Cung Cấp', dataIndex: 'supplier_name', key: 'supplier_name', render: (val) => val || 'Unknown' },
    { title: 'Hành Động', key: 'action', render: (_, record) => (
      <Space size="middle">
        <Button type="link" icon={<EditOutlined />} onClick={() => handleOpenModal(record)}>Sửa</Button>
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa sản phẩm này?"
          onConfirm={() => handleDelete(record.product_id)}
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
        title="Quản Lý Sản Phẩm"
        breadcrumbs={[
          { title: 'Trang chủ', path: '/' },
          { title: 'Dữ liệu', path: '/data/products' },
          { title: 'Sản phẩm' }
        ]}
      />
      <Card style={{ marginTop: 24, borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space>
            <Search
              placeholder="Tìm kiếm sản phẩm..."
              allowClear
              onSearch={(val) => setSearch(val)}
              style={{ width: 250 }}
            />
            <Select 
              placeholder="Lọc theo danh mục" 
              allowClear 
              style={{ width: 150 }}
              onChange={(val) => setFilters({ ...filters, category: val })}
            >
              <Option value="CPU">Vi xử lý (CPU)</Option>
              <Option value="GPU">Card đồ họa (GPU)</Option>
              <Option value="RAM">Bộ nhớ (RAM)</Option>
              <Option value="Motherboard">Bo mạch chủ</Option>
              <Option value="Storage">Lưu trữ</Option>
              <Option value="PSU">Nguồn</Option>
              <Option value="Case">Vỏ máy</Option>
              <Option value="Cooling">Tản nhiệt</Option>
              <Option value="Laptop">Máy tính xách tay</Option>
              <Option value="Peripherals">Ngoại vi</Option>
              <Option value="Monitor">Màn hình</Option>
              <Option value="Audio">Âm thanh</Option>
            </Select>
          </Space>
          <Space>
            <Upload {...importUploadProps}>
              <Button icon={<UploadOutlined />}>Nhập tệp JSON</Button>
            </Upload>
            <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
              <Button icon={<DownloadOutlined />}>Xuất dữ liệu</Button>
            </Dropdown>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>Thêm Mới</Button>
          </Space>
        </div>
        <DataTable
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingProduct ? "Sửa Sản Phẩm" : "Thêm Sản Phẩm"}
        open={isModalVisible}
        onCancel={handleCloseModal}
        onOk={() => form.submit()}
        confirmLoading={submitting}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="product_name" label="Tên Sản Phẩm" rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}>
            <Input placeholder="Nhập tên sản phẩm" />
          </Form.Item>
          <Form.Item name="category" label="Danh Mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}>
            <Select placeholder="Chọn danh mục">
              <Option value="CPU">Vi xử lý (CPU)</Option>
              <Option value="GPU">Card đồ họa (GPU)</Option>
              <Option value="RAM">Bộ nhớ (RAM)</Option>
              <Option value="Motherboard">Bo mạch chủ</Option>
              <Option value="Storage">Lưu trữ</Option>
              <Option value="PSU">Nguồn</Option>
              <Option value="Case">Vỏ máy</Option>
              <Option value="Cooling">Tản nhiệt</Option>
              <Option value="Laptop">Máy tính xách tay</Option>
              <Option value="Peripherals">Ngoại vi</Option>
              <Option value="Monitor">Màn hình</Option>
              <Option value="Audio">Âm thanh</Option>
            </Select>
          </Form.Item>
          <Form.Item name="brand" label="Thương Hiệu" rules={[{ required: true, message: 'Vui lòng nhập thương hiệu' }]}>
            <Input placeholder="Nhập thương hiệu" />
          </Form.Item>
          <Form.Item name="lifecycle_stage" label="Vòng Đời" rules={[{ required: true, message: 'Vui lòng chọn vòng đời' }]}>
            <Select placeholder="Chọn vòng đời">
              <Option value="growth">Phát triển</Option>
              <Option value="maturity">Bão hòa</Option>
              <Option value="decline">Suy thoái</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};


