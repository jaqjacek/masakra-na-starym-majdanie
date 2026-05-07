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

# Check if server is running
curl -s "${HOST_URL}/api/ping" > /dev/null
if [ $? -ne 0 ]; then
  echo "Error: Server is not running on ${HOST_URL}"
  exit 1
fi

echo "Running full simulation test with multiple files on ${HOST_URL}..."

# Ensure test files exist
if [ ! -f "tests/sets.json" ] || [ ! -f "tests/game.json" ]; then
  echo "Error: Test files tests/sets.json or tests/game.json missing."
  exit 1
fi

# Run curl with -F (multipart/form-data)
# This sends the files separately without compiling them into one JSON
response=$(curl -s -X POST \
  -F "sets=@tests/sets.json" \
  -F "game=@tests/game.json" \
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
else
  echo "Test FAILED: Unexpected response."
  echo "$response"
  exit 1
fi
