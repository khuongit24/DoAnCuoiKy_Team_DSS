import React from 'react';
import { List, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { StatusBadge } from '../Common/StatusBadge';

export const ReorderAlert = ({ alerts = [], onDismiss }) => {
  return (
    <List
      itemLayout="horizontal"
      dataSource={alerts}
      renderItem={(item) => (
        <List.Item
          actions={
            onDismiss ? [
              <Button 
                type="text" 
                icon={<CloseOutlined />} 
                onClick={() => onDismiss(item.id)} 
              />
            ] : []
          }
        >
          <List.Item.Meta
            avatar={<StatusBadge status={item.severity || 'warning'} />}
            title={item.message}
            description={item.description || "Hệ thống tự động phát hiện cảnh báo từ dữ liệu kho"}
          />
        </List.Item>
      )}
    />
  );
};

export default ReorderAlert;
