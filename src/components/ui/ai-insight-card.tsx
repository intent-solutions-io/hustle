'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type InsightType = 'strategy' | 'analytics' | 'tip';
type State = 'idle' | 'loading' | 'done' | 'error';

interface AIInsightCardProps {
  type: InsightType;
  context: Record<string, unknown>;
  title?: string;
  /** Load immediately on mount (tip of the day). Default: false — shows a button. */
  autoLoad?: boolean;
  className?: string;
}

export function AIInsightCard({
  type,
  context,
  title = 'AI Insight',
  autoLoad = false,
  className,
}: AIInsightCardProps) {
  const [state, setState] = useState<State>('idle');
  const [result, setResult] = useState('');
  const contextRef = useRef(context);
  // Keep ref current on every render so the Refresh button always sends fresh context
  contextRef.current = context;

  const fetchInsight = async (ctx: Record<string, unknown>) => {
    setState('loading');
    setResult('');
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, context: ctx }),
      });
      if (!res.ok) throw new Error('Request failed');
      const data = await res.json() as { result: string };
      setResult(data.result);
      setState('done');
    } catch {
      setState('error');
    }
  };

  useEffect(() => {
    contextRef.current = context;
    if (autoLoad) fetchInsight(context);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad]);

  const handleTrigger = () => fetchInsight(contextRef.current);

  return (
    <div className={cn('bg-white rounded-2xl p-5 shadow-sm', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-violet-600" />
          </div>
          <span className="font-display text-sm font-semibold text-zinc-900">{title}</span>
          <span className="font-body text-[10px] font-semibold px-1.5 py-0.5 bg-violet-50 text-violet-600 rounded-full">
            AI
          </span>
        </div>

        {state !== 'idle' && (
          <button
            onClick={handleTrigger}
            disabled={state === 'loading'}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors disabled:opacity-40"
            aria-label="Refresh"
          >
            <RefreshCw size={13} className={state === 'loading' ? 'animate-spin' : ''} />
          </button>
        )}
      </div>

      {/* Body */}
      <AnimatePresence mode="wait">
        {state === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="font-body text-xs text-zinc-400 mb-3">
              Get personalised AI coaching powered by Gemini.
            </p>
            <button
              onClick={handleTrigger}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 text-white font-display text-xs font-semibold hover:bg-violet-700 transition-colors"
            >
              <Sparkles size={12} />
              Generate insight
            </button>
          </motion.div>
        )}

        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2.5"
          >
            {[100, 90, 80].map((w, i) => (
              <div
                key={i}
                className="h-3 bg-zinc-100 rounded-full animate-pulse"
                style={{ width: `${w}%` }}
              />
            ))}
            <p className="font-body text-xs text-zinc-400 pt-1">Thinking…</p>
          </motion.div>
        )}

        {state === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="font-body text-sm text-zinc-700 whitespace-pre-line leading-relaxed">
              {result}
            </p>
          </motion.div>
        )}

        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2"
          >
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-body text-xs text-red-500 mb-2">
                Could not reach the AI agent. Check your Vertex AI credentials.
              </p>
              <button
                onClick={handleTrigger}
                className="font-body text-xs font-semibold text-zinc-600 underline underline-offset-2 hover:text-zinc-900"
              >
                Try again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
