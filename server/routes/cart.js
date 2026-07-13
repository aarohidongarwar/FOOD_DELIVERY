import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get cart items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [items] = await db.execute(`
      SELECT c.*, m.name, m.price, m.image_url, m.is_veg, r.name as restaurant_name 
      FROM cart_items c
      JOIN menu_items m ON c.menu_item_id = m.id
      JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.user_id = ?
    `, [req.user.id]);
    res.json(items);
  } catch (err) {
    console.error('Fetch cart error:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add to cart
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { restaurant_id, menu_item_id, quantity = 1, cart_type = 'food' } = req.body;
    
    // Check if cart has items from a different restaurant
    const [existing] = await db.execute('SELECT restaurant_id FROM cart_items WHERE user_id = ? AND cart_type = ? LIMIT 1', [req.user.id, cart_type]);
    if (existing.length > 0 && existing[0].restaurant_id !== restaurant_id) {
      return res.status(400).json({ error: `Cart contains items from another store. Clear cart first.`, code: 'DIFFERENT_RESTAURANT' });
    }

    const [existingItem] = await db.execute('SELECT * FROM cart_items WHERE user_id = ? AND menu_item_id = ?', [req.user.id, menu_item_id]);
    
    if (existingItem.length > 0) {
      await db.execute('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, existingItem[0].id]);
    } else {
      await db.execute(
        'INSERT INTO cart_items (id, user_id, restaurant_id, menu_item_id, quantity, cart_type) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), req.user.id, restaurant_id, menu_item_id, quantity, cart_type]
      );
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// Update quantity
router.put('/:menuItemId', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    if (quantity <= 0) {
      await db.execute('DELETE FROM cart_items WHERE user_id = ? AND menu_item_id = ?', [req.user.id, req.params.menuItemId]);
    } else {
      await db.execute('UPDATE cart_items SET quantity = ? WHERE user_id = ? AND menu_item_id = ?', [quantity, req.user.id, req.params.menuItemId]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove item
router.delete('/:menuItemId', authenticateToken, async (req, res) => {
  try {
    await db.execute('DELETE FROM cart_items WHERE user_id = ? AND menu_item_id = ?', [req.user.id, req.params.menuItemId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// Clear cart
router.delete('/', authenticateToken, async (req, res) => {
  try {
    const cart_type = req.query.cart_type;
    if (cart_type) {
      await db.execute('DELETE FROM cart_items WHERE user_id = ? AND cart_type = ?', [req.user.id, cart_type]);
    } else {
      await db.execute('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
