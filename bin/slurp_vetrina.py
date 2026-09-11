#!/usr/bin/env python3
"""
Slurper & Ingestion Engine for Palladius Vetrina:
1. Reads data/sources.yaml (list of repos or URLs to slurp).
2. Fetches remote /vetrina.json (supporting GitHub raw, GitLab raw, or direct HTTP/HTTPS URLs).
3. Validates schema and version comparison (only updates if remote version > local version).
4. Downloads remote screenshots locally to assets/screenshots/<id>.<ext>.
5. Merges updates into data/games.yaml ensuring primary key uniqueness (id, repo_url, play_url).
6. Runs tests and updates JSON & JS data files.
"""

import os
import sys
import re
import json
import urllib.request
import urllib.parse
import yaml

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
GAMES_YAML = os.path.join(PROJECT_ROOT, "data", "games.yaml")
SOURCES_YAML = os.path.join(PROJECT_ROOT, "data", "sources.yaml")
SCREENSHOTS_DIR = os.path.join(PROJECT_ROOT, "assets", "screenshots")

def parse_semver(v_str):
    """Convert version string like '1.2.3' or 'v1.0.1' into a comparable tuple."""
    if not v_str:
        return (0, 0, 0)
    cleaned = re.sub(r'^[^\d]*', '', str(v_str).strip())
    parts = cleaned.split('.')
    nums = []
    for p in parts[:3]:
        match = re.match(r'^(\d+)', p)
        nums.append(int(match.group(1)) if match else 0)
    while len(nums) < 3:
        nums.append(0)
    return tuple(nums)

def resolve_raw_url(source):
    """Normalize github/gitlab repository URLs to raw vetrina.json URLs."""
    source = source.strip()
    if source.endswith("vetrina.json"):
        return source

    # GitHub repo: https://github.com/owner/repo or git@github.com:owner/repo.git
    gh_match = re.match(r'(?:https?://github\.com/|git@github\.com:)([^/]+)/([^/\.]+)(?:\.git)?', source)
    if gh_match:
        owner, repo = gh_match.group(1), gh_match.group(2)
        # default to master or main
        return f"https://raw.githubusercontent.com/{owner}/{repo}/HEAD/vetrina.json"

    # GitLab repo: https://gitlab.com/owner/repo
    gl_match = re.match(r'(?:https?://gitlab\.com/|git@gitlab\.com:)([^/]+)/([^/\.]+)(?:\.git)?', source)
    if gl_match:
        owner, repo = gl_match.group(1), gl_match.group(2)
        return f"https://gitlab.com/{owner}/{repo}/-/raw/HEAD/vetrina.json"

    return source

def fetch_json(url):
    """Fetch and parse JSON from a URL with timeout and User-Agent."""
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "PalladiusVetrina-Slurper/1.0", "Accept": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=12) as response:
        content = response.read().decode('utf-8')
        return json.loads(content)

def download_screenshot(image_url, item_id):
    """Download remote screenshot to assets/screenshots/<id>.<ext>."""
    parsed = urllib.parse.urlparse(image_url)
    ext = os.path.splitext(parsed.path)[1].lower()
    if ext not in [".png", ".jpg", ".jpeg", ".webp", ".gif"]:
        ext = ".png"
    target_rel = f"assets/screenshots/{item_id}{ext}"
    target_abs = os.path.join(PROJECT_ROOT, target_rel)

    req = urllib.request.Request(image_url, headers={"User-Agent": "PalladiusVetrina-Slurper/1.0"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        with open(target_abs, "wb") as f:
            f.write(resp.read())
    return target_rel

def slurp_sources():
    if not os.path.isfile(SOURCES_YAML):
        print(f"⚠️ No {SOURCES_YAML} found. Creating default sources template...")
        os.makedirs(os.path.dirname(SOURCES_YAML), exist_ok=True)
        default_sources = [
            {"name": "sakura", "url": "https://github.com/palladius/sakura"}
        ]
        with open(SOURCES_YAML, "w", encoding="utf-8") as f:
            yaml.dump(default_sources, f, indent=2)

    with open(SOURCES_YAML, "r", encoding="utf-8") as f:
        sources = yaml.safe_load(f) or []

    with open(GAMES_YAML, "r", encoding="utf-8") as f:
        local_data = yaml.safe_load(f) or []

    local_by_id = {item.get("id"): item for item in local_data if item.get("id")}
    changes_made = False

    for src in sources:
        src_url = src.get("url") if isinstance(src, dict) else str(src)
        raw_url = resolve_raw_url(src_url)
        print(f"🔍 Fetching {raw_url} ...")

        manifest = None
        candidates = [raw_url]
        if "/HEAD/" in raw_url:
            candidates.extend([raw_url.replace("/HEAD/", "/master/"), raw_url.replace("/HEAD/", "/main/")])

        for cand_url in candidates:
            try:
                manifest = fetch_json(cand_url)
                if manifest:
                    print(f"   ✅ Fetched manifest from {cand_url}")
                    break
            except Exception:
                continue

        if not manifest:
            print(f"   ❌ Failed to fetch manifest from any candidate for {raw_url}")
            continue

        item_id = manifest.get("id")
        if not item_id:
            print(f"   ⚠️ Invalid vetrina.json: missing 'id'. Skipping.")
            continue

        existing = local_by_id.get(item_id)
        remote_version = manifest.get("version", "1.0.0")
        local_version = existing.get("version", "0.0.0") if existing else "0.0.0"

        remote_v_tuple = parse_semver(remote_version)
        local_v_tuple = parse_semver(local_version)

        if existing and remote_v_tuple <= local_v_tuple:
            print(f"   ⏩ [{item_id}] Up-to-date (local: {local_version} >= remote: {remote_version})")
            continue

        print(f"   ⭐ [{item_id}] Upgrading from {local_version} -> {remote_version}")

        # Handle screenshot
        screenshot_url = manifest.get("screenshot_url")
        if screenshot_url and screenshot_url.startswith("http"):
            try:
                local_shot = download_screenshot(screenshot_url, item_id)
                manifest["screenshot"] = local_shot
                print(f"      📸 Downloaded screenshot to {local_shot}")
            except Exception as se:
                print(f"      ⚠️ Failed to download screenshot {screenshot_url}: {se}")
                if "screenshot" not in manifest and existing and "screenshot" in existing:
                    manifest["screenshot"] = existing["screenshot"]

        # Ensure schema defaults
        if "score" not in manifest or manifest["score"] is None:
            manifest["score"] = 50
        if "audience" not in manifest:
            manifest["audience"] = "tools"
        if "kind" not in manifest:
            manifest["kind"] = "tool"
        if "can_embed" not in manifest:
            manifest["can_embed"] = False

        if existing:
            # Update fields in-place
            existing.update(manifest)
        else:
            local_data.append(manifest)
            local_by_id[item_id] = manifest

        changes_made = True

    if changes_made:
        with open(GAMES_YAML, "w", encoding="utf-8") as f:
            yaml.dump(local_data, f, indent=2, sort_keys=False, allow_unicode=True)
        print(f"💾 Updated {GAMES_YAML}")
        # Run build
        os.system(f"python3 {os.path.join(SCRIPT_DIR, 'build.py')}")
        # Run tests
        ret = os.system(f"python3 {os.path.join(PROJECT_ROOT, 'tests', 'test_games_yaml.py')}")
        if ret != 0:
            print("❌ Validation tests failed after slurp! Check errors above.")
            sys.exit(1)
        print("✅ Slurp, build & tests completed successfully!")
    else:
        print("✨ All sources are up-to-date. No changes made.")

if __name__ == "__main__":
    slurp_sources()
