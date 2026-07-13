import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { optionalAuth, authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get cuisines list — MUST be before /:id
router.get('/meta/cuisines', async (req, res) => {
  try {
    const [cuisines] = await db.execute('SELECT DISTINCT cuisine_type FROM restaurants WHERE is_active = 1 AND cuisine_type IS NOT NULL');
    res.json(cuisines.map(c => c.cuisine_type));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cuisines' });
  }
});

// Get owner restaurant details — MUST be before /:id
router.get('/owner/me', authenticateToken, requireRole('restaurant', 'grocery'), async (req, res) => {
  try {
    const [restaurants] = await db.execute('SELECT * FROM restaurants WHERE owner_id = ?', [req.user.id]);
    const restaurant = restaurants[0];
    if (!restaurant) return res.json({ is_profile_complete: 0 });
    
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

// Create/Register restaurant details — MUST be before /:id
router.post('/owner/register', authenticateToken, requireRole('restaurant', 'grocery'), async (req, res) => {
  try {
    const { name, address, cuisine_type, registration_details } = req.body;
    
    if (!name || !address) {
      return res.status(400).json({ error: 'Restaurant name and address are required' });
    }
    
    const [existingArr] = await db.execute('SELECT * FROM restaurants WHERE owner_id = ?', [req.user.id]);
    const existing = existingArr[0];
    const regDetailsString = registration_details ? JSON.stringify(registration_details) : null;
    
    if (existing) {
      // Update existing
      await db.execute(
        `UPDATE restaurants SET name = ?, address = ?, cuisine_type = ?, registration_details = ?, is_profile_complete = 1 WHERE owner_id = ?`,
        [name, address, cuisine_type || 'General', regDetailsString, req.user.id]
      );
      
      const [updatedArr] = await db.execute('SELECT * FROM restaurants WHERE owner_id = ?', [req.user.id]);
      const updated = updatedArr[0];
      if (updated.registration_details) updated.registration_details = JSON.parse(updated.registration_details);
      return res.json(updated);
    } else {
      // Create new
      const id = uuidv4();
      const isGrocery = req.user.role === 'grocery' ? 1 : 0;
      await db.execute(
        `INSERT INTO restaurants (id, owner_id, name, description, address, cuisine_type, rating, total_ratings, is_active, is_grocery, registration_details, is_profile_complete)
         VALUES (?, ?, ?, ?, ?, ?, 0.0, 0, 1, ?, ?, 1)`,
        [id, req.user.id, name, registration_details?.businessType || 'New Partner', address, cuisine_type || 'General', isGrocery, regDetailsString]
      );
      
      const [createdArr] = await db.execute('SELECT * FROM restaurants WHERE id = ?', [id]);
      const created = createdArr[0];
      if (created.registration_details) created.registration_details = JSON.parse(created.registration_details);
      return res.status(201).json(created);
    }
  } catch (err) {
    console.error('Register owner restaurant error:', err);
    res.status(500).json({ error: 'Failed to register/update restaurant' });
  }
});

// Update restaurant profile (owner settings)
router.put('/owner/me', authenticateToken, requireRole('restaurant', 'grocery'), async (req, res) => {
  try {
    const { 
      name, description, address, cuisine_type, delivery_time, delivery_fee, min_order,
      opening_time, closing_time, delivery_radius, prep_time,
      owner_name, owner_phone, owner_email
    } = req.body;

    const [restaurants] = await db.execute('SELECT * FROM restaurants WHERE owner_id = ?', [req.user.id]);
    const restaurant = restaurants[0];
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    // Update restaurant details
    await db.execute(
      `UPDATE restaurants SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        address = COALESCE(?, address),
        cuisine_type = COALESCE(?, cuisine_type),
        delivery_time = COALESCE(?, delivery_time),
        delivery_fee = COALESCE(?, delivery_fee),
        min_order = COALESCE(?, min_order)
      WHERE owner_id = ?`,
      [name, description, address, cuisine_type, 
       delivery_time || (prep_time ? `${prep_time}-${parseInt(prep_time)+10} min` : null),
       delivery_fee, min_order, req.user.id]
    );

    // Update owner user details if provided
    if (owner_name || owner_phone || owner_email) {
      await db.execute(
        `UPDATE users SET 
          name = COALESCE(?, name), 
          phone = COALESCE(?, phone), 
          email = COALESCE(?, email)
        WHERE id = ?`,
        [owner_name, owner_phone, owner_email, req.user.id]
      );
    }

    const [updated] = await db.execute('SELECT * FROM restaurants WHERE owner_id = ?', [req.user.id]);
    if (updated[0]?.registration_details) {
      try { updated[0].registration_details = JSON.parse(updated[0].registration_details); } catch(e) {}
    }
    res.json(updated[0]);
  } catch (err) {
    console.error('Update restaurant error:', err);
    res.status(500).json({ error: 'Failed to update restaurant' });
  }
});

// Toggle restaurant open/closed
router.put('/owner/toggle-status', authenticateToken, requireRole('restaurant', 'grocery'), async (req, res) => {
  try {
    const { is_open } = req.body;
    await db.execute('UPDATE restaurants SET is_open = ? WHERE owner_id = ?', [is_open ? 1 : 0, req.user.id]);
    const [updated] = await db.execute('SELECT * FROM restaurants WHERE owner_id = ?', [req.user.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle status' });
  }
});

// Get all restaurants (with optional search/filter)
router.get('/', optionalAuth, async (req, res) => {
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

      const [restaurants] = await db.execute(query, params);
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

    const [restaurants] = await db.execute(query, params);
    res.json(restaurants);
  } catch (err) {
    console.error('Get restaurants error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
});

// Get single restaurant with menu — MUST be after all specific routes
router.get('/:id', async (req, res) => {
  try {
    const [restaurants] = await db.execute('SELECT * FROM restaurants WHERE id = ?', [req.params.id]);
    const restaurant = restaurants[0];
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });

    const [menuItems] = await db.execute('SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = 1 ORDER BY category, is_bestseller DESC', [req.params.id]);
    
    // Group by category
    const categories = {};
    menuItems.forEach(item => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });

    const [reviews] = await db.execute(`
      SELECT r.*, u.name as user_name FROM reviews r 
      JOIN users u ON r.user_id = u.id 
      WHERE r.restaurant_id = ? ORDER BY r.created_at DESC LIMIT 10
    `, [req.params.id]);

    res.json({ ...restaurant, menu: categories, menuItems, reviews });
  } catch (err) {
    console.error('Get restaurant error:', err);
    res.status(500).json({ error: 'Failed to fetch restaurant' });
  }
});

export default router;

