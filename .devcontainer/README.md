# NNM Portal in GitHub Codespaces

A private, throwaway copy of the portal running the code currently on GitHub.
It has an empty database (full schema, no real holdings or payments) and is
separate from mmc.bihar.gov.in.

## Open it
1. On github.com/mungernn/Portal: **Code → Codespaces → Create codespace on main**.
2. First creation takes about 5 minutes (installs packages, builds the database).
3. The portal opens in a new tab on its own. If not: **Ports** tab → port **3000** → globe icon.

Test logins are printed in the terminal and saved in `.devcontainer/LOGINS.txt`.

## Everyday use
- Get the latest code: `git pull`, then `bash .devcontainer/start.sh`
  (it applies any new migrations; running apps reload by themselves).
- Logs: `.devcontainer/logs/api.log` and `.devcontainer/logs/web.log`
- Stop it when done (github.com/codespaces → … → Stop) to save free hours.
  It also stops itself after 30 minutes idle. Deleting it erases the test data.

## Not active in this copy
Online payment, face attendance and password-reset email are switched off.

## Sharing the link
Port 3000 is **private**: only your GitHub account can open it. Keep it that
way unless you deliberately want to show someone, and never load real
citizen data (Aadhaar, holdings, payments) into a Codespace.
