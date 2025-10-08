'use client';

/**
 * Survey Completion Page
 *
 * @description Thank you page displayed after successful survey submission.
 *              Matches the email content and survey's soft purple gradient colors.
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-400 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-0">

        {/* Header with Soft Purple Gradient */}
        <div className="bg-gradient-to-br from-purple-200 to-purple-300 text-center py-16 md:py-20 px-6 rounded-b-3xl shadow-xl mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-purple-900 mb-4 tracking-tight">
            HUSTLE™
          </h1>
          <p className="text-lg md:text-xl text-purple-700 font-medium max-w-2xl mx-auto">
            Thank you for completing the survey!
          </p>
        </div>

        {/* Main Content Container */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-8">

          {/* Personal Message */}
          <div className="mb-10 text-neutral-700 space-y-4 text-base md:text-lg leading-relaxed">
            <p>
              Hi there,
            </p>
            <p>
              Thank you for taking the time to complete our survey. I know how busy life gets when you&apos;re juggling work, family, and those never-ending sports schedules - so I genuinely appreciate you spending 10 minutes with us.
            </p>

            <h2 className="text-2xl md:text-3xl font-bold text-neutral-800 mt-8 mb-4">
              Let me tell you why I&apos;m building this:
            </h2>

            <p>
              I spent 20+ years in the restaurant business, then ran a trucking company for about 5 years before making what seemed like a crazy pivot - diving into AI and technology. People thought I&apos;d lost it. But here&apos;s the thing: I&apos;ve always been drawn to solving real problems for real people.
            </p>

            <p>
              Recently, I got accepted into the Google Cloud Startup Program (still feels surreal to say that). But more importantly, I live, eat, and breathe soccer now. And suddenly, all those years of building systems, managing operations, and leveraging technology clicked into place with a new purpose.
            </p>

            <p>
              <strong>We spend ridiculous amounts of money, time, and energy on our kids&apos; sports.</strong> Tournament fees, travel expenses, private training, equipment - it adds up fast. But here&apos;s what drives me crazy: when it comes time for college recruitment, most of us are scrambling through our phones trying to remember stats from games 2 years ago, or hunting down coaches who&apos;ve long since moved on.
            </p>

            <p>
              Our kids&apos; efforts deserve better than that. Every goal, every assist, every improvement should be documented, tracked, and ready to submit when it matters most.
            </p>

            <p className="text-xl font-semibold text-purple-700">
              That&apos;s why I&apos;m building HUSTLE™.
            </p>

            <p>
              Not as some fancy tech company looking to make millions (though I wouldn&apos;t complain 😄). But as a parent-first solution, built by someone who&apos;s been in the trenches - whether that&apos;s running a kitchen during a Friday night rush, managing a fleet of trucks, or now, trying to remember which tournament had that incredible save my kid made.
            </p>

            <p>
              Your survey responses are going to directly shape this app. I&apos;m reading every single one, and I&apos;ll be reaching out to beta testers. If you indicated interest in testing, you&apos;ll hear from me personally.
            </p>

            <p className="italic text-neutral-600 text-sm md:text-base">
              Fair warning: while I&apos;m over here talking about building apps and systems, my wife Mandy is the one who actually keeps our family (and this whole operation) running. She&apos;s the real MVP - I just get to play with code and pretend I&apos;m busy. 😊
            </p>
          </div>

          {/* What We're Building Section */}
          <div className="bg-purple-50 border-l-4 border-purple-400 p-6 md:p-8 rounded-lg mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-purple-900 mb-6">
              What are we building together?
            </h2>

            <p className="text-neutral-700 mb-6">
              HUSTLE™ is what we need right now to track our kids&apos; development. Here&apos;s what you&apos;ll help us perfect:
            </p>

            <div className="space-y-4 text-neutral-700">
              <div>
                <strong className="text-purple-700">Quick Logging:</strong> Log practices, games, and private training in under 2 minutes. Because nobody has time for complicated forms after a tournament.
              </div>

              <div>
                <strong className="text-purple-700">Verified Stats - Transparency Equals Honesty:</strong> Parent and coach verification system so stats actually mean something for recruiting. Kids and parents can view stats just like miniature professional athletes—real numbers, real progress, real accountability. The system itself breeds honesty and trustworthy stats. When teammates can see the data, honesty becomes automatic. When coaches can verify performance, recruiting becomes transparent. No more inflated stats or guesswork.
              </div>

              <div>
                <strong className="text-purple-700">The Full Picture:</strong> Not just goals and assists. Track injuries, emotions, training hours, mental state, what they&apos;re working on, and those moments that make it all worth it. This is geared toward kids hitting middle school and high school—high-level youth athletes who deserve the same tracking tools as the pros.
              </div>

              <div>
                <strong className="text-purple-700">Multi-Kid, Multi-Sport Management:</strong> One account for all your athletes. This isn&apos;t just for soccer players—this is for every serious youth athlete in your family. Basketball, baseball, lacrosse, whatever sport your kids grind in.
              </div>

              <div>
                <strong className="text-purple-700">Progress Tracking & AI Analysis:</strong> Charts, trends, and eventually AI-powered insights that show growth over time. Perfect for recruitment packages or just seeing how far they&apos;ve come.
              </div>

              <p className="text-lg font-semibold text-purple-700 mt-6">
                But here&apos;s where it gets really exciting...
              </p>

              <div>
                <strong className="text-purple-700">ONE Hub for Everything:</strong> We&apos;re building THE platform—one place where all their highlights live. No more hunting through your camera roll or 17 different apps. Upload once, and HUSTLE™ becomes your athlete&apos;s professional portfolio.
              </div>

              <div>
                <strong className="text-purple-700">Auto-Post Everywhere:</strong> Instead of manually posting highlights to Instagram, TikTok, Twitter, and everywhere else, we do it for you. One click, and your kid&apos;s highlight reel goes to every platform that matters. We handle the distribution—you focus on the game.
              </div>

              <div>
                <strong className="text-purple-700">Gamification That Actually Matters:</strong> Badges, streaks, and achievements that motivate kids to document their journey. Not just points for the sake of points—meaningful milestones that track real athletic development.
              </div>

              <div>
                <strong className="text-purple-700">The Mental Game:</strong> Track emotions, confidence levels, and mental state over time. Because elite athletes know that 90% of performance is mental. We&apos;re building tools that help kids understand their own psychology.
              </div>

              <div>
                <strong className="text-purple-700">You&apos;ll Shape It All:</strong> These aren&apos;t distant dreams—these are features you&apos;ll get to test, provide feedback on, and help refine. Your voice will directly influence what HUSTLE™ becomes. You&apos;re not just using an app—you&apos;re helping build something that will make a real difference in parents&apos;, coaches&apos;, and kids&apos; lives.
              </div>

              <p className="italic text-neutral-600 mt-4">
                This starts as a simple MVP—logging, stats, verification. But together, we&apos;re building toward something bigger: THE standard platform for youth athletic development. One app. One source of truth. Every highlight. Every stat. Every moment that matters.
              </p>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-purple-50 border-l-4 border-purple-400 p-6 md:p-8 rounded-lg mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-purple-900 mb-4">
              What happens next:
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-neutral-700">
              <li>I&apos;m analyzing all responses</li>
              <li>Selecting beta testers based on fit and feedback</li>
              <li>You&apos;ll get an email invitation if selected</li>
              <li>Beta testers get 1 year free when we launch (plus you&apos;ll help shape the final product)</li>
            </ol>
          </div>

          {/* Beta Testing Details */}
          <div className="bg-purple-50 border-l-4 border-purple-400 p-6 md:p-8 rounded-lg mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-purple-900 mb-4">
              What does beta testing actually mean?
            </h2>

            <p className="text-neutral-700 mb-4">
              If you&apos;re selected, you&apos;ll be among the first 50-100 families to use HUSTLE™. Here&apos;s what that looks like:
            </p>

            <div className="space-y-4 text-neutral-700">
              <p>
                <strong className="text-purple-700">You&apos;ll test:</strong> Logging practices, games, and training sessions. Tracking stats, emotions, and progress. The parent verification system. How the app feels to use after a long tournament weekend.
              </p>

              <p>
                <strong className="text-purple-700">Your input shapes everything:</strong> Found a bug? Tell me. Have an idea for a feature? I&apos;m listening. Confused by something? That&apos;s exactly what I need to know. You&apos;re not just testing—you&apos;re co-building this with me.
              </p>

              <p>
                <strong className="text-purple-700">Time commitment:</strong> Use it like you normally would track your kid&apos;s soccer. A few minutes after practices and games. Maybe 10-15 minutes a week. No formal testing required—just real-world usage and honest feedback.
              </p>

              <p>
                <strong className="text-purple-700">The reward:</strong> You get 1 year free when we officially launch. Plus, you&apos;ll literally help build the features that matter most to families like yours. Your feedback shapes version 2.0.
              </p>

              <p className="italic text-neutral-600">
                This is a working app, not a broken prototype. It won&apos;t be perfect, but it&apos;ll be functional. And together, we&apos;ll make it great.
              </p>
            </div>
          </div>

          {/* Closing */}
          <div className="text-neutral-700 space-y-4 mb-10">
            <p>
              If you have any questions, ideas, or just want to chat about the insanity of youth sports, hit reply. I read every email.
            </p>

            <p>
              Thanks again for believing in this vision. Together, we&apos;re going to make sure our kids&apos; hard work doesn&apos;t get lost in the shuffle.
            </p>

            <p className="text-xl font-semibold text-purple-700">
              Let&apos;s build something that actually helps our families.
            </p>

            <div className="mt-8 pt-8 border-t-2 border-neutral-200">
              <p className="font-semibold text-lg">— Jeremy Longshore</p>
              <p className="text-purple-700 font-semibold">Founder, HUSTLE™</p>
              <p className="text-neutral-600 italic text-sm">Google Cloud Startup Program | Soccer Dad</p>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mb-8">
            <div className="bg-neutral-50 rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-neutral-800 mb-6">
                Let&apos;s Connect
              </h3>

              {/* Contact Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-4">
                <a
                  href="mailto:jeremy@intentsolutions.io"
                  className="inline-block bg-purple-400 hover:bg-purple-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  📧 Email Me
                </a>
                <a
                  href="https://jeremylongshore.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-purple-400 hover:bg-purple-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  🌐 Personal Site
                </a>
                <a
                  href="https://startsitools.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-purple-400 hover:bg-purple-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  🛠️ StartSI Tools
                </a>
                <a
                  href="https://intentsolutions.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-purple-400 hover:bg-purple-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  💼 IntentSolutions
                </a>
              </div>

              <div className="flex justify-center gap-6 text-purple-700 font-medium">
                <a
                  href="https://github.com/jeremylongshore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-900 transition-colors"
                >
                  🔗 GitHub
                </a>
                <a
                  href="https://linkedin.com/in/jeremylongshore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-900 transition-colors"
                >
                  🔗 LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* P.S. */}
          <div className="text-sm italic text-neutral-600 mb-8">
            <p>
              P.S. - If you know other parents drowning in game stats and tournament chaos, feel free to send them the survey link. The more feedback we get, the better we can build this thing.
            </p>
          </div>

          {/* Return to Home */}
          <div className="text-center pt-8">
            <Link
              href="/"
              className="inline-block px-10 py-4 bg-purple-400 hover:bg-purple-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-2xl transition-all duration-200"
            >
              Return to Home
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-purple-50 text-center py-10 px-6 rounded-t-3xl shadow-xl mt-8">
          <p className="text-neutral-900 text-xl font-bold mb-2">
            HUSTLE™
          </p>
          <p className="text-neutral-700 text-base mb-2">
            Built by parents, for parents
          </p>
          <p className="text-neutral-500 text-sm">
            You&apos;re receiving this because you completed our survey. We&apos;ll never spam you.
          </p>
        </div>
      </div>
    </div>
  );
}
