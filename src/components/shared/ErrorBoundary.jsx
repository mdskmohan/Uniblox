/**
 * ErrorBoundary.jsx
 *
 * React class-based error boundary that catches unhandled render/lifecycle
 * errors anywhere in its subtree. Because React hooks cannot be used inside
 * class components, this must remain a class component.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomePage />
 *   </ErrorBoundary>
 *
 * Or with a custom fallback:
 *   <ErrorBoundary fallback={<p>Something went wrong.</p>}>
 *     <SomePage />
 *   </ErrorBoundary>
 *
 * In development the error and stack trace are surfaced in the UI.
 * In production only a clean recovery screen is shown.
 */

import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  /** Called when a descendant throws during rendering. */
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  /** Called after the error is caught — good place for logging / Sentry. */
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })

    // TODO: wire up a real error-reporting service (e.g. Sentry) here:
    // Sentry.captureException(error, { extra: errorInfo })
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
  }

  handleReset() {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    const { hasError, error, errorInfo } = this.state
    const { children, fallback } = this.props
    const isDev = import.meta.env.DEV

    if (!hasError) return children

    // Custom fallback provided by parent
    if (fallback) return fallback

    // Default recovery UI
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 rounded-full bg-destructive-light flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-destructive" />
          </div>

          <h2 className="text-lg font-semibold text-ink-primary mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-ink-secondary mb-6">
            An unexpected error occurred while rendering this page.
            Your data is safe — try refreshing or navigating back.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => this.handleReset()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                         bg-brand text-white rounded hover:bg-brand-hover transition-colors"
            >
              <RefreshCw size={14} /> Try again
            </button>
            <button
              onClick={() => window.location.assign('/')}
              className="px-4 py-2 text-sm font-medium border border-line rounded
                         text-ink-secondary hover:bg-surface-hover transition-colors"
            >
              Go to home
            </button>
          </div>

          {/* Show technical details in development only */}
          {isDev && error && (
            <details className="mt-6 text-left">
              <summary className="text-xs font-mono text-ink-tertiary cursor-pointer hover:text-ink-primary">
                Show error details (dev only)
              </summary>
              <pre className="mt-2 p-3 bg-surface-secondary border border-line rounded
                              text-xs font-mono text-destructive-text overflow-x-auto whitespace-pre-wrap">
                {error.toString()}
                {errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      </div>
    )
  }
}
