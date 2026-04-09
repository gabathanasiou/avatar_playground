# 🛸 LIP Sync Avatar & NPC Social Engine

A state-of-the-art(ish), procedurally-generated avatar system built with **React**, **SVG**, and **TypeScript**. This project features a high-fidelity SVG animation engine paired with a stateful NPC social logic and NLP-driven dialogue system.

## ✨ Key Features

### 🧬 Procedural Genetics
- Every avatar is deterministically generated from a unique **seed string**.
- Millions of permutations: skin tones, body shapes, hair styles, accessories, and facial hair.
- 100% SVG-based for crisp rendering at any scale.

### 🏃 4-Way Animated Controller
- **JS-Driven Sprite Logic**: Framerate-independent walking animations designed to eliminate loop stutter.

### 🧠 NPC Social Brain
- **Stateful Attention Engine**: NPCs alternate between "Locked Tracking" (eye contact) and "Environmental Wandering" based on social context.
- **Social Weighting**: Gaze behavior changes dynamically during greetings, active chatting, or ambient passing.

### 🗨️ Paged Dialogue & NLP
- **Archetype-Based Generation**: NPCs use Questions, Rumors, Advice, and Simple statements to create varied conversations.
- **Emotional Synchronization**: Facial expressions update in real-time to match the emotional tone of each dialogue page.
- **Mundane Sci-Fi World**: A massive procedural word bank describing the daily life of a futuristic village dome.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/lis-sync-avatar.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📖 Documentation
For a deep dive into the technical architecture, see [AVATAR_SYSTEM.md](./AVATAR_SYSTEM.md).

## 🛠️ Built With
- **React** - Component architecture
- **TypeScript** - Type safety & logic
- **Vite** - Build toolchain
- **Vanilla CSS** - Premium styling & animations
- **SVG** - Vector-based character rendering
