# Release Process

Canonical workflow: [`.grok/skills/deploy/SKILL.md`](../.grok/skills/deploy/SKILL.md) (`/deploy`). Do not invent a second path.

**Last tagged release:** v1.20.2 (`develop` @ `128d5c6`).

**Before the next tag:** commit the hand/pass WIP (5 starting sets, +3 from round 2, pass keep-3 with 0 points) and any player-AI work. Working tree is currently dirty.

## 1. Version files

`package.json` `"version"` is the source of truth. Sync:

1. `package.json` / `package-lock.json` (root version only)
2. `src/constants/version.js` (`tag`, `branch`, `hash`, `date`, `time`)
3. `docs/openapi.json` `info.version`
4. `docs/GAME_RULES.md` first heading
5. `docs/PROJECT_SPEC.md` `Current: vX.Y.Z`
6. `README.md` version badge
7. `src/locales/{pl,en,cs,uk,tlh}.json` — `rules_edition` token only

Five locales only. Do not restore the 110-language experiment.

## 2. Git

On `develop`: commit, tag `vX.Y.Z`, push branch + tag. Never force-push. Never delete a tag.

## 3. Images

```bash
./bash/deploy_localy.sh     # local container http://localhost:7777
./bash/deploy_network.sh    # registry + remote host 192.168.111.25
```

`bash/deploy.sh` is the unified engine. It wipes `server/games/*` — expected.

Unified flags: `--tag`, `--port`, `--skip-run`, `latest`, `network`.
