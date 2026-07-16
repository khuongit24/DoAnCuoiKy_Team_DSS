import React from 'react';
import { Card, Statistic, Space, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import styles from './StatCard.module.css';

const { Text } = Typography;

export const StatCard = React.memo(({ title, value, icon, trend, prefix, suffix, loading = false, status = 'default' }) => {
  const isPositive = trend > 0;
  const trendColor = isPositive ? '#3f8600' : '#cf1322';
  
  // Dynamic border top based on status
  const getStatusColor = () => {
    switch(status) {
      case 'critical': return '#cf1322';
      case 'warning': return '#faad14';
      case 'success': return '#52c41a';
      default: return 'transparent';
    }
  };

  return (
    <Card 
      className={styles.statCard} 
      bordered={false}
      style={{ borderTop: `4px solid ${getStatusColor()}` }}
      loading={loading}
    >
      <div className={styles.cardContent}>
        <div className={styles.infoSection}>
          <Text type="secondary" className={styles.title}>{title}</Text>
          <Statistic
            value={value}
            prefix={prefix}
            suffix={suffix}
            valueStyle={{ fontSize: '24px', fontWeight: 'bold' }}
          />
          {trend !== undefined && (
            <div className={styles.trendSection}>
              <Space size={4}>
                {isPositive ? (
                  <ArrowUpOutlined style={{ color: trendColor }} />
                ) : (
                  <ArrowDownOutlined style={{ color: trendColor }} />
                )}
                <Text style={{ color: trendColor, fontWeight: 500 }}>
                  {Math.abs(trend)}%
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>so với tháng trước</Text>
              </Space>
            </div>
          )}
        </div>
        <div className={styles.iconSection}>
          {icon}
        </div>
      </div>
    </Card>
  );
});

StatCard.displayName = 'StatCard';
