#!/bin/bash

# --- KONFIGURACJA ZDALNA ---
REMOTE_USER="root"
REMOTE_HOST="192.168.111.25"
REMOTE_SCRIPT="/root/deploy_latest.sh" # Zakładamy tę lokalizację na serwerze

echo "--- Łączenie z $REMOTE_HOST i wywoływanie deploy_latest.sh ---"

ssh "$REMOTE_USER@$REMOTE_HOST" "bash $REMOTE_SCRIPT"

echo "--- ZDALNY DEPLOY ZAKOŃCZONY ---"
