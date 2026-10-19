# Maintenance: Documentation

This file tracks the documentation system. Current release: **v1.20.2**. Next work: player AI (`docs/PLAYER_AI.md`, `COPILOT.md`).

## API Documentation (Scalar)

- **Library:** `@scalar/express-api-reference`
- **Spec file:** `docs/openapi.json` (not `server/openapi.json`)
- **Mount:** `server/server.js` — `/api/docs/api`
- **How to update:** edit `docs/openapi.json` whenever REST routes in `server/routes/` change. Scalar picks it up on server restart.

## Game documentation

- **Markdown rules:** `docs/GAME_RULES.md` served at `/api/docs/game`
- **Styled SPA:** `src/components/docs/GameRulesPage.jsx` at `/docs/game` (PDF via `html2pdf.js`)
- **Lore:** `docs/STORY.md`
- **Player AI:** `docs/PLAYER_AI.md`

UI copy for the rules SPA lives in `src/locales/{pl,en,cs,uk,tlh}.json` (`rules_*` keys). Those locale strings may lag `GAME_RULES.md` (pass/hand WIP).

## Assistant / Copilot handoff

| File | Audience |
| :--- | :--- |
| `COPILOT.md` | Copilot / human transfer |
| `AGENTS.md` | Coding-agent entry |
| `.github/copilot-instructions.md` | Always-on Copilot prompt |
| `GROK.md` | File map + constraints |
| `GEMINI.md` | Short mandates |
| `docs/PROJECT_SPEC.md` | Architecture SSOT |

## Deployment

- `docs/openapi.json` and `docs/GAME_RULES.md` are copied into the Docker image.
- Paths in `server.js` use `process.cwd()`.
- Release workflow: `.grok/skills/deploy/SKILL.md`. Last tagged release: **v1.20.2**.
