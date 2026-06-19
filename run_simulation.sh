#!/bin/bash

# Default values
HOST_URL="http://localhost:3001"
COUNT=1
SETS_FILE=""
GAME_FILE=""
EVENTS_FILE=""

# Help message
show_help() {
  echo "Usage: ./run_simulation.sh [options]"
  echo "Options:"
  echo "  --host <url>       Host URL of the server (default: http://localhost:3001)"
  echo "  --count <number>   Number of games to simulate (default: 1)"
  echo "  --sets <path>      Path to sets configuration JSON file"
  echo "  --game <path>      Path to game configuration JSON file"
  echo "  --events <path>    Path to events configuration JSON file"
  echo "  --use-defaults     Explicitly send default files from simulation_defaults/"
  echo "  -h, --help         Show this help message"
  exit 0
}

# Parse options
USE_DEFAULTS=false
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --host) HOST_URL="$2"; shift ;;
    --count) COUNT="$2"; shift ;;
    --sets) SETS_FILE="$2"; shift ;;
    --game) GAME_FILE="$2"; shift ;;
    --events) EVENTS_FILE="$2"; shift ;;
    --use-defaults) USE_DEFAULTS=true ;;
    -h|--help) show_help ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
  shift
done

# If use-defaults is true and paths are not specified, set them to default files
if [ "$USE_DEFAULTS" = true ]; then
  [ -z "$SETS_FILE" ] && SETS_FILE="simulation_defaults/sets.json"
  [ -z "$GAME_FILE" ] && GAME_FILE="simulation_defaults/game.json"
  [ -z "$EVENTS_FILE" ] && EVENTS_FILE="simulation_defaults/events.json"
fi

echo "Running simulation on $HOST_URL..."
echo "Simulations count: $COUNT"

# Build curl command arguments array
curl_args=(-s -X POST)

# If files exist and are passed, add them to curl arguments
if [ -n "$SETS_FILE" ]; then
  if [ -f "$SETS_FILE" ]; then
    echo "Using sets file: $SETS_FILE"
    curl_args+=(-F "sets=@$SETS_FILE")
  else
    echo "Error: Sets file not found at $SETS_FILE"
    exit 1
  fi
fi

if [ -n "$GAME_FILE" ]; then
  if [ -f "$GAME_FILE" ]; then
    echo "Using game config file: $GAME_FILE"
    curl_args+=(-F "game=@$GAME_FILE")
  else
    echo "Error: Game config file not found at $GAME_FILE"
    exit 1
  fi
fi

if [ -n "$EVENTS_FILE" ]; then
  if [ -f "$EVENTS_FILE" ]; then
    echo "Using events file: $EVENTS_FILE"
    curl_args+=(-F "events=@$EVENTS_FILE")
  else
    echo "Error: Events file not found at $EVENTS_FILE"
    exit 1
  fi
fi

# Add the count field as a multipart form parameter
curl_args+=(-F "count=$COUNT")

# Send POST request to /api/simulate/full
url="${HOST_URL}/api/simulate/full"
echo "Sending POST request to $url..."

response=$(curl "${curl_args[@]}" "$url")

# Format output using python if available for readability
if command -v python3 &>/dev/null; then
  echo "$response" | python3 -m json.tool
else
  echo "$response"
fi
