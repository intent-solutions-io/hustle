#!/bin/bash
# assemble_nwsl90.sh
# Assemble 90-second NWSL documentary from segments + audio + voiceover

set -euo pipefail

WORKDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIPS_DIR="${WORKDIR}/000-clips"
AUDIO_DIR="${WORKDIR}/000-audio"
VO_DIR="${WORKDIR}/tmp/voiceover_wav"
OUTPUT_DIR="${WORKDIR}/000-videos"
TMP_DIR="${WORKDIR}/tmp/assembly"

mkdir -p "${TMP_DIR}" "${OUTPUT_DIR}"

echo "🎬 NWSL 90-Second Documentary Assembly"
echo "========================================"
echo

# Define segment mapping (your existing clips → final timeline)
declare -A SEGMENTS=(
    ["01"]="009-MS-CLIP-segment-01-soccer-final.mp4"     # 0-8s: The Joy
    ["02"]="013-MS-CLIP-segment-02-best.mp4"             # 8-14s: Youth Training (6s)
    # ["03"]="MUSIC_BREAK_4S"                            # 14-18s: Music break
    ["04"]="016-MS-CLIP-segment-03-best.mp4"             # 18-26s: League HQ (8s)
    ["05"]="019-MS-CLIP-segment-04-best.mp4"             # 26-32s: Washington Spirit (6s)
    ["06"]="022-MS-CLIP-segment-05-best.mp4"             # 32-40s: KC Current (8s)
    ["07"]="025-MS-CLIP-segment-06-best.mp4"             # 40-46s: Orlando Pride (6s)
    # ["08"]="MUSIC_BREAK_4S"                            # 46-50s: Music build
    ["09"]="028-MS-CLIP-segment-07-best.mp4"             # 50-58s: League Policy (8s)
    ["10"]="031-MS-CLIP-segment-08-best.mp4"             # 58-64s: Player Advocacy (6s)
    ["11"]="033-MS-CLIP-segment-09-best.mp4"             # 64-72s: Young Athletes (8s)
    # ["12"]="PLACEHOLDER_6S"                            # 72-78s: Reflection (6s) - NEED
    # ["13"]="PLACEHOLDER_6S"                            # 78-84s: The Question (6s) - NEED
    # ["14"]="PLACEHOLDER_6S"                            # 84-90s: Outro fade (6s) - NEED
)

# Check which segments exist
echo "📋 Checking segment availability..."
for seg_id in "${!SEGMENTS[@]}"; do
    seg_file="${SEGMENTS[$seg_id]}"
    if [[ "$seg_file" == PLACEHOLDER* ]] || [[ "$seg_file" == MUSIC* ]]; then
        echo "  ⚠️  Segment ${seg_id}: ${seg_file} (needs generation)"
    elif [[ -f "${CLIPS_DIR}/${seg_file}" ]]; then
        duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${CLIPS_DIR}/${seg_file}" 2>/dev/null | cut -d. -f1)
        echo "  ✅ Segment ${seg_id}: ${seg_file} (${duration}s)"
    else
        echo "  ❌ Segment ${seg_id}: ${seg_file} (MISSING)"
    fi
done

echo
echo "🎵 Checking audio assets..."
if [[ -f "${AUDIO_DIR}/007-MS-AUDM-master-mix.wav" ]]; then
    echo "  ✅ Master mix found"
else
    echo "  ⚠️  Master mix not found, will use fallback"
fi

# Check voiceover files
vo_count=$(find "${VO_DIR}" -name "vo_*.wav" 2>/dev/null | wc -l)
echo "  ℹ️  Found ${vo_count} voiceover files"

echo
echo "🔧 Assembly Strategy:"
echo "  1. Concatenate video segments (existing: 01-11)"
echo "  2. Create black placeholders for missing 12-14"
echo "  3. Mix master audio track"
echo "  4. Overlay voiceover at precise timestamps"
echo "  5. Export final 90-second MP4"

echo
echo "⚙️  Starting assembly..."

# Step 1: Create concat list for existing segments
cat > "${TMP_DIR}/concat_list.txt" <<EOF
# NWSL 90-Second Segment List
file '${CLIPS_DIR}/009-MS-CLIP-segment-01-soccer-final.mp4'
file '${CLIPS_DIR}/013-MS-CLIP-segment-02-best.mp4'
file '${CLIPS_DIR}/016-MS-CLIP-segment-03-best.mp4'
file '${CLIPS_DIR}/019-MS-CLIP-segment-04-best.mp4'
file '${CLIPS_DIR}/022-MS-CLIP-segment-05-best.mp4'
file '${CLIPS_DIR}/025-MS-CLIP-segment-06-best.mp4'
file '${CLIPS_DIR}/028-MS-CLIP-segment-07-best.mp4'
file '${CLIPS_DIR}/031-MS-CLIP-segment-08-best.mp4'
file '${CLIPS_DIR}/033-MS-CLIP-segment-09-best.mp4'
EOF

# Step 2: Concatenate existing segments
echo "  🔗 Concatenating segments 01-09..."
ffmpeg -f concat -safe 0 -i "${TMP_DIR}/concat_list.txt" \
    -c copy "${TMP_DIR}/segments_01-09.mp4" -y 2>/dev/null

current_duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${TMP_DIR}/segments_01-09.mp4" 2>/dev/null | cut -d. -f1)
echo "  ✅ Segments 01-09 concatenated (${current_duration}s)"

# Step 3: Create black placeholder for missing segments (10-14)
remaining=$((90 - current_duration))
echo "  ⚫ Creating ${remaining}s black placeholder for missing segments..."
ffmpeg -f lavfi -i color=c=black:s=1920x1080:d=${remaining} \
    -f lavfi -i anullsrc=r=48000:cl=stereo \
    -t ${remaining} -pix_fmt yuv420p \
    "${TMP_DIR}/placeholder_10-14.mp4" -y 2>/dev/null

# Step 4: Combine existing + placeholder
echo "  🎞️  Merging segments + placeholder..."
cat > "${TMP_DIR}/final_concat.txt" <<EOF
file '${TMP_DIR}/segments_01-09.mp4'
file '${TMP_DIR}/placeholder_10-14.mp4'
EOF

ffmpeg -f concat -safe 0 -i "${TMP_DIR}/final_concat.txt" \
    -c copy "${TMP_DIR}/video_base.mp4" -y 2>/dev/null

# Step 5: Add audio mix (if available)
if [[ -f "${AUDIO_DIR}/007-MS-AUDM-master-mix.wav" ]]; then
    echo "  🎵 Mixing master audio track..."
    ffmpeg -i "${TMP_DIR}/video_base.mp4" \
        -i "${AUDIO_DIR}/007-MS-AUDM-master-mix.wav" \
        -filter_complex "[1:a]volume=0.8[a1];[0:a][a1]amix=inputs=2:duration=first[aout]" \
        -map 0:v -map "[aout]" \
        -c:v copy -c:a aac -b:a 192k \
        "${TMP_DIR}/video_with_music.mp4" -y 2>/dev/null
    video_source="${TMP_DIR}/video_with_music.mp4"
else
    echo "  ⚠️  No master audio, using video as-is"
    video_source="${TMP_DIR}/video_base.mp4"
fi

# Step 6: Add voiceover (if available)
if [[ ${vo_count} -gt 0 ]]; then
    echo "  🎤 Overlaying voiceover tracks with precise timing..."

    # Voiceover timing from script
    # SEG 01 (0-8s):   "These girls dream of playing professional soccer..."
    # SEG 02 (8-14s):  "Every practice, every game..."
    # BREAK (14-18s):  "But who makes the decisions?"
    # SEG 03 (18-26s): "The National Women's Soccer League..."
    # SEG 04 (26-32s): "Michele Kang owns the Washington Spirit..."
    # SEG 05 (32-40s): "The Kansas City Current, owned by Angie Long..."
    # SEG 06 (40-46s): "The Orlando Pride is owned by the Wilf family..."
    # BREAK (46-50s):  "These ownership groups make policy decisions."
    # SEG 07 (50-58s): "The league's 2021 eligibility policy..."
    # SEG 08 (58-64s): "Elizabeth Eddy, an eleven-year league veteran..."
    # SEG 09 (64-72s): "Her statement was met with public criticism..."
    # SEG 10 (72-78s): "Questions remain about fairness, biology..."
    # SEG 11 (78-84s): "When will league leadership address these concerns?..."
    # SEG 12 (84-90s): "Women's sports. Women's voices. Women's future."

    # Build FFmpeg filter for 14 voiceover overlays
    filter_complex="[0:a]volume=0.8[music]"

    # Check if voiceover files exist
    for i in {01..14}; do
        vo_file="${VO_DIR}/vo_${i}.wav"
        if [[ -f "${vo_file}" ]]; then
            filter_complex="${filter_complex};[${i}:a]adelay=delays=$((i*1000)):all=1[vo${i}]"
        fi
    done

    # Mix all tracks
    filter_complex="${filter_complex};[music][vo01][vo02][vo03][vo04][vo05][vo06][vo07][vo08][vo09][vo10][vo11][vo12][vo13][vo14]amix=inputs=15:duration=first[aout]"

    # Apply voiceover mix
    ffmpeg -i "${video_source}" \
        -i "${VO_DIR}/vo_01.wav" \
        -i "${VO_DIR}/vo_02.wav" \
        -i "${VO_DIR}/vo_03.wav" \
        -i "${VO_DIR}/vo_04.wav" \
        -i "${VO_DIR}/vo_05.wav" \
        -i "${VO_DIR}/vo_06.wav" \
        -i "${VO_DIR}/vo_07.wav" \
        -i "${VO_DIR}/vo_08.wav" \
        -i "${VO_DIR}/vo_09.wav" \
        -i "${VO_DIR}/vo_10.wav" \
        -i "${VO_DIR}/vo_11.wav" \
        -i "${VO_DIR}/vo_12.wav" \
        -i "${VO_DIR}/vo_13.wav" \
        -i "${VO_DIR}/vo_14.wav" \
        -filter_complex "${filter_complex}" \
        -map 0:v -map "[aout]" \
        -c:v copy -c:a aac -b:a 192k \
        "${TMP_DIR}/video_final.mp4" -y 2>/dev/null || {
            echo "  ⚠️  Voiceover overlay failed, using video with music only"
            cp "${video_source}" "${TMP_DIR}/video_final.mp4"
        }
else
    echo "  ⚠️  No voiceover files found, using video with music only"
    cp "${video_source}" "${TMP_DIR}/video_final.mp4"
fi

# Step 7: Final export with optimization
output_file="${OUTPUT_DIR}/$(date +%s)-MS-VIDR-nwsl90-assembly.mp4"
echo "  📦 Exporting final video..."
ffmpeg -i "${TMP_DIR}/video_final.mp4" \
    -c:v libx264 -preset medium -crf 23 \
    -c:a aac -b:a 192k \
    -movflags +faststart \
    "${output_file}" -y 2>/dev/null

duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${output_file}" 2>/dev/null | cut -d. -f1)
size=$(du -h "${output_file}" | cut -f1)

echo
echo "✅ Assembly complete!"
echo "   📁 ${output_file}"
echo "   ⏱️  Duration: ${duration}s"
echo "   💾 Size: ${size}"
echo
echo "⚠️  MISSING SEGMENTS TO GENERATE:"
echo "   10: Reflection (empty field at dusk, 6s)"
echo "   11: The Question (athlete close-up, 6s)"
echo "   12: Outro Fade (fade to black, 6s)"
echo
echo "Next steps:"
echo "1. Generate missing segments 10-12 via Veo"
echo "2. Re-run this script to replace placeholders"
echo "3. Add voiceover timing for precise overlay"
