#!/usr/bin/env bash
# Does:  Runs the same CodeQL analysis as CI against the working tree and fails on any finding.
# Holds: Path filters come from .github/codeql/codeql-config.yml and the suite matches its `security-extended`.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

codeql database create "$work/db" --db-cluster --language=javascript-typescript,actions --build-mode=none \
  --source-root="$root" --codescanning-config="$root/.github/codeql/codeql-config.yml" --overwrite >"$work/create.log" 2>&1 \
  || { cat "$work/create.log"; exit 1; }

status=0
# Why: A database cluster names the JavaScript/TypeScript database `javascript`, not by its language alias.
for lang in javascript actions; do
  sarif="$work/$lang.sarif"
  codeql database analyze "$work/db/$lang" "codeql/$lang-queries:codeql-suites/$lang-security-extended.qls" \
    --format=sarif-latest --output="$sarif" --download --quiet
  count="$(jq '[.runs[].results[]] | length' "$sarif")"
  if [[ "$count" -gt 0 ]]; then
    jq -r '.runs[].results[] | "\(.ruleId)\t\(.locations[0].physicalLocation.artifactLocation.uri):\(.locations[0].physicalLocation.region.startLine)\t\(.message.text)"' "$sarif"
    status=1
  fi
  echo "$lang: $count finding(s)"
done
exit "$status"
