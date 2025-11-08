# SEGMENT MAPPING STRATEGY
## How Video Clips Map to Text Overlays

### THE PROBLEM:
We have ~32-40 seconds of clips but need to tell a 60-second story with specific text overlays at precise moments.

### THE SOLUTION:
Strategic clip usage with speed adjustments and smart repetition.

---

## CLIP-TO-NARRATIVE MAPPING

### Available Clips (what we generated):
1. **opening** (5s) - Empty stadium at golden hour
2. **soccer_goal** (5s) - Clear soccer goal with net
3. **ball/soccer_ball_close** (4s) - Soccer ball on penalty spot
4. **locker/nwsl_jersey** (5s) - Empty locker room/jersey
5. **cleats/soccer_cleats_detail** (4s) - Cleats hanging
6. **field/soccer_pitch_lines** (5s) - Empty training field
7. **tunnel** (4s) - Dark stadium tunnel
8. **lights** (5s) - Stadium lights turning off

**Total Raw: ~37 seconds**

---

## SMART EXTENSION TO 60 SECONDS

### SEGMENT 1: THE INNOCENCE (0-10s)
**Clips:** `opening` (5s) + `soccer_ball_close` (5s)
**Speed:** Normal (1x)
**Text:** None - pure visual innocence
**Why:** Sets emotional baseline with clear soccer imagery

### SEGMENT 2: THE COMMISSIONER (10-15s)
**Clips:** `locker` (slowed to 5s)
**Speed:** 0.8x (slight slow motion for gravity)
**Text:**
- 10-13s: "Commissioner Jessica Berman"
- 13-15s: "Receives her marching orders from majority owners"
**Why:** Empty locker room represents institutional emptiness

### SEGMENT 3: MICHELE KANG (15-22s)
**Clips:** `field` (5s) + `tunnel` (2s)
**Speed:** Field at 1x, tunnel at 0.5x (dramatic slow)
**Text:**
- 15-18s: "Michele Kang - Washington Spirit"
- 18-20s: "Spent $30 million+ on women's soccer"
- 20-22s: "Why no answer?"
**Why:** Empty field = wasted investment

### SEGMENT 4: ANGIE LONG (22-30s)
**Clips:** `soccer_goal` (4s) + `soccer_pitch_lines` (4s)
**Speed:** Normal (1x)
**Text:**
- 22-26s: "Angie Long - Kansas City Current"
- 26-28s: "Built a $117 million stadium for women"
- 28-30s: "...only to let males play"
**Why:** Stadium/goal imagery = investment betrayed

### SEGMENT 5: THE WILFS (30-37s)
**Clips:** `opening` (reversed, 3s) + `tunnel` (4s)
**Speed:** Opening at 0.6x reverse, tunnel normal
**Text:**
- 30-33s: "The Wilf Family - Orlando Pride"
- 33-35s: "What excuse will they use?"
- 35-37s: "Money, probably."
**Why:** Reversed stadium = going backwards

### SEGMENT 6: THE POLICY (37-45s)
**Clips:** `cleats` (4s) + `nwsl_jersey` (4s)
**Speed:** Both at normal
**Text:**
- 37-41s: "The 2021 NWSL Policy remains in place"
- 41-45s: "Males can compete with castration or testosterone blockers"
**Why:** Equipment without players = dehumanization

### SEGMENT 7: THE QUESTION RETURNS (45-52s)
**Clips:** `ball` (3s) + `field` (4s)
**Speed:** Ball at 0.75x (lingering), field normal
**Text:**
- 45-49s: "Thousands of young girls are asking..."
- 49-52s: "Is it all about the money?"
**Why:** Return to innocence but now questioning

### SEGMENT 8: THE UNANSWERED (52-60s)
**Clips:** `lights` (5s) + `opening` (3s fade to black)
**Speed:** Lights at 0.8x, opening at 0.5x
**Text:**
- 52-56s: "What happened to women playing women?"
- 56-60s: "Why won't you answer them?"
**Why:** Lights out = dreams dying, fade to black = no answer

---

## TECHNICAL IMPLEMENTATION

```bash
# FFmpeg command to control timing
ffmpeg -i opening.mp4 -i soccer_ball.mp4 -i locker.mp4 ... \
  -filter_complex "
  [0:v]setpts=1.0*PTS[v0];  # Normal speed
  [2:v]setpts=1.25*PTS[v2]; # Slow locker room
  [6:v]setpts=2.0*PTS[v6];  # Very slow tunnel
  [0:v]reverse,setpts=1.67*PTS[v0r]; # Reversed slow opening
  ...
  concat=n=12:v=1[out]" \
  -map "[out]" extended_60s.mp4
```

---

## KEY STRATEGIES USED:

1. **Speed Ramping:** Slow motion on emotional moments (tunnel, lights)
2. **Clip Reuse:** Opening stadium used 3x at different speeds/directions
3. **Soccer Specificity:** Soccer-specific clips at crucial moments (goal, ball, cleats)
4. **Narrative Alignment:** Each clip choice reinforces the text message
5. **Emotional Pacing:** Slower speeds as tragedy deepens

---

## CROSSFADE TRANSITIONS:

Between each segment: 0.5s crossfade for smooth flow
- Maintains continuity
- Adds ~3-4 seconds total
- Creates professional documentary feel

---

## FINAL TIMING BREAKDOWN:

- Raw clips: 37 seconds
- Speed adjustments: +8 seconds
- Crossfades: +4 seconds
- Strategic holds: +11 seconds
- **TOTAL: 60 seconds**

---

## WHY THIS WORKS:

1. **Every clip serves the narrative** - not just random footage
2. **Text appears over relevant visuals** - stadium when talking about stadium investment
3. **Emotional arc maintained** - from innocence to darkness
4. **Soccer imagery clear** - no confusion with football
5. **Pacing matches Lyria score** - slow sections align with musical movements

The magic is in the TIMING - making 37 seconds feel like 60 through strategic speed control and emotional pacing.