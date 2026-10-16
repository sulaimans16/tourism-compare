#!/bin/sh
# Writes the browser's runtime settings from container env vars. Only public values belong here.
set -eu
esc() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }
cat > /usr/share/nginx/html/env.js <<JS
window.__ENV__ = {
  API_BASE_URL: "$(esc "${WEB_API_BASE_URL:-/api}")",
  SUPABASE_URL: "$(esc "${SUPABASE_URL:-}")",
  SUPABASE_ANON_KEY: "$(esc "${SUPABASE_ANON_KEY:-}")",
  GOOGLE_MAPS_BROWSER_KEY: "$(esc "${GOOGLE_MAPS_BROWSER_KEY:-}")",
  GOOGLE_MAP_ID: "$(esc "${GOOGLE_MAP_ID:-DEMO_MAP_ID}")"
};
JS
