# LIS Sync Avatar System — Technical Documentation

## Overview

This is a **procedurally-generated, fully-animated SVG avatar** built in React. Every character is uniquely generated from a seed string, supports 4-directional rendering (front, back, left, right), has a sprite-style walking animation, facial expressions, real-time audio lip-sync, and idle behaviors.

---

## 1. The Genetics System (Procedural Generation)

Every visual trait is derived deterministically from a **seed string** using a simple hash function.

```ts
let hash = 0;
for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
}
const getGene = (shift: number, mod: number) => Math.abs(hash >> shift) % mod;
```

`getGene(shift, mod)` extracts a specific "gene" by bit-shifting the hash and taking modulo. Each gene controls one trait:

| Gene | Trait | Options |
|------|-------|---------|
| `getGene(0, 16)` | Skin color | 16 skin tones |
| `getGene(1, 3)` | Body shape | Circle, Squircle, Peanut |
| `getGene(2, 8)` | Eye spacing | -4 to +4 offset |
| `getGene(3, 3)` | Eye size | Small, Medium, Large |
| `getGene(4, 5)` | Mouth type | 5 styles |
| `getGene(5, 8)` | Hair type | Bald, Spiky, Bob, Afro, Long, Mohawk, Crazy, Ponytail |
| `getGene(6, 16)` | Hair color | 16 colors |
| `getGene(7, 4)` | Nose type | None, Button, Long, Triangle |
| `getGene(8, 4)` | Cheeks | None, Rosy, Freckles, Spiral |
| `getGene(9, 6)` | Accessory | None, Glasses, Eye patch, Monocle |
| `getGene(10, 5)` | Facial hair | None, Stubble, Mustache, Goatee |
| `getGene(11, 16)` | Shirt color | 16 colors |
| `getGene(12, 16)` | Pants color | 16 colors |
| `getGene(13, 3)` | Body proportion | Slim, Chunky, Buff |

**The same seed always produces the same character.** Ideal for user avatars, NPCs, or any system where you want reproducible characters from a name/ID.

---

## 2. The Walk Animation Architecture

### Why JS-driven, not CSS animations

The initial implementation used multiple CSS `@keyframes` with `step-end` timing. This caused **sync drift** — each animation runs on its own browser clock and falls out of phase, creating a stutter at the loop boundary (duplicate idle frame on 0% → 100% wrap).

The final architecture uses a **single JS frame counter** — exactly how game sprite engines work:

```ts
const [walkFrame, setWalkFrame] = useState(0); // 0–3

useEffect(() => {
    if (!walking) { setWalkFrame(0); return; }
    const interval = setInterval(() => {
        setWalkFrame(f => (f + 1) % 4);
    }, 150); // 150ms per frame = 600ms full cycle
    return () => clearInterval(interval);
}, [walking]);
```

**One timer drives everything.** All body parts read the same `walkFrame` value.

### The Pose Tables (Spritesheet equivalent)

```ts
const WALK_BODY   = [{ y: -4 }, { y: 0  }, { y: -4 }, { y: 0  }];

// Front/Back legs: y offset, scaleY, height, shoe type
const WALK_LEG_L  = [
    { y: 4,  sy: 0.75, h: 30, shoe: 'sole'   }, // Frame 0: forward
    { y: 0,  sy: 1,    h: 40, shoe: 'normal'  }, // Frame 1: neutral
    { y: -3, sy: 1.08, h: 45, shoe: 'top'    }, // Frame 2: backward
    { y: 0,  sy: 1,    h: 40, shoe: 'normal'  }, // Frame 3: neutral
];
const WALK_LEG_R  = [ /* mirror of WALK_LEG_L */ ];

// Front/Back arms: y offset, scaleY, z-order flag
const WALK_ARM_L  = [
    { y: 3,  sy: 1.1, behind: true  }, // Frame 0: swinging back
    { y: 0,  sy: 1,   behind: false },
    { y: -4, sy: 0.7, behind: false }, // Frame 2: swinging forward
    { y: 0,  sy: 1,   behind: false },
];
const WALK_ARM_R  = [ /* inverse phase */ ];

// Side view legs and arms use rotation
const WALK_SIDE_LEG_L = [{ r: 30, y: -2 }, { r: 0, y: 0 }, { r: -30, y: 4 }, { r: 0, y: 0 }];
const WALK_SIDE_ARM_L = [{ r: -30, y: 2 }, { r: 0, y: 0 }, { r: 30,  y: 2 }, { r: 0, y: 0 }];
```

---

## 3. The 4-Direction Turntable

### Direction prop
```ts
direction?: 'front' | 'left' | 'right' | 'back'
```

| Direction | Face | Hair | Arms | Torso |
|-----------|------|------|------|-------|
| `front` | ✅ centered | Front + Back (visible volume) | Both sides, full width | Full |
| `back` | ❌ hidden | Scalp Cap (covers face) | Both sides | Full |
| `left` | ✅ `translate(-15, 0)` | Side-matched Cap | Near arm centered, far arm behind torso | Slimmer |
| `right` | ✅ `translate(+15, 0)` | Side-matched Cap | Near arm centered, far arm behind torso | Slimmer |

### Z-order trick for arms
SVG z-order is DOM paint order. Each arm is rendered **twice** — once before the torso and once after — and the `behind` flag from the pose table controls which copy is visible:

```tsx
{armLBehind && <ArmLeft />}   {/* behind torso */}
<Torso />
{!armLBehind && <ArmLeft />}  {/* in front of torso */}
```

---

## 4. Leg Foreshortening (Front/Back)

Three layers of depth per leg per frame:

1. **Height** (`h`): Forward = 30px, neutral = 40px, back = 45px
2. **ScaleY**: Forward = 0.75 (squash), back = 1.08 (stretch)
3. **Shoe shape** (dynamically swapped):
   - `sole` → flat ellipse (bottom of shoe visible, leg coming toward camera)
   - `top` → arc curve (top of shoe visible, leg going away)
   - `normal` → default wedge

Shoe Y position: `130 + frame.h` (always glued to bottom of leg rect).

---

## 5. Expression System

```ts
type Expression = 'NEUTRAL' | 'HAPPY' | 'SAD' | 'ANGRY' | 'SHOCKED' | 'SMUG' | 'THINKING'
```

Each expression affects: eyebrows, eyes, mouth, idle CSS animation, gaze behavior, and particle FX.

---

## 6. Idle Behaviors

### Blinking
Random `setTimeout` every 2–5s sets `blinking` state for 150ms, replacing eye circles with horizontal lines.

### Gaze
Updates `{ x, y }` pixel offset on pupils. Expression-driven: shocked = rapid random darts; thinking = locked upward; neutral = slow random wander with `transition: 0.15s ease-out`.

---

## 7. Audio Lip-sync

```ts
audioVolume?: number // 0.0–1.0 RMS amplitude
```

```ts
const dynamicRy = Math.min(2 + audioVolume * 40, 16);
return <ellipse cx="50" cy="78" rx="8" ry={dynamicRy} />;
```

Fallback: when `speaking=true` and `audioVolume=0`, a 150ms interval toggles mouth open/closed.

---

## 8. Full API

```tsx
<Avatar
    seed="PlayerOne"       // deterministic character generation
    size={200}             // px width (height = size * 1.8)
    expression="HAPPY"
    speaking={true}        // fallback mouth animation
    audioVolume={0.4}      // 0.0–1.0 for real-time lip sync
    direction="left"       // 'front' | 'left' | 'right' | 'back'
    walking={true}
    className=""
/>
```

---

## 9. Porting to a Game Character Controller

```ts
const walking = velocity.x !== 0 || velocity.y !== 0;
```

### Movement Normalization
To prevent "diagonal speed boost" (where X+Y is 1.4x faster than X alone), the world uses vector normalization:
```ts
const length = Math.hypot(inputX, inputY) || 1;
const dx = (inputX / length) * MOVE_SPEED;
const dy = (inputY / length) * MOVE_SPEED;
```
This ensures consistent travel speed regardless of input direction.

### Extending frame rate
Change `150ms` interval and `% 4` modulo. Drop to `100ms` for faster characters. The pose tables scale with any frame count.

### Adding more frames
Extend pose table arrays from 4 to 8 entries, change `% 4` → `% 8`. Intermediate frames smooth out the motion.

### 8 directions
Add `'up-left'`, `'up-right'` etc. to the direction prop. Blend `faceTransform` offsets between presets.

### Replacing SVG with Canvas/WebGL
The `walkFrame` state and pose tables are renderer-agnostic. Replace SVG elements with canvas draw calls or spritesheet pixel offsets — the logic stays identical.

---

## 11. Multi-Layer Hair Rendering

To achieve a premium "turntable" look without bald spots or "unibrow" effects, the hair is split into three distinct layers across the SVG stack:

1. **HairBack (Bottom Layer)**: Renders behind the head and body. This provides the "volume" visible behind the shoulders when facing forward, ensuring characters don't look bald from the front.
2. **HairScalp (Middle Layer)**: Renders on top of the head (`BodyShape`).
   - **Facing Back**: It draws a full "back-of-head" cap that covers the face area.
   - **Facing Side**: It draws a "slicked-back" cap from forehead to nape to close gaps created by the face rotation.
3. **HairFront (Top Layer)**: Renders the bangs and styling elements (Spikes, Bob fringe, Mohawk). These use specific skull-cap geometry (`A 38 38`) to connect seamlessly with the background volume.

### Stylistic Overlays
For maximum expressiveness, **Eyebrows** and **Accessories (Glasses)** are rendered on top of **HairFront**. This is a stylistic choice that keeps the character's emotion and identity visible even when they have long bangs.

---

## 12. File Structure

```
├── Avatar.tsx              # Main component: genetics, behaviors, rendering
├── types.ts                # Expression and Social Types 
├── index.css               # Expression idle animations
├── components/
│   ├── GameWorld.tsx       # Physics, AI loops, and Social State
│   ├── DialogueBox.tsx     # Paged RPG-style UI
│   └── WelcomeScreen.tsx   # Game Entry Point
└── utils/
    └── sentenceFactory.ts # Archetype-based NLP engine
```

---

## 13. The Social Brain (NPC Dynamics)

The system evolves from a character renderer into a **Social Ecosystem** through several layers of intelligence.

### Stateful Attention Engine
Unlike simple "look-at" logic, NPCs use a **Phase-Based Machine**:
- **Locked Phase**: The NPC real-time tracks a target (player or another NPC).
- **Wander Phase**: The gaze drifts to random environmental points.
- **Social Weighting**: Probabilities shift based on `socialContext`:
    - `greeting`: 85% Tracking (Intense focus)
    - `chatting`: 50% Tracking (Casual eye contact)
    - `ambient`: 20% Tracking (Passerby glance)

### Multi-Page Dialogue & Emotional Sync
Dialogue is generated as an array of `DialoguePage` objects. This allows a single interaction to have **emotional transitions**:
1. NPC generates a 2-3 page story.
2. Each page has its own `expression`.
3. The `GameWorld` updates the NPC's `expression` state as the player clicks through.

### Archetype-based NLP
Sentences avoid a single template by using **Archetypes**:
- **Question**: "Is it just me, or is [X] [Y]?"
- **Rumor**: "Word on the street is [X] [Z] [Time]."
- **Advice**: "If I were you, I'd [Action]..."
- **Simple**: "I like bread."

This creates millions of unique permutations across a mundane Sci-Fi vocabularly.
