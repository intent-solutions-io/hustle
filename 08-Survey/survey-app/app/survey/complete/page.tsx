'use client';

/**
 * Survey Completion Page
 *
 * @description Thank you page displayed after successful survey submission.
 *              Matches the email template design with Jeremy's HUSTLE™ vision.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SurveyCompletePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-4xl mx-auto px-4 py-0">

        {/* Header with Purple Gradient */}
        <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-center py-16 md:py-20 px-6 rounded-b-3xl shadow-2xl mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Thank You! 🙏
          </h1>
          <p className="text-lg md:text-xl text-purple-100 font-medium max-w-2xl mx-auto">
            You&apos;ve just helped shape the future of youth sports tracking
          </p>
        </div>

        {/* Main Content Container */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-8">

          {/* Jeremy's Story Section */}
          <div className="mb-12 pb-12 border-b border-neutral-200">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-6">
              A Note from Jeremy 👋
            </h2>
            <div className="text-neutral-700 space-y-4 text-base md:text-lg leading-relaxed">
              <p>
                Hey there,
              </p>
              <p>
                I&apos;m Jeremy Longshore, and I want to personally thank you for completing this survey. Your insights are <strong>incredibly valuable</strong>.
              </p>
              <p>
                Quick background: I spent <strong>20+ years in restaurants</strong> (eventually running 6 locations), then <strong>5 years in trucking</strong>, and now I&apos;m pivoting into AI and tech. I was <strong>accepted into the Google Cloud Startup Program</strong>, which gives me $350,000 in credits over 2 years to build something meaningful.
              </p>
              <p>
                As a parent of a high school soccer player, I saw firsthand how hard it is to track stats, celebrate progress, and stay organized during the season. That frustration sparked <strong>HUSTLE™</strong>.
              </p>
              <p className="text-[#667eea] font-semibold text-lg md:text-xl">
                This isn&apos;t just another app—it&apos;s built by a parent who gets it, powered by enterprise-grade AI, and designed to actually help families like ours.
              </p>
              <p>
                Thanks again for being part of this journey.
              </p>
              <p className="font-semibold">
                — Jeremy
              </p>
            </div>
          </div>

          {/* What We're Building Section */}
          <div className="mb-12 pb-12 border-b border-neutral-200">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-6">
              What We&apos;re Building ⚽
            </h2>

            {/* Platform Overview */}
            <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-2xl p-8 mb-8 text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                HUSTLE™ Platform
              </h3>
              <p className="text-purple-100 text-lg leading-relaxed">
                The <strong>AI-powered youth sports tracking platform</strong> that helps parents like you manage player profiles, log game stats, track progress over time, and celebrate your athlete&apos;s achievements—all in one place.
              </p>
            </div>

            {/* Key Features */}
            <h3 className="text-2xl font-bold text-neutral-800 mb-4">
              Key Features:
            </h3>
            <ul className="space-y-3 text-neutral-700 mb-6">
              <li className="flex items-start gap-3">
                <span className="text-[#667eea] mt-1">•</span>
                <span><strong>Player Profiles:</strong> Manage multiple kids, positions, teams, and seasons</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#667eea] mt-1">•</span>
                <span><strong>Game Logging:</strong> Quick stat entry (goals, assists, minutes, saves)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#667eea] mt-1">•</span>
                <span><strong>Progress Tracking:</strong> Visualize improvement over time with charts</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#667eea] mt-1">•</span>
                <span><strong>Verification System:</strong> Confirm stats after watching game film</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#667eea] mt-1">•</span>
                <span><strong>AI Insights:</strong> Smart analysis of performance trends (coming soon)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#667eea] mt-1">•</span>
                <span><strong>Family Sharing:</strong> Grandparents, coaches, scouts can view progress</span>
              </li>
            </ul>

            {/* Google Cloud Quote */}
            <div className="bg-neutral-50 border-l-4 border-[#667eea] p-6 rounded-lg">
              <p className="text-neutral-700 italic">
                &quot;Built on <strong>Google Cloud Platform</strong> with the same infrastructure that powers Gmail and YouTube. Your data is secure, scalable, and always available.&quot;
              </p>
            </div>
          </div>

          {/* Beta Tester Reward Section */}
          <div className="mb-12 pb-12 border-b border-neutral-200">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-300 rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-purple-900 text-center mb-8">
                🎁 Your Beta Tester Reward
              </h2>

              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                    ✓
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      Survey Complete ✅
                    </h3>
                    <p className="text-neutral-600">
                      You&apos;ve shared invaluable insights about what parents actually need
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#667eea] text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      Beta Testing (2-4 weeks)
                    </h3>
                    <p className="text-neutral-600">
                      If selected, you&apos;ll get early access and help shape the final product
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-[#667eea] text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                      FREE for 1 Year 🎉
                    </h3>
                    <p className="text-neutral-600">
                      Complete beta testing, get 12 months free—no credit card required
                    </p>
                  </div>
                </div>
              </div>

              {/* Timeline Notice */}
              <div className="mt-8 bg-white border border-purple-200 rounded-xl p-6 text-center">
                <p className="text-neutral-700">
                  <strong>Selected beta testers</strong> will receive an email invitation within <strong>7 days</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mb-8">
            <div className="bg-neutral-50 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-neutral-800 mb-4">
                Questions? Let&apos;s Connect 💬
              </h3>
              <p className="text-neutral-600 mb-8 text-lg">
                I&apos;d love to hear from you! Reach out directly:
              </p>

              {/* Contact Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <a
                  href="mailto:jeremy@intentsolutions.io"
                  className="inline-block bg-[#667eea] hover:bg-[#5568d3] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  📧 Email Me
                </a>
                <a
                  href="https://jeremylongshore.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  🌐 Personal Site
                </a>
                <a
                  href="https://github.com/jeremylongshore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-neutral-800 hover:bg-neutral-900 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  💻 GitHub
                </a>
                <a
                  href="https://linkedin.com/in/jeremylongshore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  💼 LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* Return to Home */}
          <div className="text-center pt-8">
            <Link
              href="/"
              className="inline-block px-10 py-4 bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:from-[#5568d3] hover:to-[#6a4199] text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200"
            >
              Return to Home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-center py-10 px-6 rounded-t-3xl shadow-2xl mt-8">
          <p className="text-white text-2xl font-bold mb-2 tracking-wide">
            HUSTLE™
          </p>
          <p className="text-purple-100 text-base mb-4">
            Track Stats. Celebrate Progress. Build Legends.
          </p>
          <p className="text-purple-200 text-sm">
            Powered by Intent Solutions × Google Cloud Platform
          </p>
        </div>
      </div>
    </div>
  );
}
