# Closet OS

A personal wardrobe tracker built with Node.js + Express.
Your data lives in `data/wardrobe.json` — no database required.

---

## Quick Start

### 1. Install dependencies
```bash
cd closet-os
npm install
```

### 2. Start the server
```bash
npm start
```

Or with auto-reload on file changes (recommended while editing):
```bash
npm run dev
```

### 3. Open the app
Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
closet-os/
├── server.js              # Express server & REST API
├── package.json
├── data/
│   ├── seed.json          # Initial wardrobe data (read-only template)
│   └── wardrobe.json      # Your live data (auto-created on first run)
└── public/
    ├── index.html         # App shell
    ├── css/
    │   └── styles.css
    └── js/
        ├── api.js         # All fetch() calls to the backend
        ├── ui.js          # Rendering helpers (cards, modals, panels)
        └── app.js         # Main controller (state + events)
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | All items (optional `?season=summer\|winter\|both`) |
| GET | `/api/items/:id` | Single item |
| POST | `/api/items` | Create item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
| GET | `/api/categories` | Category list |
| GET | `/api/stats` | Summary stats |

---

## Item Schema

```json
{
  "id": "uuid",
  "name": "Commission Short",
  "brand": "Lululemon",
  "category": "chino-shorts",
  "season": "summer",
  "fit": "32W",
  "color": "#8b6914",
  "colorName": "Brown",
  "material": "Waterproof",
  "condition": "good | worn | replace | new",
  "rating": 10,
  "notes": "Best shorts — buy replacement same style"
}
```

---

## Resetting Your Data

To start fresh from the original seed data, delete `data/wardrobe.json`.
It will be recreated from `data/seed.json` on next server start.

---

## Recommended VS Code Extensions

- **Live Server** — not needed here (app has its own server), but useful for static files
- **Nodemon** — already included as a dev dependency via `npm run dev`
- **REST Client** — test API endpoints directly from VS Code
- **Prettier** — code formatting
