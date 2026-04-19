# Release Process

This document describes the standard release workflow for the Wedrowycz-Gemini project.

## 1. Preparation
-   **Version Bump:** Update the version in `package.json` (e.g., `1.7.0` -> `1.8.0`).
-   **Update Version Constants:** Sync `src/constants/version.js` with the new tag and commit hash.
-   **Commit Changes:** Ensure all features, dependency updates, and bug fixes are staged and committed to the current feature branch (e.g., `refactor_ai`).
    ```bash
    git add -A
    git commit -m "chore: release v1.8.0 - description of changes"
    ```

## 2. Merging
-   Switch to the target release branch (typically `develop` or `main`).
-   Merge the feature branch into the release branch.
    ```bash
    git checkout develop
    git merge refactor_ai
    ```

## 3. Tagging
-   Create a new Git tag matching the version in `package.json`.
    ```bash
    git tag v1.8.0
    ```

## 4. Local Build & Registry Push
-   Run the local deployment script. This script:
    1.  Determines the version from the latest Git tag.
    2.  Builds the Docker image locally.
    3.  Runs a local container for verification (on port 7777).
    4.  Tags the image for the private registry (`docker.jaqjacek.duckdns.org`).
    5.  Pushes the image to the registry.
    ```bash
    bash bash/deploy_localy.sh
    ```

## 5. Network Deployment
-   Run the network deployment script to update the production server.
-   This script connects via SSH to the remote host (`192.168.111.25`) and triggers the pull/restart process.
    ```bash
    bash bash/deploy_network.sh
    ```

---
*Last Release Performed: v1.8.0*
