'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Zap,
  Users,
  GamepadIcon,
  Download,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Mock data ────────────────────────────────────────────────
const currentPlan = {
  name: 'Starter',
  status: 'active' as const,
  price: 12,
  period: 'month',
  renewsOn: 'Apr 22, 2026',
};

const usage = [
  { label: 'Athletes', used: 8, max: 15, icon: Users, color: 'bg-amber-500' },
  { label: 'Games this month', used: 14, max: 30, icon: GamepadIcon, color: 'bg-blue-500' },
];

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'For individual coaches starting out',
    features: ['3 athletes', '10 games/month', 'Basic analytics', 'Dream Gym access'],
    missing: ['Advanced analytics', 'Invoice history', 'Priority support'],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 12,
    description: 'For small squads and youth teams',
    features: ['15 athletes', '30 games/month', 'Full analytics', 'Dream Gym access', 'Invoice history'],
    missing: ['Priority support', 'API access'],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 29,
    description: 'For serious coaches with growing teams',
    features: ['50 athletes', 'Unlimited games', 'Full analytics', 'Dream Gym access', 'Invoice history', 'Priority support'],
    missing: ['API access'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    description: 'For academies and professional staff',
    features: ['Unlimited athletes', 'Unlimited games', 'Full analytics', 'Dream Gym access', 'Invoice history', 'Priority support', 'API access'],
    missing: [],
  },
];

const invoices = [
  { id: 'INV-0041', date: 'Mar 1, 2026', amount: 12.0, status: 'paid' as const },
  { id: 'INV-0038', date: 'Feb 1, 2026', amount: 12.0, status: 'paid' as const },
  { id: 'INV-0034', date: 'Jan 1, 2026', amount: 12.0, status: 'paid' as const },
  { id: 'INV-0030', date: 'Dec 1, 2025', amount: 12.0, status: 'paid' as const },
  { id: 'INV-0026', date: 'Nov 1, 2025', amount: 9.0, status: 'paid' as const },
  { id: 'INV-0022', date: 'Oct 1, 2025', amount: 9.0, status: 'paid' as const },
];

const STATUS_CONFIG = {
  paid: { label: 'Paid', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  failed: { label: 'Failed', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

// ─── Page ─────────────────────────────────────────────────────
export default function BillingPage() {
  const [openSection, setOpenSection] = useState<string | null>(null);
  void openSection;
  void setOpenSection;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-display text-2xl font-semibold text-zinc-900">Billing</h2>
        <p className="font-body text-sm text-zinc-500">Manage your subscription and invoices</p>
      </motion.div>

      {/* Current plan + usage */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-5">
        {/* Plan card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="bg-white rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" fill="white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-semibold text-zinc-900">
                    {currentPlan.name}
                  </h3>
                  <span className="font-body text-xs font-medium px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                    Active
                  </span>
                </div>
                <p className="font-body text-xs text-zinc-400">
                  Renews {currentPlan.renewsOn}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-semibold text-zinc-900">
                ${currentPlan.price}
              </p>
              <p className="font-body text-xs text-zinc-400">/{currentPlan.period}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full font-display font-semibold text-sm bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
            >
              <ExternalLink size={13} />
              Manage Billing
            </motion.button>
            <Link
              href="/dashboard/billing/change-plan"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full font-display font-semibold text-sm bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <CreditCard size={13} />
              Change Plan
            </Link>
          </div>
        </motion.div>

        {/* Usage */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          className="bg-white rounded-2xl p-5 shadow-sm space-y-4"
        >
          <h3 className="font-display text-base font-semibold text-zinc-900">Usage</h3>
          {usage.map((item) => {
            const pct = Math.min((item.used / item.max) * 100, 100);
            const near = pct >= 80;
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <item.icon size={13} className="text-zinc-400" />
                    <span className="font-body text-xs font-medium text-zinc-600">
                      {item.label}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'font-display text-xs font-semibold',
                      near ? 'text-amber-600' : 'text-zinc-500'
                    )}
                  >
                    {item.used}/{item.max}
                  </span>
                </div>
                <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', near ? 'bg-amber-500' : item.color)}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
                  />
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* Plan comparison */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-zinc-100">
          <h3 className="font-display text-base font-semibold text-zinc-900">Plans</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 divide-x-0 lg:divide-x divide-zinc-100">
          {plans.map((plan) => {
            const isCurrent = plan.id === 'starter';
            return (
              <div
                key={plan.id}
                className={cn(
                  'p-4 flex flex-col',
                  isCurrent && 'bg-amber-50/60'
                )}
              >
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-display text-sm font-semibold text-zinc-900">
                      {plan.name}
                    </p>
                    {isCurrent && (
                      <span className="font-body text-[10px] font-semibold px-1.5 py-0.5 bg-amber-500 text-white rounded-full leading-none">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="font-display text-xl font-semibold text-zinc-900">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    {plan.price > 0 && (
                      <span className="font-body text-xs font-normal text-zinc-400">/mo</span>
                    )}
                  </p>
                </div>

                <ul className="space-y-1.5 flex-1 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                      <span className="font-body text-xs text-zinc-600">{f}</span>
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 opacity-40">
                      <span className="text-zinc-400 mt-0.5 shrink-0">✕</span>
                      <span className="font-body text-xs text-zinc-400 line-through">{f}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <span className="block w-full text-center py-2 rounded-full font-display font-semibold text-xs bg-amber-100 text-amber-700">
                    Current Plan
                  </span>
                ) : (
                  <Link
                    href="/dashboard/billing/change-plan"
                    className={cn(
                      'block w-full text-center py-2 rounded-full font-display font-semibold text-xs transition-colors',
                      plan.price > 12
                        ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                    )}
                  >
                    {plan.price > 12 ? 'Upgrade' : 'Downgrade'}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Invoice history */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.13 }}
        className="bg-white rounded-2xl shadow-sm overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-zinc-100">
          <h3 className="font-display text-base font-semibold text-zinc-900">Invoice History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="border-b border-zinc-50 bg-zinc-50/60">
                {['Invoice', 'Date', 'Amount', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-left font-body text-xs font-semibold text-zinc-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv, i) => {
                const cfg = STATUS_CONFIG[inv.status];
                return (
                  <tr
                    key={inv.id}
                    className={cn(
                      'border-b border-zinc-50 last:border-0 hover:bg-zinc-50/50 transition-colors',
                      i === 0 && 'bg-amber-50/20'
                    )}
                  >
                    <td className="px-5 py-3 font-body text-sm font-medium text-zinc-800">
                      {inv.id}
                    </td>
                    <td className="px-5 py-3 font-body text-sm text-zinc-500">{inv.date}</td>
                    <td className="px-5 py-3 font-display text-sm font-semibold text-zinc-900">
                      ${inv.amount.toFixed(2)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 font-body text-xs font-medium px-2 py-0.5 rounded-full',
                          cfg.bg,
                          cfg.color
                        )}
                      >
                        <cfg.icon size={11} />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button className="inline-flex items-center gap-1 font-body text-xs text-zinc-400 hover:text-zinc-700 transition-colors">
                        <Download size={12} />
                        PDF
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
