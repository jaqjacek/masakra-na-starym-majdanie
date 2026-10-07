---
name: deploy
description: >
  Release this project: bump version (footer + config), merge onto develop,
  commit, tag, push, then build the container locally and deploy it on the
  network. Use when the user runs /deploy, says "deploy", "wydaj wersję",
  "zrób release", or "wypchnij obraz".
argument-hint: "[version | patch | minor | major]"
---

# Deploy MASAKRA

Talk to the user in the language they are using. Commits, tags, and file
content stay in English.

Work from the repo root. Stop on the first failure. Never force-push, never
delete a tag, never skip the version files.

## Arguments

Parse the argument string (trim whitespace):

| Input | Version |
|---|---|
| empty | bump **patch** of `package.json` (`1.20.0` → `1.20.1`) |
| `patch` / `minor` / `major` | bump that SemVer field; reset smaller fields to 0 |
| `1.21.0` or `v1.21.0` | use that version (strip a leading `v`) |

Anything else: stop and tell the user the valid forms.

`TAG=v${VERSION}` (always with a `v` prefix). If `git rev-parse -q --verify "refs/tags/${TAG}"` exists, stop.

## Version files

`package.json` `"version"` is the source of truth. After choosing `VERSION`,
write the same number everywhere below.

1. `package.json` — `"version"`
2. `package-lock.json` — only the root `"version"` and `packages[""].version`
3. `src/constants/version.js` — footer. Set:
   - `tag` to `${TAG}`
   - `branch` to `develop`
   - `date` / `time` to local now (`YYYY-MM-DD`, `HH:MM`)
   - `hash` to `pending` for the first write; replace after the release commit
4. `docs/openapi.json` — `info.version`
5. `docs/GAME_RULES.md` — version in the first heading
6. `docs/PROJECT_SPEC.md` — `Current: vX.Y.Z`
7. `README.md` — version badge `vX.Y.Z`
8. `src/locales/pl.json`, `en.json`, `cs.json`, `uk.json`, `tlh.json` — `rules_edition` (keep the rest of each string; only replace the `vX.Y.Z` token)

Supported languages are exactly these five. Footer is five flag buttons (`src/components/Footer.jsx`). Do not restore a world-language search picker. Do not run `scripts/` locale generators and do not re-add the 110-locale dictionaries as part of a release.

Do not bump example tags in `GROK.md` or `README.md` CLI samples. Keep `COPILOT.md` / `docs/PLAYER_AI.md` version lines in sync with the release (vX.Y.Z only).

## Git

1. `git status` / `git branch --show-current`. Refuse to run inside a detached HEAD.
2. If the current branch is not `develop`:
   - commit remaining work on the current branch if the tree is dirty (see commit message below)
   - `git checkout develop`
   - `git merge --no-ff <previous-branch>`
   - if the merge conflicts, stop and leave the conflict for the user
3. If already on `develop` and dirty, keep the working tree; the version bump commit will include those files.
4. Apply the version-file edits.
5. Stage only project files (respect `.gitignore`). Do not add `node_modules/`, `server/games/`, or secrets.
6. Commit:

   ```
   chore(release): bump version to vX.Y.Z
   ```

7. Set `hash` in `src/constants/version.js` to `git rev-parse --short HEAD`. Amend the release commit **only if it has not been pushed**. Otherwise make a second commit `chore(release): set version hash for vX.Y.Z`.
8. `git tag "${TAG}"`
9. `git push -u origin develop` and `git push origin "${TAG}"`

If there is nothing to commit besides the version bump, still commit the bump.

## Images

From the repo root, after the tag is on the remote:

```bash
chmod +x bash/deploy.sh bash/deploy_localy.sh bash/deploy_network.sh
./bash/deploy_localy.sh
./bash/deploy_network.sh
```

`deploy_localy.sh` builds and runs locally (port 7777). `deploy_network.sh` builds, tags `:latest`, pushes to `docker.jaqjacek.duckdns.org`, and restarts the container on `192.168.111.25`.

`deploy.sh` deletes `server/games/*` — that is expected. Do not restore those files.

If the local build fails, do not run network. If network fails, report local success separately.

## Report

Print:

- version (`1.x.y`) and tag (`v1.x.y`)
- branch and short hash
- commit and whether the tag was pushed
- local URL `http://localhost:7777`
- network result (ok / failed + error)
