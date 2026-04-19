# Maintenance: Documentation

This file tracks the technical setup of the documentation system for future sessions.

## API Documentation (Scalar)
The project uses **Scalar** for interactive API docs.

- **Library:** `@scalar/express-api-reference`
- **Source:** `server/openapi.json`
- **Logic:** Integrated in `server/server.js` as an Express middleware.
- **How to Update:** 
  1. Modify `server/openapi.json` to reflect changes in endpoints or parameters.
  2. The Scalar UI will automatically update on the next server restart.

## Game Documentation
The game rules are stored in `GAME_RULES.md` at the project root.

- **Logic:** Served as a plain file via the `/api/docs/game` route in `server/server.js`.
- **Planned:** Future transition to a styled HTML page within the React application.

## Deployment
- Both `server/openapi.json` and `GAME_RULES.md` are copied into the Docker image via the `Dockerfile`.
- Always ensure paths in `server.js` use `process.cwd()` to remain compatible with both local development and Docker environments.
