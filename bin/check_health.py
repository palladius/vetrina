#!/usr/bin/env python3
"""
SRE Health & CI/CD Monitor for Palladius Vetrina (bin/check_health.py)
100% deterministic, zero-LLM probe that checks every app in data/games.yaml:
  1. Live Endpoint Liveness (play_url + multi-region endpoints) -> HTTP status & latency (ms)
  2. GitHub Actions CI/CD Status (repo_url) -> Latest workflow run conclusion, name & URL
  3. Generates data/health.json and assets/js/health-data.js for the Vetrina UI
"""

import argparse
import concurrent.futures
import datetime
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import yaml

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, ".."))
GAMES_YAML = os.path.join(PROJECT_ROOT, "data", "games.yaml")
HEALTH_JSON = os.path.join(PROJECT_ROOT, "data", "health.json")
HEALTH_JS = os.path.join(PROJECT_ROOT, "assets", "js", "health-data.js")


def get_github_token():
    """Retrieve GitHub token from env or `gh auth token` CLI if available."""
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if token:
        return token.strip()
    try:
        res = subprocess.run(
            ["gh", "auth", "token"],
            capture_output=True,
            text=True,
            timeout=3,
            check=False,
        )
        if res.returncode == 0 and res.stdout.strip():
            return res.stdout.strip()
    except Exception:
        pass
    return None


class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def check_url(url, timeout=10):
    """Probe an HTTP/HTTPS URL and return status dict."""
    if not url:
        return {"status": "none", "http_code": None, "latency_ms": None, "note": "No play_url (CLI/Library)"}

    start = time.monotonic()
    headers = {
        "User-Agent": "PalladiusVetrina-SREProbe/1.0 (+https://palladius.github.io/vetrina/)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }

    try:
        req = urllib.request.Request(url, headers=headers, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            latency_ms = int((time.monotonic() - start) * 1000)
            final_url = resp.geturl()
            code = resp.getcode()
            body_sample = resp.read(2048).decode("utf-8", errors="ignore")

            if "cloudflareaccess.com" in final_url:
                return {
                    "status": "protected",
                    "http_code": code,
                    "latency_ms": latency_ms,
                    "note": "Cloudflare Zero Trust Access",
                }

            return {
                "status": "up" if 200 <= code < 400 else "down",
                "http_code": code,
                "latency_ms": latency_ms,
                "note": "OK" if len(body_sample.strip()) > 0 else "Empty response body",
            }
    except urllib.error.HTTPError as e:
        latency_ms = int((time.monotonic() - start) * 1000)
        # Cloudflare Access or login pages sometimes return 403/302
        location = e.headers.get("Location", "") if e.headers else ""
        if "cloudflareaccess.com" in location or "cloudflareaccess.com" in str(e.url):
            return {
                "status": "protected",
                "http_code": e.code,
                "latency_ms": latency_ms,
                "note": "Cloudflare Zero Trust Access",
            }
        return {
            "status": "down",
            "http_code": e.code,
            "latency_ms": latency_ms,
            "note": f"HTTP {e.code}: {e.reason}",
        }
    except Exception as e:
        latency_ms = int((time.monotonic() - start) * 1000)
        return {
            "status": "down",
            "http_code": 0,
            "latency_ms": latency_ms,
            "note": str(e),
        }


def check_github_ci(repo_url, gh_token):
    """Query GitHub Actions API for the latest workflow run of a repository."""
    if not repo_url:
        return {"status": "none", "note": "No repo_url"}

    gh_match = re.match(r"https?://github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$", repo_url.strip())
    if not gh_match:
        if "gitlab.com" in repo_url:
            return {"status": "gitlab", "note": "Hosted on GitLab"}
        return {"status": "none", "note": "Non-GitHub repo"}

    owner, repo = gh_match.group(1), gh_match.group(2)
    api_url = f"https://api.github.com/repos/{owner}/{repo}/actions/runs?per_page=5"

    headers = {
        "User-Agent": "PalladiusVetrina-SREProbe/1.0",
        "Accept": "application/vnd.github+json",
    }
    if gh_token:
        headers["Authorization"] = f"Bearer {gh_token}"

    try:
        req = urllib.request.Request(api_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            runs = data.get("workflow_runs", [])
            if not runs:
                return {
                    "status": "no_workflows",
                    "repo": f"{owner}/{repo}",
                    "note": "No GitHub Actions runs",
                }

            latest = runs[0]
            conclusion = latest.get("conclusion")  # success, failure, cancelled, skipped, None (if in_progress)
            run_status = latest.get("status")      # completed, in_progress, queued
            workflow_name = latest.get("name", "Workflow")
            display_title = latest.get("display_title", "")
            html_url = latest.get("html_url", "")
            updated_at = latest.get("updated_at", "")
            head_branch = latest.get("head_branch", "")
            event = latest.get("event", "")

            # Also check if ANY workflow's latest run on this repo is failing
            failing_workflows = []
            seen_workflows = set()
            for r in runs:
                wf_id = r.get("workflow_id")
                if wf_id in seen_workflows:
                    continue
                seen_workflows.add(wf_id)
                if r.get("status") == "completed" and r.get("conclusion") == "failure":
                    failing_workflows.append({
                        "name": r.get("name"),
                        "url": r.get("html_url"),
                        "updated_at": r.get("updated_at"),
                        "title": r.get("display_title"),
                    })

            if run_status != "completed":
                ci_state = "running"
            elif conclusion in ("success", "skipped", "neutral"):
                ci_state = "passing"
            else:
                ci_state = "failing"

            return {
                "status": ci_state,
                "repo": f"{owner}/{repo}",
                "conclusion": conclusion,
                "run_status": run_status,
                "workflow_name": workflow_name,
                "display_title": display_title,
                "branch": head_branch,
                "event": event,
                "updated_at": updated_at,
                "run_url": html_url,
                "failing_workflows": failing_workflows,
            }
    except urllib.error.HTTPError as e:
        return {
            "status": "error",
            "repo": f"{owner}/{repo}",
            "note": f"GitHub API HTTP {e.code}",
        }
    except Exception as e:
        return {
            "status": "error",
            "repo": f"{owner}/{repo}",
            "note": str(e),
        }


def inspect_item(item, gh_token):
    """Run both live endpoint check and CI/CD check for a single Vetrina item."""
    item_id = item.get("id")
    title = item.get("title", item_id)
    archived = bool(item.get("archived", False))
    play_url = (item.get("play_url") or "").strip()
    repo_url = (item.get("repo_url") or "").strip()
    regions = item.get("regions") or []

    if archived:
        web_res = {"status": "archived", "http_code": None, "latency_ms": None, "note": "Archived app"}
    else:
        web_res = check_url(play_url)

    region_results = []
    for reg in regions:
        r_url = reg.get("url")
        r_check = check_url(r_url)
        region_results.append({
            "name": reg.get("name"),
            "env": reg.get("env"),
            "region": reg.get("region"),
            "url": r_url,
            **r_check,
        })

    ci_res = check_github_ci(repo_url, gh_token)

    # Compute overall SRE health badge
    if archived:
        overall = "archived"
    elif web_res["status"] == "down":
        overall = "down"
    elif ci_res["status"] == "failing":
        overall = "ci_failing"
    elif any(r["status"] == "down" for r in region_results):
        overall = "degraded"
    else:
        overall = "healthy"

    return {
        "id": item_id,
        "title": title,
        "audience": item.get("audience"),
        "archived": archived,
        "overall": overall,
        "play_url": play_url,
        "repo_url": repo_url,
        "web": web_res,
        "regions": region_results,
        "ci": ci_res,
    }


def main():
    parser = argparse.ArgumentParser(description="Palladius Vetrina SRE Health & CI/CD Monitor")
    parser.add_argument("--fail-on-error", action="store_true", help="Exit with code 1 if any app is down or CI is failing")
    args = parser.parse_args()

    if not os.path.isfile(GAMES_YAML):
        print(f"❌ Missing {GAMES_YAML}")
        sys.exit(1)

    with open(GAMES_YAML, "r", encoding="utf-8") as f:
        items = yaml.safe_load(f) or []

    gh_token = get_github_token()
    print(f"🩺 Starting Vetrina SRE Health Probe across {len(items)} apps (GH Token: {'✅' if gh_token else '❌ anonymous'})...\n")

    start_all = time.monotonic()
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_map = {executor.submit(inspect_item, item, gh_token): item.get("id") for item in items}
        for future in concurrent.futures.as_completed(future_map):
            results.append(future.result())

    # Sort results in the same order as games.yaml
    order_map = {item.get("id"): idx for idx, item in enumerate(items)}
    results.sort(key=lambda r: order_map.get(r["id"], 999))

    elapsed = time.monotonic() - start_all

    counts = {
        "healthy": sum(1 for r in results if r["overall"] == "healthy"),
        "ci_failing": sum(1 for r in results if r["overall"] == "ci_failing"),
        "degraded": sum(1 for r in results if r["overall"] == "degraded"),
        "down": sum(1 for r in results if r["overall"] == "down"),
        "archived": sum(1 for r in results if r["overall"] == "archived"),
    }

    report = {
        "checked_at": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "duration_sec": round(elapsed, 2),
        "total": len(results),
        "summary": counts,
        "items": {r["id"]: r for r in results},
    }

    with open(HEALTH_JSON, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    with open(HEALTH_JS, "w", encoding="utf-8") as f:
        f.write("// Auto-generated by bin/check_health.py - DO NOT EDIT MANUALLY\n")
        f.write("window.VETRINA_HEALTH = ")
        json.dump(report, f, indent=2, ensure_ascii=False)
        f.write(";\n")

    # Print formatted SRE table
    STATUS_ICONS = {
        "healthy": "🟢 HEALTHY   ",
        "ci_failing": "🟡 CI BROKEN ",
        "degraded": "🟠 DEGRADED  ",
        "down": "🔴 SITE DOWN ",
        "archived": "📦 ARCHIVED  ",
    }

    print(f"{'STATUS':<14} | {'ID':<28} | {'WEB PROBE':<22} | {'GITHUB ACTIONS CI/CD'}")
    print("-" * 105)
    for r in results:
        icon = STATUS_ICONS.get(r["overall"], r["overall"])
        w = r["web"]
        if w["status"] == "up":
            web_str = f"200 OK ({w['latency_ms']}ms)"
        elif w["status"] == "protected":
            web_str = f"🔒 ZeroTrust ({w['latency_ms']}ms)"
        elif w["status"] == "none":
            web_str = "— (CLI/Tool)"
        elif w["status"] == "archived":
            web_str = "📦 Archived"
        else:
            web_str = f"❌ {w.get('http_code') or 'ERR'} ({w.get('note', '')[:12]})"

        ci = r["ci"]
        if ci["status"] == "passing":
            ci_str = f"✅ {ci.get('workflow_name', 'CI')[:28]} ({ci.get('updated_at', '')[:10]})"
        elif ci["status"] == "failing":
            ci_str = f"❌ FAIL: {ci.get('workflow_name', 'CI')} -> {ci.get('run_url', '')}"
        elif ci["status"] == "running":
            ci_str = f"⏳ RUNNING: {ci.get('workflow_name', 'CI')}"
        elif ci["status"] == "no_workflows":
            ci_str = "⚪ No workflows"
        elif ci["status"] == "gitlab":
            ci_str = "🦊 GitLab Repo"
        elif ci["status"] == "none":
            ci_str = "— (No repo)"
        else:
            ci_str = f"⚠️ {ci.get('note', 'Unknown')}"

        print(f"{icon:<14} | {r['id']:<28} | {web_str:<22} | {ci_str}")

    print("-" * 105)
    print(
        f"⏱️  Done in {elapsed:.2f}s | "
        f"🟢 Healthy: {counts['healthy']} | "
        f"🟡 CI Broken: {counts['ci_failing']} | "
        f"🔴 Site Down: {counts['down']} | "
        f"📦 Archived: {counts['archived']}"
    )
    print(f"💾 Saved {HEALTH_JSON} & {HEALTH_JS}")

    if args.fail_on_error and (counts["down"] > 0 or counts["ci_failing"] > 0):
        sys.exit(1)


if __name__ == "__main__":
    main()
