import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("BugRadar Caught UI Exception:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || String(this.state.error) || 'An unexpected rendering issue occurred.';
      return (
        <div className="max-w-3xl mx-auto my-12 p-8 rounded-3xl border border-red-500/30 bg-red-500/10 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-red-400">View Rendering Degraded Gracefully</h2>
          <p className="text-xs sm:text-sm text-gray-400 max-w-lg mx-auto font-mono">
            {errorMsg}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-black font-bold text-xs shadow transition-all inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Recovering View</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
