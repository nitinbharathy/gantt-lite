#!/bin/sh
# Run the browser tests headless. Prints the summary, exits 1 unless it starts with PASS.
cd "$(dirname "$0")" || exit 1
. ./lib.sh
out="$(page_output "$PWD/run.html")"
printf '%s\n' "$out"
case "$out" in PASS*) exit 0;; *) exit 1;; esac
