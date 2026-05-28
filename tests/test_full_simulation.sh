#!/bin/bash
# Test for the /api/simulate/full endpoint using multiple file uploads

# Default Host URL
HOST_URL="http://localhost:3001"

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --HOST_URL) HOST_URL="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

# Check if something is already running on port 3001
curl -s "${HOST_URL}/api/ping" > /dev/null
ALREADY_RUNNING=$?

SERVER_PID=""

if [ $ALREADY_RUNNING -ne 0 ]; then
  echo "Server not running. Starting server in background..."
  node server/server.js > /dev/null 2>&1 &
  SERVER_PID=$!
  
  # Set up trap to kill the background server on exit
  trap "echo 'Stopping background server (PID: $SERVER_PID)...'; kill $SERVER_PID 2>/dev/null" EXIT
  
  # Wait for server to boot up (ping health check)
  echo "Waiting for server to respond on ${HOST_URL}..."
  for i in {1..10}; do
    curl -s "${HOST_URL}/api/ping" > /dev/null
    if [ $? -eq 0 ]; then
      echo "Server started successfully."
      break
    fi
    sleep 0.5
    if [ $i -eq 10 ]; then
      echo "Error: Server failed to start on ${HOST_URL}"
      exit 1
    fi
  done
else
  echo "Using already running server on ${HOST_URL}..."
fi

# Ensure test files exist
if [ ! -f "tests/sets.json" ] || [ ! -f "tests/game.json" ] || [ ! -f "tests/events.json" ]; then
  echo "Error: Test files tests/sets.json, tests/game.json, or tests/events.json missing."
  exit 1
fi

echo "Running full simulation test with multiple files on ${HOST_URL}..."

# Run curl with -F (multipart/form-data)
# This sends the files separately without compiling them into one JSON
response=$(curl -s -X POST \
  -F "sets=@tests/sets.json" \
  -F "game=@tests/game.json" \
  -F "events=@tests/events.json" \
  "${HOST_URL}/api/simulate/full")

# Check if response contains analytics
if echo "$response" | grep -q "analytics"; then
  echo "Test PASSED: Received analytics response from multi-file upload."
  # Use python to pretty print if available, otherwise just echo
  if command -v python3 &>/dev/null; then
    echo "$response" | python3 -m json.tool | head -n 20
  else
    echo "$response" | head -c 500
    echo "..."
  fi
  exit 0
else
  echo "Test FAILED: Unexpected response."
  echo "$response"
  exit 1
fi
