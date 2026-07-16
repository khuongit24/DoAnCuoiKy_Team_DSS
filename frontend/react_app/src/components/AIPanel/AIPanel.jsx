import React, { useState } from 'react';
import { Card, Button, Modal, Radio, Spin, Typography, Space } from 'antd';
import { RobotOutlined, FunctionOutlined, ThunderboltOutlined } from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { genaiService } from '../../services/genaiService';

const { Text } = Typography;

export const AIPanel = ({ type, productId, contextData, title = "AI Nhận xét & Đánh giá" }) => {
  const [modelSelectorVisible, setModelSelectorVisible] = useState(false);
  const [modelType, setModelType] = useState('genai');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState('');
  const [error, setError] = useState(null);

  const handleStartAnalysis = async () => {
    setModelSelectorVisible(false);
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
    <Card title={<><RobotOutlined style={{ color: '#1890ff', marginRight: 8 }} /> {title}</>} style={{ marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      
      <Spin spinning={loading} tip="AI đang xử lý dữ liệu...">
        <div style={{ minHeight: 100, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb', marginBottom: 16 }}>
          {explanation ? (
            <ReactMarkdown>{explanation}</ReactMarkdown>
          ) : (
            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#8c8c8c' }}>
              Chưa có dữ liệu phân tích. Nhấn nút "Phân tích" bên dưới để bắt đầu.
            </div>
          )}
        </div>
      </Spin>

      <div style={{ textAlign: 'center' }}>
        <Button type="primary" icon={<RobotOutlined />} onClick={() => setModelSelectorVisible(true)} size="large">
          Phân tích
        </Button>
      </div>

      <Modal
        title="Chọn mô hình phân tích"
        open={modelSelectorVisible}
        onCancel={() => setModelSelectorVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModelSelectorVisible(false)}>Hủy</Button>,
          <Button key="start" type="primary" onClick={handleStartAnalysis}>Bắt đầu</Button>
        ]}
      >
        <div style={{ padding: '16px 0' }}>
          <Text strong>Vui lòng chọn mô hình AI:</Text>
          <Radio.Group 
            onChange={(e) => setModelType(e.target.value)} 
            value={modelType}
            style={{ display: 'flex', flexDirection: 'column', marginTop: 16, gap: 16 }}
          >
            <Radio value="genai">
              <Space>
                <ThunderboltOutlined style={{ color: '#faad14' }} />
                <Text strong>Gemini AI</Text>
                <Text type="secondary">- Phân tích sâu, chính xác, linh hoạt (Sử dụng API Key)</Text>
              </Space>
            </Radio>
            <Radio value="rule_based">
              <Space>
                <FunctionOutlined style={{ color: '#52c41a' }} />
                <Text strong>AI Thuật toán</Text>
                <Text type="secondary">- Phân tích nhanh dựa trên số liệu và công thức (Không giới hạn)</Text>
              </Space>
            </Radio>
          </Radio.Group>
        </div>
      </Modal>
    </Card>
  );
};

export default AIPanel;
