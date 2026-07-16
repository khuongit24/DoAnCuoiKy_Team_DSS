import React, { createContext, useContext, useEffect } from 'react';
import { message } from 'antd';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [messageApi, contextHolder] = message.useMessage();

  const showNotification = (type, content, duration = 3) => {
    messageApi.open({
      type,
      content,
      duration,
    });
  };

  const notify = {
    success: (content, duration) => showNotification('success', content, duration),
    error: (content, duration) => showNotification('error', content, duration),
    warning: (content, duration) => showNotification('warning', content, duration),
    info: (content, duration) => showNotification('info', content, duration),
  };

  useEffect(() => {
    const handleApiError = (event) => {
      if (event.detail) {
        showNotification('error', event.detail);
      }
    };
    window.addEventListener('api-error', handleApiError);
    return () => window.removeEventListener('api-error', handleApiError);
  }, [messageApi]);

  return (
    <NotificationContext.Provider value={notify}>
      {contextHolder}
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
