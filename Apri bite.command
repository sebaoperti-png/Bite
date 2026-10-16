#!/bin/bash
# Double-click to open the Bite website and app on this Mac (works offline).
# It serves the ready-made "dist" folder with the Python that comes with macOS.
cd "$(dirname "$0")/dist" || { echo "Folder 'dist' not found."; read -r; exit 1; }
PORT=8080
while lsof -i :$PORT >/dev/null 2>&1; do PORT=$((PORT+1)); done
echo ""
echo "  Bite is running:"
echo "    Landing page:  http://localhost:$PORT/"
echo "    App (demo):    http://localhost:$PORT/bite.html?reset"
echo "    Survey (tablet, kiosk):  http://localhost:$PORT/stand.html?kiosk"
echo "    Live results (TV):       http://localhost:$PORT/stand.html?screen"
echo ""
echo "  Keep this window open while you present. Close it to stop."
echo ""
(sleep 1; open "http://localhost:$PORT/") &
exec python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1
