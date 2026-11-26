#!/bin/sh
# Recapture golden SVGs from the CURRENT gantt.html. Only do this on purpose.
cd "$(dirname "$0")" || exit 1
. ./lib.sh
mkdir -p golden
out="$(page_output "$PWD/capture.html")"
case "$out" in "window.GOLDEN="*) ;; *) echo "capture failed: $out"; exit 1;; esac
printf '%s\n' "$out" > golden/goldens.js
echo "wrote test/golden/goldens.js ($(wc -c < golden/goldens.js) bytes)"
