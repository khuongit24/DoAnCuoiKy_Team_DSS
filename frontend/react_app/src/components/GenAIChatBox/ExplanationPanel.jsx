import React, { useState, useEffect } from 'react';
import { Card, Skeleton, Typography, Space, Alert } from 'antd';
import { RobotOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { genaiService } from '../../services/genaiService';

const { Text, Title } = Typography;

export const ExplanationPanel = ({ type, productId, context }) => {
  const [explanation, setExplanation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchExplanation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await genaiService.explain(type, productId, context);
        if (response && response.success) {
          setExplanation(response.data.explanation);
        } else {
          setError('Không thể lấy được giải thích.');
        }
      } catch (err) {
        setError('Đã xảy ra lỗi khi gọi AI.');
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchExplanation();
    }
  }, [type, productId, context]);

  if (isLoading) {
    return (
      <Card bordered={false} style={{ background: 'var(--color-bg-body)', borderRadius: '8px' }}>
        <Space align="center" style={{ marginBottom: 16 }}>
          <RobotOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} />
          <Text strong>AI đang phân tích dữ liệu...</Text>
        </Space>
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <Card 
      bordered={false} 
      style={{ 
        background: 'linear-gradient(145deg, var(--color-bg-body) 0%, var(--color-bg-page) 100%)', 
        border: '1px solid var(--color-primary-light, #bfdbfe)',
        borderRadius: '8px' 
      }}
    >
      <Space align="center" style={{ marginBottom: 16 }}>
        <RobotOutlined style={{ fontSize: 24, color: 'var(--color-primary)' }} />
        <Title level={5} style={{ margin: 0 }}>Giải thích từ AI Assistant</Title>
      </Space>
      <div style={{ padding: '12px', background: 'var(--color-bg-page)', borderRadius: '6px', fontSize: '14px', lineHeight: 1.6 }}>
        <ReactMarkdown>{explanation}</ReactMarkdown>
      </div>
    </Card>
  );
};
