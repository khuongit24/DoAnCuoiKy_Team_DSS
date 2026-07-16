import React from 'react';
import { Empty, Button } from 'antd';
import styles from './EmptyState.module.css';

export const EmptyState = ({ description = 'Không có dữ liệu', actionText, onAction }) => {
  return (
    <div className={styles.emptyContainer}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={description}
      >
        {actionText && onAction && (
          <Button type="primary" onClick={onAction}>
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
};
