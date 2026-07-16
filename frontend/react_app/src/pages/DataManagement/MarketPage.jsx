import React from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Card, Row, Col, Typography, Button, Space } from 'antd';
import { GlobalOutlined, LinkOutlined, LineChartOutlined } from '@ant-design/icons';
import { PageHeader } from '../../components/Common/PageHeader';

const { Title, Text, Paragraph } = Typography;

export const MarketPage = () => {
  useDocumentTitle('Thị trường linh kiện');

  const marketResources = [
    {
      title: 'Octopart',
      description: 'Công cụ tìm kiếm linh kiện điện tử mạnh mẽ, theo dõi giá cả, tồn kho từ hàng ngàn nhà cung cấp toàn cầu.',
      link: 'https://octopart.com/',
      icon: <GlobalOutlined style={{ fontSize: 32, color: '#1890ff' }} />
    },
    {
      title: 'Mouser Electronics',
      description: 'Nhà phân phối linh kiện bán dẫn và điện tử ủy quyền lớn, thường xuyên cập nhật xu hướng giá linh kiện mới nhất.',
      link: 'https://www.mouser.vn/',
      icon: <LineChartOutlined style={{ fontSize: 32, color: '#52c41a' }} />
    },
    {
      title: 'Digi-Key',
      description: 'Cung cấp hàng triệu linh kiện từ hàng ngàn nhà sản xuất. Nơi tốt nhất để tra cứu giá cả linh kiện công nghiệp và vi mạch.',
      link: 'https://www.digikey.com/',
      icon: <LinkOutlined style={{ fontSize: 32, color: '#faad14' }} />
    },
    {
      title: 'Tom\'s Hardware',
      description: 'Cập nhật tin tức và đánh giá thị trường thiết bị máy tính, GPU, CPU, RAM mới nhất và chi tiết nhất.',
      link: 'https://www.tomshardware.com/',
      icon: <GlobalOutlined style={{ fontSize: 32, color: '#f5222d' }} />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Theo Dõi Thị Trường Điện Tử"
        breadcrumbs={[{ title: 'Trang chủ', path: '/' }, { title: 'Dữ liệu' }, { title: 'Thị trường' }]}
        description="Theo dõi biến động giá và nguồn cung linh kiện thông qua các đối tác và chuyên trang uy tín toàn cầu."
      />

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {marketResources.map((resource, index) => (
          <Col xs={24} md={12} lg={12} key={index}>
            <Card 
              hoverable 
              className="shadow-sm"
              style={{ height: '100%' }}
              actions={[
                <Button 
                  type="primary" 
                  href={resource.link} 
                  target="_blank" 
                  icon={<LinkOutlined />}
                >
                  Truy cập ngay
                </Button>
              ]}
            >
              <Card.Meta 
                avatar={resource.icon}
                title={<Title level={4}>{resource.title}</Title>}
                description={
                  <Paragraph type="secondary" style={{ minHeight: 45 }}>
                    {resource.description}
                  </Paragraph>
                }
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default MarketPage;


