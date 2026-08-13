#!/bin/bash
set -e

# ==============================================================================
# Skrypt do budowy i wdrażania kontenera MASAKRA na Starym Majdanie
#
# Sposób użycia:
#   ./bash/deploy.sh                   # Buduje wersję z bieżącym tagiem i uruchamia lokalnie
#   ./bash/deploy.sh latest            # Buduje bieżący tag oraz tag 'latest' i uruchamia lokalnie
#   ./bash/deploy.sh network           # Buduje, taguje (bieżący + latest), wysyła do rejestru
#                                      # i wdraża na serwerze 192.168.111.25
#   ./bash/deploy.sh latest network    # Buduje oba tagi, pushuje do rejestru i wdraża zdalnie
#
# Dodatkowe opcje:
#   --tag <nazwa>       Wymuszenie własnego tagu wersji (domyślnie z package.json)
#   --port <port>       Lokalny port aplikacji (domyślnie 7777)
#   --skip-run          Pomiń uruchamianie lokalnego kontenera po zbudowaniu
#   --help, -h          Wyświetla tę pomoc
# ==============================================================================

# --- KONFIGURACJA DOMYŚLNA ---
REGISTRY="docker.jaqjacek.duckdns.org"
IMAGE_NAME="wedrowycz-masakra"
CONTAINER_NAME="wedrowycz-masakra"
PORT="7777"
REMOTE_USER="root"
REMOTE_HOST="192.168.111.25"
REMOTE_SCRIPT="/root/deploy_latest.sh"

FLAG_LATEST=false
FLAG_NETWORK=false
FLAG_SKIP_RUN=false
VERSION=""

# --- PARSOWANIE ARGUMENTÓW ---
while [[ "$#" -gt 0 ]]; do
    case "$1" in
        latest|--latest)
            FLAG_LATEST=true
            ;;
        network|--network)
            FLAG_NETWORK=true
            ;;
        --skip-run)
            FLAG_SKIP_RUN=true
            ;;
        --tag)
            VERSION="$2"
            shift
            ;;
        --port)
            PORT="$2"
            shift
            ;;
        -h|--help)
            echo "Użycie: $0 [latest] [network] [--tag <wersja>] [--port <port>] [--skip-run]"
            exit 0
            ;;
        *)
            echo "Nieznana opcja: $1"
            echo "Użyj: $0 --help"
            exit 1
            ;;
    esac
    shift
done

# W trybie network automatycznie tagujemy również jako latest
if [ "$FLAG_NETWORK" = true ]; then
    FLAG_LATEST=true
fi

# --- WYKRYWANIE SILNIKA KONTENERÓW ---
if command -v docker >/dev/null 2>&1; then
    DOCKER_CMD="docker"
elif command -v podman >/dev/null 2>&1; then
    DOCKER_CMD="podman"
else
    echo "❌ Błąd: Nie znaleziono ani 'docker', ani 'podman' w systemie."
    exit 1
fi

# --- OKREŚLENIE WERSJI (TAG) ---
if [ -z "$VERSION" ]; then
    if [ -f "./package.json" ]; then
        VERSION="v$(node -p "require('./package.json').version" 2>/dev/null)"
    fi
    if [ -z "$VERSION" ] || [ "$VERSION" = "v" ]; then
        VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "v1.0.0")
    fi
fi

FULL_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:$VERSION"
LATEST_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:latest"

echo "================================================================="
echo " 🚀 MASAKRA DEPLOY: $IMAGE_NAME | Wersja: $VERSION"
echo " Silnik: $DOCKER_CMD | Port: $PORT | Latest: $FLAG_LATEST | Network: $FLAG_NETWORK"
echo "================================================================="

# --- 1. ZARZĄDZANIE LOKALNYM KONTENEREM ---
if [ "$FLAG_SKIP_RUN" = false ]; then
    echo "--- [1/5] Zatrzymywanie starego lokalnego kontenera (jeśli istnieje) ---"
    if [ "$($DOCKER_CMD ps -aq -f name=$CONTAINER_NAME)" ]; then
        echo "Zatrzymywanie i usuwanie: $CONTAINER_NAME..."
        $DOCKER_CMD stop $CONTAINER_NAME 2>/dev/null || true
        $DOCKER_CMD rm $CONTAINER_NAME 2>/dev/null || true
    fi
fi

# --- 2. CZYSZCZENIE LOKALNYCH DANYCH GIER ---
echo "--- [2/5] Czyszczenie tymczasowych gier w server/games ---"
rm -rf server/games/*

# --- 3. BUDOWANIE OBRAZU ---
echo "--- [3/5] Budowanie obrazu: $IMAGE_NAME:$VERSION ---"
$DOCKER_CMD build -t "$IMAGE_NAME:$VERSION" --no-cache .

# Tagowanie lokalne 'latest' jeśli wybrano
if [ "$FLAG_LATEST" = true ]; then
    echo "Tagowanie lokalne jako $IMAGE_NAME:latest..."
    $DOCKER_CMD tag "$IMAGE_NAME:$VERSION" "$IMAGE_NAME:latest"
fi

# --- 4. URUCHOMIENIE LOKALNE ---
if [ "$FLAG_SKIP_RUN" = false ]; then
    echo "--- [4/5] Uruchamianie kontenera lokalnie na porcie $PORT ---"
    $DOCKER_CMD run -d -p $PORT:3001 --name $CONTAINER_NAME "$IMAGE_NAME:$VERSION"
    echo "✅ Aplikacja dostępna lokalnie pod adresem: http://localhost:$PORT (oraz http://127.0.0.1:$PORT)"
else
    echo "--- [4/5] Pominięto uruchamianie lokalnego kontenera (--skip-run) ---"
fi

# --- 5. WDROŻENIE SIECIOWE (NETWORK) ---
if [ "$FLAG_NETWORK" = true ]; then
    echo "--- [5/5] Wdrażanie sieciowe do rejestru $REGISTRY ($REMOTE_HOST) ---"
    
    # Tagowanie pod rejestr zdalny
    echo "Tagowanie obrazów dla rejestru..."
    $DOCKER_CMD tag "$IMAGE_NAME:$VERSION" "$FULL_IMAGE_NAME"
    $DOCKER_CMD tag "$IMAGE_NAME:$VERSION" "$LATEST_IMAGE_NAME"

    echo "Wysyłanie obrazu $FULL_IMAGE_NAME..."
    $DOCKER_CMD push "$FULL_IMAGE_NAME"

    echo "Wysyłanie obrazu $LATEST_IMAGE_NAME..."
    $DOCKER_CMD push "$LATEST_IMAGE_NAME"

    echo "Kopiowanie zaktualizowanego deploy_latest.sh na serwer $REMOTE_HOST..."
    scp bash/deploy_latest.sh "$REMOTE_USER@$REMOTE_HOST:$REMOTE_SCRIPT" >/dev/null 2>&1 || true

    echo "Łączenie z serwerem $REMOTE_HOST przez SSH w celu wdrożenia..."
    ssh "$REMOTE_USER@$REMOTE_HOST" "
        echo '--- Zarządzanie kontenerem $CONTAINER_NAME na $REMOTE_HOST ---'
        if [ \"\$(docker ps -aq -f name=$CONTAINER_NAME)\" ]; then
            echo 'Zatrzymywanie i usuwanie starego kontenera $CONTAINER_NAME...'
            docker stop $CONTAINER_NAME 2>/dev/null || true
            docker rm $CONTAINER_NAME 2>/dev/null || true
        fi
        echo '--- Pobieranie najnowszego obrazu localhost:5000/$IMAGE_NAME:latest ---'
        docker pull localhost:5000/$IMAGE_NAME:latest
        echo '--- Uruchamianie kontenera $CONTAINER_NAME na porcie $PORT ---'
        docker run -d -p $PORT:3001 --name $CONTAINER_NAME --restart unless-stopped localhost:5000/$IMAGE_NAME:latest
        docker ps -f name=$CONTAINER_NAME
    "
    echo "✅ Zdalny deploy na $REMOTE_HOST zakończony pomyślnie!"
else
    echo "--- [5/5] Wdrożenie sieciowe pominięte (brak parametru 'network') ---"
fi

echo "================================================================="
echo " 🎉 ZAKOŃCZONO POMYŚLNIE"
echo "================================================================="
