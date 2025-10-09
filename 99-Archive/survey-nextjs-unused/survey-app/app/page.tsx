import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Help Us Build the Future of Youth Sports Tracking
          </h1>
          <p className="text-xl md:text-2xl text-neutral-600 mb-8">
            Share your experience as a sports parent - get 1 year free when we launch
          </p>
        </div>

        {/* Benefits Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                What We&apos;re Building
              </h2>
              <p className="text-neutral-700 leading-relaxed mb-4">
                A simple app to help parents track their kids&apos; games, practices, and progress—all in one place, for ANY sport. Your honest feedback will shape what we build first.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-4">
                Your Reward
              </h2>
              <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">
                <p className="text-lg font-semibold text-purple-900 mb-2">
                  Complete Survey + Beta Test
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  = 1 Year FREE
                </p>
                <p className="text-sm text-purple-700 mt-2">
                  No credit card required
                </p>
              </div>
            </div>
          </div>

          {/* Key Points */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">8-10 Minutes</h3>
                <p className="text-sm text-neutral-600">Quick and easy to complete</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">100% Confidential</h3>
                <p className="text-sm text-neutral-600">All responses anonymized</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-1">Shape the Product</h3>
                <p className="text-sm text-neutral-600">Your feedback drives what we build</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <Link
              href="/survey/1"
              className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg px-12 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              Start Survey →
            </Link>
            <p className="text-sm text-neutral-500 mt-4">
              Takes 8-10 minutes · 15 sections · 68 questions
            </p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="text-center text-sm text-neutral-600">
          <p>
            By participating, you agree to our data collection for product research purposes.
            <br />
            All responses are confidential and will be used solely for improving Hustle.
          </p>
        </div>
      </div>
    </div>
  );
}
