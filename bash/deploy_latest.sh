#!/bin/bash

# --- KONFIGURACJA ---
REGISTRY="docker.jaqjacek.duckdns.org"
IMAGE_NAME="wedrowycz-masakra"
CONTAINER_NAME="wedrowycz-masakra"
PORT="7777"

FULL_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:latest"

echo "--- 1. Zarządzanie kontenerem na serwerze ---"
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "Zatrzymywanie i usuwanie starego kontenera: $CONTAINER_NAME..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
fi

echo "--- 2. Pobieranie najnowszej wersji obrazu ---"
docker pull "$FULL_IMAGE_NAME"

echo "--- 3. Uruchamianie aplikacji ---"
# Uruchamiamy na porcie 6666
docker run -d \
    -p $PORT:3001 \
    --name $CONTAINER_NAME \
    --restart unless-stopped \
    "$FULL_IMAGE_NAME"

echo "--- PROCES ZAKOŃCZONY ---"
echo "Kontener: $CONTAINER_NAME jest uruchomiony na porcie: $PORT"