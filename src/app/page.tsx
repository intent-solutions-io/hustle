import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Shield, Users, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header */}
      <header className="border-b border-zinc-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">HUSTLE</h1>
          </div>
          <Link href="/login">
            <Button variant="ghost" className="text-zinc-600 hover:text-zinc-900 font-medium">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section - Premium Spacing */}
      <main className="max-w-5xl mx-auto px-6 lg:px-8">
        <div className="pt-16 pb-12 md:pt-20 md:pb-16 text-center">
          {/* Primary Value Proposition */}
          <div className="space-y-8 mb-12">
            <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-zinc-900 tracking-tight leading-[1.1] max-w-4xl mx-auto">
              performance DATA
              <br />
              recruiters trust
            </h2>
            <p className="text-xl md:text-2xl text-zinc-600 max-w-3xl mx-auto leading-relaxed font-light">
              Professional athletic tracking for families invested in elite player development and college recruiting.
            </p>
          </div>

          {/* Trust Signal Quote */}
          <div className="mb-12">
            <div className="max-w-3xl mx-auto border-l-2 border-zinc-900 pl-8 text-left">
              <p className="text-lg md:text-xl text-zinc-700 italic font-light leading-relaxed">
                &ldquo;When teammates can see the data, honesty becomes automatic. When coaches can verify performance, recruiting becomes transparent.&rdquo;
              </p>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="space-y-6">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-zinc-900 hover:bg-zinc-800 text-white h-14 px-10 text-base font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                Begin Tracking
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <p className="text-sm text-zinc-500">
              Trusted by families at elite clubs nationwide
            </p>
          </div>
        </div>

        {/* Value Props - Refined */}
        <div className="border-t border-zinc-100 pt-12 pb-16">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-50">
                <Shield className="w-6 h-6 text-zinc-900" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Verified Performance</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Team-validated statistics that college recruiters can trust
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-50">
                <TrendingUp className="w-6 h-6 text-zinc-900" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Development Tracking</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Comprehensive progress analytics across seasons and tournaments
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-50">
                <Users className="w-6 h-6 text-zinc-900" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Team Transparency</h3>
              <p className="text-zinc-600 text-sm leading-relaxed">
                Shared visibility creates accountability and builds trust
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 mt-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900">Sign In</Link>
              <Link href="/register" className="text-sm text-zinc-600 hover:text-zinc-900">Get Started</Link>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-zinc-500">
                © 2025 Hustle. Professional athletic performance tracking.
              </p>
              <p className="text-xs text-zinc-400">
                Created by{' '}
                <a href="https://intentsolutions.io" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 underline">
                  intentsolutions.io
                </a>
                {' '}| Owned and operated by{' '}
                <a href="https://jeremylongshore.com" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-600 underline">
                  jeremylongshore.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
