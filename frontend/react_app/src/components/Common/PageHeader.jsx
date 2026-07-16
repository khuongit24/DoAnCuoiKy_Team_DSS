import React from 'react';
import { Typography, Breadcrumb, Space } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import styles from './PageHeader.module.css';

const { Title, Text } = Typography;

export const PageHeader = ({ title, breadcrumbs, description, actions }) => {
  return (
    <div className={styles.headerContainer}>
      <div className={styles.titleSection}>
        <Breadcrumb
          items={[
            {
              title: <Link to="/"><HomeOutlined /></Link>,
            },
            ...(breadcrumbs || []).map((item) => ({
              title: item.path ? <Link to={item.path}>{item.title}</Link> : item.title,
            })),
          ]}
          className={styles.breadcrumb}
        />
        <Title level={3} className={styles.title}>
          {title}
        </Title>
        {description && (
          <Text type="secondary" className={styles.description}>
            {description}
          </Text>
        )}
      </div>
      {actions && (
        <div className={styles.actionSection}>
          <Space>{actions}</Space>
        </div>
      )}
    </div>
  );
};
