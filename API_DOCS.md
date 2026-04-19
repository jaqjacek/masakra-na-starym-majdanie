# Wedrowycz-Gemini REST API Documentation

This document describes the available API endpoints for the Wedrowycz-Gemini game engine.

## General Information
- **Base URL:** `http://<host>:<port>/api`
- **Content-Type:** `application/json`

## Endpoints

### 1. Game State
- **GET `/map/:gameId`**
  - Returns the current full state of a specific game.
- **POST `/map/:gameId`**
  - Updates the state of a game. Used for manual overrides and sync.
- **POST `/init/:gameId`**
  - Initializes a new game session with a randomized or specific set.
  - Query Param: `?set=set_name` (optional)

### 2. Configuration & Sets
- **GET `/config`**
  - Returns global server configuration.
- **GET `/sets`**
  - Returns a list of all available pawn sets.
- **GET `/sets/details/:setName`**
  - Returns the JSON structure of a specific set.
- **POST `/sets/generate`**
  - Generates a new randomized set based on parameters in the request body.

### 3. Simulation & Analytics
- **POST `/simulate/:gameId`**
  - Runs a fast 10-round simulation and returns race performance analytics.
- **POST `/simulate-detailed`**
  - Runs a full 100-game simulation and returns a comprehensive history of turns and scores.
  - **Body Support:** Accepts `setsData` in the request body to simulate custom configurations.

### 4. System
- **GET `/ping`**
  - Health check. Returns `pong`.
- **DELETE `/games`**
  - **DANGER:** Deletes all active game sessions from the server.
