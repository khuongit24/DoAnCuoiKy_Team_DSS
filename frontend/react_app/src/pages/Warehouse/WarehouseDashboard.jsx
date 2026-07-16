import React, { useState, useEffect } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Row, Col, Card, Button, Modal, Form, InputNumber, Typography, List, message, Tooltip } from 'antd';
import { 
  AppstoreOutlined, 
  WarningOutlined, 
  HomeOutlined,
  EditOutlined,
  RobotOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { 
  PageHeader, 
  StatCard, 
  DataTable, 
  StatusBadge, 
  LoadingSpinner, 
  ErrorBoundary 
} from '../../components/Common';
import { ReorderAlert } from '../../components/ReorderAlert/ReorderAlert';
import CategoryPieChart from '../../components/Charts/CategoryPieChart';
import InventoryBarChart from '../../components/Charts/InventoryBarChart';
import { AIPanel } from '../../components/AIPanel/AIPanel';
import api from '../../services/api';
import styles from './WarehouseDashboard.module.css';

const { Title, Text } = Typography;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const InfoTooltip = ({ title, text }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    {title}
    <Tooltip title={text} overlayInnerStyle={{ width: '300px' }}>
      <QuestionCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
      <span style={{ fontSize: '12px', color: '#1890ff', cursor: 'pointer', fontWeight: 'normal' }}>Đây là gì?</span>
    </Tooltip>
  </span>
);

export const WarehouseDashboard = () => {
  useDocumentTitle('Warehouse');
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  // Modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [inventoryRes, alertsRes, overviewRes] = await Promise.all([
        api.get('/inventory').catch(() => ({ data: { data: [] } })),
        api.get('/inventory/alerts').catch(() => ({ data: { data: [] } })),
        api.get('/dashboard/overview').catch(() => ({ data: { data: {} } }))
      ]);

      const rawInventory = inventoryRes.data?.data || inventoryRes.data || [];
      const rawAlerts = alertsRes.data?.data || alertsRes.data || [];
      const rawOverview = overviewRes.data?.data || overviewRes.data || {};

      const mappedInventory = Array.isArray(rawInventory) ? rawInventory.map(item => ({
        id: item.id || item._id,
        productName: item.product_name || item.name || item.productName || 'Unknown Product',
        stock: item.stock_quantity || item.stock || item.currentStock || 0,
        safetyStock: item.reorder_level || item.safetyStock || item.rop || 0,
        status: item.status || 'SAFE',
        category: item.category || 'Unknown'
      })) : [];

      const mappedAlerts = Array.isArray(rawAlerts) ? rawAlerts.map(alert => ({
        id: alert.id || alert._id || Math.random(),
        message: `${alert.product_name || 'Sản phẩm'}: Tồn kho (${alert.currentStock || alert.stock || 0}) < Mức an toàn (${alert.rop || alert.safetyStock || 0})`,
        severity: alert.status || alert.severity || 'WARNING'
      })) : [];

      setOverviewData({
        totalInventory: rawOverview.currentInventory || rawOverview.totalInventory || 0,
        belowSafetyStock: rawOverview.alertsCount || rawOverview.belowSafetyStock || 0,
        activeWarehouses: rawOverview.activeWarehouses || 2,
      });

      setInventory(mappedInventory);
      setAlerts(mappedAlerts);

    } catch (error) {
      console.error('Error fetching warehouse data:', error);
      message.error('Không thể tải dữ liệu bảng điều khiển kho.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = (record) => {
    setEditingItem(record);
    form.setFieldsValue({ stock: record.stock });
    setIsModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      await api.patch(`/inventory/${editingItem.id}/stock`, {
        stock: values.stock
      });
      
      message.success('Cập nhật tồn kho thành công!');
      
      const newInventory = inventory.map(item => {
        if (item.id === editingItem.id) {
          const newStock = values.stock;
          const newStatus = newStock < item.safetyStock ? 'CRITICAL' : 'SAFE';
          return { ...item, stock: newStock, status: newStatus };
        }
        return item;
      });
      setInventory(newInventory);
      setIsModalVisible(false);
    } catch (error) {
      if (error.errorFields) {
        // Validation error
        return;
      }
      console.error('Error updating stock:', error);
      message.error('Có lỗi xảy ra khi cập nhật tồn kho.');
    }
  };

  const columns = [
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName' },
    { title: 'Tồn kho hiện tại', dataIndex: 'stock', key: 'stock' },
    { title: <InfoTooltip title="Mức An Toàn" text="Mức tồn kho tối thiểu cần duy trì để đảm bảo không bị thiếu hàng." />, dataIndex: 'safetyStock', key: 'safetyStock' },
    { 
      title: 'Trạng thái', 
      key: 'status', 
      render: (_, record) => <StatusBadge status={record.status} /> 
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          onClick={() => handleUpdateStock(record)}
          size="small"
          ghost
        >
          Cập nhật
        </Button>
      ),
    },
  ];

  // Prepare chart data
  const pieData = inventory.reduce((acc, curr) => {
    const existing = acc.find(item => item.name === curr.category);
    if (existing) {
      existing.value += curr.stock;
    } else {
      acc.push({ name: curr.category, value: curr.stock });
    }
    return acc;
  }, []);

  const barData = inventory.map(item => ({
    name: item.productName,
    'Tồn kho': item.stock,
    'Safety Stock': item.safetyStock
  })).slice(0, 5); // Only show top 5

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <ErrorBoundary>
      <div className={styles.dashboardContainer}>
        <PageHeader 
          title="Bảng Điều Khiển Quản Lý Kho" 
          description="Quản lý hàng hóa, tồn kho và cảnh báo nhập hàng"
        />

        <AIPanel
          type="dashboard"
          productId="warehouse_dashboard"
          contextData={{ overview: overviewData, alerts, inventory }}
          title="AI Phân Tích Kho Hàng"
        />

        {/* Section 1: Overview */}
        <Row gutter={[16, 16]} className={styles.section}>
          <Col xs={24} sm={8}>
            <StatCard 
              title="Tổng tồn kho" 
              value={overviewData?.totalInventory || 0} 
              icon={<AppstoreOutlined />} 
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard 
              title="Dưới mức an toàn" 
              value={overviewData?.belowSafetyStock || 0} 
              icon={<WarningOutlined />} 
              status="warning"
            />
          </Col>
          <Col xs={24} sm={8}>
            <StatCard 
              title="Kho hoạt động" 
              value={overviewData?.activeWarehouses || 0} 
              icon={<HomeOutlined />} 
            />
          </Col>
        </Row>

        {/* Section 2: Inventory Table */}
        <div className={styles.section}>
          <Card title={<InfoTooltip title="Bảng tồn kho chi tiết" text="Bảng danh sách chi tiết các mặt hàng và số lượng tồn kho hiện tại." />} bordered={false} className={styles.card}>
            <DataTable 
              columns={columns} 
              dataSource={inventory} 
              rowKey="id"
              pagination={{ pageSize: 5 }}
            />
          </Card>
        </div>

        {/* Section 3 & 4: Alerts & Charts */}
        <Row gutter={[16, 16]} className={styles.section}>
          <Col xs={24} lg={8}>
            <Card title={<InfoTooltip title="Cảnh báo tồn kho" text="Danh sách các sản phẩm đang có số lượng tồn kho dưới mức an toàn." />} bordered={false} className={styles.card} style={{ height: '100%' }}>
              <ReorderAlert alerts={alerts} />
            </Card>
          </Col>
          
          <Col xs={24} lg={16}>
            <Card title={<InfoTooltip title="Phân bổ tồn kho" text="Biểu đồ tỷ trọng tồn kho theo từng danh mục và mức độ an toàn." />} bordered={false} className={styles.card}>
              <Row>
                <Col span={12}>
                  <div style={{ height: 250 }}>
                    <CategoryPieChart data={pieData} showLabel={false} />
                  </div>
                  <div style={{ textAlign: 'center' }}><Text type="secondary">Tỷ trọng theo Category</Text></div>
                </Col>
                <Col span={12}>
                  <div style={{ height: 250 }}>
                    <InventoryBarChart 
                      data={barData} 
                      xAxisKey="name" 
                      bars={[
                        { dataKey: "Tồn kho", fill: "#3b82f6" },
                        { dataKey: "Safety Stock", fill: "#faad14" }
                      ]}
                    />
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Update Stock Modal */}
        <Modal 
          title={`Cập nhật tồn kho: ${editingItem?.productName}`}
          open={isModalVisible} 
          onOk={handleModalOk} 
          onCancel={() => setIsModalVisible(false)}
        >
          <Form form={form} layout="vertical">
            <Form.Item 
              name="stock" 
              label="Số lượng tồn kho mới"
              rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </ErrorBoundary>
  );
};


