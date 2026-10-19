# Justfile for vetrina
# Quick tasks for Palladius Showcase

list:
    @just -l

# Build JSON and JS datasets from data/games.yaml
build:
    uv run --with pyyaml python3 ./bin/build.py

# Run integrity tests on data/games.yaml
test: build
    uv run --with pyyaml python3 ./tests/test_games_yaml.py

# Start a local preview server
serve port="8080":
    @echo "🚀 Avvio server locale su http://localhost:{{port}}"
    python3 -m http.server {{port}}

# Run build and serve together
dev port="8080": build
    python3 -m http.server {{port}}
