import express from 'express';
import db from '../db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Get all restaurants (with optional search/filter)
router.get('/', optionalAuth, (req, res) => {
  try {
    const { search, cuisine, sort, min_rating, is_grocery } = req.query;
    let query = 'SELECT * FROM restaurants WHERE is_active = 1';
    const params = [];

    if (is_grocery !== undefined) {
      query += ' AND is_grocery = ?';
      params.push(is_grocery === 'true' ? 1 : 0);
    }

    if (search) {
      query = `
        SELECT DISTINCT r.* FROM restaurants r
        LEFT JOIN menu_items m ON r.id = m.restaurant_id
        WHERE r.is_active = 1
        AND (r.name LIKE ? OR r.cuisine_type LIKE ? OR r.description LIKE ? OR m.name LIKE ? OR m.category LIKE ?)
      `;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      
      // If we joined, we need to handle the rest of the filters differently
      if (is_grocery !== undefined) {
        query += ' AND r.is_grocery = ?';
        params.push(is_grocery === 'true' ? 1 : 0);
      }
      if (cuisine) {
        query += ' AND r.cuisine_type LIKE ?';
        params.push(`%${cuisine}%`);
      }
      if (min_rating) {
        query += ' AND r.rating >= ?';
        params.push(parseFloat(min_rating));
      }
      
      if (sort === 'rating') query += ' ORDER BY r.rating DESC';
      else if (sort === 'delivery_time') query += ' ORDER BY r.delivery_time ASC';
      else if (sort === 'price_low') query += ' ORDER BY r.delivery_fee ASC';
      else query += ' ORDER BY r.rating DESC';

      const restaurants = db.prepare(query).all(...params);
      return res.json(restaurants);
    }

    if (cuisine) {
      query += ' AND cuisine_type LIKE ?';
      params.push(`%${cuisine}%`);
    }

    if (min_rating) {
      query += ' AND rating >= ?';
      params.push(parseFloat(min_rating));
    }

    if (sort === 'rating') query += ' ORDER BY rating DESC';
    else if (sort === 'delivery_time') query += ' ORDER BY delivery_time ASC';
    else if (sort === 'price_low') query += ' ORDER BY delivery_fee ASC';
    else query += ' ORDER BY rating DESC';

    const restaurants = db.prepare(query).all(...params);
    res.json(restaurants);
  } catch (err) {
    console.error('Get restaurants error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Get single restaurant with menu
router.get('/:id', (req, res) => {
  try {
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const menuItems = db.prepare('SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = 1 ORDER BY category, is_bestseller DESC').all(req.params.id);
    
    // Group by category
    const categories = {};
    menuItems.forEach(item => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });

    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name FROM reviews r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.restaurant_id = ? ORDER BY r.created_at DESC LIMIT 10
    `).all(req.params.id);

    res.json({ ...restaurant, menu: categories, menuItems, reviews });
  } catch (err) {
    console.error('Get restaurant error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

// Get cuisines list
router.get('/meta/cuisines', (req, res) => {
  try {
    const cuisines = db.prepare('SELECT DISTINCT cuisine_type FROM restaurants WHERE is_active = 1 AND cuisine_type IS NOT NULL').all();
    res.json(cuisines.map(c => c.cuisine_type));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cuisines' });
  }
});

export default router;
