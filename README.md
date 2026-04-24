# Kanban

A minimalistic kanban board with swimlanes, drag-and-drop, and localStorage persistence. No accounts, no database, no tracking.

## Features

- Columns and swimlanes (both draggable)
- Draggable, reorderable cards
- Cards have title, subtitle, and notes with clickable hyperlinks
- All data lives in `localStorage` — no server, no cookies
- Export / Import JSON backups (so you don't lose data if the browser clears storage)

## Requirements

- [Node.js](https://nodejs.org) (comes with `npm`)

## Running locally

Pick whichever launcher matches your OS. Each one installs dependencies on first run, then starts the dev server at `http://127.0.0.1:8765`.

| OS       | Command                       |
| -------- | ----------------------------- |
| Linux    | `./launch.sh`                 |
| macOS    | `./launch.sh`                 |
| Windows  | double-click `launch.bat`     |
| Any      | `python3 launch.py`           |

Or manually:

```bash
npm install
npm run dev
```

## Hosting it as a web app

Build the static bundle:

```bash
npm run build
```

This produces a `dist/` folder. Upload it anywhere that serves static files:

- **GitHub Pages** — push `dist/` to a `gh-pages` branch
- **Netlify / Vercel / Cloudflare Pages** — drop the repo in, set build command to `npm run build` and publish directory to `dist`
- **Any web server** (nginx, Apache, S3) — serve the files directly

Because all data lives in each visitor's browser, there's nothing to configure and nothing to pay for.

## Your data

- Everything is saved to `localStorage` under the key `kanban_v1`.
- Clearing browsing history in some browsers also clears localStorage. Use the **Export** button to save a JSON backup, and **Import** to restore it.
- Don't use private/incognito mode if you want data to persist — it gets wiped when the window closes.

## Stack

- Vite + React + TypeScript
- [dnd-kit](https://dndkit.com/) for drag and drop
