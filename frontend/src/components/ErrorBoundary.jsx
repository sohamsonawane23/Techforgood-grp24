import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Catches render-time errors anywhere below it in the tree and shows a
 * visible fallback instead of leaving the page blank with no
 * indication anything went wrong. Without this, any uncaught error in
 * a page component (e.g. a map widget, a malformed API response)
 * unmounts the entire app silently - clicking a nav link would appear
 * to "do nothing" with no clue why.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Surfaced in the browser console (F12 → Console) so it's easy to
    // screenshot and diagnose, in addition to the on-screen fallback.
    console.error('CivicCare render error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) this.props.onReset();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="max-w-lg mx-auto mt-12 text-center space-y-4 bg-white/5 border border-white/10 rounded-3xl p-8">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-100">Something went wrong loading this page</h2>
          <p className="text-sm text-slate-400">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <p className="text-xs text-slate-500">
            Open the browser console (F12) for the full error details if this keeps happening.
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
