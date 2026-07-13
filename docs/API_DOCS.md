# MASAKRA na Starym Majdanie REST API Documentation

This document describes the available API endpoints for the MASAKRA na Starym Majdanie game engine.

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
- **POST `/sets/generate/transient`**
  - Generates a new randomized set transiently and returns the resulting JSON structure without saving it to disk. Naming matches parameters.

### 3. Simulation & Analytics
- **POST `/simulate/`**
  - Runs a fast simulation of a single game and returns band performance analytics.
- **POST `/simulate/batch`**
  - Runs multiple simulations in a single request and returns an array of performance analytics.
  - Query Param: `?count=100` (optional, default 100), `?set=set_name` (optional)
- **POST `/simulate/detailed`**
  - Runs a detailed single game simulation and returns a comprehensive history of turns and scores.
  - **Body Support:** Accepts `setsData` in the request body to simulate custom configurations.

### 4. System
- **GET `/ping`**
  - Health check. Returns `pong`.
- **DELETE `/games`**
  - **DANGER:** Deletes all active game sessions from the server.
