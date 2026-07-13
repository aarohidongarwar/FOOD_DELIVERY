import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateMenuItem } from '../middleware/validate.js';

const router = express.Router();

const checkDirectRestaurantOwnership = async (restaurantId, userId) => {
  const [restOwner] = await db.execute('SELECT owner_id FROM restaurants WHERE id = ?', [restaurantId]);
  return restOwner[0] && restOwner[0].owner_id === userId;
};

const checkMenuItemOwnership = async (menuItemId, userId) => {
  const [menuItem] = await db.execute('SELECT restaurant_id FROM menu_items WHERE id = ?', [menuItemId]);
  if (!menuItem[0]) return false;
  return checkDirectRestaurantOwnership(menuItem[0].restaurant_id, userId);
};

// Get menu items for a restaurant
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const [items] = await db.execute('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name', [req.params.restaurantId]);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// Add menu item (restaurant owner)
router.post('/', authenticateToken, requireRole('restaurant', 'admin', 'grocery'), validateMenuItem, async (req, res) => {
  try {
    const { restaurant_id, name, description, price, image_url, category, is_veg, is_bestseller } = req.body;
    
    if (req.user.role !== 'admin') {
      const isOwner = await checkDirectRestaurantOwnership(restaurant_id, req.user.id);
      if (!isOwner) return res.status(403).json({ error: 'Access denied' });
    }
    
    const id = uuidv4();
    
    await db.execute(
      `INSERT INTO menu_items (id, restaurant_id, name, description, price, image_url, category, is_veg, is_bestseller)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, restaurant_id, name, description, price, image_url || null, category || 'Main Course', is_veg ? 1 : 0, is_bestseller ? 1 : 0]
    );

    const [items] = await db.execute('SELECT * FROM menu_items WHERE id = ?', [id]);
    res.status(201).json(items[0]);
  } catch (err) {
    console.error('Add menu item error:', err);
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

// Update menu item
router.put('/:id', authenticateToken, requireRole('restaurant', 'admin', 'grocery'), validateMenuItem, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const isOwner = await checkMenuItemOwnership(req.params.id, req.user.id);
      if (!isOwner) return res.status(403).json({ error: 'Access denied' });
    }
    
    const { name, description, price, image_url, category, is_veg, is_available, is_bestseller } = req.body;
    
    await db.execute(
      `UPDATE menu_items SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        image_url = COALESCE(?, image_url),
        category = COALESCE(?, category),
        is_veg = COALESCE(?, is_veg),
        is_available = COALESCE(?, is_available),
        is_bestseller = COALESCE(?, is_bestseller)
      WHERE id = ?`,
      [name, description, price, image_url, category, 
       is_veg !== undefined ? (is_veg ? 1 : 0) : null, 
       is_available !== undefined ? (is_available ? 1 : 0) : null, 
       is_bestseller !== undefined ? (is_bestseller ? 1 : 0) : null, 
       req.params.id]
    );

    const [items] = await db.execute('SELECT * FROM menu_items WHERE id = ?', [req.params.id]);
    res.json(items[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// Delete menu item
router.delete('/:id', authenticateToken, requireRole('restaurant', 'admin', 'grocery'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const isOwner = await checkMenuItemOwnership(req.params.id, req.user.id);
      if (!isOwner) return res.status(403).json({ error: 'Access denied' });
    }
    
    await db.execute('DELETE FROM menu_items WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;
