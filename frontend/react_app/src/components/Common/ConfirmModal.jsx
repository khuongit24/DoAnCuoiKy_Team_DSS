import React from 'react';
import { Modal, Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

export const ConfirmModal = ({ 
  visible, 
  title, 
  content, 
  onConfirm, 
  onCancel, 
  confirmText = 'Xác nhận', 
  cancelText = 'Hủy',
  danger = false,
  loading = false
}) => {
  return (
    <Modal
      title={
        <span>
          <ExclamationCircleOutlined style={{ color: danger ? '#ff4d4f' : '#faad14', marginRight: '8px' }} />
          {title}
        </span>
      }
      open={visible}
      onOk={onConfirm}
      onCancel={onCancel}
      okText={confirmText}
      cancelText={cancelText}
      okButtonProps={{ danger, loading }}
      centered
    >
      <div style={{ marginTop: '16px', paddingLeft: '24px' }}>
        <Text>{content}</Text>
      </div>
    </Modal>
  );
};
