import React from 'react';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

export class ErrorBoundary extends React.Component<Props, { hasError: boolean; error?: Error }> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('UI crash:', error, info.componentStack);
  }

  handleReset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Georgia, serif', color: '#4a3f35', background: '#faf4eb', padding: '20px', textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>😕</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 400, margin: '0 0 8px' }}>Something went wrong</h2>
            <p style={{ color: '#7b6a5d', margin: '0 0 18px', maxWidth: '420px' }}>
              We hit an unexpected error. Please refresh the page or go back and try again.
            </p>
            <button onClick={this.handleReset} style={{
              padding: '10px 22px', borderRadius: '10px', border: 'none', background: '#b07f56', color: '#fff',
              cursor: 'pointer', fontWeight: 700
            }}>Try Again</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
