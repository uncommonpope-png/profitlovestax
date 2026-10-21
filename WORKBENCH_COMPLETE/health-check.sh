#!/usr/bin/env bash
# BUYaSOUL ONE SYSTEM - Health Check Script
# Run: ./health-check.sh

set -e

echo "═══════════════════════════════════════════"
echo "  BUYaSOUL ONE SYSTEM — Health Check"
echo "═══════════════════════════════════════════"

check_service() {
  local name=$1
  local url=$2
  local expected=$3
  
  if curl -s -f --max-time 5 "$url" > /dev/null 2>&1; then
    echo "✅ $name: $url"
    return 0
  else
    echo "❌ $name: $url (unreachable)"
    return 1
  fi
}

check_json() {
  local name=$1
  local url=$2
  local jq_filter=$3
  
  if response=$(curl -s -f --max-time 5 "$url" 2>/dev/null); then
    if echo "$response" | jq -e "$jq_filter" > /dev/null 2>&1; then
      echo "✅ $name: $url"
      return 0
    else
      echo "⚠️  $name: $url (invalid response)"
      return 1
    fi
  else
    echo "❌ $name: $url (unreachable)"
    return 1
  fi
}

echo ""
echo "🔍 Checking core services..."
echo ""

# System status (orchestrates all)
check_json "System Status" "http://localhost:3001/api/system/status" '.success == true'

# Individual services
check_json "OmniRoute Models" "http://localhost:20128/v1/models" '.data != null or . != null'
check_json "GSK MCP Health" "http://localhost:3001/mcp/health" '.status == "ok" or .ok == true'
check_json "CPL Health" "http://localhost:3457/health" '.ok == true or .status == "ok"'
check_json "CPL MCP Health" "http://localhost:3457/mcp/health" '.status == "ok" or .ok == true'

# Workbench API
check_json "Workbench API" "http://localhost:3001/api/gsk/status" '.success == true'
check_json "Soul Economy" "http://localhost:3001/api/soul-economy/catalog" '.success == true'

# Vite dev server
check_service "Workbench UI (Vite)" "http://localhost:3000"

echo ""
echo "═══════════════════════════════════════════"
echo "  Health check complete"
echo "═══════════════════════════════════════════"