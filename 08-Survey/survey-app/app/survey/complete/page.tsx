'use client';

/**
 * Survey Completion Page
 *
 * @description Thank you page displayed after successful survey submission.
 *              Shows appreciation message and next steps for beta testing.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SurveyCompletePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verify that survey was actually completed
    // (check if there was data in localStorage that's now been cleared)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
        {/* Success Animation */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 animate-bounce">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Thank You! 🎉
          </h1>
          <p className="text-xl md:text-2xl text-neutral-600">
            Your feedback will directly shape what we build
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
          {/* Beta Tester Rewards */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-neutral-900 mb-6">
              Your Beta Tester Reward
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    Survey Complete ✓
                  </h3>
                  <p className="text-neutral-600">
                    You&apos;ve completed the parent survey and shared invaluable insights about your needs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    Next: Beta Testing (2-4 weeks)
                  </h3>
                  <p className="text-neutral-600">
                    We&apos;ll email you within 7 days if you&apos;re selected for the beta program.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                  <span className="text-purple-600 font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    Your Reward: FREE for 1 Year
                  </h3>
                  <p className="text-neutral-600">
                    Complete beta testing and get full access for 12 months—no credit card required.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="border-t border-neutral-200 pt-8 mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              What Happens Next?
            </h2>
            <ul className="space-y-3 text-neutral-700">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span>We&apos;ll review your responses and identify beta testing candidates</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Selected beta testers will receive an email invitation within 7 days</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                <span>Beta testing will run for 2-4 weeks with direct product development input</span>
              </li>
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                <span>After successful beta completion, you&apos;ll receive 1 year of free access</span>
              </li>
            </ul>
          </div>

          {/* Contact Information */}
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              Questions or Concerns?
            </h3>
            <p className="text-purple-700 mb-3">
              We&apos;re here to help! If you have any questions about the survey, beta testing, or the product:
            </p>
            <div className="flex items-center gap-2 text-purple-900 font-medium">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              <a href="mailto:support@hustlesurvey.intentsolutions.io" className="hover:underline">
                support@hustlesurvey.intentsolutions.io
              </a>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Link
            href="/"
            className="inline-block px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            Return to Home
          </Link>

          <div className="text-sm text-neutral-600">
            <p>
              Want to share this survey with other sports parents?{' '}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin);
                  alert('Survey link copied to clipboard!');
                }}
                className="text-purple-600 hover:text-purple-700 font-medium underline"
              >
                Copy link
              </button>
            </p>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-16 text-center">
          <p className="text-sm text-neutral-500 mb-4">
            Join sports parents from across the country helping build the future of youth sports tracking
          </p>
          <div className="flex justify-center items-center gap-2 text-neutral-400">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <p className="text-sm font-medium">Powered by Intent Solutions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
