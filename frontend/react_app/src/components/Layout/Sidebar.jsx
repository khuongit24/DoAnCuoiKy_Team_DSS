import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  HomeOutlined,
  DashboardOutlined,
  ShoppingCartOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  TeamOutlined,
  SettingOutlined,
  AppstoreOutlined,
  ShopOutlined,
  LineChartOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const { Title } = Typography;

export const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getMenuItems = () => {
    const items = [];

    // Common items for everyone
    items.push({ key: '/', icon: <HomeOutlined />, label: 'Trang chủ' });
    items.push({ key: '/dashboard/purchase', icon: <ShoppingCartOutlined />, label: 'Mua hàng' });
    items.push({ key: '/dashboard/warehouse', icon: <DatabaseOutlined />, label: 'Kho hàng' });
    items.push({ key: '/dashboard/sales', icon: <BarChartOutlined />, label: 'Kinh doanh' });
    items.push({ key: '/dashboard/finance', icon: <DashboardOutlined />, label: 'Tài chính' });

    items.push(
      { 
        key: 'data', 
        icon: <DatabaseOutlined />, 
        label: 'Quản lý Dữ liệu',
        children: [
          { key: '/data/products', icon: <AppstoreOutlined />, label: 'Sản phẩm' },
          { key: '/data/sales', icon: <LineChartOutlined />, label: 'Doanh số' },
          { key: '/data/inventory', icon: <DatabaseOutlined />, label: 'Tồn kho' },
          { key: '/data/suppliers', icon: <TeamOutlined />, label: 'Nhà cung cấp' },
          { key: '/data/market', icon: <ShopOutlined />, label: 'Thị trường' }
        ]
      },
      { key: '/settings', icon: <SettingOutlined />, label: 'Cài đặt' }
    );

    return items;
  };

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={(value) => setCollapsed(value)}
      theme="dark"
      width={250}
    >
      <div className="logo" style={{ height: 64, margin: 16 }}>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={getMenuItems()}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  );
};
