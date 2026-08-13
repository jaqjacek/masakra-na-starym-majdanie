#!/bin/bash
# Zastąpione przez bash/deploy.sh (kompatybilność wsteczna)
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$DIR/deploy.sh" "$@"
