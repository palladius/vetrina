# 🎠 Palladius Showcase — Kids Games & Dad's Tools

> An interactive, responsive showcase for all games created for the kids (Tubature, Orologia.io, Puzzle, Pasta Invaders, etc.) and Riccardo's developer tools.

![Screenshot](assets/screenshots/tubature.jpg)

## ✨ Features

- 🧸 **Clean Discrimination between Kids Games & Dev Tools**: dedicated filter tabs to instantly separate children's games from father's development tools and frameworks.
- ⚡ **Instant Autofocused Search**: ultra-responsive client-side search engine; type keywords (e.g. `tubature`, `clock`, `flutter`, `puzzle`) to filter titles, descriptions, and tags in real-time.
- 🕹️ **Interactive Arcade Player (Embeds)**: click "🕹️ Play Here" to launch Flutter web games in a fullscreen overlay without leaving the showcase.
- 🎮 **Large Clickable Screenshots**: smooth hover zoom and animated gameplay GIFs on hover.
- 📝 **Single Source of Truth in YAML**: easily add or edit projects in `data/games.yaml`.
- 🚀 **Zero Runtime Dependencies**: static HTML5, TailwindCSS, and modern Vanilla JS ready for instant deployment to GitHub Pages.

## 🛠️ Adding or Editing Projects

1. Open `data/games.yaml`.
2. Add or update an entry:
   ```yaml
   - id: "my-game"
     title: "Game Title"
     category: "kids" # or "tools"
     tagline: "Catchy subtitle"
     description: "Full description"
     screenshot: "assets/screenshots/my-game.png"
     play_url: "https://palladius.github.io/my-game/"
     repo_url: "https://github.com/palladius/my-game"
     tech: ["Flutter", "Dart"]
     tags: ["puzzle", "kids"]
     badge: "🟢 Play Live"
     target: "Alessandro & Sebi"
   ```
3. Run the sync build:
   ```bash
   just build
   # or:
   ./bin/build.py
   ```

## 💻 Local Preview

```bash
just serve
# or:
python3 -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.
