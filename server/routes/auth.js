import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { validateRegistration } from '../middleware/validate.js';

const router = express.Router();

// Register
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { 
      name, email, password, phone, role = 'customer', address,
      vehicleType, vehicleNumber, licenseNumber, emergencyContact 
    } = req.body;
    const allowedRoles = ['customer', 'driver', 'restaurant', 'grocery'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const id = uuidv4();
    const password_hash = bcrypt.hashSync(password, 10);
    
    await db.execute(
      'INSERT INTO users (id, name, email, password_hash, phone, role, address) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, password_hash, phone || null, role, address || null]
    );

    // If registering as driver, create delivery agent entry with extra details
    if (role === 'driver') {
      await db.execute(
        `INSERT INTO delivery_agents (id, user_id, status, vehicle_type, vehicle_number, license_number, emergency_contact)
         VALUES (?, ?, 'available', ?, ?, ?, ?)`,
        [uuidv4(), id, vehicleType || 'bike', vehicleNumber || null, licenseNumber || null, emergencyContact || null]
      );
    }

    const [users] = await db.execute('SELECT id, name, email, role, phone, avatar_url, address FROM users WHERE id = ?', [id]);
    const user = users[0];

    // Create wallet for new users
    await db.execute('INSERT INTO wallets (id, user_id, balance) VALUES (?, ?, 0.00)', [uuidv4(), id]);
    user.wallet_balance = 0;
    user.subscription = null;

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password_hash, ...userData } = user;

    // Fetch wallet balance
    const [wallets] = await db.execute('SELECT balance FROM wallets WHERE user_id = ?', [userData.id]);
    userData.wallet_balance = wallets[0] ? parseFloat(wallets[0].balance) : 0;

    // Fetch subscription status
    const [subs] = await db.execute('SELECT * FROM user_subscriptions WHERE user_id = ? AND is_active = 1 AND end_date > NOW() LIMIT 1', [userData.id]);
    userData.subscription = subs[0] || null;

    const token = generateToken(userData);
    res.json({ user: userData, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.execute('SELECT id, name, email, role, phone, avatar_url, address, lat, lon FROM users WHERE id = ?', [req.user.id]);
    if (!users[0]) return res.status(404).json({ error: 'User not found' });
    const user = users[0];

    // Fetch wallet balance
    const [wallets] = await db.execute('SELECT balance FROM wallets WHERE user_id = ?', [user.id]);
    user.wallet_balance = wallets[0] ? parseFloat(wallets[0].balance) : 0;

    // Fetch subscription status
    const [subs] = await db.execute('SELECT * FROM user_subscriptions WHERE user_id = ? AND is_active = 1 AND end_date > NOW() LIMIT 1', [user.id]);
    user.subscription = subs[0] || null;

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phone, address, lat, lon } = req.body;
    await db.execute(
      `UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone),
       address = COALESCE(?, address), lat = COALESCE(?, lat), lon = COALESCE(?, lon),
       updated_at = NOW() WHERE id = ?`,
      [
        name !== undefined ? name : null, 
        phone !== undefined ? phone : null, 
        address !== undefined ? address : null, 
        lat !== undefined ? lat : null, 
        lon !== undefined ? lon : null, 
        req.user.id
      ]
    );

    const [users] = await db.execute('SELECT id, name, email, role, phone, avatar_url, address, lat, lon FROM users WHERE id = ?', [req.user.id]);
    const user = users[0];

    // Fetch wallet balance
    const [wallets] = await db.execute('SELECT balance FROM wallets WHERE user_id = ?', [user.id]);
    user.wallet_balance = wallets[0] ? parseFloat(wallets[0].balance) : 0;

    // Fetch subscription status
    const [subs] = await db.execute('SELECT * FROM user_subscriptions WHERE user_id = ? AND is_active = 1 AND end_date > NOW() LIMIT 1', [user.id]);
    user.subscription = subs[0] || null;

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get wallet details (balance + transactions)
router.get('/wallet', authenticateToken, async (req, res) => {
  try {
    const [wallets] = await db.execute('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
    let wallet = wallets[0];
    if (!wallet) {
      const walletId = uuidv4();
      await db.execute('INSERT INTO wallets (id, user_id, balance) VALUES (?, ?, 0.00)', [walletId, req.user.id]);
      const [newWallets] = await db.execute('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
      wallet = newWallets[0];
    }

    const [transactions] = await db.execute(
      'SELECT * FROM wallet_transactions WHERE wallet_id = ? ORDER BY created_at DESC',
      [wallet.id]
    );

    res.json({
      balance: parseFloat(wallet.balance),
      transactions
    });
  } catch (err) {
    console.error('Get wallet error:', err);
    res.status(500).json({ error: 'Failed to fetch wallet details' });
  }
});

// Add funds to wallet
router.post('/wallet/add', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const [wallets] = await db.execute('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
    let wallet = wallets[0];
    if (!wallet) {
      const walletId = uuidv4();
      await db.execute('INSERT INTO wallets (id, user_id, balance) VALUES (?, ?, 0.00)', [walletId, req.user.id]);
      const [newWallets] = await db.execute('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
      wallet = newWallets[0];
    }

    const newBalance = parseFloat(wallet.balance) + parsedAmount;
    await db.execute('UPDATE wallets SET balance = ? WHERE id = ?', [newBalance, wallet.id]);

    await db.execute(
      'INSERT INTO wallet_transactions (id, wallet_id, type, amount, description) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), wallet.id, 'credit', parsedAmount, 'Added funds via Card/UPI']
    );

    res.json({ balance: newBalance });
  } catch (err) {
    console.error('Add wallet funds error:', err);
    res.status(500).json({ error: 'Failed to add funds' });
  }
});

export default router;
