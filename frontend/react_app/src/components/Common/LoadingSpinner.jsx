import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import styles from './LoadingSpinner.module.css';

export const LoadingSpinner = ({ tip = 'Đang tải...', fullscreen = false, size = 24 }) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size }} spin />;

  if (fullscreen) {
    return (
      <div className={styles.fullscreenContainer}>
        <Spin indicator={antIcon} tip={tip} size="large" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Spin indicator={antIcon} tip={tip} />
    </div>
  );
};
