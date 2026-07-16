import React from 'react';
import { Tag } from 'antd';
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';

export const StatusBadge = React.memo(({ status }) => {
  const statusUpper = status?.toUpperCase();

  switch (statusUpper) {
    case 'SAFE':
    case 'OK':
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          SAFE
        </Tag>
      );
    case 'WARNING':
      return (
        <Tag icon={<ExclamationCircleOutlined />} color="warning">
          WARNING
        </Tag>
      );
    case 'CRITICAL':
    case 'DANGER':
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          CRITICAL
        </Tag>
      );
    default:
      return <Tag color="default">{status}</Tag>;
  }
});

StatusBadge.displayName = 'StatusBadge';
