const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON bodies
app.use(express.json());

// Serve static frontend files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store with continuous sequential Serial Numbers (1, 2, ...)
let items = [
  { id: 1, name: 'Book', price: 250 },
  { id: 2, name: 'Pen', price: 25 }
];

// Helper: Ensure all items in memory have consecutive sequential IDs (1, 2, 3...)
function reindexItems() {
  items.forEach((item, index) => {
    item.id = index + 1;
  });
}

// 1. GET /items - Retrieve all items
app.get('/items', (req, res) => {
  reindexItems();
  res.status(200).json(items);
});

// 2. POST /items - Create a new item (assigned next consecutive Serial No.)
app.post('/items', (req, res) => {
  const { name, price } = req.body;

  if (!name || price === undefined || price === null || isNaN(price)) {
    return res.status(400).json({ error: 'Valid name and price are required.' });
  }

  reindexItems();

  const newItem = {
    id: items.length + 1,
    name: name.trim(),
    price: Number(price)
  };

  items.push(newItem);
  res.status(201).json(newItem);
});

// 3. PUT /items/:id - Update an existing item
app.put('/items/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, price } = req.body;

  const itemIndex = items.findIndex(item => item.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  if (!name || price === undefined || price === null || isNaN(price)) {
    return res.status(400).json({ error: 'Valid name and price are required.' });
  }

  items[itemIndex].name = name.trim();
  items[itemIndex].price = Number(price);

  res.status(200).json(items[itemIndex]);
});

// 4. DELETE /items/:id - Remove an item and automatically re-sequence Serial Numbers
app.delete('/items/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const itemIndex = items.findIndex(item => item.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  const deletedItem = items.splice(itemIndex, 1)[0];

  // Re-sequence so remaining items remain strictly in 1, 2, 3... order without gaps
  reindexItems();

  res.status(200).json({
    message: 'Item deleted successfully and serial numbers re-ordered.',
    item: deletedItem,
    items: items
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
