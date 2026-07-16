import React from 'react';
import useDocumentTitle from '../../hooks/useDocumentTitle';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export const NotFoundPage = () => {
  useDocumentTitle('404 Không tìm thấy');
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Result
        status="404"
        title="404"
        subTitle="Xin lỗi, trang bạn truy cập không tồn tại."
        extra={<Button type="primary" onClick={() => navigate('/')}>Về Trang chủ</Button>}
      />
    </div>
  );
};

export default NotFoundPage;


