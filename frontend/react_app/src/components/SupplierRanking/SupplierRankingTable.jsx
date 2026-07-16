import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Button, Progress, Tag, Space, Typography, Spin, Alert, Tooltip } from 'antd';
import { SettingOutlined, TrophyFilled, QuestionCircleOutlined } from '@ant-design/icons';
import { supplierService } from '../../services/supplierService';
import api from '../../services/api';
import AHPConfigModal from './AHPConfigModal';
import styles from './SupplierRanking.module.css';
import { formatVND } from '../../utils/formatters';

const { Option } = Select;
const { Text } = Typography;

const InfoTooltip = ({ title, text }) => (
  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
    {title}
    <Tooltip title={text} overlayInnerStyle={{ width: '300px' }}>
      <QuestionCircleOutlined style={{ color: '#1890ff', cursor: 'pointer' }} />
      <span style={{ fontSize: '12px', color: '#1890ff', cursor: 'pointer', fontWeight: 'normal' }}>Đây là gì?</span>
    </Tooltip>
  </span>
);

const SupplierRankingTable = ({ readOnly = false }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productId, setProductId] = useState(1);
  const [suppliers, setSuppliers] = useState([]);
  const [isConfigModalVisible, setIsConfigModalVisible] = useState(false);

  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products');
        const data = response.data?.data || response.data || [];
        setProducts(data);
        if (data.length > 0) {
          setProductId(data[0].product_id || data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }
    };
    fetchProducts();
  }, []);

  const fetchRanking = async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const response = await supplierService.getRanking(id);
      if (response.data.success) {
          setSuppliers(response.data.data);
      } else {
          setError(response.data.message || 'Lỗi tải xếp hạng nhà cung cấp');
      }
    } catch (err) {
      console.error("Supplier Ranking Error:", err);
      // Fallback mock data
      setSuppliers([
        { id: 1, rank: 1, name: 'TechSource VN', price: 15500000, lead_time: 3, defect_rate: 0.01, reliability_score: 0.95, topsis_score: 0.85 },
        { id: 2, rank: 2, name: 'Global Components', price: 15200000, lead_time: 7, defect_rate: 0.02, reliability_score: 0.90, topsis_score: 0.78 },
        { id: 3, rank: 3, name: 'FastShip Electronics', price: 16000000, lead_time: 2, defect_rate: 0.01, reliability_score: 0.98, topsis_score: 0.72 },
        { id: 4, rank: 4, name: 'Budget Parts', price: 14500000, lead_time: 14, defect_rate: 0.05, reliability_score: 0.80, topsis_score: 0.55 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchRanking(productId);
    }
  }, [productId]);

  const columns = [
    {
      title: 'Hạng',
      dataIndex: 'rank',
      key: 'rank',
      render: (rank) => (
        <Space>
          {rank === 1 ? <TrophyFilled style={{ color: '#faad14' }} /> : rank}
        </Space>
      ),
      width: 80,
      align: 'center'
    },
    {
      title: 'Nhà cung cấp',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Text strong={record.rank === 1}>{text}</Text>
      )
    },
    {
      title: 'Đơn giá',
      dataIndex: 'price',
      key: 'price',
      render: (val) => formatVND(val)
    },
    {
      title: 'Thời gian giao (ngày)',
      dataIndex: 'lead_time',
      key: 'lead_time',
      align: 'right'
    },
    {
      title: 'Tỷ lệ lỗi',
      dataIndex: 'defect_rate',
      key: 'defect_rate',
      render: (val) => val != null ? `${(val * 100).toFixed(1)}%` : '-',
      align: 'right'
    },
    {
      title: 'Uy tín',
      dataIndex: 'reliability_score',
      key: 'reliability_score',
      render: (val) => val != null ? `${(val * 100).toFixed(0)}%` : '-',
      align: 'right'
    },
    {
      title: 'Điểm TOPSIS',
      dataIndex: 'topsis_score',
      key: 'topsis_score',
      render: (val) => (
        <Progress 
          percent={val != null ? Math.round(val * 100) : 0} 
          size="small" 
          status={val > 0.8 ? 'success' : val > 0.6 ? 'normal' : 'exception'}
        />
      ),
      width: 150
    },
  ];

  return (
    <Card 
      className={styles.rankingCard} 
      title={<InfoTooltip title="Đánh giá & Xếp hạng Nhà cung cấp" text="Bảng xếp hạng này sử dụng thuật toán đa tiêu chí để đánh giá các nhà cung cấp dựa trên: Giá cả, Thời gian giao hàng, Tỷ lệ lỗi và Uy tín. Nhà cung cấp đạt điểm cao nhất sẽ được đề xuất ưu tiên." />}
      extra={
        !readOnly && (
          <Button 
            type="primary" 
            icon={<SettingOutlined />}
            onClick={() => setIsConfigModalVisible(true)}
          >
            Cấu hình Trọng số (AHP)
          </Button>
        )
      }
    >
      <div className={styles.controls}>
        <Text strong>Sản phẩm: </Text>
        <Select 
          value={productId} 
          style={{ width: 250, marginLeft: 8, marginBottom: 16 }} 
          onChange={setProductId}
          showSearch
          optionFilterProp="children"
        >
          {products.map(p => (
            <Option key={p.product_id || p.id} value={p.product_id || p.id}>{p.product_name || p.name}</Option>
          ))}
        </Select>
      </div>

      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}

      <Spin spinning={loading}>
        <Table 
          dataSource={suppliers} 
          columns={columns} 
          rowKey="id"
          pagination={false}
          rowClassName={(record) => record.rank === 1 ? styles.topRankRow : ''}
        />
      </Spin>

      <AHPConfigModal 
        visible={isConfigModalVisible} 
        onCancel={() => setIsConfigModalVisible(false)}
        onSuccess={() => fetchRanking(productId)}
      />
    </Card>
  );
};

export default SupplierRankingTable;
