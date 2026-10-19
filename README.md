# 🐺 MASAKRA na Starym Majdanie

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-lightgrey.svg)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-black.svg)](https://socket.io/)
[![Docker](https://img.shields.io/badge/Docker%20%2F%20Podman-Ready-blue.svg)](https://www.docker.com/)
[![Version](https://img.shields.io/badge/version-v1.23.0-orange.svg)](package.json)

**MASAKRA na Starym Majdanie** is a tactical digital board game simulator set in the grim, humorous universe of Jakub Wędrowycz. Players manage pawn bands across a 6x6 grid, competing for points while trying to avoid the wrath of Jakub Wędrowycz—or actively turning his rampage toward their opponents.

The platform provides a real-time multi-client game engine, phase-based automation, high-performance multi-core simulation tools, and interactive admin dashboards.

**Status (v1.23.0):** Live game, Jakub AI, live player AI, spectator replay, events, i18n (5 languages), and Monte Carlo sims are in production. **Next work is refining player/Herszt AI.** If you are continuing in Copilot, start at [`COPILOT.md`](COPILOT.md) and [`docs/PLAYER_AI.md`](docs/PLAYER_AI.md).

---

## 📑 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture & Mechanics](#-architecture--mechanics)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Local Run](#installation--local-run)
  - [Running Tests & Simulations](#running-tests--simulations)
- [Docker & Container How-To](#-docker--container-how-to)
  - [Unified Deployment Script (`bash/deploy.sh`)](#unified-deployment-script-bashdeploysh)
  - [Usage Modes](#usage-modes)
  - [Manual Docker / Podman Execution](#manual-docker--podman-execution)
- [API & Documentation](#-api--documentation)
- [Configuration](#-configuration)
- [Current status & Copilot handoff](#-current-status--copilot-handoff)

---

## 🌟 Features

- **Real-Time Multi-Game Engine:** Unique session isolation per URL (`/game/{id}`) with instant bi-directional state sync via Socket.io.
- **Dynamic Phase Loop:**
  - **Setup Phase:** Board initialization, pawn pool calculation, and hand distribution.
  - **General Phase:** Reverse-point order selection of Band Generals (Catch-up mechanic).
  - **Player Phase:** Strategic pawn placement from hand, bulk Set deployment, and passing logic.
  - **Jakub Phase:** Automated Jakub AI hunting sequence with depleting movement range and fury escalation.
  - **Event Phase:** Random event card drawn from deck affecting board status, pawns, and Jakub.
  - **Final Scoring:** Automated 12th-round scoring (Vampires, Werewolves, Ghosts, Bardaks).
- **Special AI & Mechanics:**
  - **Player AI:** Unclaimed seats played on the server (`playerAiService` + greedy placement). Humans claim via `manualPlayers`.
  - **Jakub AI:** Automated hunt in `jakubStrategy.js`.
  - **Cascading Fury Tie-Breaker:** Hierarchical region target resolution.
  - **Niepochamowany Zwierzęcy Magnetyzm:** Shockwave pulse pulling pawns when region ties persist.
  - **Świadek Jakuba & Miłosierdzie:** Dynamic witness points and mercy mechanics.
- **Parallel Monte Carlo Simulation Engine:** Multi-threaded simulation using Node.js `worker_threads` across all CPU cores with real-time throughput metrics and 13+ interactive Recharts dashboards.
- **Admin Management Suite:**
  - Sets Tuner & Custom Pawn Generation (`/admin/sets`)
  - Event Cards Deck Manager & Card Editor (`/admin/events`)
  - Multi-threaded Simulation Suite (`/admin`)
- **Integrated Interactive Documentation:** Scalar OpenAPI reference (`/api/docs/api`) and dynamic rulebook (`/docs/game`).

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Recharts, Vanilla CSS |
| **Backend** | Node.js (v20+), Express 5, Socket.io |
| **Simulations** | Node.js Worker Threads (`worker_threads`) |
| **API Docs** | Scalar (`@scalar/express-api-reference`), OpenAPI 3.0 |
| **Storage** | Multi-file JSON session persistence (`server/games/{id}/`) |
| **Containers** | Docker / Podman (Multi-stage Alpine image) |

---

## 🎲 Architecture & Mechanics

### Band Types & Base Abilities

| Band | Speed | Base Mechanics |
| :--- | :---: | :--- |
| 🧛 **Vampires (V)** | `999` | Teleport anywhere on the board. Score points based on proximity to Jakub. |
| 🐺 **Werewolves (W)** | `2` | Pack hunting. Score bonuses when adjacent to other Werewolves and Jakub. |
| 👻 **Ghosts (G)** | `1` | Ethereal loners. Score points when near map borders and away from Jakub. |
| 🪓 **Bardaks (B)** | `1` | High raw power pieces and defensive meat-shields. |
| ⚡ **Jakub (Unique)** | `1` | Rampaging unique entity; consumes sets, tracks band anger, and slays pawns. |

---

## 📁 Project Structure

```text
masakra-na-starym-majdanie/
├── COPILOT.md                  # Copilot / next-dev handoff (player AI)
├── AGENTS.md                   # Coding-agent entry
├── GROK.md                     # Assistant file map and constraints
├── bash/                       # Automation & container deployment scripts
│   ├── deploy.sh               # Unified build & deployment script
│   ├── deploy_latest.sh        # Remote server runner script
│   ├── deploy_localy.sh        # Wrapper for deploy.sh
│   └── deploy_network.sh       # Wrapper for deploy.sh network
├── docs/                       # Project specifications, rules, and API docs
│   ├── PROJECT_SPEC.md         # Authoritative technical specification
│   ├── PLAYER_AI.md            # Player/Herszt AI — current brain and next work
│   ├── GAME_RULES.md           # Game rules & scoring guide
│   ├── STORY.md                # Story & thematic lore
│   └── openapi.json            # OpenAPI 3.0 specification
├── server/                     # Backend Express server & game engine
│   ├── configs/                # Default game, sets, and events JSON configs
│   ├── events/                 # Event deck & phase execution managers
│   ├── routes/                 # Express REST API routes
│   ├── scoring/                # Band scoring engines
│   ├── services/               # playerAiService, simulation workers, placement
│   ├── boardManager.js         # Map & region coordinate BFS logic
│   ├── gameLogic.js            # Phase transition & snapshot engine
│   └── server.js               # Main Express & Socket.io server entry point
├── shared/                     # Shared logic between frontend, backend & workers
├── src/                        # React 19 Frontend application
│   ├── assets/                 # CSS design system, images & sprites
│   ├── components/             # Board, regions, admin panels, and modals
│   ├── hooks/                  # useGameState, useAutoplay, useGameInteraction
│   └── strategies/             # Jakub AI step & rampage strategies
├── tests/                      # Automated unit tests & simulation scripts
├── Dockerfile                  # Multi-stage production container build
├── server_config.json          # Server connectivity endpoint configuration
└── package.json                # Project dependencies and npm scripts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher
- **Container Engine (optional for docker builds)**: `Docker` or `Podman`

### Installation & Local Run

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repository-url>
   cd masakra-na-starym-majdanie
   npm install --legacy-peer-deps
   ```

2. **Start Backend Server:**
   ```bash
   npm run server
   ```
   *The backend starts at `http://localhost:3001`.*

3. **Start Frontend Dev Server:**
   ```bash
   npm run dev
   ```
   *Vite development server starts at `http://localhost:5173`.*

### Running Tests & Simulations

- **Unit Tests:**
  ```bash
  npm test
  ```
- **CLI Parallel Simulation:**
  ```bash
  npm run simulate:parallel
  ```

---

## 🐳 Docker & Container How-To

The project includes a multi-stage Alpine-based [Dockerfile](Dockerfile) and automated deployment scripts in the [bash/](bash/) folder. The setup natively supports both **Docker** and **Podman**.

### Unified Deployment Script (`bash/deploy.sh`)

The script [bash/deploy.sh](bash/deploy.sh) is the single entry point for all container actions.

```bash
chmod +x bash/deploy.sh
```

#### 1. Local Build & Run (Default)
Builds the container image tagged with the version from `package.json` (e.g. `wedrowycz-masakra:v1.18.0`), resets `server/games/*`, and runs the container locally:
```bash
./bash/deploy.sh
```
*Access the app at: **`http://localhost:7777`** (or `http://127.0.0.1:7777`).*

#### 2. Local Build with `latest` Tag
Builds the current version tag and also creates the `latest` image locally:
```bash
./bash/deploy.sh latest
```

#### 3. Network Deployment (`network`)
Builds both versioned and `latest` images, pushes them to the remote Docker registry at `docker.jaqjacek.duckdns.org` (`192.168.111.25:5000`), syncs the runner script, and restarts the container remotely via SSH:
```bash
./bash/deploy.sh network
```

#### Optional CLI Flags
```bash
# Build with a custom version tag
./bash/deploy.sh --tag v1.20.0

# Run on a custom local port (e.g. 8080)
./bash/deploy.sh --port 8080

# Build image without starting local container
./bash/deploy.sh --skip-run

# Display help
./bash/deploy.sh --help
```

---

### Manual Docker / Podman Execution

If you prefer building and running containers manually:

1. **Build Image:**
   ```bash
   docker build -t wedrowycz-masakra:v1.18.0 .
   # or with Podman:
   podman build -t wedrowycz-masakra:v1.18.0 .
   ```

2. **Run Container:**
   ```bash
   docker run -d -p 7777:3001 --name wedrowycz-masakra --restart unless-stopped wedrowycz-masakra:v1.18.0
   # or with Podman:
   podman run -d -p 7777:3001 --name wedrowycz-masakra wedrowycz-masakra:v1.18.0
   ```

3. **Check Container Logs:**
   ```bash
   docker logs -f wedrowycz-masakra
   # or with Podman:
   podman logs -f wedrowycz-masakra
   ```

---

## 📖 API & Documentation

When running locally or via container, documentation is served directly:

- **Interactive API Documentation (Scalar):** `http://localhost:7777/api/docs/api` (or `http://localhost:3001/api/docs/api`)
- **Game Rules & Mechanics:** `http://localhost:7777/docs/game` (or `http://localhost:7777/api/docs/game`)
- **OpenAPI Specification File:** `docs/openapi.json`

---

## ⚙️ Configuration

- **`server_config.json`**: Specifies the server URL endpoint for frontend-backend communication.
- **`server/configs/game_config.json`**: Dynamic game title, general settings, and theme customization.
- **`server/configs/set_default.json`**: Default pawn distribution and set powers.
- **`server/configs/events_all.json`**: Full event card deck definitions and triggers.

---

## 🧭 Current status & Copilot handoff

| Item | Value |
| :--- | :--- |
| Release | **v1.23.0** on `develop` |
| Next feature | Player AI (`server/services/playerAiService.js`) |
| Transfer docs | [`COPILOT.md`](COPILOT.md), [`AGENTS.md`](AGENTS.md), [`docs/PLAYER_AI.md`](docs/PLAYER_AI.md) |
| Rules | [`docs/GAME_RULES.md`](docs/GAME_RULES.md) |
| Architecture | [`docs/PROJECT_SPEC.md`](docs/PROJECT_SPEC.md) |

Shipped hand/pass and AI baseline:

- Start of game: **5** sets per player.
- Round 1 DRAW SETS: no extra player sets (Jakub still draws 2).
- From round 2: each player is dealt **+3** sets (append, not top-up).
- Pass: keep at most **3** (random); excess to Jakub with **0 points**. Voluntary kablowanie still **+1**.
- Player AI: greedy one-ply place / kablowanie / pass. Pass discard is random. Improve heuristics next; do not rewrite Jakub AI unless asked.
