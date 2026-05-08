import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get menu items for a restaurant
router.get('/restaurant/:restaurantId', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name').all(req.params.restaurantId);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Add menu item (restaurant owner)
router.post('/', authenticateToken, requireRole('restaurant', 'admin'), (req, res) => {
  try {
    const { restaurant_id, name, description, price, image_url, category, is_veg, is_bestseller } = req.body;
    const id = uuidv4();
    
    db.prepare(`
      INSERT INTO menu_items (id, restaurant_id, name, description, price, image_url, category, is_veg, is_bestseller)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, restaurant_id, name, description, price, image_url || null, category || 'Main Course', is_veg ? 1 : 0, is_bestseller ? 1 : 0);

    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    res.status(201).json(item);
  } catch (err) {
    console.error('Add menu item error:', err);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

// Update menu item
router.put('/:id', authenticateToken, requireRole('restaurant', 'admin'), (req, res) => {
  try {
    const { name, description, price, image_url, category, is_veg, is_available, is_bestseller } = req.body;
    
    db.prepare(`
      UPDATE menu_items SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        image_url = COALESCE(?, image_url),
        category = COALESCE(?, category),
        is_veg = COALESCE(?, is_veg),
        is_available = COALESCE(?, is_available),
        is_bestseller = COALESCE(?, is_bestseller)
      WHERE id = ?
    `).run(name, description, price, image_url, category, is_veg !== undefined ? (is_veg ? 1 : 0) : null, is_available !== undefined ? (is_available ? 1 : 0) : null, is_bestseller !== undefined ? (is_bestseller ? 1 : 0) : null, req.params.id);

    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(req.params.id);
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Delete menu item
router.delete('/:id', authenticateToken, requireRole('restaurant', 'admin'), (req, res) => {
  try {
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;
