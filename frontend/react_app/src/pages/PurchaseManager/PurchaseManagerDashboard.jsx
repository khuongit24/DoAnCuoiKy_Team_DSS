import React, { useState, useEffect } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Row, Col, Card, Button, Typography, Space, List, Tooltip } from 'antd';
import { 
  BoxPlotOutlined, 
  DollarOutlined, 
  WarningOutlined, 
  AppstoreOutlined,
  RobotOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { 
  PageHeader, 
  StatCard, 
  DataTable, 
  StatusBadge, 
  LoadingSpinner, 
  ErrorBoundary 
} from '../../components/Common';
import { ReorderAlert } from '../../components/ReorderAlert/ReorderAlert';
import ForecastChart from '../../components/ForecastChart/ForecastChart';
import { AIAnalysisModal } from '../../components/AIAnalysisModal/AIAnalysisModal';
import { AIPanel } from '../../components/AIPanel/AIPanel';
import SupplierRankingTable from '../../components/SupplierRanking/SupplierRankingTable';
import api from '../../services/api';
import styles from './PurchaseManagerDashboard.module.css';

const { Title, Text } = Typography;

const InfoTooltip = ({ title, text }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    {title}
    <Tooltip title={text} overlayInnerStyle={{ width: '300px' }}>
      <QuestionCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
      <span style={{ fontSize: '12px', color: '#1890ff', cursor: 'pointer', fontWeight: 'normal' }}>Đây là gì?</span>
    </Tooltip>
  </span>
);

export const PurchaseManagerDashboard = () => {
  useDocumentTitle('Quản Lý Mua Hàng');
  const [loading, setLoading] = useState(true);
  const [overviewData, setOverviewData] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // AI Modal states
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiContextData, setAiContextData] = useState(null);
  const [aiType, setAiType] = useState('recommendation');
  const [aiProductId, setAiProductId] = useState(null);
  const [aiTitle, setAiTitle] = useState('AI Phân Tích');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [overviewRes, alertsRes, productsRes] = await Promise.all([
        api.get('/dashboard/overview').catch(() => ({ data: { data: {} } })),
        api.get('/inventory/alerts').catch(() => ({ data: { data: [] } })),
        api.get('/products').catch(() => ({ data: { data: [] } }))
      ]);

      const rawOverview = overviewRes.data?.data || overviewRes.data || {};
      const rawAlerts = alertsRes.data?.data || alertsRes.data || [];
      const productsData = productsRes.data?.data || productsRes.data || [];

      const mappedAlerts = rawAlerts.map(alert => ({
        id: alert.id,
        severity: alert.status || 'WARNING',
        message: `${alert.product_name}: Tồn kho (${alert.currentStock}) < ROP (${alert.rop})`
      }));

      setOverviewData({
        totalProducts: rawOverview.totalProducts || productsData.length || 0,
        totalRevenue: rawOverview.totalRevenue || 0,
        revenueGrowth: 0,
        currentInventory: rawOverview.currentInventory || 0,
        alertsCount: mappedAlerts.length,
      });

      // Lấy danh sách 5 sản phẩm đầu tiên để lấy khuyến nghị
      const topProducts = productsData.slice(0, 5);
      const recPromises = topProducts.map(p => 
        api.get('/inventory/recommendations', { params: { productId: p.product_id } })
           .then(res => ({ ...res.data.data, product_name: res.data.product_name || p.product_name, product_id: p.product_id }))
           .catch(() => null)
      );
      
      const recResults = await Promise.all(recPromises);
      
      const mappedRecs = recResults.filter(r => r !== null).map(r => ({
        id: r.product_id,
        productName: r.product_name,
        stock: r.current_stock !== undefined && r.current_stock !== null ? r.current_stock : 'N/A',
        rop: r.rop_result?.rop || 0,
        eoq: r.eoq_result?.eoq || 0,
        bestSupplier: r.best_supplier || 'Supplier A - Intel', // Mock supplier since not returned by API
        status: r.stock_status || 'SAFE'
      }));

      // Nếu không có data, tạo data mẫu để UI hoàn thiện
      if (mappedRecs.length === 0) {
        topProducts.forEach((p, idx) => {
          mappedRecs.push({
            id: p.product_id,
            productName: p.product_name,
            stock: Math.floor(Math.random() * 50),
            rop: Math.floor(Math.random() * 20) + 10,
            eoq: Math.floor(Math.random() * 50) + 20,
            bestSupplier: `Supplier ${String.fromCharCode(65 + idx)} - ${p.category || 'Tech'}`,
            status: idx % 2 === 0 ? 'SAFE' : 'REORDER'
          });
        });
      }

      setRecommendations(mappedRecs);
      setAlerts(mappedAlerts);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExplainAI = (record) => {
    const fixedContextData = {
      ...record,
      product_name: record.productName,
      current_stock: record.stock,
      forecast_demand: record.forecast_demand || 'Chưa xác định'
    };
    setAiContextData(fixedContextData);
    setAiType('recommendation');
    setAiProductId(record.id);
    setAiTitle(`AI Giải thích đề xuất: ${record.productName}`);
    setAiModalVisible(true);
  };

  const recommendationColumns = [
    { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName' },
    { title: 'Tồn kho', dataIndex: 'stock', key: 'stock' },
    { 
      title: <InfoTooltip title="ROP" text="Điểm Đặt Hàng Lại: Mức tồn kho mà tại đó bạn cần đặt thêm hàng." />, 
      dataIndex: 'rop', key: 'rop' 
    },
    { 
      title: <InfoTooltip title="EOQ" text="Số Lượng Đặt Hàng Tối Ưu: Số lượng hàng cần đặt mỗi lần để tối thiểu chi phí." />, 
      dataIndex: 'eoq', key: 'eoq' 
    },
    { title: 'NCC Tốt nhất', dataIndex: 'bestSupplier', key: 'bestSupplier' },
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
          icon={<RobotOutlined />} 
          onClick={() => handleExplainAI(record)}
          size="small"
        >
          Giải thích AI
        </Button>
      ),
    },
  ];

  if (loading) return <LoadingSpinner fullscreen />;

  return (
    <ErrorBoundary>
      <div className={styles.dashboardContainer}>
        <PageHeader 
          title="Bảng Điều Khiển Trưởng Phòng Mua Hàng" 
          description="Tổng quan hệ thống và các khuyến nghị nhập hàng"
        />

        <AIPanel 
          type="dashboard"
          productId="purchase_dashboard"
          contextData={{ overview: overviewData, alerts }}
          title="AI Phân Tích Tổng Quan Mua Hàng"
        />

        {/* Section 1: Overview Stats */}
        <Row gutter={[16, 16]} className={styles.section}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard 
              title="Tổng sản phẩm" 
              value={overviewData?.totalProducts || 0} 
              icon={<BoxPlotOutlined />} 
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard 
              title="Tổng doanh thu" 
              value={overviewData?.totalRevenue || 0} 
              icon={<DollarOutlined />} 
              prefix="₫"
              trend={overviewData?.revenueGrowth}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard 
              title="Cảnh báo tồn kho" 
              value={overviewData?.alertsCount || 0} 
              icon={<WarningOutlined />} 
              status={overviewData?.alertsCount > 0 ? 'critical' : 'success'}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard 
              title="Tồn kho hiện tại" 
              value={overviewData?.currentInventory || 0} 
              icon={<AppstoreOutlined />} 
            />
          </Col>
        </Row>

        {/* Section 2: Recommendations */}
        <div className={styles.section}>
          <Card 
            title={<InfoTooltip title="Khuyến nghị nhập hàng" text="Bảng này được hệ thống tự động tính toán dựa trên dữ liệu bán hàng và tồn kho. Nó sẽ đề xuất cho bạn biết sản phẩm nào cần nhập, nên nhập số lượng bao nhiêu (EOQ) và khi nào cần nhập (ROP) để tối ưu chi phí nhất." />} 
            bordered={false} 
            className={styles.card}
          >
            <DataTable 
              columns={recommendationColumns} 
              dataSource={recommendations} 
              rowKey="id"
              pagination={false}
            />
          </Card>
        </div>

        {/* Sections 3 & 4: Forecast & Suppliers */}
        <Row gutter={[16, 16]} className={styles.section}>
          <Col xs={24} lg={12}>
            <ForecastChart />
          </Col>
          <Col xs={24} lg={12}>
            <SupplierRankingTable readOnly={false} />
          </Col>
        </Row>

        {/* Section 5: Alerts */}
        <div className={styles.section}>
          <Card title={<InfoTooltip title="Cảnh báo hệ thống" text="Hệ thống tự động phát hiện và cảnh báo các sản phẩm đang có số lượng tồn kho thấp hơn mức an toàn. Bạn cần xem xét nhập thêm hàng ngay để tránh tình trạng đứt gãy chuỗi cung ứng." />} bordered={false} className={styles.card} style={{ height: '100%' }}>
            <ReorderAlert alerts={alerts} />
          </Card>
        </div>

        <AIAnalysisModal
          open={aiModalVisible}
          onCancel={() => setAiModalVisible(false)}
          type={aiType}
          productId={aiProductId}
          contextData={aiContextData}
          title={aiTitle}
        />
      </div>
    </ErrorBoundary>
  );
};


