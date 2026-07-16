import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GenAIChatBox } from '../GenAIChatBox/GenAIChatBox';

const { Content, Footer } = Layout;

export const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout style={{ marginLeft: 0 }}>
        <Header collapsed={collapsed} setCollapsed={setCollapsed} />
        <Content style={{ margin: '24px', background: 'var(--color-bg-page)', borderRadius: 'var(--radius-lg)' }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center', background: 'var(--color-bg-page)', color: 'var(--color-text-secondary)' }}>
          Hệ thống Quản lý ©2026 Created by Team 7
        </Footer>
      </Layout>
      <GenAIChatBox />
    </Layout>
  );
};
