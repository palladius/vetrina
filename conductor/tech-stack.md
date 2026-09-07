# Tech Stack: Palladius Vetrina

## Frontend
- **Markup**: HTML5 Semantic markup
- **Styling**: TailwindCSS (CDN / utilities) + Custom CSS Glassmorphism (`assets/css/style.css`)
- **Scripting**: Vanilla JavaScript (ES6+ modular, no build framework required)

## Build & Ingestion
- **Compiler**: Python 3.11+ (`bin/build.py`)
- **Data Formats**: YAML (`data/games.yaml`), JSON (`data/games.json`), fallback JS (`assets/js/games-data.js`)
- **Task Runner**: `Justfile`

## Testing & CI/CD
- **Testing**: Python `unittest` (`tests/test_games_yaml.py`)
- **Hosting**: GitHub Pages (`gh-pages` / Actions workflow)
- **CI/CD**: GitHub Actions (`.github/workflows/deploy.yml`)
