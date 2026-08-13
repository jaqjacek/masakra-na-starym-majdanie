#!/bin/bash

# --- WYKRYWANIE SILNIKA KONTENERÓW ---
if command -v docker >/dev/null 2>&1; then
    DOCKER_CMD="docker"
elif command -v podman >/dev/null 2>&1; then
    DOCKER_CMD="podman"
else
    echo "Błąd: Nie znaleziono ani 'docker', ani 'podman' w systemie."
    exit 1
fi

# --- KONFIGURACJA ---
REGISTRY="localhost:5000"
IMAGE_NAME="wedrowycz-masakra"
CONTAINER_NAME="wedrowycz-masakra"
PORT="7777"

FULL_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:latest"

echo "--- 1. Zarządzanie kontenerem na serwerze ($DOCKER_CMD) ---"
if [ "$($DOCKER_CMD ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "Zatrzymywanie i usuwanie starego kontenera: $CONTAINER_NAME..."
    $DOCKER_CMD stop $CONTAINER_NAME 2>/dev/null || true
    $DOCKER_CMD rm $CONTAINER_NAME 2>/dev/null || true
fi

echo "--- 2. Pobieranie najnowszej wersji obrazu ---"
$DOCKER_CMD pull "$FULL_IMAGE_NAME"

echo "--- 3. Uruchamianie aplikacji ---"
# Uruchamiamy na porcie 7777
$DOCKER_CMD run -d \
    -p $PORT:3001 \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    "$FULL_IMAGE_NAME"

echo "--- PROCES ZAKOŃCZONY ---"
echo "Kontener: $CONTAINER_NAME jest uruchomiony na porcie: $PORT"