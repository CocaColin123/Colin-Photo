/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, Component, ReactNode } from 'react';
import LandingPage from './components/LandingPage';

class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-red-500 bg-black h-screen w-full font-mono text-sm overflow-auto">
          <h1 className="text-xl mb-4">Something went wrong.</h1>
          <pre>{this.state.error?.message}</pre>
          <pre className="mt-4 text-xs text-red-400">{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [entered, setEntered] = useState(false);

  if (entered) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0a0f] text-white">
        <h1 className="text-2xl font-light tracking-[0.2em] text-[#c9a96e]">
          作品集展示区
        </h1>
        <p className="mt-4 text-sm text-white/40 tracking-widest">
          (Portfolio Content Goes Here)
        </p>
        <button 
          onClick={() => setEntered(false)}
          className="mt-12 text-[13px] tracking-[0.15em] text-white/50 hover:text-white transition-colors"
        >
          返回首页
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <LandingPage onEnter={() => setEntered(true)} />
    </ErrorBoundary>
  );
}
