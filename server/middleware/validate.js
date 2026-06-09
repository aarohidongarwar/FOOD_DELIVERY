// server/middleware/validate.js

export const validateRegistration = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Valid name is required' });
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Valid email is required' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }
  next();
};

export const validateOrderPlacement = (req, res, next) => {
  const { restaurant_id, items, delivery_lat, delivery_lon } = req.body;
  if (!restaurant_id) {
    return res.status(400).json({ error: 'restaurant_id is required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required and cannot be empty' });
  }
  if (delivery_lat !== undefined && isNaN(parseFloat(delivery_lat))) {
    return res.status(400).json({ error: 'delivery_lat must be a valid number' });
  }
  if (delivery_lon !== undefined && isNaN(parseFloat(delivery_lon))) {
    return res.status(400).json({ error: 'delivery_lon must be a valid number' });
  }
  next();
};

export const validateMenuItem = (req, res, next) => {
  const { name, price } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Valid name is required' });
  }
  if (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
    return res.status(400).json({ error: 'Price must be a positive number' });
  }
  next();
};

export const validateLocationUpdate = (req, res, next) => {
  const { lat, lon } = req.body;
  if (lat === undefined || isNaN(parseFloat(lat))) {
    return res.status(400).json({ error: 'lat must be a valid number' });
  }
  if (lon === undefined || isNaN(parseFloat(lon))) {
    return res.status(400).json({ error: 'lon must be a valid number' });
  }
  next();
};
