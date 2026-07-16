import React, { Component } from 'react';
import { Result, Button } from 'antd';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px' }}>
          <Result
            status="500"
            title="Đã có lỗi xảy ra"
            subTitle="Hệ thống gặp sự cố trong quá trình hiển thị giao diện này."
            extra={
              <Button type="primary" onClick={() => window.location.reload()}>
                Tải lại trang
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
