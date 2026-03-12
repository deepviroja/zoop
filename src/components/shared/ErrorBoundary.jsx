import React from "react";
import { AlertCircle } from "../../assets/icons/AlertCircle";
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-white/5 flex flex-col items-center justify-center p-4">
          <div className="bg-white dark:glass-card p-8 rounded-3xl shadow-xl dark:shadow-[0_16px_48px_rgba(0,0,0,0.5)] max-w-lg w-full text-center border border-red-100">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle width={40} height={40} className="text-red-500" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
              Something went wrong.
            </h1>
            <p className="text-gray-500 mb-6">
              We encountered an unexpected error. Please try refreshing the
              page.
            </p>

            <div className="bg-gray-900 p-4 rounded-xl overflow-x-auto text-left mb-6">
              <code className="text-red-400 text-xs font-mono">
                {this.state.error && this.state.error.toString()}
              </code>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-black transition-all w-full"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
