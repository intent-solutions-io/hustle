# Vertex AI Veo Prompting Guide

This guide provides a comprehensive overview of how to write effective prompts for Veo, Google's text-to-video and image-to-video generation model. It covers basic principles, detailed components, advanced techniques, and best practices to help you create high-quality videos.

## Prompt Guide Overview

To use Veo, you provide a prompt, which is a text description of the video you want to generate. Good prompts are descriptive, specific, and clear. By mastering the art of prompting, you can guide the model to produce results that closely match your creative vision.

## Safety Filters

Veo applies safety filters to help ensure that generated videos and uploaded photos don't contain offensive content. Prompts that violate [responsible AI guidelines](https://cloud.google.com/vertex-ai/generative-ai/docs/learn/responsible-ai) are blocked. If you suspect abuse of Veo or any generated output that contains inappropriate material or inaccurate information, please use the [Report suspected abuse on Google Cloud form](https://support.google.com/code/contact/cloud_platform_report).

***

## Prompting Basics: The Core Components

A well-structured prompt typically includes several key elements. Think of these as the building blocks of your scene.

1.  **Subject**: The main character, object, or focus of your video.
2.  **Action**: What the subject is doing.
3.  **Scene/Context**: The environment, setting, and background.
4.  **Cinematography**: Camera angles, movements, and lens effects.
5.  **Visual Style**: The overall aesthetic, including art style, lighting, and mood.
6.  **Ambiance**: The sensory details that contribute to the feeling of the scene.
7.  **Audio**: Sound effects or speech to be included in the video.

---

## Detailed Prompt Components

Let's dive deeper into each component with detailed options and examples.

### 1. Subject

The subject is the "who" or "what" of your video. Specificity is key to avoiding generic outputs.

**Options:**
*   **People**: Man, woman, child, elderly person, specific professions (e.g., "a seasoned detective," "a joyful baker"), historical figures, mythical beings (e.g., "a mischievous fairy").
*   **Animals**: Specific breeds (e.g., "a playful Golden Retriever puppy," "a majestic bald eagle"), fantastical creatures (e.g., "a miniature dragon with iridescent scales").
*   **Objects**: Everyday items (e.g., "a vintage typewriter," "a steaming cup of coffee"), vehicles (e.g., "a classic 1960s muscle car," "a futuristic hovercraft"), abstract shapes ("glowing orbs").
*   **Multiple Subjects**: "A group of diverse friends laughing around a campfire," "a busy marketplace scene with vendors and shoppers."

**Examples:**

| Vague Prompt | Detailed Prompt | Generated Output |
| :--- | :--- | :--- |
| "A car" | "A gleaming, cherry-red Tesla Model S speeding down a coastal highway at sunset." | *(Conceptual)* A video of a sleek red car on a scenic road. |
| "A person" | "An elderly woman with kind eyes and silver hair, wearing a hand-knitted blue shawl." | *(Conceptual)* A portrait-style video focusing on the woman. |
| "A building" | "An architectural rendering of a white concrete apartment building with flowing organic shapes, seamlessly blending with lush greenery and futuristic elements." | <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/white_building.gif" alt="Architectural rendering of a white building." width="400"> |

### 2. Action

Action brings your subject to life. Describe movements, interactions, and even subtle expressions.

**Options:**
*   **Basic Movements**: Walking, running, jumping, flying, swimming, dancing, spinning.
*   **Interactions**: Talking, laughing, arguing, hugging, playing a game, cooking, writing.
*   **Emotional Expressions**: Smiling, frowning, looking surprised, concentrating deeply, crying.
*   **Subtle Actions**: A gentle breeze ruffling hair, leaves rustling, a subtle nod, fingers tapping impatiently.
*   **Transformations**: A flower blooming in fast-motion, ice melting, a city skyline developing over time.

**Examples:**

| Vague Prompt | Detailed Prompt | Generated Output |
| :--- | :--- | :--- |
| "A cat is playing" | "A ginger tabby kitten playfully pouncing on a feather toy, its eyes wide with excitement." | *(Conceptual)* A dynamic video of a kitten's playful actions. |
| "A woman on a beach" | "A wide shot of a woman walking along the beach, looking content and relaxed and looking towards the horizon at sunset." | <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/sunset.gif" alt="Woman walking on the beach at sunset." width="400"> |

### 3. Scene / Context

The environment grounds your subject and establishes the mood.

**Options:**
*   **Location (Interior)**: A cozy living room with a crackling fireplace, a sterile futuristic laboratory, a cluttered artist's studio, a grand ballroom.
*   **Location (Exterior)**: A sun-drenched tropical beach, a misty ancient forest, a bustling futuristic cityscape at night, a serene mountain peak at dawn.
*   **Time of Day**: Golden hour, midday sun, twilight, deep night.
*   **Weather**: Clear blue sky, overcast and gloomy, heavy thunderstorm with visible lightning, gentle snowfall.
*   **Period**: A medieval castle courtyard, a roaring 1920s jazz club, a cyberpunk alleyway.

**Examples:**

| Vague Prompt | Detailed Prompt | Generated Output |
| :--- | :--- | :--- |
| "A forest" | "An ancient, moss-covered redwood forest with shafts of sunlight piercing through the dense canopy, a babbling brook winding through the undergrowth." | *(Conceptual)* A lush, atmospheric video of a forest. |
| "In space" | "A satellite floating through outer space with the moon and some stars in the background." | <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/satellite2.gif" alt="Satellite floating in space." width="400"> |

### 4. Cinematography (Camera, Composition & Lens)

Define the shot's perspective, movement, and optical qualities to influence the subject's portrayal and direct the viewer's gaze.

#### Camera Angles & Composition

| Term | Description | Example Prompt |
| :--- | :--- | :--- |
| **Eye-Level Shot** | Neutral, common perspective. | "Eye-level shot of a woman sipping tea." |
| **Low-Angle Shot** | Camera looks up, making the subject appear powerful. | "Low-angle tracking shot of a superhero landing." |
| **High-Angle Shot**| Camera looks down, making the subject seem small or vulnerable. | "High-angle shot of a child lost in a crowd." |
| **Bird's-Eye View** | Directly from above, like a map. | "Bird's-eye view of a bustling city intersection." |
| **Dutch Angle** | Camera is tilted to one side to convey unease or dynamism. | "Dutch angle shot of a character running down a hallway." |
| **Close-Up** | Frames a subject tightly to emphasize emotions or details. | "Extreme close-up of an eye with a city reflected in it." |
| **Wide Shot** | Shows the subject within their broad environment to establish context. | "Wide shot of a lone cabin in a snowy landscape." |
| **Over-the-Shoulder** | Frames from behind one person looking at another. | "Over-the-shoulder shot during a tense negotiation." |
| **Point-of-View (POV)**| Shows the scene from a character's visual perspective. | "A POV shot from a vintage car driving in the rain, Canada at night, cinematic." |

#### Camera Movements

| Term | Description | Example Prompt |
| :--- | :--- | :--- |
| **Static Shot** | The camera remains completely still. | "Static shot of a serene landscape." |
| **Pan (Left/Right)** | Camera rotates horizontally from a fixed position. | "Slow pan left across a city skyline at dusk." |
| **Tilt (Up/Down)** | Camera rotates vertically from a fixed position. | "Tilt down from the character's shocked face to the revealing letter in their hands." |
| **Dolly (In/Out)** | The entire camera moves closer to or further away from the subject. | "Dolly out from the character to emphasize their isolation." |
| **Tracking Shot** | Camera moves alongside the subject. | "Tracking shot following a wolf running through a snowy forest." |
| **Aerial/Drone Shot** | Shot from a high altitude, often with smooth flying movements. | "Sweeping aerial drone shot flying over a tropical island chain." |
| **Handheld/Shaky Cam**| Jerky movements that convey realism or unease. | "Handheld camera shot during a chaotic marketplace chase." |

#### Lens & Optical Effects

| Term | Description | Example Prompt |
| :--- | :--- | :--- |
| **Shallow Depth of Field / Bokeh** | Only a narrow plane is in sharp focus, blurring the background. | "Portrait of a man with a shallow depth of field, their face sharp against a softly blurred park background with beautiful bokeh." |
| **Deep Depth of Field**| Most of the image, from foreground to background, is in sharp focus. | "Landscape scene with deep depth of field, showing sharp detail from the wildflowers in the foreground to the distant mountains." |
| **Wide-Angle Lens** | Captures a broader field of view, can exaggerate perspective. | "Wide-angle lens shot of a grand cathedral interior, emphasizing its soaring arches." |
| **Telephoto Lens** | Narrows the field of view and compresses perspective. | "Telephoto lens shot capturing a distant eagle in flight against a mountain range." |
| **Lens Flare** | Streaks or circles of light when a bright source hits the lens. | "Cinematic lens flare as the sun dips below the horizon." |
| **Rack Focus** | Shifting focus from one subject to another within a single shot. | "Rack focus from a character's thoughtful face to a photograph behind them." |
| **Fisheye Lens** | Ultra-wide-angle lens creating extreme distortion. | "Fisheye lens view from inside a car, capturing the driver and the entire dashboard." |


### 5. Visual Style, Ambiance & Mood

Dictate the overall artistic interpretation, sensory details, and emotional feeling of your video.

#### Lighting
*   **Natural Light**: "Soft morning sunlight streaming through a window," "Overcast daylight," "Moonlight."
*   **Artificial Light**: "Warm glow of a fireplace," "Flickering candlelight," "Pulsating neon signs."
*   **Cinematic Lighting**: "Film noir style with deep shadows and stark highlights," "High-key lighting for a bright, cheerful scene," "Low-key lighting for a dark, mysterious mood," "Volumetric lighting creating visible light rays."

#### Tone & Mood
*   **Joyful**: Bright, vibrant, cheerful, uplifting, whimsical.
*   **Melancholy**: Somber, muted colors, slow pace, poignant.
*   **Suspenseful**: Dark, shadowy, sense of unease.
*   **Peaceful**: Calm, tranquil, soft, gentle.
*   **Epic**: Sweeping, majestic, dramatic, awe-inspiring.
*   **Vintage**: Sepia tone, grainy film, "1950s Americana," "1980s vaporwave."

#### Artistic Style
*   **Photorealistic**: "hyperrealistic," "shot on 8K camera," "sharp focus."
*   **Animation**: "3D cartoon style," "Ghibli-inspired animation," "claymation style."
*   **Art Movements**: "Impressionist painting," "Surrealism," "Art Deco."
*   **Film Genres**: "Film noir," "Horror film," "Sci-fi aesthetic."

**Examples:**

| Style/Ambiance | Prompt | Generated Output |
| :--- | :--- | :--- |
| **Film Noir** | "Film noir style, man and woman walk on the street, mystery, cinematic, black and white." | <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/film_noir.gif" alt="A black and white film noir scene." width="400"> |
| **Warm Ambiance** | "A close-up of a girl holding an adorable golden retriever puppy in the park, sunlight." | <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/ambiance_puppy.gif" alt="A girl holding a puppy in warm sunlight." width="400"> |
| **Cool/Sad Mood** | "Cinematic close-up shot of a sad woman riding a bus in the rain, cool blue tones, sad mood." | <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/ambiance_sad.gif" alt="A sad woman on a bus in the rain with blue tones." width="400"> |


### 6. Audio

*Audio is supported by `veo-3.0-generate-preview` in [Preview](https://cloud.google.com/products#product-launch-stages).*

Clearly specify if you want audio, using separate sentences to describe it.

*   **Sound effects**: "The audio features water splashing in the background." or "Add soft music in the background."
*   **Speech**: "The man in the red hat says, 'Where is the rabbit?' Then the woman in the green dress next to him replies, 'There, in the woods.'"

### 7. Temporal Elements

Even in short clips, you can imply change or speed.

*   **Pacing**: "slow-motion," "fast-paced action," "time-lapse."
*   **Evolution**: "A flower bud slowly unfurling," "Dawn breaking, the sky gradually lightening."
*   **Rhythm**: "pulsating light," "rhythmic movement."

**Example:** "Time-lapse of clouds drifting across a mountain peak from sunrise to midday."

***

## Illustrative Examples: From Simple to Detailed

See how adding detail transforms a simple idea into a rich, specific video.

### Example 1: Man on the Phone

| Prompt | Generated Output | Analysis |
| :--- | :--- | :--- |
| The camera dollies to show a close up of a desperate man in a green trench coat that's making a call on a rotary-style wall phone with a green neon light and a movie scene. | <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/phonebooth.gif" alt="Man talking on the phone."> | A good starting point, but the scene could be richer. |
| A close-up cinematic shot follows a desperate man in a weathered green trench coat as he dials a rotary phone mounted on a gritty brick wall, bathed in the eerie glow of a green neon sign. The camera dollies in, revealing the tension in his jaw. The shallow depth of field focuses on his furrowed brow and the black rotary phone, blurring the background into a sea of neon colors and indistinct shadows. | <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/phonebooth2.gif" alt="Man talking on the phone"> | Much more focused with a richer environment and emotional depth. |

### Example 2: Snow Leopard

| Prompt | Generated Output |
| :--- | :--- |
| A cute creature with snow leopard-like fur is walking in winter forest, 3D cartoon style render. | <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/snow_leopard_short.gif" alt="Snow leopard is lethargic."> |
| Create a short 3D animated scene in a joyful cartoon style. A cute creature with snow leopard-like fur, large expressive eyes, and a friendly, rounded form happily prances through a whimsical winter forest. The scene should feature rounded, snow-covered trees, gentle falling snowflakes, and warm sunlight filtering through the branches. The creature's bouncy movements and wide smile should convey pure delight. Aim for an upbeat, heartwarming tone with bright, cheerful colors and playful animation. | <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/running_snow_leopard.gif" alt="Snow leopard is running faster."> |

***

## Advanced Prompting Techniques

### Using Reference Images (Image-to-Video)

Bring static images to life by providing an image and a text prompt describing the desired action.

**Example:**

| Input Image | Prompt | Generated Output |
| :--- | :--- | :--- |
| <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/static_bunny.png" alt="A static image of a bunny with a chocolate bar." width="200"> | "Bunny runs away." | <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/bunny_runs_away.gif" alt="Bunny is running away." width="300"> |

**Tips for Image-to-Video:**
*   Ensure actions and speech descriptions align with the subjects in the image.
*   If multiple subjects are present, clearly specify who is performing an action (e.g., "The man in the red hat," "The woman in the blue dress").

### Negative Prompts

Specify what to *exclude* from your video. Describe what you want to discourage, rather than using words like "no" or "don't".

**Example:**
*   **Prompt**: "Generate a short, stylized animation of a large, solitary oak tree with leaves blowing vigorously in a strong wind... The animation should feature a gentle, atmospheric soundtrack and use a warm, inviting color palette."
*   **Output with no negative prompt**:
    <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/tree_with_no_negative.gif" alt="Tree with a potentially urban background." width="400">
*   **Prompt with negative prompt added**: "... **Negative prompt**: urban background, man-made structures, dark, stormy, or threatening atmosphere."
*   **Output with negative prompt**:
    <img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/tree_with_negative.gif" alt="Tree in a natural, non-stormy setting." width="400">

### Aspect Ratios

Veo supports two aspect ratios.

| Aspect Ratio | Description | Example |
| :--- | :--- | :--- |
| **Widescreen (16:9)** | Standard for TVs, monitors, and landscape video. Best for capturing scenic landscapes and wide action. | **Prompt**: "Create a video with a tracking drone view of a man driving a red convertible car in Palm Springs, 1970s, warm sunlight, long shadows."<br><br><img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/widescreen_palm_springs.gif" alt="Widescreen video of a car in Palm Springs." width="300"> |
| **Portrait (9:16)** | For short-form video apps and tall subjects like people, buildings, or waterfalls. (*Note: The 9:16 aspect ratio isn't supported by `veo-3.0-generate-preview`.*) | **Prompt**: "Create a video with a smooth motion of a majestic Hawaiian waterfall within a lush rainforest. Focus on realistic water flow, detailed foliage, and natural lighting to convey tranquility..."<br><br><img src="https://cloud.google.com/static/vertex-ai/generative-ai/docs/video/images/waterfall.gif" alt="Portrait video of a waterfall." width="200"> |

---

## Best Practices & Final Tips

*   **Be Detailed and Specific**: Avoid vagueness. Instead of "A man walking," try "Eye-level medium shot of a young man in a soaked trench coat, urgently weaving through a crowded, neon-lit Times Square at night during a heavy downpour."
*   **Think Like a Filmmaker**: Use cinematic terms to guide the model's style. While the model may not execute literal edits like "jump cut," it will interpret them as stylistic cues.
*   **Iterate and Experiment**: If your first attempt isn't perfect, refine your prompt. Add or remove details, change the camera angle, or adjust the style.
*   **Use Clear Language**: Write direct and unambiguous prompts. Avoid conversational or vague phrasing.
*   **Focus on a Single Scene**: For a short video clip, focus on one continuous action or scene. Trying to describe multiple distinct events will likely result in a muddled or incomplete video. Generate complex sequences as separate clips.

## Using Gemini to Enhance Prompting

You can use a powerful LLM like Gemini to help in your video creation process.
1.  **Prompt Rewriting (Gemini → Veo)**: Ask Gemini to act as an expert prompter. Give it a simple idea or an image and ask it to write a comprehensive and detailed prompt for Veo. You can even provide examples of prompts you like (few-shot prompting).
2.  **Video Evaluation (Veo → Gemini)**: Use Gemini as a critic to evaluate your generated videos. You can ask it to check for compliance with brand guidelines, analyze the content, or identify areas for improvement in your next prompt.