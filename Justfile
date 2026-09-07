# Justfile for vetrina
# Quick tasks for Palladius Showcase

# Build JSON and JS datasets from data/games.yaml
build:
    ./bin/build.py

# Start a local preview server
serve port="8080":
    @echo "🚀 Avvio server locale su http://localhost:{{port}}"
    python3 -m http.server {{port}}

# Run build and serve together
dev port="8080": build
    python3 -m http.server {{port}}
