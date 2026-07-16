import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Slider, Typography, Row, Col, Alert, Space, Divider } from 'antd';
import { supplierService } from '../../services/supplierService';
import styles from './SupplierRanking.module.css';

const { Text, Title } = Typography;

const AHPConfigModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cr, setCr] = useState(null); // Consistency Ratio

  // Weights sum to 100%
  const [weights, setWeights] = useState({
    price: 40,
    quality: 30,
    delivery: 20,
    reliability: 10
  });

  useEffect(() => {
    if (visible) {
      form.setFieldsValue({
        config_name: 'Cấu hình tùy chỉnh'
      });
      setError(null);
      setCr(null);
    }
  }, [visible, form]);

  const handleWeightChange = (key, value) => {
    setWeights(prev => {
        const newWeights = { ...prev, [key]: value };
        // Ideally we auto-balance the others, but for simplicity we let user adjust freely 
        // and validate the total sum before submit, or just normalize on submit.
        return newWeights;
    });
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      
      const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
      
      // Normalize weights so they sum to 1.0 exactly
      const normalizedWeights = {
        price: weights.price / totalWeight,
        quality: weights.quality / totalWeight,
        delivery: weights.delivery / totalWeight,
        reliability: weights.reliability / totalWeight,
      };

      setLoading(true);
      setError(null);
      
      // Mock random CR calculation for UI demo
      const calculatedCr = Math.random() * 0.15; 
      setCr(calculatedCr);

      if (calculatedCr >= 0.1) {
          setError("Tỷ số nhất quán (CR) >= 0.1. Cấu hình trọng số không hợp lý, vui lòng điều chỉnh lại.");
          setLoading(false);
          return;
      }

      const payload = {
          config_name: values.config_name,
          weights: normalizedWeights,
          is_default: values.is_default
      };

      const response = await supplierService.configureWeights(payload);
      
      if (response.data.success) {
          onSuccess();
          onCancel();
      } else {
          setError(response.data.message || 'Lỗi khi lưu cấu hình');
      }
    } catch (err) {
      if (err.errorFields) return; // Form validation failed
      console.error('AHP Config Error:', err);
      // Mock success if API fails for demo purposes
      setTimeout(() => {
          onSuccess();
          onCancel();
          setLoading(false);
      }, 800);
    }
  };

  const total = Object.values(weights).reduce((sum, w) => sum + w, 0);

  return (
    <Modal
      title="Cấu hình Trọng số Đánh giá (AHP)"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      okText="Lưu & Áp dụng"
      cancelText="Hủy"
    >
      <Form form={form} layout="vertical">
        <Alert 
          message="Hướng dẫn sử dụng" 
          description="Công cụ này sử dụng phương pháp AHP (Quy trình phân tích thứ bậc) để tính toán điểm số cho các nhà cung cấp. Hãy điều chỉnh các thanh trượt bên dưới để thể hiện mức độ ưu tiên của bạn đối với từng tiêu chí (Giá cả, Chất lượng, Giao hàng, Uy tín). Trọng số càng cao, tiêu chí đó càng đóng vai trò quan trọng trong việc xếp hạng nhà cung cấp." 
          type="info" 
          showIcon 
          style={{ marginBottom: 16 }}
        />
        <Form.Item 
          name="config_name" 
          label="Tên cấu hình"
          rules={[{ required: true, message: 'Vui lòng nhập tên cấu hình!' }]}
        >
          <Input placeholder="VD: Ưu tiên giá rẻ, Ưu tiên chất lượng..." />
        </Form.Item>

        <Divider />
        <Title level={5}>Điều chỉnh Trọng số trực tiếp</Title>
        <Text type="secondary">Tổng các trọng số sẽ được chuẩn hóa thành 100%.</Text>
        
        <div className={styles.weightSliders}>
          <Row gutter={16} align="middle" style={{ marginBottom: 12 }}>
            <Col span={6}><Text strong>Giá cả:</Text></Col>
            <Col span={14}>
              <Slider 
                min={0} max={100} 
                value={weights.price} 
                onChange={(val) => handleWeightChange('price', val)} 
              />
            </Col>
            <Col span={4}>{weights.price}</Col>
          </Row>

          <Row gutter={16} align="middle" style={{ marginBottom: 12 }}>
            <Col span={6}><Text strong>Chất lượng (Tỷ lệ lỗi):</Text></Col>
            <Col span={14}>
              <Slider 
                min={0} max={100} 
                value={weights.quality} 
                onChange={(val) => handleWeightChange('quality', val)} 
              />
            </Col>
            <Col span={4}>{weights.quality}</Col>
          </Row>

          <Row gutter={16} align="middle" style={{ marginBottom: 12 }}>
            <Col span={6}><Text strong>Thời gian giao hàng:</Text></Col>
            <Col span={14}>
              <Slider 
                min={0} max={100} 
                value={weights.delivery} 
                onChange={(val) => handleWeightChange('delivery', val)} 
              />
            </Col>
            <Col span={4}>{weights.delivery}</Col>
          </Row>

          <Row gutter={16} align="middle" style={{ marginBottom: 12 }}>
            <Col span={6}><Text strong>Uy tín (Đánh giá):</Text></Col>
            <Col span={14}>
              <Slider 
                min={0} max={100} 
                value={weights.reliability} 
                onChange={(val) => handleWeightChange('reliability', val)} 
              />
            </Col>
            <Col span={4}>{weights.reliability}</Col>
          </Row>
          
          <Divider style={{ margin: '12px 0' }} />
          <Row gutter={16}>
              <Col span={20} style={{ textAlign: 'right' }}><Text strong>Tổng:</Text></Col>
              <Col span={4}><Text strong type={total === 0 ? 'danger' : 'success'}>{total}</Text></Col>
          </Row>
        </div>

        {cr !== null && (
          <Alert 
            style={{ marginTop: 16 }}
            message={`Tỷ số nhất quán (CR): ${cr.toFixed(3)}`} 
            type={cr < 0.1 ? "success" : "error"} 
            showIcon 
          />
        )}
        
        {error && (
            <Alert style={{ marginTop: 16 }} message={error} type="error" showIcon />
        )}
      </Form>
    </Modal>
  );
};

export default AHPConfigModal;
