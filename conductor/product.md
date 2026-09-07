# Product Definition: Palladius Vetrina

## Vision
Palladius Vetrina is the digital showcase and launcher for Riccardo Carlesso's creative ecosystem: children's educational games (starring Alessandro and Sebi), family chronicles and diaries, and developer tools.

## Target Audiences
1. **Kids & Family (`#kids`)**: Playful games (Tubature, Orologia.io, Kids Jigsaw Puzzle, Pasta Invaders) with big tap targets, responsive controls, and offline PWA support for planes and travel.
2. **Family & Friends (`#diaries`)**: Life chronicles and celebrations (50° Compleanno Palladiano, South Africa Diary, Private Journal, Ricc Reads the News).
3. **Developers & SREs (`#tools`)**: Open-source tools, SDKs, and visualizers (Conductoras, Antigravity Ruby SDK, Sumaron, Storagify, Gprism).

## Core Principles
- **Less is More**: Compact, aesthetic glassmorphism cards. Resting state shows Title, Subtitle, Score, and ONE prominent Action button (`🎮 PLAY` / `🎬 WATCH DEMO` / `🚀 EXPLORE`). Extra info is revealed smoothly on hover.
- **Zero Runtime Dependencies**: Pure HTML5, TailwindCSS, and Vanilla JS.
- **Single Source of Truth**: Data lives in structured formats (`data/games.yaml`, federated `vetrina.json`), automatically tested and compiled into JSON and fallback JS.
- **Offline First**: Support for PWAs that function without internet connectivity.
