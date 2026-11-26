#!/bin/sh
# Scripted smoke test of the real gantt.html editor (synthetic DOM events, headless).
# Prints the summary, exits 1 unless it starts with PASS.
cd "$(dirname "$0")" || exit 1
. ./lib.sh
out="$(page_output "$PWD/smoke.html")"
printf '%s\n' "$out"
case "$out" in PASS*) exit 0;; *) exit 1;; esac
