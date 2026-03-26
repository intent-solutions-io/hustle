'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Data ─────────────────────────────────────────────────────
const CURRENT_PLAN = 'starter';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'For individual coaches starting out',
    color: 'bg-zinc-500',
    highlight: false,
    features: [
      '3 athletes',
      '10 games per month',
      'Basic analytics',
      'Dream Gym access',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 12,
    description: 'For small squads and youth teams',
    color: 'bg-amber-500',
    highlight: false,
    features: [
      '15 athletes',
      '30 games per month',
      'Full analytics',
      'Dream Gym access',
      'Invoice history',
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 29,
    description: 'For serious coaches with growing teams',
    color: 'bg-blue-500',
    highlight: true,
    features: [
      '50 athletes',
      'Unlimited games',
      'Full analytics',
      'Dream Gym access',
      'Invoice history',
      'Priority support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 59,
    description: 'For academies and professional staff',
    color: 'bg-purple-600',
    highlight: false,
    features: [
      'Unlimited athletes',
      'Unlimited games',
      'Full analytics',
      'Dream Gym access',
      'Invoice history',
      'Priority support',
      'API access',
    ],
  },
];

// ─── Modal ────────────────────────────────────────────────────
function ConfirmModal({
  from,
  to,
  onConfirm,
  onClose,
}: {
  from: (typeof PLANS)[number];
  to: (typeof PLANS)[number];
  onConfirm: () => void;
  onClose: () => void;
}) {
  const isUpgrade = to.price > from.price;
  const isDowngrade = to.price < from.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full z-10"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-full hover:bg-zinc-100 flex items-center justify-center transition-colors"
        >
          <X size={14} className="text-zinc-500" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', to.color)}>
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-zinc-900">
              {isUpgrade ? 'Upgrade to' : isDowngrade ? 'Downgrade to' : 'Switch to'} {to.name}
            </h3>
            <p className="font-body text-xs text-zinc-400">
              {to.price === 0 ? 'Free' : `$${to.price}/month`}
            </p>
          </div>
        </div>

        <div className="bg-zinc-50 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between">
            <span className="font-body text-xs text-zinc-500">Current plan</span>
            <span className="font-display text-xs font-semibold text-zinc-900">{from.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-body text-xs text-zinc-500">New plan</span>
            <span className="font-display text-xs font-semibold text-zinc-900">{to.name}</span>
          </div>
          <div className="border-t border-zinc-200 pt-2 flex justify-between">
            <span className="font-body text-xs text-zinc-500">New monthly charge</span>
            <span className="font-display text-sm font-semibold text-zinc-900">
              {to.price === 0 ? 'Free' : `$${to.price}/mo`}
            </span>
          </div>
        </div>

        {isDowngrade && (
          <p className="font-body text-xs text-amber-600 bg-amber-50 rounded-xl p-3 mb-4">
            Downgrading may remove access to features and data above your new plan&apos;s limits.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full font-display font-semibold text-sm bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            className={cn(
              'flex-1 py-2.5 rounded-full font-display font-semibold text-sm transition-colors',
              isDowngrade
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-zinc-900 text-white hover:bg-zinc-800'
            )}
          >
            Confirm Change
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Success state ────────────────────────────────────────────
function SuccessState({ plan }: { plan: (typeof PLANS)[number] }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4', plan.color)}
      >
        <Check size={28} className="text-white" strokeWidth={3} />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="font-display text-xl font-semibold text-zinc-900 mb-2"
      >
        You&apos;re now on {plan.name}!
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="font-body text-sm text-zinc-500 mb-6"
      >
        Your plan has been updated. Changes take effect immediately.
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <Link
          href="/dashboard/billing"
          className="px-6 py-2.5 rounded-full font-display font-semibold text-sm bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
        >
          Back to Billing
        </Link>
      </motion.div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function ChangePlanPage() {
  const currentPlan = PLANS.find((p) => p.id === CURRENT_PLAN)!;
  const [selected, setSelected] = useState<string>(CURRENT_PLAN);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const selectedPlan = PLANS.find((p) => p.id === selected)!;
  const canChange = selected !== CURRENT_PLAN;

  const handleConfirm = () => {
    setConfirming(false);
    setConfirmed(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1.5 font-body text-sm text-zinc-500 hover:text-zinc-800 transition-colors mb-4"
        >
          <ChevronLeft size={15} />
          Billing
        </Link>
        <h2 className="font-display text-2xl font-semibold text-zinc-900">Change Plan</h2>
        <p className="font-body text-sm text-zinc-500">Select the plan that fits your needs</p>
      </motion.div>

      {confirmed ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <SuccessState plan={selectedPlan} />
        </motion.div>
      ) : (
        <>
          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan, i) => {
              const isCurrent = plan.id === CURRENT_PLAN;
              const isSelected = plan.id === selected;

              return (
                <motion.button
                  key={plan.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 + i * 0.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(plan.id)}
                  className={cn(
                    'relative text-left rounded-2xl p-5 border-2 transition-all shadow-sm',
                    isSelected
                      ? 'border-amber-500 bg-amber-50/40'
                      : 'border-zinc-100 bg-white hover:border-zinc-300'
                  )}
                >
                  {isCurrent && (
                    <span className="absolute top-3 right-3 font-body text-[10px] font-semibold px-2 py-0.5 bg-amber-500 text-white rounded-full">
                      Current
                    </span>
                  )}
                  {plan.highlight && !isCurrent && (
                    <span className="absolute top-3 right-3 font-body text-[10px] font-semibold px-2 py-0.5 bg-blue-500 text-white rounded-full">
                      Popular
                    </span>
                  )}

                  <div
                    className={cn(
                      'w-9 h-9 rounded-xl flex items-center justify-center mb-3',
                      plan.color
                    )}
                  >
                    <Zap size={16} className="text-white" fill="white" />
                  </div>

                  <p className="font-display text-base font-semibold text-zinc-900 mb-0.5">
                    {plan.name}
                  </p>
                  <p className="font-display text-2xl font-semibold text-zinc-900 mb-1">
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                    {plan.price > 0 && (
                      <span className="font-body text-xs font-normal text-zinc-400">/mo</span>
                    )}
                  </p>
                  <p className="font-body text-xs text-zinc-400 mb-4">{plan.description}</p>

                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <Check size={12} className="text-green-500 shrink-0" strokeWidth={3} />
                        <span className="font-body text-xs text-zinc-600">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {isSelected && !isCurrent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute top-3 left-3 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center"
                    >
                      <Check size={10} className="text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="flex items-center justify-between bg-white rounded-2xl px-5 py-4 shadow-sm"
          >
            <div>
              <p className="font-display text-sm font-semibold text-zinc-900">
                {canChange
                  ? `Switch to ${selectedPlan.name} — ${selectedPlan.price === 0 ? 'Free' : `$${selectedPlan.price}/mo`}`
                  : 'Select a different plan to continue'}
              </p>
              <p className="font-body text-xs text-zinc-400">
                {canChange
                  ? 'Changes take effect immediately after confirmation'
                  : `Currently on ${currentPlan.name}`}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => canChange && setConfirming(true)}
              disabled={!canChange}
              className={cn(
                'shrink-0 px-5 py-2.5 rounded-full font-display font-semibold text-sm transition-colors',
                canChange
                  ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                  : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
              )}
            >
              Confirm Change
            </motion.button>
          </motion.div>
        </>
      )}

      {/* Confirmation modal */}
      <AnimatePresence>
        {confirming && (
          <ConfirmModal
            from={currentPlan}
            to={selectedPlan}
            onConfirm={handleConfirm}
            onClose={() => setConfirming(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
