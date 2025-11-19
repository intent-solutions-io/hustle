#!/bin/bash
# generate_intent_logos.sh
# Generate Intent Solutions IO logos using Vertex AI Imagen 4

set -euo pipefail

PROJECT_ID=$(gcloud config get-value project)
LOCATION="us-central1"
MODEL_ID="imagegeneration@006"
API_ENDPOINT="https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}:predict"
BUCKET="gs://hustleapp-production-logos"
WORKDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="${WORKDIR}/tmp/logos/raw"
LOG_DIR="${WORKDIR}/tmp/logos/logs"

mkdir -p "${OUT_DIR}" "${LOG_DIR}"

echo "🎨 Intent Solutions IO Logo Generation"
echo "Project: ${PROJECT_ID}"
echo "Model: ${MODEL_ID}"
echo "Bucket: ${BUCKET}"
echo

# Create bucket if it doesn't exist
gsutil mb -l ${LOCATION} ${BUCKET} 2>/dev/null || true

# 4 Logo Variants
LOGOS_JSON=$(cat <<'JSON'
[
  {
    "id": "01",
    "name": "infrastructure-architect-badge",
    "prompt": "Ultra-professional minimalist logo badge for \"INTENT SOLUTIONS IO\" - independent AI consulting and cloud infrastructure engineering company.\n\nDESIGN CONCEPT:\nAbstract geometric representation of multi-layer cloud infrastructure architecture. Visualize distributed systems, microservices orchestration, and data flow through intelligent agent networks.\n\nVISUAL STRUCTURE:\n- Central icon: Modular geometric composition suggesting layered infrastructure\n- Three stacked or nested hexagons representing cloud layers (data, compute, orchestration)\n- Subtle connection lines between layers showing data flow and agent communication\n- Letter \"I\" or \"IS\" monogram integrated into architectural structure\n- Clean sans-serif wordmark \"INTENT SOLUTIONS IO\" below or alongside icon\n\nSTYLE SPECIFICATIONS:\n- Geometric precision: Sharp angles, perfect symmetry, architectural exactness\n- Infrastructure abstraction: Not literal cloud icons - pure geometric representation\n- Modular composition: Pieces fit together like microservices architecture\n- Forward momentum: Subtle directional flow (left-to-right or bottom-to-top)\n- Scalable design: Must work at 16px (favicon) and 4096px (presentation)\n\nCOLOR PALETTE:\n- Primary shape: Deep charcoal #18181b (80% opacity for depth layering)\n- Connection lines: Google Cloud blue #4285F4 (subtle accent, 60% opacity)\n- Background: Transparent\n- Typography: Charcoal #18181b (100% opacity, bold weight)\n\nTYPOGRAPHY:\n- Font style: Geometric sans-serif (Inter, Geist, or similar)\n- \"INTENT SOLUTIONS\" in bold weight, clean tracking\n- \"IO\" as compact technical suffix (slightly smaller, same weight)\n- All caps or title case (test both for best balance)\n\nMOOD & POSITIONING:\n- Enterprise-grade technical authority\n- Independent builder, not corporate consulting firm\n- \"Creating industries that don't exist\" - category creation, not incremental\n- Production-ready infrastructure, shipping to live systems\n- Google Cloud ecosystem alignment (Vertex AI, BigQuery, Firebase)\n\nREFERENCE AESTHETIC:\n- Google Cloud product logos (clean, authoritative, cloud-native)\n- Stripe (developer-first enterprise credibility)\n- Vercel (modern platform engineering, minimalist)\n- Temporal (distributed systems infrastructure, geometric precision)\n- NOT generic consulting logos - this is deep infrastructure engineering\n\nOUTPUT FORMAT:\n- Square composition (1:1 aspect ratio)\n- 4096 x 4096 pixels minimum resolution\n- Clean transparent background\n- Icon + wordmark lockup (horizontal preferred)\n- Badge-only variant (icon without text) for compact contexts\n\nAVOID:\n- Generic cloud icons (fluffy clouds, weather symbols)\n- Overused tech symbols (gears, circuits, lightbulbs)\n- Corporate consulting aesthetics (blue suits, handshakes, arrows)\n- Gradient overlays, drop shadows, or glossy effects\n- Literal AI imagery (brains, neural networks, robots)"
  },
  {
    "id": "02",
    "name": "agent-orchestration-network",
    "prompt": "Professional logo system for \"INTENT SOLUTIONS IO\" - AI agent orchestration and automation engineering company.\n\nDESIGN CONCEPT:\nVisualize intelligent agent communication through A2A (Agent-to-Agent) protocol. Show distributed intelligence, autonomous systems, and orchestrated workflows as an elegant geometric network.\n\nVISUAL STRUCTURE:\n- Central orchestration hub: Circular or hexagonal node (main coordinator)\n- Satellite agent nodes: 3-5 smaller geometric shapes orbiting or connecting to hub\n- Connection pathways: Clean lines showing data flow and agent communication\n- Network topology: Star pattern (hub-and-spoke) or mesh (interconnected)\n- Integrated monogram: \"IS\" or \"I\" formed by node arrangement or connection pattern\n\nCOMPOSITIONAL LAYOUT:\n- Primary icon: Agent network diagram (abstract, geometric)\n- Wordmark placement: Below or to the right of network icon\n- Horizontal lockup for corporate headers and presentations\n- Vertical stacked variant for social media and mobile contexts\n\nSTYLE SPECIFICATIONS:\n- Precision geometry: Perfect circles, hexagons, or octagonal nodes\n- Intelligent spacing: Mathematical rhythm in node distribution\n- Subtle motion implied: Asymmetric balance suggesting data flow\n- Modular system: Each node could exist as standalone element\n- Technical elegance: Engineering precision meets modern design\n\nCOLOR PALETTE:\n- Hub node: Deep charcoal #18181b (100% opacity, primary authority)\n- Agent nodes: Google Cloud blue #4285F4 (60% opacity, AI intelligence)\n- Connection lines: Gradient from charcoal to blue (subtle, 40% opacity)\n- Optional accent: Vertex AI purple #9334EA (1-2 nodes, AI agent signal)\n- Typography: Charcoal #18181b (bold, confident)\n\nTYPOGRAPHY:\n- Primary font: Geometric sans-serif (Inter Bold, Geist Semi-bold)\n- \"INTENT SOLUTIONS\" in all caps, tight tracking (-1%)\n- \"IO\" suffix smaller (70% size), same weight, slight letter-spacing\n- Clean alignment with network icon baseline\n\nMOOD & POSITIONING:\n- Autonomous intelligence: Agents working together without human intervention\n- Orchestration mastery: Complex systems made elegant\n- Production infrastructure: Battle-tested, enterprise-ready\n- \"You sell, we build\" white-label positioning\n- Vertex AI Agent Engine expertise (A2A protocol, Memory Bank)\n\nREFERENCE AESTHETIC:\n- Kubernetes architecture diagrams (node orchestration)\n- Temporal workflow visualizations (distributed systems)\n- Firebase product suite logos (modular, interconnected)\n- N8N automation nodes (workflow elegance)\n- AWS architecture icons (clean technical diagrams)\n\nOUTPUT FORMAT:\n- 4096 x 4096 pixels (square canvas)\n- Horizontal lockup (icon left, wordmark right)\n- Icon-only badge (network diagram without text)\n- Both light and dark mode variants\n\nAVOID:\n- Chaotic network diagrams (keep 3-5 nodes max)\n- Literal AI imagery (neural networks, brain scans)\n- Generic connection graphics (random dots and lines)\n- Busy compositions (emphasize negative space)\n- Trendy gradients or neon effects"
  },
  {
    "id": "03",
    "name": "data-flow-architecture",
    "prompt": "Enterprise-grade minimalist logo for \"INTENT SOLUTIONS IO\" - data engineering and cloud infrastructure company.\n\nDESIGN CONCEPT:\nAbstract representation of data flowing through intelligent infrastructure layers. Visualize ETL pipelines, BigQuery analytics, and Firebase real-time sync as elegant geometric pathways.\n\nVISUAL STRUCTURE:\n- Layered infrastructure: 3 horizontal strata representing data layers (bottom: ingestion, middle: processing, top: application)\n- Data flow indicator: Subtle arrow, line gradient, or directional shape\n- Monogram integration: \"I\" letterform formed by vertical data pathway\n- Architecture cross-section: Side view of multi-tier cloud infrastructure\n\nCOMPOSITIONAL LAYOUT:\n- Icon orientation: Horizontal layers (landscape) or vertical flow (portrait)\n- Wordmark: \"INTENT SOLUTIONS IO\" below horizontal icon or beside vertical flow\n- Lockup flexibility: Works in horizontal (website header) and vertical (business card)\n\nSTYLE SPECIFICATIONS:\n- Architectural blueprint aesthetic: Clean lines, precise angles, technical drawing\n- Layered transparency: Each infrastructure tier has subtle opacity variation\n- Directional flow: Visual weight moves from input to output (left-to-right or bottom-to-top)\n- Modular precision: Each layer could be extracted as standalone graphic\n- Production-ready signal: No sketches or drafts - this is deployed infrastructure\n\nCOLOR PALETTE:\n- Base layer (data ingestion): Charcoal #18181b (100% opacity, solid foundation)\n- Processing layer (AI/analytics): Google Cloud blue #4285F4 (70% opacity, intelligent processing)\n- Application layer (outputs): Blue #4285F4 (40% opacity, light delivery)\n- Data flow accent: Gradient from charcoal to blue (subtle directional indicator)\n- Typography: Charcoal #18181b (bold, grounded)\n\nTYPOGRAPHY:\n- Primary typeface: Monospace-inspired geometric sans (JetBrains Mono, Geist Mono, or Inter)\n- \"INTENT SOLUTIONS\" in semi-bold, architectural tracking\n- \"IO\" technical suffix (slightly condensed, same weight)\n- All caps preferred (matches technical/infrastructure aesthetic)\n\nMOOD & POSITIONING:\n- Infrastructure authority: Deep expertise in cloud-native architectures\n- Data engineering mastery: BigQuery, ETL pipelines, real-time sync\n- Production deployment focus: \"Measurable automation, real outcomes\"\n- Google Cloud ecosystem: Vertex AI, Firebase, Cloud Functions, BigQuery\n- Operator-focused: Built for teams eliminating manual reporting\n\nREFERENCE AESTHETIC:\n- Google Cloud architecture diagrams (clean, layered, technical)\n- Snowflake data platform logo (data flow, precision)\n- Databricks (data engineering, analytics pipelines)\n- Supabase (developer-first infrastructure, clean design)\n- Fivetran (data pipeline automation, minimalist)\n\nOUTPUT FORMAT:\n- 4096 x 4096 pixels minimum\n- Both horizontal and vertical lockups\n- Icon-only badge (layered infrastructure without text)\n- Light mode (charcoal on white) and dark mode (white/blue on dark)\n\nAVOID:\n- Literal data imagery (spreadsheets, databases, servers)\n- Generic flow charts (boxes and arrows)\n- Corporate IT aesthetics (stuffy, outdated)\n- Overly complex diagrams (keep 3 layers maximum)\n- Skeuomorphic effects (no 3D, shadows, or textures)"
  },
  {
    "id": "04",
    "name": "category-creator-emblem",
    "prompt": "Bold, forward-thinking logo emblem for \"INTENT SOLUTIONS IO\" - category-creating AI and infrastructure company.\n\nDESIGN CONCEPT:\nVisualize \"Creating industries that don't exist\" through pioneering geometric abstraction. Design represents uncharted territory, new categories, and industry-defining infrastructure.\n\nVISUAL STRUCTURE:\n- Central emblem: Shield, badge, or geometric crest (authority, pioneering)\n- Abstract frontier symbol: Horizon line, forward arrow, or expanding geometry\n- Monogram integration: \"IS\" or \"INTENT\" abbreviated in emblem center\n- Architectural foundation: Stable base suggesting infrastructure depth\n- Forward momentum: Visual weight or directional element pointing toward future\n\nCOMPOSITIONAL LAYOUT:\n- Emblem-style badge: Compact, authoritative, recognizable at any size\n- Wordmark below or wrapping emblem perimeter\n- Lock-up versatility: Works as standalone icon or full wordmark system\n- Symmetrical or asymmetric: Test both for best balance of authority and innovation\n\nSTYLE SPECIFICATIONS:\n- Bold geometric confidence: Strong shapes, definitive lines, category authority\n- Pioneering signal: Subtle asymmetry or directional element (not static)\n- Infrastructure foundation: Base geometry suggests depth and stability\n- Modern heritage: Feels established yet forward-thinking\n- Timeless design: Won't feel dated in 5 years (avoid trends)\n\nCOLOR PALETTE:\n- Emblem primary: Deep charcoal #18181b (100% opacity, authoritative)\n- Accent element: Google Cloud blue #4285F4 (60% opacity, innovation signal)\n- Optional accent: Vertex AI purple #9334EA (1 element, AI category creation)\n- Emblem border: Charcoal with subtle blue gradient (optional, test both)\n- Typography: Charcoal #18181b (bold weight, confident)\n\nTYPOGRAPHY:\n- Emblem-compatible font: Geometric sans with strong presence (Inter Black, Geist Bold)\n- \"INTENT SOLUTIONS\" wrapping or below emblem\n- \"IO\" integrated into emblem design or as separate technical suffix\n- All caps with architectural tracking (slightly condensed for emblem fit)\n- Optional: Tagline \"Creating industries that don't exist\" in smaller weight below\n\nMOOD & POSITIONING:\n- Category pioneer: Not incremental improvement, industry creation\n- Infrastructure authority: Battle-tested, production-deployed systems\n- Independent mastery: Jeremy Longshore as practitioner-founder, not theorist\n- White-label expertise: \"You sell, we build\" partner positioning\n- Google Cloud native: Vertex AI Agent Engine, A2A protocol, Firebase, BigQuery\n\nREFERENCE AESTHETIC:\n- Stripe emblem (authoritative, payment infrastructure pioneer)\n- Docker whale (category creator, developer tool identity)\n- MongoDB leaf (database category, recognizable icon)\n- Cloudflare badge (internet infrastructure, authoritative)\n- Terraform (infrastructure as code, pioneering category)\n\nSPECIFIC DESIGN ELEMENTS TO EXPLORE:\n1. Horizon Line: Abstract frontier representing new industries\n2. Expanding Hexagon: Growth from center (industry creation)\n3. Forward Arrow: Integrated into emblem (pioneering direction)\n4. Layered Shield: Infrastructure depth, protective stability\n5. Geometric Compass: Navigation into uncharted territory\n\nOUTPUT FORMAT:\n- 4096 x 4096 pixels (square emblem composition)\n- Emblem-only variant (icon without text)\n- Full lockup (emblem + wordmark)\n- Optional tagline version (emblem + wordmark + \"Creating industries that don't exist\")\n- Light mode and dark mode variants\n\nAVOID:\n- Generic badge templates (shields, stars, ribbons)\n- Literal imagery (buildings, factories, construction)\n- Overused pioneer symbols (compasses, maps, flags)\n- Busy compositions (emphasize bold simplicity)\n- Trendy geometric patterns (keep timeless)\n\nCREATIVE DIRECTION:\nThis emblem represents a company that doesn't follow trends—it creates new categories. The design should feel both authoritative (established infrastructure) and pioneering (uncharted territory). Think Stripe's authority + MongoDB's category creation + Cloudflare's infrastructure mastery."
  }
]
JSON
)

ACCESS_TOKEN="$(gcloud auth application-default print-access-token)"

echo "📤 Submitting logo generation requests..."
echo

echo "${LOGOS_JSON}" | jq -c '.[]' | while read -r logo; do
  id=$(echo "${logo}" | jq -r '.id')
  name=$(echo "${logo}" | jq -r '.name')
  prompt=$(echo "${logo}" | jq -r '.prompt')

  echo "LOGO ${id} – ${name}"

  # Imagen 3 uses synchronous predict, generate 3 samples sequentially
  for sample in {1..3}; do
    payload=$(jq -n --arg prompt "${prompt}" '{
        instances: [{
          prompt: $prompt
        }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          safetyFilterLevel: "block_only_high",
          personGeneration: "allow_adult"
        }
      }')

    response=$(curl -s -X POST \
      -H "Authorization: Bearer ${ACCESS_TOKEN}" \
      -H "Content-Type: application/json" \
      "${API_ENDPOINT}" \
      -d "${payload}")

    # Check for image data in response
    image_data=$(echo "${response}" | jq -r '.predictions[0].bytesBase64Encoded // empty')
    if [[ -z "${image_data}" ]]; then
      echo "  ❌ Sample ${sample} failed: $(echo "${response}" | jq -r '.error.message // "Unknown error"')" | tee -a "${LOG_DIR}/submit.log"
      continue
    fi

    # Save image
    output_file="${OUT_DIR}/logo-${id}_${name}_variant-${sample}.png"
    echo "${image_data}" | base64 -d > "${output_file}"
    echo "  ✅ Sample ${sample} saved: ${output_file}"
  done

  echo
done

echo
echo "✅ All logo generation complete!"

echo
echo "🎉 Logo generation complete!"
echo "📁 Logos saved to: ${OUT_DIR}"
echo
echo "Generated 4 logo variants (3 samples each = 12 total):"
echo "  01 - Infrastructure Architect Badge"
echo "  02 - Agent Orchestration Network"
echo "  03 - Data Flow Architecture"
echo "  04 - Category Creator Emblem"
echo
echo "Next steps:"
echo "1. Review all 12 logos: ls -lh ${OUT_DIR}"
echo "2. Select best sample from each variant"
echo "3. Vectorize using https://vectorizer.ai"
echo "4. Deploy to https://intentsolutions.io"
