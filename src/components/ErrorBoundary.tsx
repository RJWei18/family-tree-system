import { Component } from "react"; import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-500 bg-slate-900 h-screen">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <div className="bg-slate-800 p-4 rounded-lg overflow-auto font-mono text-sm">
            <p className="font-bold mb-2">{this.state.error && this.state.error.toString()}</p>
            <pre className="whitespace-pre-wrap text-slate-400">
               {this.state.errorInfo && this.state.errorInfo.componentStack}
            </pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
