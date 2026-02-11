'use client';

import { motion } from 'framer-motion';
import { Shield, Users, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Verified Performance',
    description: 'Team-validated statistics that college recruiters can trust',
    gradient: 'from-blue-500 to-cyan-400',
    glow: 'shadow-blue-500/25',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    borderHover: 'hover:border-blue-200',
    accentBar: 'bg-gradient-to-r from-blue-500 to-cyan-400',
  },
  {
    icon: TrendingUp,
    title: 'Development Tracking',
    description: 'Comprehensive progress analytics across seasons and tournaments',
    gradient: 'from-emerald-500 to-teal-400',
    glow: 'shadow-emerald-500/25',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    borderHover: 'hover:border-emerald-200',
    accentBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
  },
  {
    icon: Users,
    title: 'Team Transparency',
    description: 'Shared visibility creates accountability and builds trust',
    gradient: 'from-violet-500 to-purple-400',
    glow: 'shadow-violet-500/25',
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    borderHover: 'hover:border-violet-200',
    accentBar: 'bg-gradient-to-r from-violet-500 to-purple-400',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
      duration: 0.6,
    },
  },
};

export function LandingFeatures() {
  return (
    <div className="py-20">
      <motion.div
        className="grid md:grid-cols-3 gap-8"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        {features.map((feature) => (
          <motion.div
            key={feature.title}
            variants={cardVariants}
            whileHover={{ y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`group relative text-center space-y-5 cursor-default rounded-2xl p-8 border border-zinc-100 bg-white ${feature.borderHover} hover:shadow-xl hover:${feature.glow} transition-all duration-300 overflow-hidden`}
          >
            {/* Top accent bar */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${feature.accentBar} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

            {/* Icon with colored background */}
            <motion.div
              className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${feature.iconBg} transition-colors duration-300`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
            </motion.div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-zinc-900">
              {feature.title}
            </h3>

            {/* Description */}
            <p className="text-zinc-500 text-sm leading-relaxed">
              {feature.description}
            </p>

            {/* Bottom gradient line that slides in on hover */}
            <div className="pt-2">
              <div className={`mx-auto h-0.5 w-0 group-hover:w-12 ${feature.accentBar} rounded-full transition-all duration-500`} />
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
