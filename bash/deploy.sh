#!/bin/bash

# --- KONFIGURACJA GOOGLE CLOUD ---
PROJECT_ID="TWOJ-PROJECT-ID"
REGION="europe-central2"
REPO_NAME="wedrowycz-repo"
IMAGE_NAME="wedrowycz-app"
VERSION="v1.6.0"
PORT="3001"

IMAGE_URL="$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$IMAGE_NAME:$VERSION"

echo "--- 1. Ustawianie projektu Google Cloud: $PROJECT_ID ---"
gcloud config set project $PROJECT_ID

echo "--- 2. Włączanie API (Artifact Registry & Cloud Run) ---"
gcloud services enable artifactregistry.googleapis.com run.googleapis.com

echo "--- 3. Tworzenie repozytorium (jeśli nie istnieje) ---"
gcloud artifacts repositories create $REPO_NAME --repository-format=docker --location=$REGION --quiet || true

echo "--- 4. Autoryzacja Dockera dla Google Cloud ---"
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

echo "--- 5. Budowanie obrazu Docker: wedrowycz ---"
docker build -t wedrowycz .

echo "--- 6. Tagowanie i wysyłanie obrazu (Push) ---"
docker tag wedrowycz $IMAGE_URL
docker push $IMAGE_URL

echo "--- 7. Wdrażanie na Google Cloud Run ---"
gcloud run deploy wedrowycz_app \
    --image $IMAGE_URL \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --port $PORT

echo "--- DEPLOY ZAKOŃCZONY ---"
