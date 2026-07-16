import React, { useState, useEffect } from 'react';
import { Modal, Radio, Button, Spin, Typography, Space, Alert } from 'antd';
import { RobotOutlined, FunctionOutlined, ThunderboltOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { genaiService } from '../../services/genaiService';

const { Text } = Typography;

export const AIAnalysisModal = ({ open, onCancel, contextData, type, productId, title = "AI Phân Tích & Đề Xuất" }) => {
  const [modelType, setModelType] = useState('genai');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setExplanation('');
      setError(null);
      // Reset modelType to default if desired, or keep user's last choice
    }
  }, [open]);

  const handleAnalyze = async () => {
    setLoading(true);
    setExplanation('');
    setError(null);
    try {
      const response = await genaiService.explain(type, productId, contextData, modelType);
      if (response && response.success) {
        setExplanation(response.data.explanation);
      } else {
        setError('Lỗi khi lấy dữ liệu từ AI.');
      }
    } catch (err) {
      setError('Không thể kết nối với dịch vụ AI.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><RobotOutlined style={{ color: '#1890ff' }} /> {title}</div>}
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="close" onClick={onCancel}>
          Đóng
        </Button>
      ]}
      width={700}
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <Text strong>Chọn mô hình phân tích:</Text>
        <Radio.Group 
          onChange={(e) => setModelType(e.target.value)} 
          value={modelType}
          style={{ display: 'flex', marginTop: 8, gap: 16 }}
        >
          <Radio.Button value="genai" style={{ flex: 1, textAlign: 'center' }}>
            <ThunderboltOutlined /> Gemini AI (Chính xác, linh hoạt)
          </Radio.Button>
          <Radio.Button value="rule_based" style={{ flex: 1, textAlign: 'center' }}>
            <FunctionOutlined /> AI Thuật toán (Nhanh, ổn định)
          </Radio.Button>
        </Radio.Group>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<RobotOutlined />} 
          onClick={handleAnalyze} 
          loading={loading}
          size="large"
          style={{ minWidth: 200 }}
        >
          Bắt đầu phân tích
        </Button>
      </div>

      {error && (
        <Alert message="Lỗi" description={error} type="error" showIcon style={{ marginBottom: 16 }} />
      )}

      <Spin spinning={loading} tip="AI đang xử lý dữ liệu...">
        <div style={{ minHeight: 150, padding: 16, backgroundColor: '#f0f5ff', borderRadius: 8, border: '1px solid #d9d9d9' }}>
          {explanation ? (
            <ReactMarkdown>{explanation}</ReactMarkdown>
          ) : (
            <div style={{ display: 'flex', height: 150, alignItems: 'center', justifyContent: 'center', color: '#8c8c8c' }}>
              Vui lòng chọn mô hình và nhấn Bắt đầu phân tích.
            </div>
          )}
        </div>
      </Spin>
    </Modal>
  );
};

export default AIAnalysisModal;
