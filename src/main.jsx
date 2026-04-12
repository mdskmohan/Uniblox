/**
 * main.jsx
 *
 * Application entry point. Mounts the React tree into the #root DOM node.
 * ErrorBoundary at this level catches any catastrophic errors that escape
 * the per-shell boundaries, preventing a completely blank page.
 *
 * React.StrictMode is enabled to surface potential issues during development
 * (double-invoked effects, deprecated API warnings, etc.). It has no effect
 * in production builds.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)
