import React, { useState, useEffect } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Row, Col, Card, Typography, Spin, Statistic, Alert, Tooltip } from 'antd';
import {
  ShoppingCartOutlined,
  DatabaseOutlined,
  BarChartOutlined,
  DollarOutlined,
  RobotOutlined,
  ProductOutlined,
  StockOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AIPanel } from '../../components/AIPanel/AIPanel';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import styles from './HomePage.module.css';

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

export const HomePage = () => {
  useDocumentTitle('Trang chủ Hệ thống');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    overview: null,
    financial: null,
    sales: null,
    trend: [],
    alerts: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [overviewRes, financialRes, salesRes, trendRes, alertsRes] = await Promise.all([
        api.get('/dashboard/overview').catch(() => ({ data: { data: { totalProducts: 0, totalRevenue: 0, currentInventory: 0 } } })),
        api.get('/dashboard/financial').catch(() => ({ data: { data: { revenue: 0, costs: 0, profit: 0 } } })),
        api.get('/dashboard/sales').catch(() => ({ data: { data: { totalRevenue: 0, revenueChange: 0, topProduct: 'N/A' } } })),
        api.get('/dashboard/sales/trend').catch(() => ({ data: { data: [] } })),
        api.get('/dashboard/alerts').catch(() => ({ data: { data: [] } }))
      ]);

      const dashboardData = {
        overview: overviewRes.data?.data || {},
        financial: financialRes.data?.data || {},
        sales: salesRes.data?.data || {},
        trend: trendRes.data?.data || [],
        alerts: alertsRes.data?.data || []
      };

      setData(dashboardData);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu dashboard:', error);
    } finally {
      setLoading(false);
    }
  };



  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);
  };

  const modules = [
    {
      title: 'Giám đốc Kinh doanh',
      desc: 'Theo dõi doanh số, đánh giá hiệu suất sản phẩm và phân tích xu hướng bán hàng.',
      icon: <BarChartOutlined />,
      iconClass: styles.iconSales,
      path: '/dashboard/sales'
    },
    {
      title: 'Trưởng phòng Mua hàng',
      desc: 'Quản lý đơn hàng, đánh giá nhà cung cấp (AHP/TOPSIS) và cảnh báo tồn kho.',
      icon: <ShoppingCartOutlined />,
      iconClass: styles.iconPurchase,
      path: '/dashboard/purchase'
    },
    {
      title: 'Giám đốc Kho',
      desc: 'Kiểm soát hàng tồn, tối ưu hóa điểm đặt hàng lại (ROP) và số lượng đặt hàng (EOQ).',
      icon: <DatabaseOutlined />,
      iconClass: styles.iconWarehouse,
      path: '/dashboard/warehouse'
    },
    {
      title: 'Giám đốc Tài chính',
      desc: 'Kiểm soát dòng tiền, chi phí lưu kho, chi phí đặt hàng và lợi nhuận tổng thể.',
      icon: <DollarOutlined />,
      iconClass: styles.iconFinance,
      path: '/dashboard/finance'
    }
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" tip="Đang tải dữ liệu Dashboard..." />
      </div>
    );
  }

  return (
    <div className={styles.homeContainer}>
      <div className={styles.headerSection}>
        <Title level={2} className={styles.pageTitle}>Tổng quan Hệ thống</Title>
        <Text className={styles.pageSubtitle}>Cái nhìn toàn cảnh về hiệu suất kinh doanh, tài chính và hệ thống tồn kho của doanh nghiệp.</Text>
      </div>

      <Row gutter={[24, 24]} className={styles.metricsRow}>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.metricCard}>
            <Statistic
              title="Tổng Doanh Thu"
              value={data.overview?.totalRevenue || 0}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: '#2563eb', fontWeight: 700 }}
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.metricCard}>
            <Statistic
              title="Lợi Nhuận Ước Tính"
              value={data.financial?.profit || 0}
              formatter={(val) => formatCurrency(val)}
              valueStyle={{ color: '#16a34a', fontWeight: 700 }}
              prefix={<StockOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.metricCard}>
            <Statistic
              title="Tổng Sản Phẩm"
              value={data.overview?.totalProducts || 0}
              valueStyle={{ color: '#ea580c', fontWeight: 700 }}
              prefix={<ProductOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className={styles.metricCard}>
            <Statistic
              title="Tổng Tồn Kho"
              value={data.overview?.currentInventory || 0}
              valueStyle={{ color: '#db2777', fontWeight: 700 }}
              prefix={<DatabaseOutlined />}
              suffix="Đơn vị"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} className={styles.mainRow}>
        <Col xs={24} lg={16}>
          <Card className={styles.chartCard} title={<InfoTooltip title="Xu Hướng Doanh Thu" text="Biểu đồ thể hiện sự biến động của tổng doanh thu thu về theo từng ngày, giúp bạn có cái nhìn tổng quan về tình hình kinh doanh hiện tại và phát hiện các xu hướng tăng giảm." />}>
            {data.trend && data.trend.length > 0 ? (
              <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="sale_date" tickFormatter={(val) => new Date(val).toLocaleDateString('vi-VN')} />
                    <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <RechartsTooltip 
                      formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                      labelFormatter={(label) => new Date(label).toLocaleDateString('vi-VN')}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRevenue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className={styles.noData}>Chưa có dữ liệu xu hướng doanh thu</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <AIPanel 
            type="dashboard"
            productId="dashboard"
            contextData={data}
            title={<InfoTooltip title="AI Decision Support" text="Trợ lý Trí tuệ nhân tạo (AI) của hệ thống sẽ phân tích các dữ liệu kinh doanh, tồn kho và chi phí để đưa ra những lời khuyên, đề xuất hành động tối ưu nhất dành riêng cho bạn." />}
          />
          
          {data.alerts && data.alerts.length > 0 && (
            <Card className={styles.alertCard} title={<InfoTooltip title="Cảnh Báo Hệ Thống" text="Hệ thống tự động phát hiện và cảnh báo các sản phẩm đang có số lượng tồn kho thấp hơn mức an toàn. Bạn cần xem xét nhập thêm hàng ngay để tránh tình trạng đứt gãy chuỗi cung ứng." />} size="small">
              <div className={styles.alertsList}>
                {data.alerts.slice(0, 3).map((alert, idx) => (
                  <Alert 
                    key={idx}
                    message={alert.message}
                    type={alert.type === 'rop_alert' ? 'warning' : 'error'}
                    showIcon
                    className={styles.alertItem}
                  />
                ))}
              </div>
            </Card>
          )}
        </Col>
      </Row>

      <Title level={4} className={styles.modulesTitle}>Truy Cập Phân Hệ Quản Trị</Title>
      <Row gutter={[24, 24]}>
        {modules.map((mod, idx) => (
          <Col xs={24} sm={12} lg={6} key={idx}>
            <Card
              className={styles.moduleCard}
              onClick={() => navigate(mod.path)}
            >
              <div className={`${styles.iconWrapper} ${mod.iconClass}`}>
                {mod.icon}
              </div>
              <Title level={5} className={styles.moduleTitle}>{mod.title}</Title>
              <Text className={styles.moduleDesc}>{mod.desc}</Text>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};
