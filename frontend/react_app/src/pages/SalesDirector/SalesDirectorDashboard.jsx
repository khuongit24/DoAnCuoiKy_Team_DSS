import React, { useState, useEffect } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Row, Col, Card, Spin, Select, Button, Tooltip } from 'antd';
import { DollarOutlined, RiseOutlined, FireOutlined, RobotOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { PageHeader } from '../../components/Common/PageHeader';
import { StatCard } from '../../components/Common/StatCard';
import RevenueChart from '../../components/Charts/RevenueChart';
import CategoryPieChart from '../../components/Charts/CategoryPieChart';
import ForecastChart from '../../components/ForecastChart/ForecastChart';
import ModelComparison from '../../components/ForecastChart/ModelComparison';
import SupplierRankingTable from '../../components/SupplierRanking/SupplierRankingTable';
import { AIPanel } from '../../components/AIPanel/AIPanel';
import { formatVND } from '../../utils/formatters';
import api from '../../services/api';

const { Option } = Select;
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

const SalesDirectorDashboard = () => {
  useDocumentTitle('Giám Đốc Kinh Doanh');
  const [loading, setLoading] = useState(false);
  const [salesTrendCategory, setSalesTrendCategory] = useState('all');
  
  const [metrics, setMetrics] = useState({
      totalRevenue: 0,
      revenueChange: 0,
      topProduct: 'N/A',
      totalProducts: 0,
      categoryDistribution: []
  });

  const [salesTrendData, setSalesTrendData] = useState([]);

  const topSellingData = [
      { name: 'RTX 4090', sales: 450 },
      { name: 'Core i9', sales: 380 },
      { name: '32GB DDR5', sales: 320 },
      { name: '2TB SSD', sales: 250 },
      { name: 'Z790 MB', sales: 150 },
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = salesTrendCategory !== 'all' ? { category: salesTrendCategory } : {};
      
      const [salesRes, metricsRes, overviewRes] = await Promise.all([
        api.get('/dashboard/sales/trend', { params }),
        api.get('/dashboard/sales'),
        api.get('/dashboard/overview')
      ]);

      const metricsData = metricsRes.data?.data || {};
      const overviewData = overviewRes.data?.data || {};
      setMetrics({
        totalRevenue: metricsData.totalRevenue || metricsData.revenue || metricsData.total_revenue || 0,
        revenueChange: metricsData.revenueChange || metricsData.revenue_change_percent || 0,
        topProduct: metricsData.topProduct || metricsData.top_selling_product || 'N/A',
        totalProducts: overviewData.totalProducts || 0,
        categoryDistribution: metricsData.categoryDistribution || []
      });

      const salesData = salesRes.data?.data || [];
      const mappedTrendData = salesData.map(item => ({
        name: item.sale_date ? new Date(item.sale_date).toLocaleDateString('vi-VN') : (item.date || item.name || 'Unknown'),
        value: Number(item.total_revenue || item.revenue || item.value || 0) / 1000000 // Convert to Triệu VND
      }));
      setSalesTrendData(mappedTrendData.length > 0 ? mappedTrendData : []);

    } catch (error) {
      console.error('Lỗi khi tải dữ liệu Sales Dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      fetchData();
  }, [salesTrendCategory]);

  return (
    <div className="dashboard-container">
      <PageHeader 
        title="Bảng Điều Khiển Giám Đốc Kinh Doanh" 
        breadcrumb={[
          { title: 'Trang chủ', path: '/' },
          { title: 'Kinh Doanh' }
        ]}
      />

      <AIPanel
        type="dashboard"
        productId="sales_dashboard"
        contextData={{ overview: { totalProducts: metrics.totalProducts, totalRevenue: metrics.totalRevenue, currentInventory: 500 }, sales: { totalRevenue: metrics.totalRevenue, topProduct: metrics.topProduct }, financial: { profit: metrics.totalRevenue * 0.3, costs: metrics.totalRevenue * 0.7 }, alerts: [] }}
        title="AI Phân Tích Kinh Doanh"
      />

      {/* Section 1: Tổng quan doanh số */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard
            title="Doanh thu tháng hiện tại"
            value={formatVND(metrics.totalRevenue)}
            icon={<DollarOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="% Thay đổi (So với tháng trước)"
            value={`${metrics.revenueChange}%`}
            trend={metrics.revenueChange}
            icon={<RiseOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Sản phẩm bán chạy nhất"
            value={metrics.topProduct}
            icon={<FireOutlined />}
            loading={loading}
          />
        </Col>
      </Row>

      {/* Section 2: Xu hướng doanh số & Section 3: Phân bổ */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card 
            title={<InfoTooltip title="Xu hướng doanh số" text="Biểu đồ đường thể hiện sự tăng giảm doanh số theo thời gian thực." />} 
            extra={
                <Select value={salesTrendCategory} onChange={setSalesTrendCategory} style={{ width: 150 }}>
                    <Option value="all">Tất cả</Option>
                    <Option value="cpu">Vi xử lý (CPU)</Option>
                    <Option value="gpu">Card đồ họa (GPU)</Option>
                    <Option value="ram">Bộ nhớ (RAM)</Option>
                    <Option value="mainboard">Bo mạch chủ</Option>
                    <Option value="storage">Ổ cứng</Option>
                    <Option value="monitor">Màn hình</Option>
                    <Option value="accessories">Phụ kiện</Option>
                    <Option value="laptop">Máy tính xách tay</Option>
                </Select>
            }
          >
            <Spin spinning={loading}>
                <RevenueChart data={salesTrendData} loading={false} />
            </Spin>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title={<InfoTooltip title="Phân bổ doanh thu theo danh mục" text="Biểu đồ tròn tỷ lệ phần trăm doanh thu đóng góp của mỗi danh mục sản phẩm." />}>
              <CategoryPieChart data={metrics.categoryDistribution.length > 0 ? metrics.categoryDistribution : [{name: 'N/A', value: 1}]} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
            <Card title={<InfoTooltip title="Top 5 sản phẩm bán chạy" text="Danh sách 5 sản phẩm mang lại doanh số cao nhất và đang được khách hàng ưa chuộng nhất trong hệ thống ở thời điểm hiện tại. Biểu đồ thanh càng dài chứng tỏ sức mua càng lớn." />}>
                <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={topSellingData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={80} />
                        <RechartsTooltip />
                        <Bar dataKey="sales" name="Số lượng bán" fill="#87d068" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
        </Col>
        <Col xs={24} lg={16}>
             {/* Section 4: Dự báo nhu cầu */}
             <ForecastChart />
        </Col>
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={8}>
              <ModelComparison productId={1} />
          </Col>
          <Col xs={24} lg={16}>
              {/* Section 5: Xếp hạng NCC (read-only) */}
              <SupplierRankingTable readOnly={true} />
          </Col>
      </Row>

    </div>
  );
};

export default SalesDirectorDashboard;


