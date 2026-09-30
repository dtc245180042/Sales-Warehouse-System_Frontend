import { Component } from 'react';
import ErrorPage from '../pages/ErrorPage';

/**
 * ErrorBoundary - Bắt mọi ngoại lệ JavaScript Runtime không mong muốn trong React Component Tree
 * Ngăn chặn tuyệt đối tình trạng "trang trắng" (White Screen of Death) và điều hướng sang màn hình lỗi 500
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Cập nhật state để render màn hình lỗi 500 ở lần render tiếp theo
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Ghi log chi tiết lỗi ra console và lưu lại thông tin vết stack trace
    console.error('[React ErrorBoundary Caught Runtime Exception]:', error, errorInfo);
    this.setState({ errorInfo });

    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          errorType={500}
          userRole={this.props.userRole || null}
          onGoHome={() => {
            this.handleReset();
            window.location.href = '/';
          }}
          onGoBack={() => this.handleReset()}
          onLogin={() => {
            this.handleReset();
            window.location.href = '#login';
          }}
          onRetry={() => this.handleReset()}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
