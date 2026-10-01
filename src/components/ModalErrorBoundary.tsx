import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ModalErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Modal failed to load:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#FAF5EA] p-6 rounded-lg shadow-xl text-center max-w-sm mx-4">
            <h3 className="text-[#8C2711] font-semibold mb-2">Something went wrong</h3>
            <p className="text-sm text-[#665141] mb-4">We couldn't load this content. Please check your connection and try again.</p>
            <button
              onClick={() => {
                (this as any).setState({ hasError: false });
                window.location.reload();
              }}
              className="px-4 py-2 bg-[#8C2711] text-[#FAF5EA] rounded text-sm hover:bg-[#5C1A0B] transition-colors"
            >
              Tap to retry
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
