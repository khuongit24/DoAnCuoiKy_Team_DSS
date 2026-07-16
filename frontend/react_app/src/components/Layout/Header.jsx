import React, { useState, useEffect } from 'react';
import { Layout, Button, Space, Badge, Popover, List, Typography, Avatar, Tooltip } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined, BellOutlined, WarningFilled, ShoppingCartOutlined, CheckCircleFilled, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

export const Header = ({ collapsed, setCollapsed }) => {
  const [alerts, setAlerts] = useState([]);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await api.get('/inventory/alerts');
        const data = response.data?.data || response.data || [];
        const formattedAlerts = data.map(item => {
          const isDanger = item.currentStock === 0;
          return {
            id: item.id || item.product_id,
            severity: isDanger ? 'danger' : 'warning',
            title: item.product_name || 'Sản phẩm',
            description: `Tồn kho (${item.currentStock}) ${isDanger ? 'đã hết' : `dưới mức an toàn (${item.rop})`}.`,
            time: 'Vừa xong'
          };
        });
        setAlerts(formattedAlerts);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
      }
    };
    fetchAlerts();
  }, []);

  const handleRestock = (productId) => {
    setVisible(false);
    navigate('/dashboard/purchase'); // Điều hướng tới tab Mua Hàng
  };

  const removeAlert = (e, id) => {
    e.stopPropagation();
    setAlerts(alerts.filter(a => a.id !== id));
  };

  const clearAll = () => {
    setAlerts([]);
  };

  const alertHeader = (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid #f0f0f0', marginBottom: 8 }}>
      <Text strong style={{ fontSize: 16 }}>Thông báo hệ thống</Text>
      {alerts.length > 0 && (
        <Button type="link" size="small" onClick={clearAll} style={{ padding: 0 }}>
          Đánh dấu đã đọc
        </Button>
      )}
    </div>
  );

  const alertContent = (
    <div style={{ width: 350, maxHeight: 450, overflowY: 'auto', paddingRight: 4 }}>
      {alertHeader}
      {alerts.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={alerts}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '12px 8px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.3s',
                borderBottom: '1px solid #f0f0f0'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              onClick={() => handleRestock(item.id)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{ backgroundColor: item.severity === 'danger' ? '#fff1f0' : '#fffbe6' }}
                    icon={<WarningFilled style={{ color: item.severity === 'danger' ? '#ff4d4f' : '#faad14' }} />}
                  />
                }
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong style={{ fontSize: 14 }}>{item.title}</Text>
                    <Tooltip title="Ẩn thông báo">
                      <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined style={{ fontSize: 10, color: '#bfbfbf' }} />}
                        onClick={(e) => removeAlert(e, item.id)}
                      />
                    </Tooltip>
                  </div>
                }
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                      {item.description}
                    </Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>{item.time}</Text>
                      <Button type="primary" size="small" icon={<ShoppingCartOutlined />} style={{ fontSize: 12 }}>
                        Nhập hàng
                      </Button>
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <CheckCircleFilled style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
          <br />
          <Text type="secondary">Tuyệt vời! Không có cảnh báo nào.</Text>
        </div>
      )}
    </div>
  );

  return (
    <AntHeader style={{ padding: '0 24px', background: 'var(--color-bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', zIndex: 1 }}>
      <div>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          style={{ fontSize: '16px', width: 64, height: 64, marginLeft: -24 }}
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        />
      </div>
      <Space size="large">
        <Popover 
          content={alertContent} 
          trigger="click" 
          placement="bottomRight"
          open={visible}
          onOpenChange={setVisible}
          overlayInnerStyle={{ padding: 16, borderRadius: 12 }}
        >
          <Badge count={alerts.length} size="small" offset={[-4, 4]}>
            <Button type="text" icon={<BellOutlined style={{ fontSize: '20px' }} />} aria-label="Thông báo" />
          </Badge>
        </Popover>
      </Space>
    </AntHeader>
  );
};
