import React from 'react';

interface GoldErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface GoldErrorBoundaryState {
  hasError: boolean;
}

/**
 * Keeps the Gold+ layer optional at runtime. If a derived metric or a newly
 * added panel fails, the core Lin Go path and lesson player must continue to
 * work instead of taking the whole screen down.
 */
export class GoldErrorBoundary extends React.Component<GoldErrorBoundaryProps, GoldErrorBoundaryState> {
  state: GoldErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): GoldErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Gold+ panel failed; continuing with the core app.', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.06] px-4 py-3 text-center text-[10px] font-bold text-amber-100" dir="rtl">
          تعذّر تحميل لوحة Gold+ الآن. مسارك ودروسك تعمل بشكل طبيعي.
        </div>
      );
    }
    return this.props.children;
  }
}
