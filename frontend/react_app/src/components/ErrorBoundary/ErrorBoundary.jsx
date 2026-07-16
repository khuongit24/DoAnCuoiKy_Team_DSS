import React from 'react';
import { Result, Button } from 'antd';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
          <Result
            status="500"
            title="Đã xảy ra lỗi hệ thống"
            subTitle={this.state.error?.message || "Rất xin lỗi, có lỗi không mong muốn xảy ra."}
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
