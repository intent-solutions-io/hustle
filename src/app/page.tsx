import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Shield, Users, TrendingUp, ExternalLink, Mail } from 'lucide-react';
import { WaitlistForm } from '@/components/waitlist-form';

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
            <h1 className="text-xl font-semibold text-zinc-900 tracking-tight">
              HUSTLE<sup className="text-[0.5em] align-super">™</sup>
            </h1>
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

          {/* Early Access Notice */}
          <div className="space-y-6 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 rounded-full border border-amber-200">
              <span className="text-sm font-medium text-amber-800">
                🚧 Currently in Development
              </span>
            </div>
            <p className="text-base text-zinc-600 max-w-2xl mx-auto leading-relaxed">
              We're actively building the platform athletes and families deserve.
              <strong className="text-zinc-900"> Want to try what we have so far?</strong> Create an account and explore the early features.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="bg-zinc-900 hover:bg-zinc-800 text-white h-14 px-10 text-base font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                >
                  Try Early Access
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a
                href="https://intentsolutions.io/survey"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 text-base font-medium rounded-lg border-2 border-zinc-200 hover:border-zinc-900 transition-all"
                >
                  Share Feedback
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>

            <p className="text-sm text-zinc-500">
              Early access available now • Your feedback shapes the future
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

        {/* Two-Path CTA Section */}
        <div className="border-t border-zinc-100 pt-16 pb-20">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-3">
              Choose Your Path
            </h2>
            <p className="text-zinc-600">
              Jump in now or stay updated—your choice
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
            {/* Path 1: Try Now */}
            <div className="bg-zinc-50 p-6 md:p-8 rounded-2xl border-2 border-zinc-900 relative">
              <div className="absolute -top-3 left-8">
                <span className="bg-zinc-900 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  RECOMMENDED
                </span>
              </div>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-zinc-900">
                    Try It Now
                  </h3>
                  <p className="text-zinc-600">
                    Create your account and start tracking player stats immediately. Help us shape the platform with your feedback.
                  </p>
                </div>
                <ul className="space-y-3 text-sm text-zinc-700">
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-900">✓</span>
                    <span>Full access to current features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-900">✓</span>
                    <span>Help shape future development</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-zinc-900">✓</span>
                    <span>Free during development</span>
                  </li>
                </ul>
                <Link href="/register" className="block">
                  <Button
                    size="lg"
                    className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-14 text-base font-medium rounded-lg shadow-sm hover:shadow-md transition-all"
                  >
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-zinc-500">
                  No credit card required
                </p>
              </div>
            </div>

            {/* Path 2: Join Waitlist */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border-2 border-zinc-200">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-zinc-600" />
                    <h3 className="text-2xl font-bold text-zinc-900">
                      Get Notified
                    </h3>
                  </div>
                  <p className="text-zinc-600">
                    Not ready yet? Join our notification list and we'll update you on major launches and new features.
                  </p>
                </div>
                <div className="pt-4">
                  <WaitlistForm />
                </div>
              </div>
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
              <Link href="/terms" className="text-sm text-zinc-600 hover:text-zinc-900">Terms of Service</Link>
              <Link href="/privacy" className="text-sm text-zinc-600 hover:text-zinc-900">Privacy Policy</Link>
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
