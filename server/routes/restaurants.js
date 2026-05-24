import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';

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

// Get owner restaurant details
router.get('/owner/me', authenticateToken, requireRole('restaurant'), (req, res) => {
  try {
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE owner_id = ?').get(req.user.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant profile not found' });
    
    // Parse registration details if present
    if (restaurant.registration_details) {
      try {
        restaurant.registration_details = JSON.parse(restaurant.registration_details);
      } catch (e) {
        restaurant.registration_details = {};
      }
    }
    res.json(restaurant);
  } catch (err) {
    console.error('Get owner restaurant error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant details' });
  }
});

// Create/Register restaurant details
router.post('/owner/register', authenticateToken, requireRole('restaurant'), (req, res) => {
  try {
    const { name, address, cuisine_type, registration_details } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({ error: 'Restaurant name and address are required' });
    }
    
    const existing = db.prepare('SELECT * FROM restaurants WHERE owner_id = ?').get(req.user.id);
    const regDetailsString = registration_details ? JSON.stringify(registration_details) : null;
    
    if (existing) {
      // Update existing
      db.prepare(`
        UPDATE restaurants 
        SET name = ?, address = ?, cuisine_type = ?, registration_details = ?, updated_at = datetime('now')
        WHERE owner_id = ?
      `).run(name, address, cuisine_type || 'General', regDetailsString, req.user.id);
      
      const updated = db.prepare('SELECT * FROM restaurants WHERE owner_id = ?').get(req.user.id);
      if (updated.registration_details) updated.registration_details = JSON.parse(updated.registration_details);
      return res.json(updated);
    } else {
      // Create new
      const id = uuidv4();
      db.prepare(`
        INSERT INTO restaurants (
          id, owner_id, name, description, address, cuisine_type, 
          rating, total_ratings, is_active, is_grocery, registration_details
        ) VALUES (?, ?, ?, ?, ?, ?, 0.0, 0, 0, 0, ?)
      `).run(
        id, 
        req.user.id, 
        name, 
        registration_details?.businessType || 'New Restaurant Partner', 
        address, 
        cuisine_type || 'General', 
        regDetailsString
      );
      
      const created = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(id);
      if (created.registration_details) created.registration_details = JSON.parse(created.registration_details);
      return res.status(201).json(created);
    }
  } catch (err) {
    console.error('Register owner restaurant error:', err);
    res.status(500).json({ error: 'Failed to register/update restaurant' });
  }
});

export default router;
