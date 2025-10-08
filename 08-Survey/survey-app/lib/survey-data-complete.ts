export type QuestionType =
  | 'radio'
  | 'checkbox'
  | 'text'
  | 'email'
  | 'phone'
  | 'select'
  | 'textarea'
  | 'rating'
  | 'ranking';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  description?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface SurveySection {
  id: number;
  title: string;
  description?: string;
  questions: Question[];
}

export const surveyData: SurveySection[] = [
  // Section 1: Quick Start
  {
    id: 1,
    title: 'Quick Start',
    description: 'Let\'s get started!',
    questions: [
      {
        id: 'consent',
        text: 'Do you consent to participate in this research survey?',
        type: 'radio',
        required: true,
        options: ['Yes, I\'m in!', 'No thanks']
      }
    ]
  },

  // Section 2: Your Sports Family
  {
    id: 2,
    title: 'Your Sports Family',
    description: 'Tell us about your young athletes',
    questions: [
      {
        id: 'numAthletes',
        text: 'How many kids do you have playing competitive sports?',
        type: 'radio',
        required: true,
        options: ['1 athlete', '2 athletes', '3 athletes', '4+ athletes']
      },
      {
        id: 'grades',
        text: 'What grades are they in? (Select all that apply)',
        type: 'checkbox',
        required: true,
        options: [
          '5th or younger',
          '6th',
          '7th',
          '8th',
          '9th (Freshman)',
          '10th (Sophomore)',
          '11th (Junior)',
          '12th (Senior)'
        ]
      },
      {
        id: 'hoursPerWeek',
        text: 'How many hours per week does your child spend on their sport(s)? (Include practices, games, private training)',
        type: 'radio',
        required: true,
        options: ['1-5 hours', '6-10 hours', '11-15 hours', '16-20 hours', '20+ hours']
      },
      {
        id: 'recruitmentStatus',
        text: 'Is your child pursuing college recruitment opportunities?',
        type: 'radio',
        required: true,
        options: [
          'Yes, actively recruiting now',
          'Yes, planning to start soon',
          'Maybe in the future',
          'No recruitment plans',
          'Too young to think about it yet'
        ]
      },
      {
        id: 'sports',
        text: 'Which sports do they play? (Select all that apply)',
        type: 'checkbox',
        required: true,
        options: [
          'Soccer',
          'Basketball',
          'Baseball',
          'Softball',
          'Football',
          'Lacrosse',
          'Hockey (ice or field)',
          'Volleyball',
          'Track & Field',
          'Swimming',
          'Tennis',
          'Golf',
          'Wrestling',
          'Gymnastics',
          'Dance/Cheer',
          'Other'
        ]
      },
      {
        id: 'sportsOther',
        text: 'If you selected "Other", please specify:',
        type: 'text',
        required: false,
        placeholder: 'Enter other sport(s)'
      },
      {
        id: 'competitionLevel',
        text: 'What level(s) are they competing at? (Select all that apply)',
        type: 'checkbox',
        required: true,
        options: [
          'Elite/National (e.g., ECNL, MLS Next, AAU, USAG)',
          'Regional/Premier (e.g., NPL, Regional League)',
          'High School Varsity',
          'High School JV',
          'Travel/Club',
          'Recreational/Local League',
          'ODP or State/National Team',
          'Academy/Development Program',
          'Other'
        ]
      },
      {
        id: 'teamPrograms',
        text: 'What club(s), team(s), or program(s) do they play for?',
        type: 'text',
        required: false,
        placeholder: 'Enter team/program names'
      },
      {
        id: 'location',
        text: 'Where are you located? (City, State or Region)',
        type: 'text',
        required: true,
        placeholder: 'e.g., Atlanta, GA'
      }
    ]
  },

  // Section 3: How You Track Things Now
  {
    id: 3,
    title: 'How You Track Things Now',
    description: 'Understanding your current process',
    questions: [
      {
        id: 'currentTracking',
        text: 'How do you currently keep track of your child\'s sports activities?',
        type: 'radio',
        required: true,
        options: [
          'I track everything manually (notes, spreadsheets, photos)',
          'I track some things, but it\'s scattered across apps',
          'I want to track but don\'t have a good system',
          'I rely on my kid to remember',
          'The coach/team handles it',
          'I don\'t track anything'
        ]
      },
      {
        id: 'currentTools',
        text: 'What apps or tools do you currently use for sports tracking? (Select all that apply)',
        type: 'checkbox',
        required: false,
        options: [
          'Notes app',
          'Excel/Google Sheets',
          'Photos/Camera Roll',
          'TeamSnap',
          'SportsEngine/LeagueApps',
          'MaxPreps',
          'Hudl',
          'GameChanger',
          'Other',
          'No apps, just memory'
        ]
      },
      {
        id: 'timeSpent',
        text: 'How much time per week do you spend managing your child\'s sports logistics (scheduling, stats, communication)?',
        type: 'radio',
        required: true,
        options: [
          'Less than 1 hour',
          '1-3 hours',
          '4-6 hours',
          '7-10 hours',
          'More than 10 hours'
        ]
      },
      {
        id: 'devices',
        text: 'What devices would you use for tracking? (Select all that apply)',
        type: 'checkbox',
        required: true,
        options: ['iPhone', 'Android phone', 'iPad/tablet', 'Desktop/laptop']
      }
    ]
  },

  // Section 4: Your Pain Points
  {
    id: 4,
    title: 'Your Pain Points',
    description: 'What frustrates you most?',
    questions: [
      {
        id: 'biggestFrustrations',
        text: 'What frustrates you MOST about tracking your kid\'s sports life? (Pick up to 3)',
        type: 'checkbox',
        required: true,
        options: [
          'Information scattered across multiple apps/places',
          'Can\'t verify if stats are accurate',
          'Hard to see progress over time',
          'Don\'t know when my kid is overtraining or injured',
          'Too much time spent on manual data entry',
          'Managing multiple kids in different sports is chaotic',
          'No credible way to share accomplishments with coaches/recruiters',
          'Losing track of what actually happened at games',
          'Can\'t remember tournament results or achievements',
          'No way to track mental/emotional health alongside physical',
          'Expensive apps that don\'t deliver value',
          'Apps are too complicated to use regularly',
          'Other'
        ]
      },
      {
        id: 'forgetFrequency',
        text: 'How often do you forget or lose track of your child\'s games, tournaments, or training sessions?',
        type: 'radio',
        required: true,
        options: [
          'Never—I track everything',
          'Rarely—only special events get missed',
          'Sometimes—maybe once a month',
          'Often—we lose track regularly',
          'Always—it\'s total chaos'
        ]
      },
      {
        id: 'impactRating',
        text: 'If this problem was completely solved, how much would that improve your family\'s sports experience?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        description: '1 = Minimal impact, 5 = Life-changing'
      },
      {
        id: 'previousApps',
        text: 'Have you tried sports tracking apps before?',
        type: 'radio',
        required: true,
        options: [
          'Yes, currently using one',
          'Yes, tried but stopped using',
          'No, but I\'ve looked for one',
          'No, never thought about it'
        ]
      },
      {
        id: 'previousAppsDetails',
        text: 'If yes, which app and why did you stop (or continue) using it?',
        type: 'textarea',
        required: false,
        placeholder: 'Tell us about your experience...'
      }
    ]
  },

  // Section 5: The App We're Building
  {
    id: 5,
    title: 'The App We\'re Building',
    description: 'Would this solve your problem?',
    questions: [
      {
        id: 'valueRating',
        text: 'Imagine an app where your kid (or you) can quickly log every game, practice, and training session with a few taps. Stats get verified by you or their coach. Everything lives in one place, regardless of sport. How valuable would this be to you?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        description: '1 = Not valuable, 5 = Extremely valuable'
      },
      {
        id: 'disappointment',
        text: 'If this app didn\'t exist, how disappointed would you be?',
        type: 'radio',
        required: true,
        options: [
          'Very disappointed—I really need this',
          'Somewhat disappointed',
          'Not disappointed—nice to have only',
          'Indifferent'
        ]
      },
      {
        id: 'activityPriority',
        text: 'Which activities matter MOST to track? (Rank 1-4, with 1 being most important)',
        type: 'ranking',
        required: true,
        options: [
          'Official games/competitions/meets',
          'Team practices',
          'Private coaching/training sessions',
          'Individual skill work (drills, conditioning, etc.)'
        ]
      },
      {
        id: 'historicalData',
        text: 'Would you want to import historical data (past seasons, achievements)?',
        type: 'radio',
        required: true,
        options: ['Yes, very important', 'Nice to have', 'Not needed']
      }
    ]
  },

  // Section 6: Game/Competition Logging
  {
    id: 6,
    title: 'Game/Competition Logging',
    description: 'What information matters most?',
    questions: [
      {
        id: 'gameDataNeeded',
        text: 'After a game or competition, what information do you NEED to capture? (Select must-haves)',
        type: 'checkbox',
        required: true,
        options: [
          'Date and time',
          'Opponent or event name',
          'Final score/result (W/L/T or placement)',
          'Playing time/participation',
          'Key stats (goals, points, times, etc.)',
          'Personal performance rating (1-5)',
          'How they felt emotionally',
          'Body soreness/injuries',
          'Favorite moment or highlight',
          'Coach feedback',
          'Weather conditions (for outdoor sports)'
        ]
      },
      {
        id: 'practiceDataNeeded',
        text: 'For practice logging, what matters most? (Select must-haves)',
        type: 'checkbox',
        required: true,
        options: [
          'Date and time',
          'Duration',
          'Location/facility',
          'Skills worked on (tags/categories)',
          'Effort level or focus rating (1-5)',
          'How they felt',
          'Weather conditions',
          'Body soreness',
          'Favorite moment or breakthrough'
        ]
      },
      {
        id: 'sportSpecificStats',
        text: 'Should stats be sport-specific (e.g., goals for soccer, hits for baseball)?',
        type: 'radio',
        required: true,
        options: [
          'Yes, customize fields per sport',
          'No, keep it simple and universal',
          'Let me choose which fields to track'
        ]
      }
    ]
  },

  // Section 7: Parent Control & Multi-Kid Management
  {
    id: 7,
    title: 'Parent Control & Multi-Kid Management',
    description: 'Managing your family\'s sports life',
    questions: [
      {
        id: 'multiKidImportance',
        text: 'How important is it that ONE parent account can manage multiple kids in different sports?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        description: '1 = Not important, 5 = Essential'
      },
      {
        id: 'parentNotesImportance',
        text: 'Would you want to add notes/comments to your child\'s logs?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        description: '1 = Not needed, 5 = Very important'
      },
      {
        id: 'correctionMethod',
        text: 'If your child logs something incorrectly, how should corrections work?',
        type: 'radio',
        required: true,
        options: [
          'I want to suggest a fix (they approve it)',
          'I want full edit rights (I can change it directly)',
          'I trust my kid to log accurately'
        ]
      },
      {
        id: 'exportImportance',
        text: 'How important is exporting data (CSV/PDF) for college recruiting or records?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        description: '1 = Not important, 5 = Critical'
      },
      {
        id: 'notificationPreferences',
        text: 'What notifications would be helpful? (Select all that apply)',
        type: 'checkbox',
        required: false,
        options: [
          'When your child logs a new activity',
          'When a coach verifies (or questions) a stat',
          'Achievement milestones (e.g., "100 practices logged!")',
          'Injury/soreness patterns detected',
          'Weekly summary of activity',
          'Upcoming events reminder',
          'None—I\'ll check the app when I want'
        ]
      },
      {
        id: 'notificationFrequency',
        text: 'How often would you want notifications?',
        type: 'radio',
        required: true,
        options: [
          'Real-time (as things happen)',
          'Once daily (evening digest)',
          'Once weekly (Sunday summary)',
          'Off by default (I\'ll open the app)'
        ]
      }
    ]
  },

  // Section 8: Verification & Trust
  {
    id: 8,
    title: 'Verification & Trust',
    description: 'Ensuring accurate stats',
    questions: [
      {
        id: 'parentVerificationValue',
        text: 'How valuable is parent verification (you approve stats via PIN)?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        description: '1 = Not valuable, 5 = Very valuable'
      },
      {
        id: 'coachVerificationImportance',
        text: 'How important is coach verification in the future?',
        type: 'radio',
        required: true,
        options: [
          'Must have this—essential for credibility',
          'Nice to have eventually',
          'Not important to me'
        ]
      },
      {
        id: 'verifiedBadgeValue',
        text: 'Would a "Verified" badge and trust score on your child\'s profile be useful?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        description: '1 = Not useful, 5 = Very useful'
      },
      {
        id: 'verificationTimeLimit',
        text: 'Should there be a time limit for verifying stats (e.g., within 7 days of a game)?',
        type: 'radio',
        required: true,
        options: [
          'Yes, 7 days is reasonable',
          'Yes, but allow longer',
          'No time limit needed'
        ]
      }
    ]
  },

  // Section 9: Analytics & Insights
  {
    id: 9,
    title: 'Analytics & Insights',
    description: 'Understanding progress and patterns',
    questions: [
      {
        id: 'dashboardPreferences',
        text: 'Which dashboards would you use most? (Pick up to 4)',
        type: 'checkbox',
        required: true,
        options: [
          'Total practice hours (weekly/monthly/season)',
          'Private training hours tracked',
          'Games/competitions + season summary',
          'Career stats (sport-specific totals)',
          'Emotional/mental health patterns',
          'Injury history and body soreness trends',
          'Personal records and improvements',
          'Highlight reel of favorite moments',
          'Progress toward college recruiting goals',
          'Comparison to other athletes (anonymized)',
          'Season-over-season improvement tracking'
        ]
      },
      {
        id: 'comparisonInterest',
        text: 'Would you want to see how your child\'s verified stats compare to others in their sport and grade?',
        type: 'radio',
        required: true,
        options: [
          'Yes, very interested',
          'Somewhat interested',
          'Not interested',
          'Concerned about this'
        ]
      },
      {
        id: 'leaderboardComfort',
        text: 'How comfortable are you with anonymized leaderboards (e.g., "Top 10 freshmen in your sport/region")?',
        type: 'radio',
        required: true,
        options: [
          'Very comfortable',
          'Somewhat comfortable',
          'Unsure',
          'Not comfortable'
        ]
      },
      {
        id: 'benchmarkOptIn',
        text: 'Would you opt-in to include your child\'s verified data in global benchmarks (fully anonymous)?',
        type: 'radio',
        required: true,
        options: [
          'Yes',
          'Maybe, if I can control what\'s shared',
          'No'
        ]
      }
    ]
  },

  // Section 10: Motivation & Gamification
  {
    id: 10,
    title: 'Motivation & Gamification',
    description: 'Keeping athletes engaged',
    questions: [
      {
        id: 'achievementMotivation',
        text: 'Would private achievements (badges, streaks, points) motivate your child to log consistently?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        description: '1 = No effect, 5 = Big motivator'
      },
      {
        id: 'badgePreferences',
        text: 'Which badges would your child care about? (Pick up to 3)',
        type: 'checkbox',
        required: false,
        options: [
          'First Win Logged',
          '100 Practice Hours',
          '30-Day Logging Streak',
          'Century Club (100 total logs)',
          'Triple Threat (game, practice, and training in one week)',
          'Iron Athlete (50 games logged)',
          'Perfect Week (logged every day)',
          'Season Champion (logged full season)'
        ]
      },
      {
        id: 'badgePrivacy',
        text: 'Badges should be:',
        type: 'radio',
        required: true,
        options: [
          'Private to family only (default)',
          'Shareable if my child wants',
          'Not interested in badges'
        ]
      }
    ]
  },

  // Section 11: Mobile Experience
  {
    id: 11,
    title: 'Mobile Experience',
    description: 'Using the app on your phone',
    questions: [
      {
        id: 'addToHomeScreen',
        text: 'After your second visit, the app will suggest "Add to Home Screen" for quick access. Is this okay?',
        type: 'radio',
        required: true,
        options: [
          'Yes, helpful',
          'No, don\'t prompt me'
        ]
      },
      {
        id: 'offlineImportance',
        text: 'How important is offline logging (log without internet, syncs later)?',
        type: 'rating',
        required: true,
        min: 1,
        max: 5,
        description: '1 = Not needed, 5 = Essential'
      },
      {
        id: 'loggingTimeExpectation',
        text: 'How long should it take to log a game or practice?',
        type: 'radio',
        required: true,
        options: [
          'Under 60 seconds',
          '1–2 minutes is fine',
          'Up to 3 minutes is acceptable'
        ]
      }
    ]
  },

  // Section 12: Privacy & Data Ownership
  {
    id: 12,
    title: 'Privacy & Data Ownership',
    description: 'Your data, your control',
    questions: [
      {
        id: 'dataControl',
        text: 'Who should control the data before your child turns 18?',
        type: 'radio',
        required: true,
        options: [
          'Parent has full control',
          'Shared control (parent + athlete)',
          'Athlete controls their own data'
        ]
      },
      {
        id: 'emotionalNotesPrivacy',
        text: 'In the future, should your child be able to hide certain emotional notes from you?',
        type: 'radio',
        required: true,
        options: [
          'Yes, privacy is important',
          'Neutral/depends on age',
          'No, I want full visibility'
        ]
      },
      {
        id: 'deletionPolicy',
        text: 'If you delete an account, we\'ll keep data for 30 days (in case it\'s accidental), then permanently delete. Is this okay?',
        type: 'radio',
        required: true,
        options: [
          'Yes, that\'s reasonable',
          'No, I prefer different terms'
        ]
      }
    ]
  },

  // Section 13: Future Features
  {
    id: 13,
    title: 'Future Features',
    description: 'What should we build next?',
    questions: [
      {
        id: 'nextFeatures',
        text: 'What should we build NEXT after the MVP? (Pick top 3)',
        type: 'checkbox',
        required: true,
        options: [
          'Coach portal with PIN verification',
          'Family invites (grandparents, second parent, etc.)',
          'Video highlights + easy sharing',
          'Social feed (training tips and inspiration)',
          'Instagram/TikTok integration for posting',
          'Advanced recruiting profile builder',
          'Sport-specific drill libraries',
          'Calendar with reminders',
          'Team messaging',
          'Tournament/schedule tracking',
          'Nutrition and meal tracking',
          'Sleep and recovery tracking'
        ]
      },
      {
        id: 'paymentWillingness',
        text: 'If this app saves you time and helps your kid\'s development, would you consider paying for premium features after your free year?',
        type: 'radio',
        required: true,
        options: [
          'Yes, absolutely',
          'Maybe, depends on features',
          'Probably not',
          'No, must stay free'
        ]
      },
      {
        id: 'priceRange',
        text: 'If yes/maybe, what\'s a fair monthly price per family (after the free year)?',
        type: 'radio',
        required: false,
        options: [
          '$3–$5/month',
          '$6–$9/month',
          '$10–$14/month',
          '$15+/month',
          'Would prefer annual plan',
          'One-time purchase instead'
        ]
      },
      {
        id: 'pricingModel',
        text: 'What pricing model makes most sense to you?',
        type: 'radio',
        required: true,
        options: [
          'Free basic version, paid premium features',
          'Free trial, then paid subscription',
          'One-time purchase price',
          'Completely free with optional donations'
        ]
      },
      {
        id: 'premiumFeatures',
        text: 'Which premium features would be worth paying for? (Select all that apply)',
        type: 'checkbox',
        required: false,
        options: [
          'Unlimited video storage',
          'Advanced analytics and insights',
          'College recruiting profile tools',
          'Coach portal access',
          'Priority support',
          'Export to recruiting platforms',
          'Custom branding for profiles',
          'None—I wouldn\'t pay for any of these'
        ]
      }
    ]
  },

  // Section 14: Final Thoughts
  {
    id: 14,
    title: 'Final Thoughts',
    description: 'Your honest feedback',
    questions: [
      {
        id: 'downloadTrigger',
        text: 'What would make you download this app on Day 1?',
        type: 'textarea',
        required: true,
        placeholder: 'Share your thoughts...'
      },
      {
        id: 'deleteTrigger',
        text: 'What would make you DELETE this app after a week?',
        type: 'textarea',
        required: true,
        placeholder: 'Be honest - what would frustrate you?'
      },
      {
        id: 'privacyConcerns',
        text: 'Any concerns about privacy, verification, or coach access?',
        type: 'textarea',
        required: false,
        placeholder: 'Share any concerns...'
      },
      {
        id: 'multiKidFeedback',
        text: 'What are we missing for multi-kid or multi-sport families?',
        type: 'textarea',
        required: false,
        placeholder: 'What would make managing multiple kids easier?'
      },
      {
        id: 'recommendationLikelihood',
        text: 'If this app solved your problem, would you recommend it to other sports parents?',
        type: 'radio',
        required: true,
        options: [
          'Definitely—I\'d tell everyone',
          'Probably—if it works well',
          'Maybe—depends how it goes',
          'Probably not'
        ]
      },
      {
        id: 'referralMotivation',
        text: 'What would make you tell other parents about this app? (Select all that apply)',
        type: 'checkbox',
        required: false,
        options: [
          'It saves me significant time',
          'My kid is more engaged/motivated',
          'Coaches recognize and use it',
          'College recruiters take it seriously',
          'It\'s completely free or very affordable',
          'Other families are using it',
          'Referral bonus/incentive'
        ]
      },
      {
        id: 'techComfort',
        text: 'How comfortable are you with technology and new apps?',
        type: 'radio',
        required: true,
        options: [
          'Very comfortable—early adopter',
          'Comfortable—I try new apps regularly',
          'Moderate—I use apps but stick to what I know',
          'Uncomfortable—prefer simple, proven solutions'
        ]
      },
      {
        id: 'decisionMaker',
        text: 'Who makes the final decision about which sports apps your family uses?',
        type: 'radio',
        required: true,
        options: [
          'I decide',
          'My spouse/partner decides',
          'We decide together',
          'My child decides',
          'We decide together as a family'
        ]
      }
    ]
  },

  // Section 15: Beta Testing & Contact
  {
    id: 15,
    title: 'Beta Testing & Contact',
    description: 'Get early access and help shape the product',
    questions: [
      {
        id: 'betaInterest',
        text: 'Are you interested in beta testing this app?',
        type: 'radio',
        required: true,
        options: [
          'Yes! Sign me up for beta access + 1 year free',
          'Maybe, tell me more first',
          'No, just wanted to share feedback'
        ]
      },
      {
        id: 'betaTimeCommitment',
        text: 'If selected for beta, how much time could you commit to testing and feedback?',
        type: 'radio',
        required: false,
        options: [
          '10-15 minutes per week (quick feedback)',
          '30-45 minutes per week (regular testing)',
          '1+ hours per week (power user testing)',
          'Can\'t commit to specific time'
        ]
      },
      {
        id: 'email',
        text: 'Email address for beta access and updates:',
        type: 'email',
        required: true,
        placeholder: 'your.email@example.com'
      },
      {
        id: 'phone',
        text: 'Phone number (optional, for beta testing coordination):',
        type: 'phone',
        required: false,
        placeholder: '(555) 123-4567'
      },
      {
        id: 'betaSportFocus',
        text: 'Best sport(s) for us to focus on first in beta?',
        type: 'text',
        required: false,
        placeholder: 'e.g., Soccer, Basketball'
      },
      {
        id: 'videoInterviewWillingness',
        text: 'Would you be willing to do a 15-minute video interview to share your experience in more depth?',
        type: 'radio',
        required: false,
        options: [
          'Yes, I\'d love to help',
          'Maybe, depends on timing',
          'No thanks'
        ]
      },
      {
        id: 'communityActivity',
        text: 'Are you active in sports parent groups (Facebook, team chats, etc.)?',
        type: 'radio',
        required: true,
        options: [
          'Yes, very active',
          'Somewhat active',
          'Not really',
          'No'
        ]
      },
      {
        id: 'referralSource',
        text: 'How did you hear about this survey?',
        type: 'radio',
        required: false,
        options: [
          'Social media',
          'Friend/parent recommendation',
          'Coach shared it',
          'Team/club communication',
          'Online search',
          'Other'
        ]
      }
    ]
  }
];
