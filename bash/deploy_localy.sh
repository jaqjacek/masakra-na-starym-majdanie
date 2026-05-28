#!/bin/bash

# --- KONFIGURACJA ---
REGISTRY="docker.jaqjacek.duckdns.org"
IMAGE_NAME="wedrowycz-masakra"
CONTAINER_NAME="wedrowycz-masakra"
PORT="7777"

# Obsługa parametru --tag
VERSION=""
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --tag) VERSION="$2"; shift ;;
    esac
    shift
done

# Jeśli tag nie został podany, pobierz z package.json lub gita
if [ -z "$VERSION" ]; then
    if [ -f "./package.json" ]; then
        VERSION="v$(node -p "require('./package.json').version" 2>/dev/null)"
    fi
    if [ -z "$VERSION" -o "$VERSION" = "v" ]; then
        VERSION=$(git describe --tags --abbrev=0 2>/dev/null)
    fi
fi

FULL_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:$VERSION"

echo "--- 1. Zarządzanie lokalnym kontenerem ---"
if [ "$(docker ps -aq -f name=$CONTAINER_NAME)" ]; then
    echo "Zatrzymywanie i usuwanie starego kontenera: $CONTAINER_NAME..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
fi

echo "--- 2. Wybrana wersja (Tag): $VERSION ---"
echo "--- Czyszczenie danych gier w server/games ---"
rm -rf server/games/*
echo "--- 3. Budowanie obrazu: $IMAGE_NAME:$VERSION ---"
docker build -t "$IMAGE_NAME:$VERSION" --no-cache .

echo "--- 4. Uruchamianie nowej wersji lokalnie ---"
# Uruchamiamy w tle na porcie 6666 (mapujemy na 3001 w kontenerze)
docker run -d -p $PORT:3001 --name $CONTAINER_NAME "$IMAGE_NAME:$VERSION"
echo "Aplikacja dostępna pod adresem: http://localhost:$PORT"

echo "--- 5. Tagowanie dla zewnętrznego registry ---"
docker tag "$IMAGE_NAME:$VERSION" "$FULL_IMAGE_NAME"
docker tag "$IMAGE_NAME:$VERSION" "$REGISTRY/$IMAGE_NAME:latest"

echo "--- 6. Wysyłanie obrazów (Push) do: $REGISTRY ---"
docker push "$FULL_IMAGE_NAME"
docker push "$REGISTRY/$IMAGE_NAME:latest"

echo "--- PROCES ZAKOŃCZONY ---"
echo "Lokalny kontener: $CONTAINER_NAME (Up)"
echo "Obrazy w registry: $FULL_IMAGE_NAME oraz :latest"
