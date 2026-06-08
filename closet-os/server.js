const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'wardrobe.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── helpers ──────────────────────────────────────────────────────────────────

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    const seed = require('./data/seed.json');
    fs.writeFileSync(DATA_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ── routes ───────────────────────────────────────────────────────────────────

// GET all items (optionally filter by category or season)
app.get('/api/items', (req, res) => {
  const data = readData();
  let items = data.items;
  if (req.query.category) {
    items = items.filter(i => i.category === req.query.category);
  }
  if (req.query.season) {
    items = items.filter(i => i.season === req.query.season || i.season === 'both');
  }
  res.json(items);
});

// GET single item
app.get('/api/items/:id', (req, res) => {
  const data = readData();
  const item = data.items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

// POST add new item
app.post('/api/items', (req, res) => {
  const data = readData();
  const newItem = {
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    ...req.body
  };
  data.items.push(newItem);
  writeData(data);
  res.status(201).json(newItem);
});

// PUT update item
app.put('/api/items/:id', (req, res) => {
  const data = readData();
  const idx = data.items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  data.items[idx] = { ...data.items[idx], ...req.body, id: req.params.id };
  writeData(data);
  res.json(data.items[idx]);
});

// DELETE item
app.delete('/api/items/:id', (req, res) => {
  const data = readData();
  const idx = data.items.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  data.items.splice(idx, 1);
  writeData(data);
  res.json({ success: true });
});

// GET categories list
app.get('/api/categories', (req, res) => {
  const data = readData();
  res.json(data.categories);
});

// GET stats summary
app.get('/api/stats', (req, res) => {
  const data = readData();
  const items = data.items;
  const stats = {
    total: items.length,
    needReplacing: items.filter(i => i.condition === 'replace').length,
    worn: items.filter(i => i.condition === 'worn').length,
    avgRating: items.filter(i => i.rating).length
      ? (items.reduce((s, i) => s + (i.rating || 0), 0) / items.filter(i => i.rating).length).toFixed(1)
      : 0,
    byCategory: data.categories.reduce((acc, cat) => {
      acc[cat.id] = items.filter(i => i.category === cat.id).length;
      return acc;
    }, {})
  };
  res.json(stats);
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n✅ Closet OS running at http://localhost:${PORT}\n`);
});
