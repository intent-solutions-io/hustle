/**
 * Email Templates for HUSTLE™ Survey Application
 *
 * @description Professional email templates with Jeremy's vision and branding
 */

interface ThankYouEmailProps {
  recipientEmail: string;
  recipientName?: string;
}

/**
 * Generate HTML email template for survey thank you
 */
export function generateThankYouEmail({ recipientName }: Omit<ThankYouEmailProps, 'recipientEmail'>) {
  const displayName = recipientName || 'there';

  return {
    subject: 'Thank You - HUSTLE™',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You - HUSTLE™</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f5f5f5;
            color: #333;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
        }
        .header {
            background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
            padding: 40px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            color: #ffffff;
            font-size: 32px;
            font-weight: 700;
            letter-spacing: 2px;
        }
        .header .tm {
            font-size: 16px;
            vertical-align: super;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.7;
            font-size: 16px;
        }
        .content p {
            margin: 0 0 20px 0;
        }
        .content strong {
            color: #1f2937;
        }
        .next-steps {
            background-color: #f9fafb;
            border-left: 4px solid #6b7280;
            padding: 20px;
            margin: 30px 0;
        }
        .next-steps h3 {
            margin: 0 0 15px 0;
            color: #374151;
            font-size: 18px;
        }
        .next-steps ol {
            margin: 0;
            padding-left: 20px;
        }
        .next-steps li {
            margin-bottom: 10px;
        }
        .signature {
            margin-top: 40px;
            padding-top: 30px;
            border-top: 2px solid: #f0f0f0;
        }
        .signature-name {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 5px;
        }
        .signature-title {
            color: #374151;
            font-weight: 600;
            margin-bottom: 3px;
        }
        .signature-tagline {
            color: #666;
            font-size: 14px;
            font-style: italic;
            margin-bottom: 20px;
        }
        .contact-links {
            margin-top: 20px;
        }
        .contact-links a {
            display: inline-block;
            margin: 5px 10px 5px 0;
            padding: 8px 16px;
            background-color: #6b7280;
            color: #ffffff !important;
            text-decoration: none;
            border-radius: 6px;
            font-size: 14px;
            transition: background-color 0.3s;
        }
        .contact-links a:hover {
            background-color: #4b5563;
        }
        .social-links {
            margin-top: 15px;
        }
        .social-links a {
            display: inline-block;
            margin-right: 15px;
            color: #374151 !important;
            text-decoration: none;
            font-weight: 500;
        }
        .social-links a:hover {
            color: #1f2937 !important;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e0e0e0;
        }
        .footer p {
            margin: 5px 0;
        }
        @media only screen and (max-width: 600px) {
            .content {
                padding: 30px 20px;
            }
            .header {
                padding: 30px 20px;
            }
            .header h1 {
                font-size: 24px;
            }
            .contact-links a {
                display: block;
                margin: 10px 0;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>HUSTLE<span class="tm">™</span></h1>
        </div>

        <div class="content">
            <p>Hi ${displayName},</p>

            <p>Thank you for taking the time to complete our survey. I know how busy life gets when you&apos;re juggling work, family, and those never-ending sports schedules - so I genuinely appreciate you spending 10 minutes with us.</p>

            <p><strong>Let me tell you why I&apos;m building this:</strong></p>

            <p>I spent 20+ years in the restaurant business, then ran a trucking company for about 5 years before making what seemed like a crazy pivot - diving into AI and technology. People thought I&apos;d lost it. But here&apos;s the thing: I&apos;ve always been drawn to solving real problems for real people.</p>

            <p>Recently, I got accepted into the Google Cloud Startup Program (still feels surreal to say that). But more importantly, I live, eat, and breathe soccer now. And suddenly, all those years of building systems, managing operations, and leveraging technology clicked into place with a new purpose.</p>

            <p><strong>We spend ridiculous amounts of money, time, and energy on our kids&apos; sports.</strong> Tournament fees, travel expenses, private training, equipment - it adds up fast. But here&apos;s what drives me crazy: when it comes time for college recruitment, most of us are scrambling through our phones trying to remember stats from games 2 years ago, or hunting down coaches who&apos;ve long since moved on.</p>

            <p>Our kids&apos; efforts deserve better than that. Every goal, every assist, every improvement should be documented, tracked, and ready to submit when it matters most.</p>

            <p><strong>That&apos;s why I&apos;m building HUSTLE™.</strong></p>

            <p>Not as some fancy tech company looking to make millions (though I wouldn&apos;t complain 😄). But as a parent-first solution, built by someone who&apos;s been in the trenches - whether that&apos;s running a kitchen during a Friday night rush, managing a fleet of trucks, or now, trying to remember which tournament had that incredible save my kid made.</p>

            <p>Your survey responses are going to directly shape this app. I&apos;m reading every single one, and I&apos;ll be reaching out to beta testers. If you indicated interest in testing, you&apos;ll hear from me personally.</p>

            <p style="font-style: italic; color: #666; font-size: 15px;">Fair warning: while I&apos;m over here talking about building apps and systems, my wife Mandy is the one who actually keeps our family (and this whole operation) running. She&apos;s the real MVP - I just get to play with code and pretend I&apos;m busy. 😊</p>

            <div class="next-steps">
                <h3>What are we building together?</h3>
                <p style="margin: 15px 0 10px 0; font-size: 15px;">HUSTLE™ is what we need right now to track our kids&apos; development. Here&apos;s what you&apos;ll help us perfect:</p>

                <p style="margin: 10px 0; font-size: 15px;"><strong>Quick Logging:</strong> Log practices, games, and private training in under 2 minutes. Because nobody has time for complicated forms after a tournament.</p>

                <p style="margin: 10px 0; font-size: 15px;"><strong>Verified Stats - Transparency Equals Honesty:</strong> Parent and coach verification system so stats actually mean something for recruiting. Kids and parents can view stats just like miniature professional athletes—real numbers, real progress, real accountability. The system itself breeds honesty and trustworthy stats. When teammates can see the data, honesty becomes automatic. When coaches can verify performance, recruiting becomes transparent. No more inflated stats or guesswork.</p>

                <p style="margin: 10px 0; font-size: 15px;"><strong>The Full Picture:</strong> Not just goals and assists. Track injuries, emotions, training hours, mental state, what they&apos;re working on, and those moments that make it all worth it. This is geared toward kids hitting middle school and high school—high-level youth athletes who deserve the same tracking tools as the pros.</p>

                <p style="margin: 10px 0; font-size: 15px;"><strong>Multi-Kid, Multi-Sport Management:</strong> One account for all your athletes. This isn&apos;t just for soccer players—this is for every serious youth athlete in your family. Basketball, baseball, lacrosse, whatever sport your kids grind in.</p>

                <p style="margin: 10px 0; font-size: 15px;"><strong>Progress Tracking & AI Analysis:</strong> Charts, trends, and eventually AI-powered insights that show growth over time. Perfect for recruitment packages or just seeing how far they&apos;ve come.</p>

                <p style="margin: 15px 0 5px 0; font-size: 16px; font-weight: 600; color: #374151;">But here&apos;s where it gets really exciting...</p>

                <p style="margin: 10px 0; font-size: 15px;"><strong>ONE Hub for Everything:</strong> We&apos;re building THE platform—one place where all their highlights live. No more hunting through your camera roll or 17 different apps. Upload once, and HUSTLE™ becomes your athlete&apos;s professional portfolio.</p>

                <p style="margin: 10px 0; font-size: 15px;"><strong>Auto-Post Everywhere:</strong> Instead of manually posting highlights to Instagram, TikTok, Twitter, and everywhere else, we do it for you. One click, and your kid&apos;s highlight reel goes to every platform that matters. We handle the distribution—you focus on the game.</p>

                <p style="margin: 10px 0; font-size: 15px;"><strong>Gamification That Actually Matters:</strong> Badges, streaks, and achievements that motivate kids to document their journey. Not just points for the sake of points—meaningful milestones that track real athletic development.</p>

                <p style="margin: 10px 0; font-size: 15px;"><strong>The Mental Game:</strong> Track emotions, confidence levels, and mental state over time. Because elite athletes know that 90% of performance is mental. We&apos;re building tools that help kids understand their own psychology.</p>

                <p style="margin: 10px 0; font-size: 15px;"><strong>You&apos;ll Shape It All:</strong> These aren&apos;t distant dreams—these are features you&apos;ll get to test, provide feedback on, and help refine. Your voice will directly influence what HUSTLE™ becomes. You&apos;re not just using an app—you&apos;re helping build something that will make a real difference in parents&apos;, coaches&apos;, and kids&apos; lives.</p>

                <p style="margin: 10px 0 0 0; font-size: 15px; font-style: italic; color: #666;">This starts as a simple MVP—logging, stats, verification. But together, we&apos;re building toward something bigger: THE standard platform for youth athletic development. One app. One source of truth. Every highlight. Every stat. Every moment that matters.</p>
            </div>

            <div class="next-steps">
                <h3>What happens next:</h3>
                <ol>
                    <li>I&apos;m analyzing all responses</li>
                    <li>Selecting beta testers based on fit and feedback</li>
                    <li>You&apos;ll get an email invitation if selected</li>
                    <li>Beta testers get 1 year free when we launch (plus you&apos;ll help shape the final product)</li>
                </ol>
            </div>

            <div class="next-steps" style="background-color: #f3f4f6; border-left-color: #6b7280; margin-top: 30px;">
                <h3 style="color: #374151;">What does beta testing actually mean?</h3>
                <p style="margin: 15px 0 10px 0; font-size: 15px;">If you&apos;re selected, you&apos;ll be among the first 50-100 families to use HUSTLE™. Here&apos;s what that looks like:</p>
                <p style="margin: 10px 0; font-size: 15px;"><strong>You&apos;ll test:</strong> Logging practices, games, and training sessions. Tracking stats, emotions, and progress. The parent verification system. How the app feels to use after a long tournament weekend.</p>
                <p style="margin: 10px 0; font-size: 15px;"><strong>Your input shapes everything:</strong> Found a bug? Tell me. Have an idea for a feature? I&apos;m listening. Confused by something? That&apos;s exactly what I need to know. You&apos;re not just testing—you&apos;re co-building this with me.</p>
                <p style="margin: 10px 0; font-size: 15px;"><strong>Time commitment:</strong> Use it like you normally would track your kid&apos;s soccer. A few minutes after practices and games. Maybe 10-15 minutes a week. No formal testing required—just real-world usage and honest feedback.</p>
                <p style="margin: 10px 0; font-size: 15px;"><strong>The reward:</strong> You get 1 year free when we officially launch. Plus, you&apos;ll literally help build the features that matter most to families like yours. Your feedback shapes version 2.0.</p>
                <p style="margin: 10px 0 0 0; font-size: 15px; font-style: italic; color: #666;">This is a working app, not a broken prototype. It won&apos;t be perfect, but it&apos;ll be functional. And together, we&apos;ll make it great.</p>
            </div>

            <p>If you have any questions, ideas, or just want to chat about the insanity of youth sports, hit reply. I read every email.</p>

            <p>Thanks again for believing in this vision. Together, we&apos;re going to make sure our kids&apos; hard work doesn&apos;t get lost in the shuffle.</p>

            <p><strong>Let&apos;s build something that actually helps our families.</strong></p>

            <div class="signature">
                <div class="signature-name">— Jeremy Longshore</div>
                <div class="signature-title">Founder, HUSTLE™</div>
                <div class="signature-tagline">Google Cloud Startup Program | Soccer Dad</div>

                <div class="contact-links">
                    <a href="mailto:jeremy@intentsolutions.io">📧 Email Me</a>
                    <a href="https://jeremylongshore.com">🌐 Personal Site</a>
                    <a href="https://startsitools.com">🛠️ StartSI Tools</a>
                    <a href="https://intentsolutions.io">💼 IntentSolutions</a>
                </div>

                <div class="social-links">
                    <a href="https://github.com/jeremylongshore">🔗 GitHub</a>
                    <a href="https://linkedin.com/in/jeremylongshore">🔗 LinkedIn</a>
                </div>
            </div>

            <p style="margin-top: 30px; font-size: 14px; color: #666; font-style: italic;">
                P.S. - If you know other parents drowning in game stats and tournament chaos, feel free to send them the survey link. The more feedback we get, the better we can build this thing.
            </p>
        </div>

        <div class="footer">
            <p><strong>HUSTLE™</strong></p>
            <p>Built by parents, for parents</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
                You&apos;re receiving this because you completed our survey. We&apos;ll never spam you.
            </p>
        </div>
    </div>
</body>
</html>
    `,
    text: `
HUSTLE™

Hi ${displayName},

Thank you for taking the time to complete our survey. I know how busy life gets when you're juggling work, family, and those never-ending sports schedules - so I genuinely appreciate you spending 10 minutes with us.

LET ME TELL YOU WHY I'M BUILDING THIS:

I spent 20+ years in the restaurant business, then ran a trucking company for about 5 years before making what seemed like a crazy pivot - diving into AI and technology. People thought I'd lost it. But here's the thing: I've always been drawn to solving real problems for real people.

Recently, I got accepted into the Google Cloud Startup Program (still feels surreal to say that). But more importantly, I live, eat, and breathe soccer now. And suddenly, all those years of building systems, managing operations, and leveraging technology clicked into place with a new purpose.

We spend ridiculous amounts of money, time, and energy on our kids' sports. Tournament fees, travel expenses, private training, equipment - it adds up fast. But here's what drives me crazy: when it comes time for college recruitment, most of us are scrambling through our phones trying to remember stats from games 2 years ago, or hunting down coaches who've long since moved on.

Our kids' efforts deserve better than that. Every goal, every assist, every improvement should be documented, tracked, and ready to submit when it matters most.

That's why I'm building HUSTLE™.

Not as some fancy tech company looking to make millions (though I wouldn't complain 😄). But as a parent-first solution, built by someone who's been in the trenches - whether that's running a kitchen during a Friday night rush, managing a fleet of trucks, or now, trying to remember which tournament had that incredible save my kid made.

Your survey responses are going to directly shape this app. I'm reading every single one, and I'll be reaching out to beta testers. If you indicated interest in testing, you'll hear from me personally.

Fair warning: while I'm over here talking about building apps and systems, my wife Mandy is the one who actually keeps our family (and this whole operation) running. She's the real MVP - I just get to play with code and pretend I'm busy. 😊

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT ARE WE BUILDING TOGETHER?

HUSTLE™ is what we need right now to track our kids' development. Here's what you'll help us perfect:

Quick Logging: Log practices, games, and private training in under 2 minutes. Because nobody has time for complicated forms after a tournament.

Verified Stats - Transparency Equals Honesty: Parent and coach verification system so stats actually mean something for recruiting. Kids and parents can view stats just like miniature professional athletes—real numbers, real progress, real accountability. The system itself breeds honesty and trustworthy stats. When teammates can see the data, honesty becomes automatic. When coaches can verify performance, recruiting becomes transparent. No more inflated stats or guesswork.

The Full Picture: Not just goals and assists. Track injuries, emotions, training hours, mental state, what they're working on, and those moments that make it all worth it. This is geared toward kids hitting middle school and high school—high-level youth athletes who deserve the same tracking tools as the pros.

Multi-Kid, Multi-Sport Management: One account for all your athletes. This isn't just for soccer players—this is for every serious youth athlete in your family. Basketball, baseball, lacrosse, whatever sport your kids grind in.

Progress Tracking & AI Analysis: Charts, trends, and eventually AI-powered insights that show growth over time. Perfect for recruitment packages or just seeing how far they've come.

But here's where it gets really exciting...

ONE Hub for Everything: We're building THE platform—one place where all their highlights live. No more hunting through your camera roll or 17 different apps. Upload once, and HUSTLE™ becomes your athlete's professional portfolio.

Auto-Post Everywhere: Instead of manually posting highlights to Instagram, TikTok, Twitter, and everywhere else, we do it for you. One click, and your kid's highlight reel goes to every platform that matters. We handle the distribution—you focus on the game.

Gamification That Actually Matters: Badges, streaks, and achievements that motivate kids to document their journey. Not just points for the sake of points—meaningful milestones that track real athletic development.

The Mental Game: Track emotions, confidence levels, and mental state over time. Because elite athletes know that 90% of performance is mental. We're building tools that help kids understand their own psychology.

You'll Shape It All: These aren't distant dreams—these are features you'll get to test, provide feedback on, and help refine. Your voice will directly influence what HUSTLE™ becomes. You're not just using an app—you're helping build something that will make a real difference in parents', coaches', and kids' lives.

This starts as a simple MVP—logging, stats, verification. But together, we're building toward something bigger: THE standard platform for youth athletic development. One app. One source of truth. Every highlight. Every stat. Every moment that matters.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT HAPPENS NEXT:

1. I'm analyzing all responses
2. Selecting beta testers based on fit and feedback
3. You'll get an email invitation if selected
4. Beta testers get 1 year free when we launch (plus you'll help shape the final product)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

WHAT DOES BETA TESTING ACTUALLY MEAN?

If you're selected, you'll be among the first 50-100 families to use HUSTLE™. Here's what that looks like:

You'll test: Logging practices, games, and training sessions. Tracking stats, emotions, and progress. The parent verification system. How the app feels to use after a long tournament weekend.

Your input shapes everything: Found a bug? Tell me. Have an idea for a feature? I'm listening. Confused by something? That's exactly what I need to know. You're not just testing—you're co-building this with me.

Time commitment: Use it like you normally would track your kid's soccer. A few minutes after practices and games. Maybe 10-15 minutes a week. No formal testing required—just real-world usage and honest feedback.

The reward: You get 1 year free when we officially launch. Plus, you'll literally help build the features that matter most to families like yours. Your feedback shapes version 2.0.

This is a working app, not a broken prototype. It won't be perfect, but it'll be functional. And together, we'll make it great.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If you have any questions, ideas, or just want to chat about the insanity of youth sports, hit reply. I read every email.

Thanks again for believing in this vision. Together, we're going to make sure our kids' hard work doesn't get lost in the shuffle.

Let's build something that actually helps our families.

— Jeremy Longshore
Founder, HUSTLE™
Google Cloud Startup Program | Soccer Dad

📧 Email Me: jeremy@intentsolutions.io
🌐 Personal Site: https://jeremylongshore.com
🛠️ StartSI Tools: https://startsitools.com
💼 IntentSolutions: https://intentsolutions.io
🔗 GitHub: https://github.com/jeremylongshore
🔗 LinkedIn: https://linkedin.com/in/jeremylongshore

P.S. - If you know other parents drowning in game stats and tournament chaos, feel free to send them the survey link. The more feedback we get, the better we can build this thing.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HUSTLE™
Built by parents, for parents

You're receiving this because you completed our survey. We'll never spam you.
    `.trim()
  };
}
