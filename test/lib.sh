# Shared by capture.sh and run.sh: run a test page headless, print its decoded output.
EDGE="${EDGE:-/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe}"
page_output() { # $1 = html file; prints the text the page passed to emit()
  local tmp; tmp="$(mktemp -d)"
  "$EDGE" --headless --disable-gpu --no-first-run --allow-file-access-from-files \
    --virtual-time-budget=20000 --user-data-dir="$(cygpath -w "$tmp")" \
    --dump-dom "file:///$(cygpath -m "$1")" 2>/dev/null \
    | grep -o '<pre id="b64">[^<]*' | sed 's/<pre id="b64">//' | base64 -d
  rm -rf "$tmp" 2>/dev/null
}
