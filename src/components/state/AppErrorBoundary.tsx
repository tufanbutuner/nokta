import { Component, type ReactNode } from "react";
import { RouteErrorState } from "@/components/state/RouteErrorState";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <RouteErrorState devDetail={import.meta.env.DEV ? this.state.error.stack : null} />;
    }

    return this.props.children;
  }
}
