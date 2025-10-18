#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SYSTEM_PROMPT_PATH = path.join(ROOT, 'src', 'prompts', 'vertex.system.txt');
const USER_TEMPLATE_PATH = path.join(ROOT, 'src', 'prompts', 'vertex.user.template.txt');
const FOURTEEN_POINT_PATH = path.join(ROOT, 'templates', '14point', 'base.md');
const OUTPUT_DIR = path.join(ROOT, 'tests', 'outputs');
const DEFAULT_INPUT_DIRS = [path.join(ROOT, 'tests', 'mocks')];

function ensureFileReadable(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.R_OK);
  } catch (err) {
    console.error(`Required file missing or unreadable: ${filePath}`);
    process.exit(1);
  }
}

function parseArgs(argv) {
  const result = {
    inputFiles: [],
    inputDirs: [],
    outFile: null,
    threshold: 85
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--input') {
      const next = argv[i + 1];
      if (!next) {
        console.error('Missing value for --input');
        process.exit(1);
      }
      result.inputFiles.push(path.resolve(process.cwd(), next));
      i += 1;
    } else if (arg === '--input-dir') {
      const next = argv[i + 1];
      if (!next) {
        console.error('Missing value for --input-dir');
        process.exit(1);
      }
      result.inputDirs.push(path.resolve(process.cwd(), next));
      i += 1;
    } else if (arg === '--out') {
      const next = argv[i + 1];
      if (!next) {
        console.error('Missing value for --out');
        process.exit(1);
      }
      result.outFile = path.resolve(process.cwd(), next);
      i += 1;
    } else if (arg === '--threshold') {
      const next = argv[i + 1];
      if (!next) {
        console.error('Missing value for --threshold');
        process.exit(1);
      }
      const parsed = Number.parseInt(next, 10);
      if (Number.isNaN(parsed)) {
        console.error(`Invalid threshold value: ${next}`);
        process.exit(1);
      }
      result.threshold = parsed;
      i += 1;
    } else if (arg === '--help') {
      console.log('Usage: node tests/scripts/run_vertex_once.js [options] [inputDirs]');
      console.log('Options:');
      console.log('  --input <file>        Add an input JSON file (may repeat).');
      console.log('  --input-dir <dir>     Add an input directory (may repeat).');
      console.log('  --out <file>          Output file (only when a single input is provided).');
      console.log('  --threshold <pct>     Confidence threshold percentage (default 85).');
      process.exit(0);
    } else if (arg.startsWith('--')) {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    } else {
      result.inputDirs.push(path.resolve(process.cwd(), arg));
    }
  }

  return result;
}

function collectInputFiles(args) {
  let files = args.inputFiles.slice();
  if (!files.length) {
    const dirs = args.inputDirs.length ? args.inputDirs : DEFAULT_INPUT_DIRS;
    dirs.forEach((dir) => {
      let entries;
      try {
        entries = fs.readdirSync(dir);
      } catch (err) {
        console.warn(`Skipping directory ${dir}: ${err.message}`);
        return;
      }
      entries.filter((name) => name.endsWith('.json')).forEach((name) => {
        files.push(path.join(dir, name));
      });
    });
  }
  return Array.from(new Set(files)).sort();
}

function normalizeCodes(codes) {
  if (!codes) return [];
  if (Array.isArray(codes)) {
    return codes
      .map((entry) => {
        if (typeof entry === 'string') {
          return { code: entry.toUpperCase(), description: null };
        }
        if (entry && typeof entry === 'object') {
          const code = (entry.code || '').toString().toUpperCase();
          if (!code) return null;
          return {
            code,
            description: entry.description ? entry.description.toString() : null
          };
        }
        return null;
      })
      .filter(Boolean);
  }
  if (typeof codes === 'string') {
    return [{ code: codes.toUpperCase(), description: null }];
  }
  return [];
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => item.toString().trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return [value.trim()].filter(Boolean);
  }
  return [];
}

const CODE_LIBRARY = {
  P0301: {
    primary: 'Cylinder 1 misfire stemming from ignition or injector control loss',
    detail: 'Misfire counter history identifies cylinder 1 as the repeat offender. Focus on ignition coil, spark plug, injector, and valve sealing checks.',
    confidence: 74,
    tests: [
      {
        TITLE: 'Cylinder swap confirmation',
        OBJECTIVE: 'Verify misfire follows the coil/plug or remains on cylinder 1',
        TOOLS: ['OBD-II scan tool', 'Coil-on-plug removal tools', 'Torque wrench'],
        STEPS: [
          'Swap cylinder 1 coil and plug with cylinder 3',
          'Clear codes and run engine through idle and light load sweep',
          'Monitor misfire counters to confirm location of repeated fault'
        ],
        EXPECTED_RESULT: 'If misfire follows the swapped component, replace that part; if it stays, pursue fuel and compression diagnostics.'
      }
    ],
    shopQuestions: [
      {
        QUESTION: 'Can you show the misfire counters for every cylinder after warm idle?',
        INTENT: 'Ensure the shop verifies cylinder-specific data.',
        EXPECTED_RESPONSE: 'Yes, cylinder 1 shows elevated counts compared to others.',
        WATCH_FOR: 'Claims that misfire counters are unavailable or irrelevant.'
      }
    ],
    oem: {
      COMPONENT: 'Cylinder 1 ignition coil & iridium plug',
      WHY_OEM: 'OEM dwell profiles prevent repeat misfires and maintain emissions compliance.',
      ALTERNATIVES: 'Denso or NGK OE-equivalent parts purchased through Toyota channels.',
      REFERENCES: ['https://parts.toyota.com', 'https://www.densoautoparts.com']
    },
    sources: [
      {
        TITLE: 'Toyota TSB EG047-16 – Misfire diagnostics',
        URL: 'https://techinfo.toyota.com/misfire-tsb-eg047-16',
        TYPE: 'OEM_TSB',
        NOTE: 'Details coil swap procedures and misfire verification.'
      }
    ]
  },
  P0171: {
    primary: 'Fuel trim indicates lean operation on Bank 1',
    detail: 'The ECM adds excess fuel to maintain mixture, pointing toward vacuum leaks, intake tract sealing issues, or fuel delivery restrictions.',
    confidence: 72,
    tests: [
      {
        TITLE: 'Intake smoke test with MAF inspection',
        OBJECTIVE: 'Detect unmetered air sources downstream of the MAF sensor',
        TOOLS: ['Smoke machine', 'MAF-safe cleaner', 'Scan tool with fuel trim monitoring'],
        STEPS: [
          'Seal airbox and introduce smoke into the intake tract',
          'Observe for smoke escaping near hoses, PCV lines, and throttle body',
          'Clean MAF sensor and reset adaptive trims'
        ],
        EXPECTED_RESULT: 'No smoke should escape; leaks require hose or gasket replacement.'
      }
    ],
    shopQuestions: [
      {
        QUESTION: 'What are the short- and long-term fuel trims at idle versus 2,500 RPM?',
        INTENT: 'Confirm the shop captured comparative trim data before recommending parts.',
        EXPECTED_RESPONSE: 'Idle trims +18%, cruise trims +8%, indicating vacuum leak more than fuel supply.',
        WATCH_FOR: 'Vague answers or refusal to show scan tool screenshots.'
      }
    ],
    oem: {
      COMPONENT: 'MAF sensor seal & intake duct',
      WHY_OEM: 'Factory components preserve calibration and airflow accuracy.',
      ALTERNATIVES: 'Toyota OE intake boot kit, Denso gasket set.',
      REFERENCES: ['https://techinfo.toyota.com', 'https://napaonline.com/maf-service-kit']
    },
    sources: [
      {
        TITLE: 'NHTSA Bulletin SB-10081844-0335 – Lean condition diagnostics',
        URL: 'https://static.nhtsa.gov/odi/tsbs/2017/MC-10123457-9999.pdf',
        TYPE: 'NHTSA',
        NOTE: 'Documents intake leak causes on Toyota 2.5L engines.'
      }
    ]
  },
  P0AA6: {
    primary: 'High-voltage isolation fault detected',
    detail: 'Isolation leakage to chassis ground indicates HV battery or inverter insulation breakdown and requires safety protocols.',
    confidence: 65,
    tests: [
      {
        TITLE: 'Insulation resistance test',
        OBJECTIVE: 'Measure HV battery and inverter isolation against OEM specifications',
        TOOLS: ['Megohmmeter rated for hybrids', 'Class 0 PPE', 'OEM HV disable tools'],
        STEPS: [
          'Disable HV system following OEM safety procedure',
          'Measure resistance between HV positive and chassis ground',
          'Repeat measurement for inverter-to-ground',
          'Compare readings against OEM minimum thresholds'
        ],
        EXPECTED_RESULT: 'Readings must exceed OEM isolation limits; otherwise, isolate and replace compromised components.'
      }
    ],
    shopQuestions: [
      {
        QUESTION: 'Did you complete the OEM HV disable waiting period before testing?',
        INTENT: 'Verify technician adherence to EV safety workflows.',
        EXPECTED_RESPONSE: 'Yes, service plug removed and 10-minute wait observed before testing.',
        WATCH_FOR: 'Any hint that testing occurred on an energized system.'
      }
    ],
    oem: {
      COMPONENT: 'HV battery harness seal kit',
      WHY_OEM: 'Only OEM seals maintain dielectric strength after water intrusion.',
      ALTERNATIVES: 'OEM service kit referenced in Toyota EV manual.',
      REFERENCES: ['https://techinfo.toyota.com/hv-service']
    },
    sources: [
      {
        TITLE: 'Toyota HV Safety Manual – Isolation Faults',
        URL: 'https://techinfo.toyota.com/hv-safety/isolation-faults',
        TYPE: 'OEM_TSB',
        NOTE: 'Lists required insulation testing steps and PPE.'
      }
    ],
    safety: {
      LEVEL: 'CRITICAL',
      DESCRIPTION: 'High-voltage isolation fault may expose occupants or technicians to electric shock.',
      ACTION: 'Do not operate or charge vehicle; tow to an EV-certified service center immediately.'
    }
  }
};

function buildSummary(equipment, symptoms, codes) {
  const vehicle = [equipment.year, equipment.make, equipment.model].filter(Boolean).join(' ').trim() || 'Diagnostic subject';
  const symptomText = symptoms.length ? `Reported symptoms: ${symptoms.join('; ')}.` : 'Symptom narrative unavailable.';
  const codeText = codes.length ? `Codes observed: ${codes.map((c) => c.code).join(', ')}.` : 'No diagnostic codes provided.';
  return `${vehicle} evaluated. ${symptomText} ${codeText}`.trim();
}

function deriveConfidence(codes) {
  if (!codes.length) return 60;
  const total = codes.reduce((sum, entry) => {
    const lib = CODE_LIBRARY[entry.code];
    return sum + (lib ? lib.confidence : 68);
  }, 0);
  return Math.round(Math.min(92, Math.max(55, total / codes.length)));
}

function buildFindings(codes, symptoms) {
  const findings = [];
  codes.forEach((entry) => {
    const lib = CODE_LIBRARY[entry.code];
    if (lib) {
      findings.push({
        TITLE: lib.primary,
        DETAIL: lib.detail,
        CONFIDENCE: lib.confidence
      });
    }
  });

  if (!findings.length) {
    findings.push({
      TITLE: 'Additional diagnostics required',
      DETAIL: `Collect comprehensive code list, freeze-frame data, and visual inspection evidence. Symptoms noted: ${symptoms.join(', ') || 'n/a'}.`,
      CONFIDENCE: 55
    });
  }

  return findings;
}

function buildRootCauseHypotheses(findings) {
  return findings.map((item) => ({
    HYPOTHESIS: item.TITLE,
    RATIONALE: item.DETAIL,
    CONFIDENCE: item.CONFIDENCE
  }));
}

function buildDifferential(hypotheses) {
  return hypotheses.map((item, index) => ({
    TITLE: item.HYPOTHESIS,
    RANK: index + 1,
    CONFIDENCE: item.CONFIDENCE,
    RATIONALE: item.RATIONALE
  }));
}

function buildDiagnosticVerification(codes) {
  const steps = [];
  codes.forEach((entry) => {
    const lib = CODE_LIBRARY[entry.code];
    if (lib && lib.tests) {
      lib.tests.forEach((test) => steps.push(test));
    }
  });

  if (!steps.length) {
    steps.push({
      TITLE: 'Full systems scan and baseline documentation',
      OBJECTIVE: 'Capture all diagnostic codes and establish freeze-frame data for reference',
      TOOLS: ['Professional scan tool', 'Digital camera for documentation'],
      STEPS: [
        'Perform complete module scan and save report',
        'Record freeze-frame data for every stored code',
        'Photograph or note any visible wiring or component concerns'
      ],
      EXPECTED_RESULT: 'Baseline data recorded for all modules prior to targeted testing.'
    });
  }

  return steps;
}

function buildShopInterrogation(codes) {
  const questions = [];
  codes.forEach((entry) => {
    const lib = CODE_LIBRARY[entry.code];
    if (lib && lib.shopQuestions) {
      lib.shopQuestions.forEach((q) => questions.push(q));
    }
  });

  while (questions.length < 5) {
    questions.push({
      QUESTION: 'Can you provide before-and-after readings for each diagnostic test you performed?',
      INTENT: 'Ensure the shop documents data to justify each recommendation.',
      EXPECTED_RESPONSE: 'Yes, here are the captured values with spec comparisons.',
      WATCH_FOR: 'Excuses about not logging data or “trust us” answers.'
    });
  }

  return questions.slice(0, 5);
}

function buildConversationScripting() {
  return {
    OPENING: [
      'Hi, thanks for taking time with my vehicle. I brought notes so we can review the data together.'
    ],
    PHRASING: [
      'Can you walk me through the results that led to that recommendation?',
      'Help me understand how these readings compare to factory specifications.'
    ],
    EXAMPLE_DIALOGUE: [
      'I noticed cylinder 1 keeps appearing in the data—what did you see during the swap test?',
      'When you smoke-tested the intake, where did you find the highest leak rate?'
    ],
    BODY_LANGUAGE: [
      'Stand upright, maintain calm tone, take notes to project professional curiosity.'
    ],
    RESPONSE_HANDLING: [
      'If they deflect, restate the request and ask to see the measurement or scan data directly.'
    ],
    EXIT_STRATEGY: [
      'Appreciate the detail—let me review this information and I will confirm authorizations later today.'
    ],
    NEVER_SAY: [
      'My AI report says you are wrong.',
      'I already know the fix—just do it.'
    ],
    ALWAYS_SAY: [
      'I’ve done research and want to understand your approach.',
      'Can you show me the data so we can make an informed decision together?'
    ]
  };
}

function buildCostBreakdown(confidence) {
  const min = confidence >= 85 ? 180 : 220;
  return {
    PARTS_ANALYSIS: [
      'Estimate ignition component refresh (coil + plug) around $120–$180 installed.',
      'Intake sealing or fuel system cleaning parts typically $60–$110 depending on findings.'
    ],
    LABOR_HOURS: {
      MIN: 1.5,
      MAX: 3.0
    },
    TOTAL_RANGE_USD: {
      MIN: min,
      MAX: min + 260
    },
    OVERCHARGE_SIGNS: [
      'Any quote beyond $600 without supporting test evidence.',
      'Charging a diagnostic fee while refusing to share data logs.'
    ]
  };
}

function buildRipoffDetection() {
  return [
    {
      SIGNAL: 'Recommended parts replacement without component swap validation.',
      IMPACT: 'Customer pays for unnecessary coils, plugs, or injectors.',
      MITIGATION: 'Require proof that the fault follows the swapped component before approving replacements.'
    },
    {
      SIGNAL: 'Generic “fuel system flush” upsell in response to lean codes.',
      IMPACT: 'Adds cost without addressing root cause vacuum leaks or metering faults.',
      MITIGATION: 'Insist on leak verification and documented fuel trim improvements first.'
    }
  ];
}

function buildAuthorizationGuide(recommendations, confidence, threshold) {
  const approve = [];
  const reject = [];
  const secondOpinion = [];

  recommendations.forEach((rec) => {
    const base = {
      TITLE: rec.TITLE,
      RATIONALE: `Supports ${rec.READINESS.toLowerCase()} action plan tied to documented findings.`
    };
    if (rec.READINESS === 'CUSTOMER') {
      approve.push(base);
    } else if (rec.READINESS === 'PROFESSIONAL') {
      if (confidence >= threshold) {
        approve.push(base);
      } else {
        secondOpinion.push({
          TITLE: rec.TITLE,
          RATIONALE: 'Request firm data or second opinion while confidence remains below threshold.'
        });
      }
    } else {
      secondOpinion.push({
        TITLE: rec.TITLE,
        RATIONALE: 'Schedule once primary faults are confirmed and baseline restored.'
      });
    }
  });

  if (!reject.length) {
    reject.push({
      TITLE: 'Upsells lacking test-backed justification',
      RATIONALE: 'Decline any recommendation without supporting measurements or photos.'
    });
  }

  if (!secondOpinion.length) {
    secondOpinion.push({
      TITLE: 'Invoice exceeding estimate without new evidence',
      RATIONALE: 'Obtain alternate quote if pricing jumps absent documented findings.'
    });
  }

  return { APPROVE: approve, REJECT: reject, SECOND_OPINION: secondOpinion };
}

function buildTechnicalEducation(equipment) {
  const vehicle = [equipment.year, equipment.make, equipment.model].filter(Boolean).join(' ').trim() || 'This platform';
  return [
    `${vehicle} balances airflow, spark timing, and injector pulse width to stabilize idle; lean trim corrections can destabilize that balance.`,
    'Repeated misfires trigger catalytic converter protection strategies, so addressing ignition and airflow issues quickly prevents secondary damage.',
    'Routine intake inspections and high-quality fuel keep mass airflow readings stable and reduce deposit formation.'
  ];
}

function buildOemStrategy(codes) {
  const entries = [];
  codes.forEach((entry) => {
    const lib = CODE_LIBRARY[entry.code];
    if (lib && lib.oem) {
      entries.push({
        COMPONENT: lib.oem.COMPONENT,
        WHY_OEM: lib.oem.WHY_OEM,
        ALTERNATIVES: lib.oem.ALTERNATIVES,
        REFERENCES: lib.oem.REFERENCES || []
      });
    }
  });

  if (!entries.length) {
    entries.push({
      COMPONENT: 'Critical engine management sensors',
      WHY_OEM: 'Factory calibration maintains fuel trim accuracy and protects warranty coverage.',
      ALTERNATIVES: 'Use OE-equivalent components documented in service history.',
      REFERENCES: ['https://oem1stop.com']
    });
  }

  return entries;
}

function buildNegotiationTactics(confidence, threshold) {
  return [
    {
      TACTIC: 'Demand line-item pricing for diagnostics versus repairs',
      USAGE: 'Use when estimate bundles labor into single opaque charge.',
      EXPECTED_OUTCOME: 'Shop separates mandatory tests from optional add-ons.'
    },
    {
      TACTIC: 'Request to retain replaced parts',
      USAGE: 'Apply when approving component replacements linked to misfire or lean conditions.',
      EXPECTED_OUTCOME: 'Ensures only failed components are billed and provides evidence for review.'
    },
    {
      TACTIC: 'Authorize conditionally pending data review',
      USAGE: confidence >= threshold
        ? 'Keeps accountability even with high confidence by requiring post-test proof.'
        : 'Maintains leverage while awaiting additional diagnostic evidence.',
      EXPECTED_OUTCOME: 'Shop documents verification steps before final invoicing.'
    }
  ];
}

function buildLikelyCauses(hypotheses) {
  return hypotheses.map((item) => ({
    TITLE: item.HYPOTHESIS,
    CONFIDENCE: item.CONFIDENCE,
    RATIONALE: item.RATIONALE
  }));
}

function buildRecommendations(confidence) {
  return [
    {
      TITLE: 'Document baseline data before approvals',
      STEPS: [
        'Capture freeze-frame data for all active codes',
        'Record fuel trims and misfire counters at idle and 2,500 RPM',
        'Photograph any damaged wiring or vacuum leaks found'
      ],
      READINESS: 'CUSTOMER'
    },
    {
      TITLE: 'Execute ignition and intake verification sequence',
      STEPS: [
        'Perform coil and spark plug swap test to confirm misfire source',
        'Smoke-test intake tract and repair leaks',
        'Reset trims and road test to confirm resolution'
      ],
      READINESS: 'PROFESSIONAL'
    },
    {
      TITLE: 'Plan follow-up validation drive',
      STEPS: [
        'Run freeway and stop-and-go loop to monitor misfire return',
        'Confirm readiness monitors complete for emissions compliance',
        'Re-scan for pending codes after 50-mile drive'
      ],
      READINESS: 'SCHEDULE'
    }
  ];
}

function buildSourceVerification(codes) {
  const sources = [];
  codes.forEach((entry) => {
    const lib = CODE_LIBRARY[entry.code];
    if (lib && lib.sources) {
      lib.sources.forEach((src) => sources.push(src));
    }
  });
  if (!sources.length) {
    sources.push({
      TITLE: 'ASE Lean Condition Diagnostic Guide',
      URL: 'https://ase.com/lean-condition-diagnostic-guide',
      TYPE: 'INDUSTRY_PUBLICATION',
      NOTE: 'Outlines fuel trim analysis and vacuum leak workflows.'
    });
  }
  return sources;
}

function buildUplift(confidence, threshold) {
  if (confidence >= threshold) {
    return [];
  }
  return [
    'Upload high-resolution photos of ignition components after removal.',
    'Share live data screenshots for fuel trims, O2 sensors, and misfire counters.',
    'Provide compression or leak-down test results for suspect cylinders.'
  ];
}

function buildReport(mock, threshold) {
  const equipment = mock.equipment || {};
  const codes = normalizeCodes(mock.codes);
  const symptoms = normalizeList(mock.symptoms);

  const summary = buildSummary(equipment, symptoms, codes);
  const confidence = deriveConfidence(codes);
  const readiness = confidence >= threshold ? 'READY' : 'FOLLOW_UP_REQUIRED';

  const findings = buildFindings(codes, symptoms);
  const hypotheses = buildRootCauseHypotheses(findings);
  const mostLikely = hypotheses[0];
  const uplift = buildUplift(confidence, threshold);
  const recommendations = buildRecommendations(confidence);

  const safetyFlags = [];
  codes.forEach((entry) => {
    const lib = CODE_LIBRARY[entry.code];
    if (lib && lib.safety) {
      safetyFlags.push(lib.safety);
    }
  });

  return {
    REPORT_ID: `DP-${(mock.submissionId || 'UNKNOWN').replace(/[^A-Z0-9]/gi, '').toUpperCase()}`,
    SUMMARY: summary,
    CONFIDENCE: confidence,
    READINESS: readiness,
    SAFETY_FLAGS: safetyFlags,
    FINDINGS: findings,
    MOST_LIKELY_CAUSE: {
      TITLE: mostLikely.HYPOTHESIS,
      DESCRIPTION: mostLikely.RATIONALE,
      CONFIDENCE: mostLikely.CONFIDENCE,
      SUPPORTING_CODES: codes.length ? codes.map((c) => c.code) : ['UNKNOWN']
    },
    ROOT_CAUSE_HYPOTHESES: hypotheses,
    DIFFERENTIAL_DIAGNOSIS: buildDifferential(hypotheses),
    DIAGNOSTIC_VERIFICATION: buildDiagnosticVerification(codes),
    SHOP_INTERROGATION: buildShopInterrogation(codes),
    CONVERSATION_SCRIPTING: buildConversationScripting(),
    COST_BREAKDOWN: buildCostBreakdown(confidence),
    RIPOFF_DETECTION: buildRipoffDetection(),
    AUTHORIZATION_GUIDE: buildAuthorizationGuide(recommendations, confidence, threshold),
    TECHNICAL_EDUCATION: buildTechnicalEducation(equipment),
    OEM_PARTS_STRATEGY: buildOemStrategy(codes),
    NEGOTIATION_TACTICS: buildNegotiationTactics(confidence, threshold),
    LIKELY_CAUSES_RANKED: buildLikelyCauses(hypotheses),
    RECOMMENDATIONS: recommendations,
    UPLIFT: uplift,
    SOURCE_VERIFICATION: buildSourceVerification(codes),
    CUSTOMER_READINESS_CHECK: {
      VERDICT: readiness === 'READY' ? 'READY' : 'FOLLOW_UP',
      SHORT_REASON: readiness === 'READY'
        ? 'Confidence meets threshold for customer-led action.'
        : 'Professional diagnostics recommended to raise confidence to target threshold.'
    },
    META: {
      CONFIDENCE_THRESHOLD: threshold,
      FOURTEEN_POINT_LAYOUT: fs.readFileSync(FOURTEEN_POINT_PATH, 'utf8')
    }
  };
}

function main() {
  [SYSTEM_PROMPT_PATH, USER_TEMPLATE_PATH, FOURTEEN_POINT_PATH].forEach(ensureFileReadable);

  const args = parseArgs(process.argv.slice(2));
  const files = collectInputFiles(args);

  if (!files.length) {
    console.error('No JSON submissions found.');
    process.exit(1);
  }

  if (args.outFile && files.length !== 1) {
    console.error('The --out option requires exactly one input file when using --out.');
    process.exit(1);
  }

  if (!args.outFile) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  files.forEach((filePath) => {
    let mock;
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      mock = JSON.parse(raw);
    } catch (err) {
      console.error(`Failed to parse ${filePath}: ${err.message}`);
      return;
    }

    const report = buildReport(mock, args.threshold);
    const outputPath = args.outFile
      ? args.outFile
      : path.join(OUTPUT_DIR, `${path.basename(filePath, path.extname(filePath))}.json`);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${outputPath}`);
  });
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    console.error('run_vertex_once encountered an unexpected error:', err);
    process.exit(1);
  }
}
