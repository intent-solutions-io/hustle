import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Mail } from 'lucide-react';
import { WaitlistForm } from '@/components/waitlist-form';
import { LandingFeatures } from '@/components/landing-features';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Premium Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
              <span className="text-zinc-900 font-bold text-sm">H</span>
            </div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              HUSTLE<sup className="text-[0.5em] align-super">™</sup>
            </h1>
          </div>
          <Link href="/login">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/20 font-medium">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section with Video Background - Extended to include quote */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-32">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/GOAL.mp4" type="video/mp4" />
        </video>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] max-w-4xl mx-auto mb-8">
            performance DATA
            <br />
            recruiters trust
          </h2>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed font-light mb-12">
            Professional athletic tracking for families invested in elite player development and college recruiting.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white hover:bg-white/90 text-zinc-900 h-14 px-10 text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                Get Started
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
                className="h-14 px-10 text-base font-medium rounded-lg bg-transparent border-2 border-white text-white hover:bg-white hover:text-zinc-900 transition-all"
              >
                Share Feedback
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>

          {/* Quote - Now below buttons, still on video */}
          <div className="max-w-3xl mx-auto">
            <p className="text-lg md:text-xl text-white/90 italic font-light leading-relaxed">
              &ldquo;When teammates can see the data, honesty becomes automatic. When coaches can verify performance, recruiting becomes transparent.&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* Rest of Page */}
      <main className="max-w-5xl mx-auto px-6 lg:px-8">
        <LandingFeatures />
      </main>

      {/* Two-Path CTA Section with Background Image */}
      <section
        className="relative py-20"
        style={{
          backgroundImage: 'url(/images/sport-path.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundColor: '#1a1a1a',
        }}
      >
        {/* Light Overlay for text readability */}
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
              Choose Your Path
            </h2>
            <p className="text-white/80">
              Jump in now or stay updated—your choice
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Path 1: Try Now */}
            <div className="bg-white p-6 md:p-8 rounded-2xl border-2 border-zinc-900 relative shadow-xl">
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
            <div className="bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-2xl border-2 border-zinc-200 shadow-xl">
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-zinc-600" />
                    <h3 className="text-2xl font-bold text-zinc-900">
                      Get Notified
                    </h3>
                  </div>
                  <p className="text-zinc-600">
                    Not ready yet? Join our notification list and we&apos;ll update you on major launches and new features.
                  </p>
                </div>
                <div className="pt-4">
                  <WaitlistForm />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white">
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
