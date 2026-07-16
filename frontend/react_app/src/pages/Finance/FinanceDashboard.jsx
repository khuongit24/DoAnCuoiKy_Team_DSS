import React, { useState, useEffect } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Row, Col, Card, Spin, Table, Typography, Form, InputNumber, Button, Alert, Modal, Tooltip } from 'antd';
import { DollarOutlined, FundOutlined, BankOutlined, PercentageOutlined, CalculatorOutlined, RobotOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { ResponsiveContainer } from 'recharts';
import ReactMarkdown from 'react-markdown';
import { PageHeader, StatCard, LoadingSpinner, ErrorBoundary } from '../../components/Common';
import { formatVND, formatPercent } from '../../utils/formatters';
import InventoryBarChart from '../../components/Charts/InventoryBarChart';
import CostCurveChart from '../../components/Charts/CostCurveChart';
import api from '../../services/api';
import { AIPanel } from '../../components/AIPanel/AIPanel';

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

const FinanceDashboard = () => {
  useDocumentTitle('Finance');
  const [loading, setLoading] = useState(false);
  const [eoqForm] = Form.useForm();
  const [eoqResult, setEoqResult] = useState(null);

  const [metrics, setMetrics] = useState({
    totalRevenue: 1520000000,
    totalCosts: 950000000,
    estimatedProfit: 570000000,
    profitMargin: 0.375
  });

  const [inventoryCostsData, setInventoryCostsData] = useState([
    { category: 'CPU', holdingCost: 15000, orderingCost: 5000 },
    { category: 'GPU', holdingCost: 25000, orderingCost: 8000 },
    { category: 'RAM', holdingCost: 5000, orderingCost: 2000 },
    { category: 'Storage', holdingCost: 7000, orderingCost: 2500 },
    { category: 'Other', holdingCost: 3000, orderingCost: 1000 },
  ]);

  const [budgetReportData, setBudgetReportData] = useState([
    { key: '1', category: 'CPU', planned: 200000000, actual: 195000000, variance: -5000000 },
    { key: '2', category: 'GPU', planned: 350000000, actual: 380000000, variance: 30000000 },
    { key: '3', category: 'RAM', planned: 80000000, actual: 75000000, variance: -5000000 },
    { key: '4', category: 'Storage', planned: 120000000, actual: 125000000, variance: 5000000 },
  ]);

  const budgetColumns = [
    { title: 'Danh mục', dataIndex: 'category', key: 'category', render: text => <Text strong>{text}</Text> },
    { title: 'Ngân sách kế hoạch', dataIndex: 'planned', key: 'planned', render: val => formatVND(val), align: 'right' },
    { title: 'Thực tế', dataIndex: 'actual', key: 'actual', render: val => formatVND(val), align: 'right' },
    { 
      title: 'Chênh lệch', 
      dataIndex: 'variance', 
      key: 'variance', 
      render: val => <Text type={val > 0 ? 'danger' : 'success'}>{formatVND(val)}</Text>,
      align: 'right'
    },
  ];

  const onCalculateEOQ = (values) => {
    // Formula: EOQ = sqrt(2 * D * S / H)
    // D = annual demand, S = ordering cost per order, H = holding cost per unit per year
    const D = values.annualDemand;
    const S = values.orderingCost;
    const H = values.holdingCost;

    if (D > 0 && S > 0 && H > 0) {
        const eoq = Math.sqrt((2 * D * S) / H);
        const ordersPerYear = D / eoq;
        const totalCost = (D / eoq) * S + (eoq / 2) * H;
        
        // Generate curve data
        const curveData = [];
        for (let q = Math.max(10, eoq - 50); q <= eoq + 100; q += 10) {
            const holding = (q / 2) * H;
            const ordering = (D / q) * S;
            curveData.push({
                quantity: Math.round(q),
                holdingCost: holding,
                orderingCost: ordering,
                totalCost: holding + ordering
            });
        }

        setEoqResult({
            eoq: Math.round(eoq),
            ordersPerYear: ordersPerYear.toFixed(1),
            totalCost: Math.round(totalCost),
            curveData
        });
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [financeRes, inventoryRes, budgetRes] = await Promise.allSettled([
        api.get('/dashboard/financial'), // Note: backend uses /financial, fallback to /finance if needed? Using /financial as seen in routes
        api.get('/inventory'),
        api.get('/dashboard/budget-report')
      ]);

      if (financeRes.status === 'fulfilled' && financeRes.value.data?.data) {
        const data = financeRes.value.data.data;
        const rev = Number(data.revenue || 0);
        const cost = Number(data.costs || 0);
        setMetrics({
          totalRevenue: rev,
          totalCosts: cost,
          estimatedProfit: rev - cost,
          profitMargin: rev > 0 ? (rev - cost) / rev : 0
        });
      }

      if (inventoryRes.status === 'fulfilled' && inventoryRes.value.data?.data) {
        const inventoryList = inventoryRes.value.data.data;
        // Group by category if available, else by product_name
        const grouped = inventoryList.reduce((acc, item) => {
          const cat = item.category || 'Other';
          if (!acc[cat]) {
            acc[cat] = { holdingCost: 0, orderingCost: 0 };
          }
          acc[cat].holdingCost += Number(item.holding_cost || item.holding_cost_per_unit || 0) * Number(item.stock_quantity || 0);
          acc[cat].orderingCost += Number(item.ordering_cost || 0);
          return acc;
        }, {});
        
        const mappedInventoryCosts = Object.keys(grouped).map(key => ({
          category: key,
          holdingCost: grouped[key].holdingCost,
          orderingCost: grouped[key].orderingCost
        }));

        if (mappedInventoryCosts.length > 0) {
          setInventoryCostsData(mappedInventoryCosts);
        }
      }

      if (budgetRes.status === 'fulfilled' && budgetRes.value.data?.data) {
         // Assuming budget data comes as array
         if(Array.isArray(budgetRes.value.data.data) && budgetRes.value.data.data.length > 0){
             setBudgetReportData(budgetRes.value.data.data);
         }
      }

    } catch (error) {
      console.error('Error fetching finance dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAIAnalyze = async () => {
      setAiModalVisible(true);
  };

  return (
    <div className="dashboard-container">
      <PageHeader 
        title="Bảng Điều Khiển Tài Chính" 
        breadcrumb={[
          { title: 'Trang chủ', path: '/' },
          { title: 'Tài Chính' }
        ]}
      />

      <AIPanel
        type="finance"
        productId="finance_dashboard"
        contextData={metrics}
        title="AI Phân Tích Tài Chính"
      />

      {/* Section 1: Chỉ số tài chính */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Tổng doanh thu"
            value={formatVND(metrics.totalRevenue)}
            icon={<DollarOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Tổng chi phí"
            value={formatVND(metrics.totalCosts)}
            icon={<BankOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Lợi nhuận ước tính"
            value={formatVND(metrics.estimatedProfit)}
            icon={<FundOutlined />}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="Tỷ suất lợi nhuận"
            value={formatPercent(metrics.profitMargin)}
            icon={<PercentageOutlined />}
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Section 2: Chi phí tồn kho */}
        <Col xs={24} lg={12}>
          <Card title={<InfoTooltip title="Chi phí tồn kho theo Danh mục" text="Biểu đồ thể hiện sự tương quan giữa chi phí lưu kho và chi phí đặt hàng của từng danh mục sản phẩm." />}>
              <InventoryBarChart 
                data={inventoryCostsData} 
                height={300}
                xAxisKey="category"
                tooltipFormatter={(value) => `${formatVND(value * 1000)}`}
                bars={[
                  { dataKey: "holdingCost", name: "Chi phí lưu kho", stackId: "a", fill: "#8884d8" },
                  { dataKey: "orderingCost", name: "Chi phí đặt hàng", stackId: "a", fill: "#82ca9d" }
                ]}
              />
          </Card>
        </Col>

        {/* Section 4: Báo cáo ngân sách */}
        <Col xs={24} lg={12}>
          <Card title={<InfoTooltip title="Báo cáo Ngân sách nhập hàng (Tháng hiện tại)" text="Bảng theo dõi và so sánh ngân sách dự kiến với thực tế chi tiêu cho việc nhập hàng." />}>
            <Table 
                dataSource={budgetReportData} 
                columns={budgetColumns} 
                pagination={false}
                size="middle"
                scroll={{ y: 240 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Section 3: Phân tích EOQ */}
      <Card title={<InfoTooltip title="Phân tích Lượng đặt hàng hiệu quả (EOQ)" text="Công cụ tính toán số lượng hàng cần đặt mỗi lần để tối thiểu hóa tổng chi phí lưu kho và đặt hàng." />} style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]}>
          <Col xs={24} md={8}>
            <Title level={5}>Tham số đầu vào</Title>
            <Form 
              form={eoqForm} 
              layout="vertical" 
              onFinish={onCalculateEOQ}
              initialValues={{ annualDemand: 10000, orderingCost: 500000, holdingCost: 50000 }}
            >
              <Form.Item 
                name="annualDemand" 
                label="Nhu cầu hàng năm (D)"
                rules={[{ required: true, message: 'Vui lòng nhập nhu cầu!' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} />
              </Form.Item>
              
              <Form.Item 
                name="orderingCost" 
                label="Chi phí mỗi lần đặt hàng (S) - VND"
                rules={[{ required: true, message: 'Vui lòng nhập chi phí đặt hàng!' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} step={10000} />
              </Form.Item>

              <Form.Item 
                name="holdingCost" 
                label="Chi phí lưu kho/đơn vị/năm (H) - VND"
                rules={[{ required: true, message: 'Vui lòng nhập chi phí lưu kho!' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} step={1000} />
              </Form.Item>

              <Button type="primary" htmlType="submit" icon={<CalculatorOutlined />} block>
                Tính toán EOQ
              </Button>
            </Form>

            {eoqResult && (
              <Alert
                message="Kết quả phân tích"
                description={
                  <div style={{ marginTop: 12 }}>
                    <p><Text strong>Lượng đặt tối ưu (EOQ):</Text> {eoqResult.eoq} đơn vị</p>
                    <p><Text strong>Số lần đặt/năm:</Text> {eoqResult.ordersPerYear} lần</p>
                    <p><Text strong>Tổng chi phí nhỏ nhất:</Text> <Text type="success" strong>{formatVND(eoqResult.totalCost)}</Text></p>
                  </div>
                }
                type="success"
                style={{ marginTop: 24 }}
              />
            )}
          </Col>
          <Col xs={24} md={16}>
             <Title level={5}><InfoTooltip title="Biểu đồ Tổng chi phí (U-Curve)" text="Biểu đồ U-Curve minh họa điểm tối ưu (đáy chữ U) nơi tổng chi phí lưu kho và đặt hàng là thấp nhất." /></Title>
             {eoqResult ? (
                 <CostCurveChart data={eoqResult.curveData} formatVND={formatVND} />
             ) : (
                 <div style={{ height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa', borderRadius: 8 }}>
                     <Text type="secondary">Nhập tham số và tính toán để xem biểu đồ</Text>
                 </div>
             )}
          </Col>
        </Row>
      </Card>

    </div>
  );
};

export default FinanceDashboard;


