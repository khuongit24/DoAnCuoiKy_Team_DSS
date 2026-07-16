import React, { useState } from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Card, Switch, Typography, Row, Col, Divider, Space, List } from 'antd';
import { SettingOutlined, TeamOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export const SettingsPage = () => {
  useDocumentTitle('Settings');
  const [advancedMode, setAdvancedMode] = useState(false);

  const teamMembers = [
    'Trần Tuấn Khương - 2274802010440',
    'Nguyễn Hoàng Thông – 2274802010856',
    'Phan Hùng Phúc – 2174802010589'
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6" style={{ marginBottom: 24 }}>
        <SettingOutlined style={{ fontSize: 24, color: '#3b82f6', marginRight: 8 }} />
        <Title level={2} style={{ margin: 0, display: 'inline-block' }}>Cài đặt hệ thống</Title>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title={<><TeamOutlined style={{ marginRight: 8 }}/>Thông tin Nhóm Phát Triển</>} bordered={false} className="shadow-sm">
            <Title level={4}>Nhóm 7</Title>
            <List
              dataSource={teamMembers}
              renderItem={(item) => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Cài đặt hệ thống" bordered={false} className="shadow-sm">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>Cài đặt nâng cao</Text>
                <br />
                <Text type="secondary">Dành cho Developer và Tester</Text>
              </div>
              <Switch checked={advancedMode} onChange={(checked) => setAdvancedMode(checked)} />
            </div>
            
            {advancedMode && (
              <>
                <Divider />
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>Chế độ gỡ lỗi (Debug Mode)</Text>
                      <br />
                      <Text type="secondary">Hiển thị log chi tiết trên console</Text>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>Xóa bộ nhớ đệm (Clear Cache)</Text>
                      <br />
                      <Text type="secondary">Xóa dữ liệu API lưu trữ cục bộ</Text>
                    </div>
                    <Switch defaultChecked={false} onChange={(c) => c && localStorage.clear()} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>Mô phỏng độ trễ (Simulate Latency)</Text>
                      <br />
                      <Text type="secondary">Thêm độ trễ giả lập cho request</Text>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                </Space>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SettingsPage;


