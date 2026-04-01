#!/usr/bin/env python3
"""
scan_all_sites.py — Scan all ctwebsiteco Vercel deployments for build errors.

Dynamically fetches:
  1. All ctwebsiteco GitHub repos
  2. All Vercel projects linked to those repos
  3. Latest deployment for each project + build logs

Usage: python3 scripts/scan_all_sites.py
"""

import subprocess
import json
import re
import sys
import os
from datetime import datetime, timezone
from typing import Optional

GH_TOKEN = os.environ.get("GITHUB_TOKEN", "<GITHUB_TOKEN_PLACEHOLDER>")
VC_TOKEN = os.environ.get("VERCEL_TOKEN", "<VERCEL_TOKEN_PLACEHOLDER>")
VC_API = "https://api.vercel.com"
GH_API = "https://api.github.com"
ORG = "ctwebsiteco"

RED = "\033[0;31m"
GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
BLUE = "\033[0;34m"
BOLD = "\033[1m"
RESET = "\033[0m"


def gh(path: str) -> dict:
    """GitHub API GET request."""
    try:
        result = subprocess.run(
            ["curl", "-s",
             "-H", f"Authorization: token {GH_TOKEN}",
             "-H", "Accept: application/vnd.github+json",
             f"{GH_API}{path}"],
            capture_output=True, text=True, timeout=15
        )
        out = result.stdout
        if not out:
            return {}
        return json.loads(out)
    except (json.JSONDecodeError, subprocess.TimeoutExpired):
        return {}


def vc(path: str) -> dict:
    """Vercel API GET request."""
    try:
        result = subprocess.run(
            ["curl", "-s",
             "-H", f"Authorization: Bearer {VC_TOKEN}",
             f"{VC_API}{path}"],
            capture_output=True, text=True, timeout=15
        )
        out = result.stdout
        if not out:
            return {}
        return json.loads(out)
    except (json.JSONDecodeError, subprocess.TimeoutExpired):
        return {}


def latest_deployment_events(project_uid: str) -> tuple[Optional[dict], list[dict]]:
    """Fetch latest deployment info + build events for a Vercel project."""
    d = vc(f"/v6/deployments?projectId={project_uid}&limit=1")
    deps = d.get("deployments", [])
    if not deps:
        return None, []

    dep = deps[0]
    uid = dep.get("uid", "")

    events = []
    if uid:
        try:
            ev = vc(f"/v2/deployments/{uid}/events")
            events = ev if isinstance(ev, list) else []
        except Exception:
            pass

    return {
        "uid": uid,
        "state": dep.get("readyState", "?"),
        "url": dep.get("url", ""),
        "created": dep.get("createdAt", ""),
    }, events


def extract_errors(events: list[dict]) -> list[str]:
    """Extract error lines from Vercel v2 build events."""
    error_keywords = [
        "error", "failed", "failure", "fatal", "cannot find",
        "module not found", "enoent", "emsg", "exited with code",
        "command failed", "build failed", "pnpm failed", "npm failed",
        "vercel.json", "middleware"
    ]
    errors = []
    for e in events:
        if not isinstance(e, dict):
            continue
        if e.get("type") not in ("stderr", "stdout"):
            continue
        text = e.get("payload", {}).get("text", "")
        if not text:
            continue
        lower = text.lower()
        if any(kw in lower for kw in error_keywords):
            clean = re.sub(r"\x1b\[[0-9;]*[a-zA-Z]", "", text)
            for line in clean.split("\n"):
                line = line.strip()
                if line and any(kw in line.lower() for kw in error_keywords):
                    errors.append(line[:250])
    return errors[:15]


def check_github_prs() -> list[tuple[str, str, str]]:
    """Check PRs across all ctwebsiteco repos for wrong authors."""
    bad_prs = []
    bad_authors = {"openclaw", "anthropic", "noreply", " claude", "codex", "openai", "github"}

    repos_data = gh(f"/orgs/{ORG}/repos?per_page=100&sort=updated")
    if not isinstance(repos_data, list):
        repos_data = []
    repo_names = [r["full_name"] for r in repos_data if isinstance(r, dict)]

    for repo in repo_names:
        prs = gh(f"/repos/{repo}/pulls?state=open&per_page=10")
        if not isinstance(prs, list):
            continue
        for pr in prs:
            if not isinstance(pr, dict):
                continue
            author = pr.get("user", {}).get("login", "")
            if any(bad in author.lower() for bad in bad_authors):
                bad_prs.append((repo, f"#{pr['number']}", author))

    return bad_prs


def format_timestamp(ts: str) -> str:
    """Format Vercel millisecond timestamp to readable UTC string."""
    try:
        return datetime.fromtimestamp(int(ts) / 1000, tz=timezone.utc).strftime("%m-%d %H:%M")
    except Exception:
        return ts


def main():
    print(f"\n{BOLD}{'=' * 60}{RESET}")
    print(f"{BOLD}  ctwebsiteco — Vercel Build Error Scanner{RESET}")
    print(f"{BOLD}  {datetime.now(timezone.utc):%Y-%m-%d %H:%M UTC}{RESET}")
    print(f"{BOLD}{'=' * 60}{RESET}\n")

    # ── 1. Get all Vercel projects ─────────────────────────────────────────
    print(f"{BLUE}[INFO]{RESET} Fetching all Vercel projects...")
    proj_data = vc("/v6/projects?limit=50")
    all_projects = proj_data.get("projects", [])
    print(f"{BLUE}[INFO]{RESET}  {len(all_projects)} total projects in Vercel account")

    ct_projects = []
    for p in all_projects:
        if not isinstance(p, dict):
            continue
        link = p.get("link") or {}
        github_org = link.get("org", "")
        github_repo = link.get("repo", "")
        if github_org == "ctwebsiteco" and github_repo:
            ct_projects.append({
                "name": p["name"],
                "uid": p["id"],
                "github": github_repo,
            })

    print(f"{BLUE}[INFO]{RESET}  {len(ct_projects)} ctwebsiteco-linked projects\n")

    # ── 2. Check GitHub PRs ─────────────────────────────────────────────────
    print(f"{BLUE}[INFO]{RESET} Checking GitHub PRs for blocked authors...")
    bad_prs = check_github_prs()
    if bad_prs:
        print(f"{RED}WARN  {len(bad_prs)} PRs with non-SeanConway102 authors (may block merges):{RESET}")
        for repo, pr_num, author in bad_prs:
            print(f"       {RED}  {repo} {pr_num} by @{author}{RESET}")
    else:
        print(f"{GREEN}[ OK  ]{RESET} No problematic PR authors found")
    print("")

    # ── 3. Scan each Vercel project ────────────────────────────────────────
    print(f"{BOLD}--- Vercel Deployments -----------------------------------{RESET}\n")

    error_count = 0
    warn_count = 0

    for proj in sorted(ct_projects, key=lambda x: x["name"]):
        name = proj["name"]
        uid = proj["uid"]
        github = proj["github"]

        print(f"{BOLD}>>> {name}{RESET}")
        print(f"    GitHub: {github}")

        dep, events = latest_deployment_events(uid)

        if not dep or not dep.get("uid"):
            print(f"    {YELLOW}      No deployments yet (skip){RESET}\n")
            warn_count += 1
            continue

        state = dep["state"]
        url = dep["url"]
        dt = format_timestamp(dep.get("created", ""))

        print(f"    State: {state} | {dt} | {url}")

        if state == "READY":
            print(f"    {GREEN}      OK — build successful{RESET}")
        elif state == "ERROR":
            error_count += 1
            errors = extract_errors(events)
            if errors:
                print(f"    {RED}      ERRORS detected:{RESET}")
                for e in errors:
                    print(f"        {RED}  >  {e[:220]}{RESET}")
            else:
                print(f"    {RED}      Error state — check Vercel dashboard{RESET}")
        else:
            print(f"    {YELLOW}      WARNING: {state}{RESET}")
            warn_count += 1

        print()

    # ── Summary ──────────────────────────────────────────────────────────
    print(f"{BOLD}{'=' * 60}{RESET}")
    print(f"{BOLD}  Summary{RESET}")
    print(f"{BOLD}{'=' * 60}{RESET}")

    if error_count > 0:
        print(f"  {RED}FAIL {error_count} projects with ERROR deployments{RESET}")
    else:
        print(f"  {GREEN} PASS  No ERROR deployments{RESET}")

    if warn_count > 0:
        print(f"  {YELLOW} WARN  {warn_count} projects with non-READY deployments{RESET}")

    if bad_prs:
        print(f"  {RED} WARN  {len(bad_prs)} GitHub PRs with wrong authors (may block merges){RESET}")

    print()
    return 1 if error_count > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
