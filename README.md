# 🎠 Palladius Showcase — Kids Games, Diaries & Dev Tools

> An interactive, responsive showcase for all games created for the kids (Tubature, Orologia.io, Puzzle, etc.), Papino's life diaries, and Riccardo's developer tools.

[![Deploy to GitHub Pages](https://github.com/palladius/vetrina/actions/workflows/deploy.yml/badge.svg)](https://github.com/palladius/vetrina/actions/workflows/deploy.yml)

🌐 **Live Website on GitHub Pages:** **[https://palladius.github.io/vetrina/](https://palladius.github.io/vetrina/)**  
🧸 **Direct Kids Bookmark (Ale & Sebi's Club):** **[https://palladius.github.io/vetrina/#kids](https://palladius.github.io/vetrina/#kids)**  
✈️ **Offline Games (PWA):** **[https://palladius.github.io/vetrina/#pwa](https://palladius.github.io/vetrina/#pwa)**  
📔 **Papino's Diaries:** **[https://palladius.github.io/vetrina/#diaries](https://palladius.github.io/vetrina/#diaries)**  

![Showcase Inception](assets/screenshots/vetrina-meta.jpg)

## ✨ Features

- 🧸 **Ale & Sebi's Kids Club (#kids)**: Instant bookmarkable link with stylized Pixar avatar of Ale & Sebi playing games together.
- ✈️ **PWA & Offline Plane Ready**: Filter games and apps that can work offline during travel (`#pwa`).
- 📔 **Papino's Diaries & Life Section**: 50° Compleanno Palladiano (Bigoli con la Veganiga), Septober Next, Private Journal, South Africa Diary, and Ricc Reads the News.
- 🪞 **Meta Inception (#meta)**: A recursive Droste mirror of the showcase inside the showcase!
- ⚡ **Instant Search & Juicy Mix**: Fuzzy search + smart ranking algorithm combining scores (1-100) and recency bonuses.
- 🧪 **Human-Proof YAML Testing Suite**: Automated tests that run on every `git push` to catch typos, broken links, missing screenshots, or invalid scores before publishing.
- 🚀 **Automated CI/CD with GitHub Pages**: Push to `main` and GitHub Actions automatically tests, builds, and deploys.

## 🧪 Testing Your YAML Edits (Human-Proof!)

Whenever you edit `data/games.yaml`, test your changes locally before pushing:

```bash
python3 tests/test_games_yaml.py
```

The test suite automatically verifies:
- ✅ YAML syntax and schema integrity
- ✅ Unique ID slugs (no duplicate entries)
- ✅ Valid audiences (`kids`, `journals`, `tools`) and kinds (`game`, `educational`, `journal`, `tool`)
- ✅ That all referenced screenshots exist on disk in `assets/screenshots/`
- ✅ Valid URLs (`play_url`, `repo_url`, `youtube_url`, `article_url`, etc.)
- ✅ Valid score ranges (1-100)

## 🛠️ Adding or Editing Projects

1. Open `data/games.yaml`.
2. Add or update an entry:
   ```yaml
   - id: "my-game"
     title: "🎮 My Awesome Game"
     audience: "kids" # "kids", "journals", or "tools"
     kind: "game"     # "game", "educational", "journal", or "tool"
     score: 90
     tagline: "Catchy subtitle"
     description: "Full description"
     screenshot: "assets/screenshots/my-game.png"
     play_url: "https://palladius.github.io/my-game/"
     repo_url: "https://github.com/palladius/my-game"
     article_url: "https://ricc.rocks/..." # Optional!
     pwa: true                            # Optional: can run offline on a plane!
     tech: ["Flutter", "Dart", "PWA"]
     tags: ["puzzle", "kids", "pwa"]
     badge: "🟢 Play Live • PWA"
     target: "Alessandro & Sebi"
   ```
3. Run the compiler:
   ```bash
   python3 bin/build.py
   ```
4. Run the test:
   ```bash
   python3 tests/test_games_yaml.py
   ```

## 💻 Local Preview

```bash
python3 -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) or [http://localhost:8080/#kids](http://localhost:8080/#kids).
