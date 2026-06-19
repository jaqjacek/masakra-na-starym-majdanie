#!/bin/bash

# Determine directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEFAULTS_DIR="${SCRIPT_DIR}/simulation_defaults"
INPUTS_DIR="${SCRIPT_DIR}/simulation_inputs"
OUTPUTS_DIR="${SCRIPT_DIR}/simulation_outputs"

# Default values
HOST_URL="http://localhost:3001"
COUNT=1
SETS_FILE=""
GAME_FILE=""
EVENTS_FILE=""
OUTPUT_FILE=""

# Help message
show_help() {
  echo "Usage: ./run_simulation.sh [options]"
  echo "Options:"
  echo "  --host <url>         Host URL of the server (default: http://localhost:3001)"
  echo "  --count <number>     Number of games to simulate (default: 1)"
  echo "  --setFile <path>     Path to sets configuration JSON file (checks relative to Cwd, SCRIPT_DIR, inputs/, and defaults/)"
  echo "  --gameFile <path>    Path to game configuration JSON file"
  echo "  --eventFile <path>   Path to events configuration JSON file"
  echo "  --outputFile <path>  Save output to specific file (default: auto-generates timestamped file in tests/simulation_outputs/)"
  echo "  --use-defaults       Explicitly send default files from simulation_defaults/"
  echo "  -h, --help           Show this help message"
  exit 0
}

# Resolve helper function to find files under tests subdirectories
resolve_file() {
  local input_path="$1"
  if [ -f "$input_path" ]; then
    echo "$input_path"
    return 0
  fi
  if [ -f "${SCRIPT_DIR}/${input_path}" ]; then
    echo "${SCRIPT_DIR}/${input_path}"
    return 0
  fi
  if [ -f "${INPUTS_DIR}/${input_path}" ]; then
    echo "${INPUTS_DIR}/${input_path}"
    return 0
  fi
  if [ -f "${DEFAULTS_DIR}/${input_path}" ]; then
    echo "${DEFAULTS_DIR}/${input_path}"
    return 0
  fi
  echo ""
  return 1
}

# Parse options
USE_DEFAULTS=false
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --host) HOST_URL="$2"; shift ;;
    --count) COUNT="$2"; shift ;;
    --setFile) SETS_FILE="$2"; shift ;;
    --gameFile) GAME_FILE="$2"; shift ;;
    --eventFile) EVENTS_FILE="$2"; shift ;;
    --output|--outputFile) OUTPUT_FILE="$2"; shift ;;
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

# Resolve and add files if specified
if [ -n "$SETS_FILE" ]; then
  resolved_sets=$(resolve_file "$SETS_FILE")
  if [ -n "$resolved_sets" ]; then
    echo "Using sets file: $resolved_sets"
    curl_args+=(-F "sets=@$resolved_sets")
  else
    echo "Error: Sets file '$SETS_FILE' not found (checked Cwd, tests/, tests/simulation_inputs/, tests/simulation_defaults/)"
    exit 1
  fi
fi

if [ -n "$GAME_FILE" ]; then
  resolved_game=$(resolve_file "$GAME_FILE")
  if [ -n "$resolved_game" ]; then
    echo "Using game config file: $resolved_game"
    curl_args+=(-F "game=@$resolved_game")
  else
    echo "Error: Game config file '$GAME_FILE' not found (checked Cwd, tests/, tests/simulation_inputs/, tests/simulation_defaults/)"
    exit 1
  fi
fi

if [ -n "$EVENTS_FILE" ]; then
  resolved_events=$(resolve_file "$EVENTS_FILE")
  if [ -n "$resolved_events" ]; then
    echo "Using events file: $resolved_events"
    curl_args+=(-F "events=@$resolved_events")
  else
    echo "Error: Events file '$EVENTS_FILE' not found (checked Cwd, tests/, tests/simulation_inputs/, tests/simulation_defaults/)"
    exit 1
  fi
fi

# Add the count field as a multipart form parameter
curl_args+=(-F "count=$COUNT")

# Send POST request to /api/simulate/full
url="${HOST_URL}/api/simulate/full"
echo "Sending POST request to $url..."

response=$(curl "${curl_args[@]}" "$url")

# Determine where to write output
if [ -z "$OUTPUT_FILE" ]; then
  mkdir -p "$OUTPUTS_DIR"
  timestamp=$(date +"%Y%m%d_%H%M%S")
  OUTPUT_FILE="${OUTPUTS_DIR}/run_${timestamp}.json"
fi

# Save response to output file
echo "$response" > "$OUTPUT_FILE"
echo "Simulation results saved to: $OUTPUT_FILE"

# Format and print output using python if available for readability
if command -v python3 &>/dev/null; then
  echo "$response" | python3 -m json.tool | head -n 40
  echo "... [truncated, see output file for complete logs]"
else
  echo "$response" | head -c 1000
  echo "... [truncated]"
fi
